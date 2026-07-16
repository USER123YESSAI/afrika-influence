import * as authService from '../services/authService.js';
import { revokeToken } from '../middlewares/auth.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e) => {
  // Log complet dans la console backend pour debug
  console.error('[authController] ERREUR INSCRIPTION:', e.message);
  console.error('[authController] STACK:', e.stack);
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
    // SECURITE : req.ip respecte "trust proxy" (voir app.js) — fiable même
    // derrière un reverse-proxy, contrairement à un header client arbitraire.
    const data = await authService.connecter(req.body, req.ip);
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

// POST /api/auth/mot-de-passe-oublie
export async function demanderResetMdp(req, res) {
  try {
    const { email } = req.body;
    const data = await authService.demanderReinitialisation(email);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// POST /api/auth/reinitialiser-mdp
export async function confirmerResetMdp(req, res) {
  try {
    const { email, token, nouveauMotDePasse } = req.body;
    const data = await authService.confirmerReinitialisation(email, token, nouveauMotDePasse);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// POST /api/auth/deconnexion
export async function deconnexion(req, res) {
  await revokeToken(req.tokenPayload);
  ok(res, { message: 'Déconnexion réussie.' });
}