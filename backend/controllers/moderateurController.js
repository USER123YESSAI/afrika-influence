// backend/controllers/moderateurController.js
import * as modService  from '../services/moderateurService.js';
import { creerLog }     from '../services/logService.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e) => res.status(e.status || 500).json({ success: false, message: e.message || 'Erreur serveur.' });

// ─── TABLEAU DE BORD ──────────────────────────────────────────────────────────
export async function getDashboard(req, res) {
  try { ok(res, await modService.getStats()); }
  catch (e) { err(res, e); }
}

// ─── PROFILS EN ATTENTE ───────────────────────────────────────────────────────
export async function getProfilsEnAttente(req, res) {
  try {
    const { role, page, limit } = req.query;
    ok(res, await modService.getProfilsEnAttente({ role, page: +page || 1, limit: +limit || 20 }));
  } catch (e) { err(res, e); }
}

export async function validerProfil(req, res) {
  try {
    const { statut, raison } = req.body;
    const data = await modService.validerProfil(req.params.id, statut, raison, req.user.id);
    await creerLog(req.user.id, `PROFIL_${statut.toUpperCase()}`, 'Utilisateur', req.params.id, { raison }, req.ip);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// ─── CAMPAGNES À CONTRÔLER ───────────────────────────────────────────────────
export async function getCampagnesAControler(req, res) {
  try {
    const { statut, page, limit } = req.query;
    ok(res, await modService.getCampagnesAControler({ statut, page: +page || 1, limit: +limit || 20 }));
  } catch (e) { err(res, e); }
}

export async function modererCampagne(req, res) {
  try {
    const { action, raison } = req.body;
    const data = await modService.modererCampagne(req.params.id, action, raison, req.user.id);
    await creerLog(req.user.id, `CAMPAGNE_${action.toUpperCase()}`, 'Campagne', req.params.id, { raison }, req.ip);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// ─── SIGNALEMENTS ─────────────────────────────────────────────────────────────
export async function getSignalements(req, res) {
  try {
    const { statut, page, limit } = req.query;
    ok(res, await modService.getSignalements({ statut, page: +page || 1, limit: +limit || 20 }));
  } catch (e) { err(res, e); }
}

export async function traiterSignalement(req, res) {
  try {
    const { statut, decisionAdmin } = req.body;
    const data = await modService.traiterSignalement(req.params.id, statut, decisionAdmin, req.user.id);
    await creerLog(req.user.id, 'SIGNALEMENT_TRAITE', 'Signalement', req.params.id, { statut, decisionAdmin }, req.ip);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// ─── CONTENUS DES COLLABORATIONS (visibilité uniquement) ─────────────────────
export async function getContenus(req, res) {
  try {
    const { statut, page, limit } = req.query;
    ok(res, await modService.getContenus({ statut, page: +page || 1, limit: +limit || 20 }));
  } catch (e) { err(res, e); }
}

// ─── ACTIONS SUR COMPTES ──────────────────────────────────────────────────────
export async function appliquerSanction(req, res) {
  try {
    const { action, raison } = req.body;
    const data = await modService.appliquerSanction(req.params.id, action, raison, req.user.id);
    await creerLog(req.user.id, `COMPTE_${action.toUpperCase()}`, 'Utilisateur', req.params.id, { raison }, req.ip);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// ─── HISTORIQUE DES ACTIONS ───────────────────────────────────────────────────
export async function getHistoriqueActions(req, res) {
  try {
    const { page, limit } = req.query;
    ok(res, await modService.getHistoriqueActions(req.user.id, { page: +page || 1, limit: +limit || 30 }));
  } catch (e) { err(res, e); }
}
