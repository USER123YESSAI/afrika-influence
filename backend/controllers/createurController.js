import * as createurService from '../services/createurService.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e) => {
  const status = e.status || 500;
  const message = e.message || 'Erreur serveur.';
  return res.status(status).json({ success: false, message });
};

// GET /api/createurs/mon-profil
export async function getMonProfil(req, res) {
  try {
    const data = await createurService.getProfilByUtilisateurId(req.user.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// GET /api/createurs/:id
export async function getProfil(req, res) {
  try {
    const data = await createurService.getProfilCreateur(req.params.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PUT /api/createurs/:id
export async function mettreAJourProfil(req, res) {
  try {
    const data = await createurService.mettreAJourProfil(
      req.params.id, req.user.id, req.body
    );
    ok(res, data);
  } catch (e) { err(res, e); }
}

// POST /api/createurs/:id/photo
export async function uploadPhoto(req, res) {
  try {
    if (!req.file) throw { status: 400, message: 'Aucun fichier reçu.' };
    const photoProfilUrl = `/uploads/profils/${req.file.filename}`;
    const data = await createurService.mettreAJourPhoto(
      req.params.id, req.user.id, photoProfilUrl
    );
    ok(res, data);
  } catch (e) { err(res, e); }
}

// POST /api/createurs/:id/niches
export async function ajouterNiche(req, res) {
  try {
    const { niche } = req.body;
    if (!niche) throw { status: 400, message: 'Le champ "niche" est requis.' };
    const data = await createurService.ajouterNiche(req.params.id, req.user.id, niche);
    ok(res, data, 201);
  } catch (e) { err(res, e); }
}

// DELETE /api/createurs/:id/niches/:niche
export async function supprimerNiche(req, res) {
  try {
    await createurService.supprimerNiche(
      req.params.id, req.user.id, req.params.niche
    );
    ok(res, { message: 'Niche supprimée.' });
  } catch (e) { err(res, e); }
}

// POST /api/offres
export async function creerOffre(req, res) {
  try {
    const data = await createurService.creerOffre(req.user.id, req.body);
    ok(res, data, 201);
  } catch (e) { err(res, e); }
}

// GET /api/offres
export async function listerOffres(req, res) {
  try {
    const data = await createurService.listerOffres(req.user.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// PUT /api/offres/:id
export async function modifierOffre(req, res) {
  try {
    const data = await createurService.modifierOffre(
      req.params.id, req.user.id, req.body
    );
    ok(res, data);
  } catch (e) { err(res, e); }
}

// DELETE /api/offres/:id
export async function supprimerOffre(req, res) {
  try {
    await createurService.supprimerOffre(req.params.id, req.user.id);
    ok(res, { message: 'Offre supprimée.' });
  } catch (e) { err(res, e); }
}

// GET /api/createurs (public pour entreprises)
export async function listerCreateurs(req, res) {
  try {
    const data = await createurService.listerCreateursPublic(req.query);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// GET /api/createurs/:id/offres (public pour entreprises)
export async function getOffresCreateur(req, res) {
  try {
    const data = await createurService.getOffresCreateur(req.params.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}
