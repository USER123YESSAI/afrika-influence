import * as collabService from '../services/collaborationService.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e) => {
  const status = e.status || 500;
  const message = e.message || 'Erreur serveur.';
  return res.status(status).json({ success: false, message });
};

// POST /api/collaborations/inviter — entreprise invite un créateur
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

// POST /api/collaborations/postuler — créateur postule à une campagne publique
export async function postuler(req, res) {
  try {
    const { campagneId } = req.body;
    if (!campagneId) throw { status: 400, message: 'campagneId est requis.' };
    const data = await collabService.postulerCampagne({ campagneId, utilisateurId: req.user.id });
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
    const data = await collabService.getCollaboration(req.params.id, req.user.id, req.user.role);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PATCH /api/collaborations/:id/accepter — créateur (invitation) ou entreprise (candidature)
export async function accepter(req, res) {
  try {
    const data = await collabService.accepterCollaboration(req.params.id, req.user.id, req.user.role);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PATCH /api/collaborations/:id/refuser — créateur ou entreprise
export async function refuser(req, res) {
  try {
    const data = await collabService.refuserCollaboration(req.params.id, req.user.id, req.user.role);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// POST /api/collaborations/:id/lignes — créateur propose une ligne de contenu
export async function proposerLigne(req, res) {
  try {
    const { offreId, quantite, prixUnitaire } = req.body;
    if (!offreId || !quantite || !prixUnitaire)
      throw { status: 400, message: 'offreId, quantite et prixUnitaire sont requis.' };
    const data = await collabService.proposerLigne(
      req.params.id, req.user.id,
      { offreId, quantite: parseInt(quantite), prixUnitaire: parseFloat(prixUnitaire) }
    );
    ok(res, data, 201);
  } catch (e) { err(res, e); }
}

// GET /api/collaborations/:id/lignes (alias /contenus conservé)
export async function listerContenus(req, res) {
  try {
    const data = await collabService.listerContenus(req.params.id, req.user.id, req.user.role);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PUT /api/collaborations/lignes/:ligneId — créateur ajuste une ligne en attente/refusée
export async function modifierLigne(req, res) {
  try {
    const { quantite, prixUnitaire } = req.body;
    const data = await collabService.modifierLigne(req.params.ligneId, req.user.id, {
      quantite: quantite !== undefined ? parseInt(quantite) : undefined,
      prixUnitaire: prixUnitaire !== undefined ? parseFloat(prixUnitaire) : undefined,
    });
    ok(res, data);
  } catch (e) { err(res, e); }
}

// DELETE /api/collaborations/lignes/:ligneId — créateur retire une ligne non acceptée
export async function supprimerLigne(req, res) {
  try {
    await collabService.supprimerLigne(req.params.ligneId, req.user.id);
    ok(res, { message: 'Ligne supprimée.' });
  } catch (e) { err(res, e); }
}

// PATCH /api/collaborations/lignes/:ligneId/traiter — entreprise accepte/refuse une ligne
export async function traiterLigne(req, res) {
  try {
    const { action } = req.body;
    if (!['ACCEPTER', 'REFUSER'].includes(action))
      throw { status: 400, message: 'action doit être ACCEPTER ou REFUSER.' };
    const data = await collabService.traiterLigne(req.params.ligneId, req.user.id, action);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PATCH /api/collaborations/lignes/:ligneId/soumettre — créateur soumet une unité de contenu
export async function soumettreLigne(req, res) {
  try {
    const { contenuUrl } = req.body;
    const data = await collabService.soumettreLigne(req.params.ligneId, req.user.id, contenuUrl);
    ok(res, data, 201);
  } catch (e) { err(res, e); }
}

// PATCH /api/collaborations/soumissions/:soumissionId/valider — entreprise valide une soumission
export async function validerSoumission(req, res) {
  try {
    const data = await collabService.validerSoumission(req.params.soumissionId, req.user.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PATCH /api/collaborations/soumissions/:soumissionId/refuser — entreprise refuse une soumission
export async function refuserSoumission(req, res) {
  try {
    const { raison } = req.body;
    const data = await collabService.refuserSoumission(req.params.soumissionId, req.user.id, raison);
    ok(res, data);
  } catch (e) { err(res, e); }
}

