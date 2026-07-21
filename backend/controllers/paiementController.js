// backend/controllers/paiementController.js
import PDFDocument from 'pdfkit';
import { Paiement, Entreprise, Collaboration, Createur } from '../models/index.js';
import { initierPaytech, genererNumeroFacture, genererNumeroRecu } from '../services/paiementService.js';
import { creerNotification } from '../services/notificationService.js';
import { creerLog } from '../services/logService.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e, status = 500) =>
  res.status(e.status || status).json({ success: false, message: e.message || 'Erreur serveur.' });

export const initierPaiement = async (req, res) => {
  try {
    const entreprise = await Entreprise.findOne({ where: { utilisateurId: req.user.id } });
    if (!entreprise) return res.status(404).json({ success: false, message: 'Profil entreprise non trouvé.' });

    const { collaborationId, methode = 'MANUEL' } = req.body;

    // Calculer le montant depuis les contenus de la collaboration
    const collab = await Collaboration.findByPk(collaborationId, {
      include: [{ association: 'contenus' }],
    });
    if (!collab) return res.status(404).json({ success: false, message: 'Collaboration non trouvée.' });

    // Seules les lignes acceptées par l'entreprise entrent dans le montant à payer
    // (une ligne encore en négociation ou refusée n'a jamais engagé de budget).
    const montant = (collab.contenus || [])
      .filter((c) => c.statut === 'ACCEPTEE')
      .reduce((s, c) => s + (Number(c.sousTotal) || 0), 0);

    const paiement = await Paiement.create({
      collaborationId,
      createurId: collab.createurId,
      entrepriseId: entreprise.utilisateurId,
      montant,
      methode,
    });

    await paiement.initier();

    if (methode === 'PAYTECH') {
      const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3001';
      const paytechData = await initierPaytech({
        refCommand: paiement.id,
        itemName: `Collaboration #${collaborationId.slice(0, 8)}`,
        montant: paiement.montant,
        ipnUrl:     `${baseUrl}/api/paiements/confirmer`,
        successUrl: `${baseUrl}/paiements?success=1`,
        cancelUrl:  `${baseUrl}/paiements?cancel=1`,
      });
      await creerLog(req.user.id, 'INITIATION_PAIEMENT_PAYTECH', 'Paiement', paiement.id, null, req.ip);
      return ok(res, { paiement, redirectUrl: paytechData.redirectUrl || paytechData.redirect_url }, 201);
    }

    await creerLog(req.user.id, 'INITIATION_PAIEMENT_MANUEL', 'Paiement', paiement.id, null, req.ip);
    return ok(res, paiement, 201);
  } catch (e) { return err(res, e); }
};

// Webhook PayTech — pas d'auth JWT
export const confirmerPaiement = async (req, res) => {
  try {
    const { ref_command, type_event } = req.body;
    if (type_event !== 'sale_complete') return res.status(200).json({ success: true, message: 'Événement ignoré.' });

    const paiement = await Paiement.findByPk(ref_command);
    if (!paiement) return res.status(404).json({ success: false, message: 'Paiement non trouvé.' });
    if (paiement.statut === 'CONFIRME') return res.status(200).json({ success: true, message: 'Déjà confirmé.' });

    const numeroFacture = await genererNumeroFacture(Paiement);
    const numeroRecu    = await genererNumeroRecu(Paiement);
    await paiement.update({ numeroFacture, numeroRecuCreateur: numeroRecu });
    await paiement.confirmer();
    
    const createur = await Createur.findByPk(paiement.createurId, { include: [{ association: 'utilisateur' }] });
    const createurIdNotif = createur ? createur.utilisateurId : paiement.createurId;
    await creerNotification(createurIdNotif, 'PAIEMENT_RECU', 'Paiement', paiement.id);
    
    if (createur && createur.utilisateur && createur.utilisateur.email) {
      import('../services/emailService.js')
        .then(({ sendPaymentNotificationEmail }) =>
          sendPaymentNotificationEmail(createur.utilisateur.email, createur.nom, paiement.montant, numeroFacture || paiement.id)
        )
        .catch(console.error);
    }

    return res.status(200).json({ success: true, message: 'Paiement confirmé.' });
  } catch (e) { return err(res, e); }
};

export const getFacture = async (req, res) => {
  try {
    const paiement = await Paiement.findByPk(req.params.id);
    if (!paiement) return res.status(404).json({ success: false, message: 'Paiement non trouvé.' });

    const entreprise = await Entreprise.findOne({ where: { utilisateurId: req.user.id } });
    const isEntreprise = entreprise && paiement.entrepriseId === entreprise.utilisateurId;
    const createur = await Createur.findOne({ where: { utilisateurId: req.user.id } });
    const isCreateur = createur && paiement.createurId === createur.id;
    if (!isEntreprise && !isCreateur)
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    if (paiement.statut !== 'CONFIRME')
      return res.status(400).json({ success: false, message: 'Facture disponible uniquement après confirmation du paiement.' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${paiement.numeroFacture || paiement.id}.pdf"`);
    doc.pipe(res);

    doc.fontSize(22).font('Helvetica-Bold').text('AFRIKA INFLUENCE HUB', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Plateforme de marketing d\'influence africaine', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(18).font('Helvetica-Bold').text(`FACTURE ${paiement.numeroFacture || 'N/A'}`);
    doc.fontSize(11).font('Helvetica')
       .text(`Date : ${new Date(paiement.dateConfirmation || paiement.datePaiement || Date.now()).toLocaleDateString('fr-FR')}`);

    doc.moveDown();
    doc.fontSize(13).font('Helvetica-Bold').text('Détails du paiement');
    doc.moveDown(0.5);
    const lignes = [
      ['Référence collaboration', paiement.collaborationId],
      ['Montant total', `${parseFloat(paiement.montant).toLocaleString('fr-FR')} CFA`],
      [`Commission plateforme (${process.env.TAUX_COMMISSION || 10}%)`, `${parseFloat(paiement.montantCommission || 0).toLocaleString('fr-FR')} CFA`],
      ['Montant créateur', `${parseFloat(paiement.montantCreateur || 0).toLocaleString('fr-FR')} CFA`],
      ['Méthode de paiement', paiement.methode],
      ['Statut', paiement.statut],
    ];
    doc.fontSize(11).font('Helvetica');
    for (const [label, val] of lignes) {
      doc.text(`${label} : `, { continued: true }).font('Helvetica-Bold').text(String(val));
      doc.font('Helvetica');
    }
    doc.moveDown(2);
    doc.fontSize(10).fillColor('gray')
       .text('Document généré automatiquement par Afrika Influence Hub', { align: 'center' });
    doc.end();
  } catch (e) { return err(res, e); }
};

export const getHistorique = async (req, res) => {
  try {
    const entreprise = await Entreprise.findOne({ where: { utilisateurId: req.user.id } });
    let where;
    if (entreprise) {
      where = { entrepriseId: entreprise.utilisateurId };
    } else {
      // Paiement.createurId référence Createur.id (PK), pas l'utilisateurId du JWT.
      const createur = await Createur.findOne({ where: { utilisateurId: req.user.id } });
      if (!createur) return res.status(404).json({ success: false, message: 'Profil créateur non trouvé.' });
      where = { createurId: createur.id };
    }

    const paiements = await Paiement.findAll({
      where,
      order: [['datePaiement', 'DESC']],
      // NOTE: timestamps=false => pas garanti de createdAt dans la DB
    });


    return ok(res, paiements);
  } catch (e) { return err(res, e); }
};
