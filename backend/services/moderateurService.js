// backend/services/moderateurService.js
import { Op } from 'sequelize';
import models from '../models/index.js';
import { creerNotification } from './notificationService.js';
import { MOTIF_LABELS } from './emailService.js';

const {
  Utilisateur, Entreprise, Createur, Campagne, Collaboration,
  Signalement, Log,
} = models;

// ─── STATS TABLEAU DE BORD ────────────────────────────────────────────────────
export async function getStats() {
  const [
    profilsEnAttente,
    campagnesAControler,
    signalementsEnAttente,
    contenusAVerifier,
    actionsAujourdhui,
  ] = await Promise.all([
    Utilisateur.count({ where: { statut: 'pending' } }),
    Campagne.count({ where: { statut: 'PUBLIEE' } }),
    Signalement.count({ where: { statut: 'EN_ATTENTE' } }),
    Collaboration.count({ where: { statut: 'CONTENU_SOUMIS' } }),
    Log.count({
      where: {
        dateAction: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return {
    profilsEnAttente,
    campagnesAControler,
    signalementsEnAttente,
    contenusAVerifier,
    actionsAujourdhui,
  };
}

// ─── PROFILS ──────────────────────────────────────────────────────────────────
export async function getProfilsEnAttente({ role, page = 1, limit = 20 }) {
  const where = { statut: 'pending' };
  if (role) where.role = role;

  const { count, rows } = await Utilisateur.findAndCountAll({
    where,
    attributes: { exclude: ['motDePasse'] },
    order: [['createdAt', 'ASC']],
    limit,
    offset: (page - 1) * limit,
  });

  return { total: count, page, totalPages: Math.ceil(count / limit), utilisateurs: rows };
}

export async function validerProfil(utilisateurId, statut, raison, moderateurId) {
  const statutsValides = ['validated', 'rejected', 'suspended'];
  if (!statutsValides.includes(statut))
    throw { status: 400, message: `Statut invalide. Valeurs : ${statutsValides.join(', ')}.` };

  const utilisateur = await Utilisateur.findByPk(utilisateurId);
  if (!utilisateur) throw { status: 404, message: 'Utilisateur introuvable.' };

  await utilisateur.update({ statut });

  const typeNotif = statut === 'validated' ? 'PROFIL_VALIDE' : 'PROFIL_REJETE';
  await creerNotification(utilisateurId, typeNotif, 'Utilisateur', utilisateurId);

  const { motDePasse: _, ...data } = utilisateur.toJSON();
  return { utilisateur: data, raison };
}

// ─── CAMPAGNES ────────────────────────────────────────────────────────────────
export async function getCampagnesAControler({ statut, page = 1, limit = 20 }) {
  const where = {};
  if (statut) where.statut = statut;
  else where.statut = { [Op.in]: ['PUBLIEE', 'EN_COURS'] };

  const { count, rows } = await Campagne.findAndCountAll({
    where,
    include: [{ model: Entreprise, as: 'entreprise', attributes: ['id', 'nom', 'logoUrl'] }],
    order: [['dateCreation', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return { total: count, page, totalPages: Math.ceil(count / limit), campagnes: rows };
}

export async function modererCampagne(campagneId, action, raison, moderateurId) {
  const actionsValides = ['APPROUVER', 'SUSPENDRE', 'REJETER'];
  if (!actionsValides.includes(action))
    throw { status: 400, message: `Action invalide. Valeurs : ${actionsValides.join(', ')}.` };

  const campagne = await Campagne.findByPk(campagneId, {
    include: [{ model: Entreprise, as: 'entreprise' }],
  });
  if (!campagne) throw { status: 404, message: 'Campagne introuvable.' };

  const statutMap = { APPROUVER: 'PUBLIEE', SUSPENDRE: 'ANNULEE', REJETER: 'ANNULEE' };
  await campagne.update({ statut: statutMap[action] });

  if (campagne.entreprise?.utilisateurId) {
    await creerNotification(
      campagne.entreprise.utilisateurId,
      `CAMPAGNE_${action}`,
      'Campagne',
      campagneId
    );
  }

  return { campagne, raison };
}

// ─── SIGNALEMENTS ─────────────────────────────────────────────────────────────
export async function getSignalements({ statut, page = 1, limit = 20 }) {
  const where = {};
  if (statut) where.statut = statut;

  const { count, rows } = await Signalement.findAndCountAll({
    where,
    include: [{ model: Utilisateur, as: 'auteur', attributes: ['id', 'nom', 'email', 'role'] }],
    order: [['dateCreation', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return { total: count, page, totalPages: Math.ceil(count / limit), signalements: rows };
}

// Notifie l'auteur du signalement (résultat de son signalement) et, si celui-ci est jugé
// fondé (RESOLU) et cible un utilisateur, avertit aussi cette personne directement
// (notification in-app + email reprenant motif et le message rédigé par le modérateur).
// Le statut ici est 'RESOLU' (interface modérateur) — différent de 'TRAITE' côté admin.
export async function traiterSignalement(signalementId, statut, decisionAdmin, moderateurId) {
  const sig = await Signalement.findByPk(signalementId);
  if (!sig) throw { status: 404, message: 'Signalement introuvable.' };

  await sig.update({ statut, decisionAdmin, adminId: moderateurId, dateTraitement: new Date() });

  const messageAuteur = statut === 'RESOLU'
    ? 'Votre signalement a été jugé fondé — un avertissement a été envoyé à la personne concernée.'
    : 'Votre signalement a été examiné et rejeté.';
  await creerNotification(sig.auteurId, 'SIGNALEMENT_TRAITE', 'Signalement', signalementId, messageAuteur);

  if (statut === 'RESOLU' && sig.entiteCible === 'Utilisateur') {
    const cible = await Utilisateur.findByPk(sig.cibleId);
    if (cible) {
      const motifLabel = MOTIF_LABELS[sig.motif] || sig.motif;
      const message = `${motifLabel}${decisionAdmin ? ' — ' + decisionAdmin : ''}`.slice(0, 500);
      await creerNotification(cible.id, 'AVERTISSEMENT_SIGNALEMENT', 'Signalement', signalementId, message);
      import('./emailService.js')
        .then(({ sendAvertissementEmail }) => sendAvertissementEmail(cible.email, cible.nom, sig.motif, decisionAdmin))
        .catch(console.error);
    }
  }

  return sig;
}

// ─── CONTENUS ─────────────────────────────────────────────────────────────────
export async function getContenus({ statut, page = 1, limit = 20 }) {
  const where = {};
  if (statut) where.statut = statut;
  else where.statut = 'CONTENU_SOUMIS';

  const { count, rows } = await Collaboration.findAndCountAll({
    where,
    include: [
      { model: Campagne,  as: 'campagne',  attributes: ['id', 'titre', 'consignesContenu'] },
      { model: Createur,  as: 'createur',  attributes: ['id', 'nom', 'handle'] },
    ],
    order: [['updatedAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return { total: count, page, totalPages: Math.ceil(count / limit), contenus: rows };
}

export async function modererContenu(collaborationId, action, raison, moderateurId) {
  const actionsValides = ['APPROUVER', 'REJETER'];
  if (!actionsValides.includes(action))
    throw { status: 400, message: `Action invalide. Valeurs : ${actionsValides.join(', ')}.` };

  const collab = await Collaboration.findByPk(collaborationId);
  if (!collab) throw { status: 404, message: 'Collaboration introuvable.' };

  const statutMap = { APPROUVER: 'CONTENU_VALIDE', REJETER: 'TRAVAIL_EN_COURS' };
  await collab.update({ statut: statutMap[action] });

  await creerNotification(collab.createurId, `CONTENU_${action}`, 'Collaboration', collaborationId);
  return { collaboration: collab, raison };
}

// ─── SANCTIONS ────────────────────────────────────────────────────────────────
export async function appliquerSanction(utilisateurId, action, raison, moderateurId) {
  const actionsValides = ['AVERTIR', 'SUSPENDRE', 'BLOQUER', 'BANNIR'];
  if (!actionsValides.includes(action))
    throw { status: 400, message: `Action invalide. Valeurs : ${actionsValides.join(', ')}.` };

  const utilisateur = await Utilisateur.findByPk(utilisateurId);
  if (!utilisateur) throw { status: 404, message: 'Utilisateur introuvable.' };

  if (action === 'SUSPENDRE') await utilisateur.update({ statut: 'suspended' });
  if (action === 'BLOQUER')   await utilisateur.update({ statut: 'rejected' });
  if (action === 'BANNIR')    await utilisateur.update({ statut: 'banned' });

  await creerNotification(utilisateurId, `COMPTE_${action}`, 'Utilisateur', utilisateurId);

  const { motDePasse: _, ...data } = utilisateur.toJSON();
  return { utilisateur: data, action, raison };
}

// ─── HISTORIQUE ───────────────────────────────────────────────────────────────
export async function getHistoriqueActions(moderateurId, { page = 1, limit = 30 }) {
  const { count, rows } = await Log.findAndCountAll({
    where: { acteurId: moderateurId },
    order: [['dateAction', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return { total: count, page, totalPages: Math.ceil(count / limit), actions: rows };
}
