// backend/controllers/signalementController.js
import { Signalement } from '../models/index.js';
import { creerLog } from '../services/logService.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e, status = 500) =>
  res.status(e.status || status).json({ success: false, message: e.message || 'Erreur serveur.' });

// POST /api/signalements — dépose une plainte contre un autre utilisateur (créateur ou entreprise),
// visible immédiatement dans les files admin/modérateur (aucune notification temps réel).
export const creerSignalement = async (req, res) => {
  try {
    const { cibleId, motif, description } = req.body;

    if (cibleId === req.user.id)
      return res.status(400).json({ success: false, message: 'Impossible de vous signaler vous-même.' });

    const signalement = await Signalement.create({
      auteurId: req.user.id,
      cibleId,
      entiteCible: 'Utilisateur',
      motif,
      description,
    });

    await creerLog(req.user.id, 'CREATION_SIGNALEMENT', 'Signalement', signalement.id, null, req.ip);
    return ok(res, signalement, 201);
  } catch (e) { return err(res, e); }
};
