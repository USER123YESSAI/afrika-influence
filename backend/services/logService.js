import { Log, Utilisateur } from '../models/index.js';
import { Op } from 'sequelize';

export async function creerLog(acteurId, typeAction, entiteCible, idEntiteCible, details, ipAdresse) {
  try {
    return await Log.create({
      acteurId:      acteurId      || null,
      typeAction,
      entiteCible:   entiteCible   || null,
      idEntiteCible: idEntiteCible || null,
      details:       details       || null,
      ipAdresse:     ipAdresse     || null,
      dateAction:    new Date(),
    });
  } catch (err) {
    console.error('[logService] Erreur:', err.message);
    return null;
  }
}

export async function getLogs({ typeAction, acteurId, dateDebut, dateFin, page = 1, limit = 50 } = {}) {
  const where = {};
  if (typeAction) where.typeAction = typeAction;
  if (acteurId)   where.acteurId   = acteurId;
  if (dateDebut || dateFin) {
    where.dateAction = {};
    if (dateDebut) where.dateAction[Op.gte] = new Date(dateDebut);
    if (dateFin)   where.dateAction[Op.lte] = new Date(dateFin);
  }
  const offset = (page - 1) * limit;
  const { count, rows } = await Log.findAndCountAll({
    where,
    include: [{ model: Utilisateur, as: 'acteur', attributes: ['id', 'nom', 'email', 'role'] }],
    order: [['dateAction', 'DESC']],
    limit,
    offset,
  });
  return { total: count, page, totalPages: Math.ceil(count / limit), logs: rows };
}
