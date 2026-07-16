import { Op } from 'sequelize';
import models from '../models/index.js';
import { creerNotification } from './notificationService.js';

const PAYTECH_URL = 'https://paytech.sn/api/payment/request-payment';

export const initierPaytech = async ({ refCommand, itemName, montant, ipnUrl, successUrl, cancelUrl }) => {
  const response = await fetch(PAYTECH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API_KEY': process.env.PAYTECH_API_KEY,
      'API_SECRET': process.env.PAYTECH_API_SECRET,
    },
    body: JSON.stringify({
      item_name: itemName,
      item_price: Math.round(montant),
      currency: 'XOF',
      ref_command: refCommand,
      command_name: `Paiement Afrika Influence — ${itemName}`,
      env: process.env.PAYTECH_ENV || 'test',
      ipn_url: ipnUrl,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayTech error ${response.status}: ${text}`);
  }

  return response.json();
};

export const genererNumeroFacture = async (Paiement) => {
  const count = await Paiement.count({ where: { numeroFacture: { [Op.not]: null } } });
  return `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

export const genererNumeroRecu = async (Paiement) => {
  const count = await Paiement.count({ where: { numeroRecuCreateur: { [Op.not]: null } } });
  return `REC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

// ─── PAIEMENT AUTOMATIQUE ───────────────────────────────────────────────────────
// Déclenché dès qu'une collaboration passe TERMINEE (toutes ses lignes acceptées
// sont validées) — aucune action manuelle de la marque requise, aucune attente.
// Simulé : pas de vrai passage par PayTech, confirmation immédiate.
// Un échec ici ne doit jamais faire échouer la validation du contenu elle-même.

export async function payerCreateurAutomatiquement(collab) {
  const { Paiement, Entreprise, Createur } = models;
  try {
    const montant = (collab.contenus || [])
      .filter((c) => c.statut === 'ACCEPTEE')
      .reduce((s, c) => s + parseFloat(c.sousTotal || 0), 0);
    if (montant <= 0) return null;

    const entreprise = await Entreprise.findByPk(collab.campagne.entrepriseId);
    if (!entreprise) return null;

    const paiement = await Paiement.create({
      collaborationId: collab.id,
      createurId: collab.createurId,
      entrepriseId: entreprise.utilisateurId,
      montant,
      methode: 'AUTOMATIQUE',
    });
    await paiement.initier();

    const numeroFacture = await genererNumeroFacture(Paiement);
    const numeroRecu = await genererNumeroRecu(Paiement);
    await paiement.update({ numeroFacture, numeroRecuCreateur: numeroRecu });
    await paiement.confirmer();

    const createur = await Createur.findByPk(collab.createurId, { include: [{ association: 'utilisateur' }] });
    const destinataireId = createur ? createur.utilisateurId : collab.createurId;
    await creerNotification(destinataireId, 'PAIEMENT_RECU', 'Paiement', paiement.id);

    if (createur?.utilisateur?.email) {
      import('./emailService.js')
        .then(({ sendPaymentNotificationEmail }) =>
          sendPaymentNotificationEmail(createur.utilisateur.email, createur.nom, paiement.montant, numeroFacture)
        )
        .catch(console.error);
    }

    return paiement;
  } catch (e) {
    console.error('[paiementService] Échec du paiement automatique :', e.message);
    return null;
  }
}
