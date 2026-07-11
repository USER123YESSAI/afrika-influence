import * as authService from '../services/authService.js';

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

// POST /api/auth/reinitialiser-mdp
export async function reinitialiserMdp(req, res) {
  try {
    const { email, nouveauMotDePasse } = req.body;
    const data = await authService.reinitialiserMotDePasse(email, nouveauMotDePasse);
    ok(res, data);
  } catch (e) { err(res, e); }
}

// POST /api/auth/deconnexion
export async function deconnexion(req, res) {
  ok(res, { message: 'Déconnexion réussie.' });
}
