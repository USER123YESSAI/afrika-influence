import * as adminService  from '../services/adminService.js';
import * as logService    from '../services/logService.js';
import * as notifService  from '../services/notificationService.js';
import * as soldeService  from '../services/soldeService.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e) => res.status(e.status || 500).json({ success: false, message: e.message || 'Erreur serveur.' });

// GET /api/admin/utilisateurs
export async function getUtilisateurs(req, res) {
  try {
    const { role, statut, page, limit } = req.query;
    const data = await adminService.listerUtilisateurs({ role, statut, page: +page || 1, limit: +limit || 20 });
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PATCH /api/admin/utilisateurs/:id/statut
export async function changerStatut(req, res) {
  try {
    const { statut } = req.body;
    const data = await adminService.changerStatutUtilisateur(req.params.id, statut, req.user.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// GET /api/admin/transactions
export async function getTransactions(req, res) {
  try {
    const { type, entrepriseId, page, limit } = req.query;
    const data = await soldeService.getToutesLesTransactions({ type, entrepriseId, page: +page || 1, limit: +limit || 50 });
    ok(res, data);
  } catch (e) { err(res, e); }
}

// GET /api/admin/logs
export async function getLogs(req, res) {
  try {
    const { typeAction, acteurId, dateDebut, dateFin, page, limit } = req.query;
    const data = await logService.getLogs({ typeAction, acteurId, dateDebut, dateFin, page: +page || 1, limit: +limit || 50 });
    ok(res, data);
  } catch (e) { err(res, e); }
}

// GET /api/admin/signalements
export async function getSignalements(req, res) {
  try {
    const { statut, page, limit } = req.query;
    const data = await adminService.listerSignalements({ statut, page: +page || 1, limit: +limit || 20 });
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PATCH /api/admin/signalements/:id
export async function traiterSignalement(req, res) {
  try {
    const { statut, decisionAdmin } = req.body;
    const data = await adminService.traiterSignalement(req.params.id, { statut, decisionAdmin }, req.user.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// GET /api/notifications
export async function getNotifications(req, res) {
  try {
    const data = await notifService.getNotifications(req.user.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PATCH /api/notifications/:id/lue
export async function marquerNotifLue(req, res) {
  try {
    const data = await notifService.marquerLue(req.params.id, req.user.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}
