import models from '../models/index.js';
import { creerLog } from './logService.js';
import { creerNotification } from './notificationService.js';
import { MOTIF_LABELS } from './emailService.js';

const { Utilisateur, Signalement } = models;

// ─── UTILISATEURS ─────────────────────────────────────────────────────────────

export async function listerUtilisateurs({ role, statut, page = 1, limit = 20 }) {
  const where = {};
  if (role)   where.role   = role;
  if (statut) where.statut = statut;

  const offset = (page - 1) * limit;
  const { count, rows } = await Utilisateur.findAndCountAll({
    where,
    attributes: { exclude: ['motDePasse'] },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { total: count, page, totalPages: Math.ceil(count / limit), utilisateurs: rows };
}

export async function changerStatutUtilisateur(utilisateurId, statut, adminId) {
  const utilisateur = await Utilisateur.findByPk(utilisateurId);
  if (!utilisateur) throw { status: 404, message: 'Utilisateur introuvable.' };

  const statutsValides = ['validated', 'rejected', 'suspended', 'pending', 'banned'];
  if (!statutsValides.includes(statut))
    throw { status: 400, message: `Statut invalide. Valeurs acceptées : ${statutsValides.join(', ')}.` };

  await utilisateur.update({ statut });

  const typeLog = statut === 'validated' ? 'PROFIL_VALIDE'
                : statut === 'rejected'  ? 'PROFIL_REJETE'
                : statut === 'banned'    ? 'PROFIL_BANNI'
                : 'PROFIL_SUSPENDU';
  await creerLog(adminId, typeLog, 'Utilisateur', utilisateurId);

  const { motDePasse: _, ...data } = utilisateur.toJSON();
  return data;
}

// ─── SIGNALEMENTS ─────────────────────────────────────────────────────────────

export async function listerSignalements({ statut, page = 1, limit = 20 }) {
  const where = {};
  if (statut) where.statut = statut;

  const offset = (page - 1) * limit;
  const { count, rows } = await Signalement.findAndCountAll({
    where,
    include: [{
      model: Utilisateur, as: 'auteur',
      attributes: ['id', 'nom', 'email', 'role'],
    }],
    order: [['dateCreation', 'DESC']],
    limit,
    offset,
  });

  return { total: count, page, totalPages: Math.ceil(count / limit), signalements: rows };
}

// Notifie l'auteur du signalement (résultat de son signalement) et, si celui-ci est jugé
// fondé (TRAITE) et cible un utilisateur, avertit aussi cette personne directement
// (notification in-app + email reprenant le motif et le message rédigé par l'admin).
// Un rejet (REJETE) ne déclenche rien côté cible : elle n'a rien à savoir dans ce cas.
export async function traiterSignalement(signalementId, { statut, decisionAdmin }, adminId) {
  const signalement = await Signalement.findByPk(signalementId);
  if (!signalement) throw { status: 404, message: 'Signalement introuvable.' };

  await signalement.update({
    statut,
    decisionAdmin,
    adminId,
    dateTraitement: new Date(),
  });

  const messageAuteur = statut === 'TRAITE'
    ? 'Votre signalement a été jugé fondé — un avertissement a été envoyé à la personne concernée.'
    : 'Votre signalement a été examiné et rejeté.';
  await creerNotification(signalement.auteurId, 'SIGNALEMENT_TRAITE', 'Signalement', signalementId, messageAuteur);

  if (statut === 'TRAITE' && signalement.entiteCible === 'Utilisateur') {
    const cible = await Utilisateur.findByPk(signalement.cibleId);
    if (cible) {
      const motifLabel = MOTIF_LABELS[signalement.motif] || signalement.motif;
      const message = `${motifLabel}${decisionAdmin ? ' — ' + decisionAdmin : ''}`.slice(0, 500);
      await creerNotification(cible.id, 'AVERTISSEMENT_SIGNALEMENT', 'Signalement', signalementId, message);
      import('./emailService.js')
        .then(({ sendAvertissementEmail }) => sendAvertissementEmail(cible.email, cible.nom, signalement.motif, decisionAdmin))
        .catch(console.error);
    }
  }

  await creerLog(adminId, 'SIGNALEMENT_TRAITE', 'Signalement', signalementId, { statut });
  return signalement;
}
