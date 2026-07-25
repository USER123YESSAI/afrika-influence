import * as authService from '../services/authService.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e) => {
  console.error('[authController] ERREUR:', e.message);
  return res.status(e.status || 500).json({ success: false, message: e.message || 'Erreur serveur.' });
};

// POST /api/auth/inscription
export async function inscription(req, res) {
  try {
    const data = await authService.inscrire(req.body);
    ok(res, data, 201);
  } catch (e) { err(res, e); }
}

// POST /api/auth/connexion
export async function connexion(req, res) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const data = await authService.connecter(req.body, ip);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// GET /api/auth/profil
export async function profil(req, res) {
  try {
    const data = await authService.getProfil(req.user.id);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// POST /api/auth/reinitialiser-mdp — étape 1 : demande d'un lien par email
export async function reinitialiserMdp(req, res) {
  try {
    const { email } = req.body;
    const data = await authService.demanderResetMotDePasse(email);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// POST /api/auth/reinitialiser-mdp/confirmer — étape 2 : confirmation avec le jeton reçu par email
export async function confirmerReinitialisationMdp(req, res) {
  try {
    const { email, token, nouveauMotDePasse } = req.body;
    const data = await authService.confirmerResetMotDePasse(email, token, nouveauMotDePasse);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// POST /api/auth/changer-mdp
export async function changerMdp(req, res) {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;
    const data = await authService.changerMotDePasse(req.user.id, ancienMotDePasse, nouveauMotDePasse);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// POST /api/auth/deconnexion
export async function deconnexion(req, res) {
  try {
    const data = await authService.deconnecter(req.user?.jti, req.user?.exp);
    ok(res, data);
  } catch (e) { err(res, e); }
}
