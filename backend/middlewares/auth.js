// backend/middlewares/auth.js
// Export : { verifyToken, optionalAuth, requireRole, generateToken }

import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { TokenRevoque } from '../models/index.js';

// ─── Secret JWT ────────────────────────────────────────────────────────────
// CORRECTION SÉCURITÉ : l'ancien code retombait silencieusement sur une
// valeur par défaut codée en dur si JWT_SECRET était absent de l'environnement
// ('monsecretafrikainfluence2026', visible dans l'historique Git). Si ce
// secret est resté celui utilisé en production, n'importe qui pouvait forger
// un token valide (y compris ADMINISTRATEUR) à partir du code source.
// Désormais : en production, l'absence de JWT_SECRET fait planter le serveur
// au démarrage plutôt que de démarrer silencieusement dans un état non-sûr.
// En développement, on garde un secret de confort pour ne jamais bloquer un
// nouvel arrivant sur l'équipe qui n'a pas encore configuré son .env — mais
// il est différent de l'ancien secret exposé, et clairement marqué comme
// tel dans les logs.
const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  throw new Error(
    '[auth] JWT_SECRET est absent des variables d\'environnement en production. ' +
    'Démarrage refusé — génère une valeur avec : ' +
    'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

const SECRET = process.env.JWT_SECRET || 'DEV_ONLY_SECRET_never_use_in_prod_afrikainfluence';

if (!process.env.JWT_SECRET) {
  console.warn('[auth] ⚠️  JWT_SECRET non défini — secret de développement temporaire utilisé. Ne JAMAIS déployer ainsi.');
}

// ─── verifyToken ──────────────────────────────────────────────────────────────
// Vérifie le JWT dans le header Authorization: Bearer <token>
// Injecte req.user = { id, role, email, jti } si valide

export async function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Token manquant. Veuillez vous connecter.' });

  const token = header.split(' ')[1];

  // Mode développement : mock token fixe accepté par toutes les routes
  if (process.env.NODE_ENV === 'development' && token === 'MOCK_TOKEN_DEV') {
    req.user = {
      id: req.headers['x-mock-user-id'] || 'aaa00000-0000-0000-0000-000000000001',
      role: req.headers['x-mock-user-role'] || 'CREATEUR',
      email: 'dev@baobab.sn',
    };
    return next();
  }

  try {
    const payload = jwt.verify(token, SECRET);

    // CORRECTION SÉCURITÉ : révocation JWT à la déconnexion. Un JWT est par
    // nature valide jusqu'à expiration même après "déconnexion" côté client
    // (on ne fait que jeter le token du localStorage). On vérifie donc ici
    // que son identifiant unique (jti) n'a pas été explicitement révoqué
    // (déconnexion, changement de mot de passe...).
    if (payload.jti) {
      const revoque = await TokenRevoque.findByPk(payload.jti);
      if (revoque) {
        return res.status(401).json({ success: false, message: 'Session invalidée. Veuillez vous reconnecter.' });
      }
    }

    req.user = { id: payload.id, role: payload.role, email: payload.email, jti: payload.jti, exp: payload.exp };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ success: false, message: 'Session expirée. Veuillez vous reconnecter.' });
    return res.status(401).json({ success: false, message: 'Token invalide.' });
  }
}

// ─── optionalAuth ─────────────────────────────────────────────────────────────
// Comme verifyToken, mais ne bloque jamais la requête : si le token est absent
// ou invalide, req.user reste simplement undefined. Utile pour les routes
// publiques dont le comportement varie légèrement selon qui consulte (ex :
// masquer le budget d'une campagne sauf pour l'entreprise propriétaire).

export async function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) return next();

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.jti) {
      const revoque = await TokenRevoque.findByPk(payload.jti);
      if (revoque) return next(); // token révoqué → on continue en visiteur anonyme
    }
    req.user = { id: payload.id, role: payload.role, email: payload.email, jti: payload.jti, exp: payload.exp };
  } catch {
    // Token présent mais invalide/expiré — on continue en visiteur anonyme.
  }
  next();
}

// ─── requireRole ──────────────────────────────────────────────────────────────
// Vérifie que req.user.role correspond au(x) rôle(s) autorisé(s)
// Utilisation : requireRole('CREATEUR') ou requireRole('CREATEUR', 'ENTREPRISE')

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Non authentifié.' });

    // Les particuliers et les entreprises partagent les mêmes droits/fonctionnalités
    let allowedRoles = [...roles];
    if (allowedRoles.includes('ENTREPRISE') && !allowedRoles.includes('PARTICULIER')) {
      allowedRoles.push('PARTICULIER');
    }

    if (!allowedRoles.includes(req.user.role))
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle requis : ${roles.join(' ou ')}.`,
      });
    next();
  };
}

// ─── generateToken ────────────────────────────────────────────────────────────
// Génère un JWT signé pour un utilisateur (utilisé dans authService).
// jti (JWT ID) unique par token : c'est ce qui permet de révoquer UN token
// précis (déconnexion) sans invalider toutes les sessions de l'utilisateur.

export function generateToken(utilisateur) {
  return jwt.sign(
    { id: utilisateur.id, role: utilisateur.role, email: utilisateur.email, jti: randomUUID() },
    SECRET,
    { expiresIn: '24h' }
  );
}
