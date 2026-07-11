// backend/controllers/avisController.js
import { Avis } from '../models/index.js';
import { creerLog } from '../services/logService.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e, status = 500) =>
  res.status(e.status || status).json({ success: false, message: e.message || 'Erreur serveur.' });

const ROLE_MAP = { ENTREPRISE: 'ENTREPRISE', CREATEUR: 'CREATEUR' };

export const createAvis = async (req, res) => {
  try {
    const auteurRole = ROLE_MAP[req.user.role];
    if (!auteurRole)
      return res.status(403).json({ success: false, message: 'Seules les entreprises et créateurs peuvent soumettre un avis.' });

    const { collaborationId, cibleId, note, commentaire } = req.body;

    const existants = await Avis.findAll({ where: { collaborationId } });
    if (existants.length >= 2)
      return res.status(400).json({ success: false, message: 'Maximum 2 avis par collaboration atteint.' });
    if (existants.some((a) => a.auteurRole === auteurRole))
      return res.status(400).json({ success: false, message: 'Vous avez déjà soumis un avis pour cette collaboration.' });

    const avis = await Avis.create({
      collaborationId, auteurId: req.user.id, cibleId, auteurRole, note, commentaire,
    });

    await creerLog(req.user.id, 'SOUMISSION_AVIS', 'Avis', avis.id, null, req.ip);
    return ok(res, avis, 201);
  } catch (e) { return err(res, e); }
};

export const getAvisRecus = async (req, res) => {
  try {
    const avis = await Avis.findAll({
      where: { cibleId: req.params.cibleId },
      order: [['createdAt', 'DESC']],
    });
    const moyenne = avis.length > 0
      ? (avis.reduce((sum, a) => sum + a.note, 0) / avis.length).toFixed(1)
      : null;
    return ok(res, { moyenne, total: avis.length, avis });
  } catch (e) { return err(res, e); }
};
