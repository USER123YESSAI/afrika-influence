import models from '../models/index.js';
import { creerLog } from './logService.js';

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

export async function traiterSignalement(signalementId, { statut, decisionAdmin }, adminId) {
  const signalement = await Signalement.findByPk(signalementId);
  if (!signalement) throw { status: 404, message: 'Signalement introuvable.' };

  await signalement.update({
    statut,
    decisionAdmin,
    adminId,
    dateTraitement: new Date(),
  });

  await creerLog(adminId, 'SIGNALEMENT_TRAITE', 'Signalement', signalementId, { statut });
  return signalement;
}
