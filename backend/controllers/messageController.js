import * as messageService from '../services/messageService.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e) => res.status(e.status || 500).json({ success: false, message: e.message || 'Erreur serveur.' });

// GET /api/messages/:collaborationId
export async function getHistorique(req, res) {
  try {
    const data = await messageService.getHistorique(req.params.collaborationId, req.user.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// POST /api/messages
export async function envoyerMessage(req, res) {
  try {
    const { collaborationId, contenu } = req.body;
    if (!collaborationId) throw { status: 400, message: 'collaborationId requis.' };
    const data = await messageService.envoyerMessage(collaborationId, req.user.id, contenu);
    ok(res, data, 201);
  } catch (e) { err(res, e); }
}

// POST /api/messages/fichier
export async function envoyerFichier(req, res) {
  try {
    if (!req.file) throw { status: 400, message: 'Aucun fichier reçu.' };
    const { collaborationId } = req.body;
    if (!collaborationId) throw { status: 400, message: 'collaborationId requis.' };
    const fichierUrl = `/uploads/messages/${req.file.filename}`;
    const data = await messageService.envoyerFichier(collaborationId, req.user.id, fichierUrl);
    ok(res, data, 201);
  } catch (e) { err(res, e); }
}

// PATCH /api/messages/:id/lue
export async function marquerLu(req, res) {
  try {
    const data = await messageService.marquerLu(req.params.id, req.user.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}
