import * as collabService from '../services/collaborationService.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e) => {
  const status = e.status || 500;
  const message = e.message || 'Erreur serveur.';
  return res.status(status).json({ success: false, message });
};

// POST /api/collaborations/inviter
export async function inviter(req, res) {
  try {
    const { campagneId, createurId, directiveSpeciale } = req.body;
    if (!campagneId || !createurId)
      throw { status: 400, message: 'campagneId et createurId sont requis.' };
    const data = await collabService.inviterCreateur({
      campagneId, createurId, directiveSpeciale, entrepriseUserId: req.user.id,
    });
    ok(res, data, 201);
  } catch (e) { err(res, e); }
}

// GET /api/collaborations
export async function lister(req, res) {
  try {
    const { statut } = req.query;
    const data = await collabService.listerCollaborations(
      req.user.id, req.user.role, { statut }
    );
    ok(res, data);
  } catch (e) { err(res, e); }
}

// GET /api/collaborations/:id
export async function detail(req, res) {
  try {
    const data = await collabService.getCollaboration(req.params.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PATCH /api/collaborations/:id/accepter
export async function accepter(req, res) {
  try {
    const data = await collabService.accepterCollaboration(req.params.id, req.user.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PATCH /api/collaborations/:id/refuser
export async function refuser(req, res) {
  try {
    const data = await collabService.refuserCollaboration(req.params.id, req.user.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PATCH /api/collaborations/:id/soumettre
export async function soumettre(req, res) {
  try {
    const { contenuUrl } = req.body;
    const data = await collabService.soumettreContenu(req.params.id, req.user.id, contenuUrl);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PATCH /api/collaborations/:id/valider
export async function valider(req, res) {
  try {
    const data = await collabService.validerContenu(req.params.id, req.user.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// POST /api/collaborations/:id/contenus
export async function ajouterContenu(req, res) {
  try {
    const { offreId, quantite } = req.body;
    if (!offreId || !quantite)
      throw { status: 400, message: 'offreId et quantite sont requis.' };
    const data = await collabService.ajouterContenu(
      req.params.id, req.user.id, { offreId, quantite: parseInt(quantite) }
    );
    ok(res, data, 201);
  } catch (e) { err(res, e); }
}

// GET /api/collaborations/:id/contenus
export async function listerContenus(req, res) {
  try {
    const data = await collabService.listerContenus(req.params.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}
