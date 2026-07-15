// backend/middlewares/auth.js
// Export : { verifyToken, optionalAuth, requireRole, generateToken }

import jwt from 'jsonwebtoken';

// ─── SECRET JWT ──────────────────────────────────────────────────────────────
// SECURITE : aucun secret par défaut en dur. Un fallback connu de tous
// (ex: 'monsecretafrikainfluence2026') permettrait à quiconque de forger
// un token valide (y compris avec role: 'ADMINISTRATEUR') si la variable
// d'env n'est pas positionnée. On préfère un crash au démarrage à un
// secret prévisible en production.
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  console.error(
    '[FATAL] JWT_SECRET est absent des variables d\'environnement. ' +
    'Génère-en un avec : node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))" ' +
    'et ajoute-le dans backend/.env sous JWT_SECRET=...'
  );
  process.exit(1);
}

if (SECRET.length < 32) {
  console.warn(
    '[SECURITE] JWT_SECRET fait moins de 32 caractères. ' +
    'Utilise un secret plus long et aléatoire pour la production.'
  );
}

// ─── Mock auth (dev uniquement) ────────────────────────────────────────────
// SECURITE : le bypass de token nécessite désormais DEUX conditions :
// NODE_ENV !== 'production' ET ENABLE_MOCK_AUTH=true explicitement positionné
// dans .env. Ça évite qu'un déploiement mal configuré (NODE_ENV oublié)
// laisse n'importe qui s'authentifier avec un rôle arbitraire via un simple
// header x-mock-user-role.
const MOCK_AUTH_ENABLED =
  process.env.NODE_ENV !== 'production' && process.env.ENABLE_MOCK_AUTH === 'true';

const ROLES_VALIDES = ['CREATEUR', 'ENTREPRISE', 'PARTICULIER', 'ADMINISTRATEUR', 'MODERATEUR'];

if (MOCK_AUTH_ENABLED) {
  console.warn(
    '[SECURITE] ENABLE_MOCK_AUTH=true : le token MOCK_TOKEN_DEV est accepté. ' +
    'Ne JAMAIS activer cette variable en production.'
  );
}

function buildMockUser(req) {
  const role = req.headers['x-mock-user-role'] || 'CREATEUR';
  return {
    id: req.headers['x-mock-user-id'] || 'aaa00000-0000-0000-0000-000000000001',
    // On valide quand même le rôle fourni pour éviter d'injecter une valeur
    // hors énumération dans req.user.role (utilisé ensuite par requireRole).
    role: ROLES_VALIDES.includes(role) ? role : 'CREATEUR',
    email: 'dev@baobab.sn',
  };
}

// ─── verifyToken ──────────────────────────────────────────────────────────────
// Vérifie le JWT dans le header Authorization: Bearer <token>
// Injecte req.user = { id, role, email } si valide

export function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Token manquant. Veuillez vous connecter.' });

  const token = header.split(' ')[1];

  if (MOCK_AUTH_ENABLED && token === 'MOCK_TOKEN_DEV') {
    req.user = buildMockUser(req);
    return next();
  }

  try {
    const payload = jwt.verify(token, SECRET);
    req.user = { id: payload.id, role: payload.role, email: payload.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ success: false, message: 'Session expirée. Veuillez vous reconnecter.' });
    return res.status(401).json({ success: false, message: 'Token invalide.' });
  }
}

// ─── optionalAuth ─────────────────────────────────────────────────────────────
// Pour les routes publiques dont le comportement varie selon que l'appelant
// est identifié ou non (ex: GET /campagnes/:id, visible par tous une fois
// publiée, mais réservée au propriétaire tant qu'elle est en BROUILLON).
// Ne bloque jamais la requête : req.user reste null si pas de token / token
// invalide, la route décide ensuite quoi faire.

export function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = header.split(' ')[1];

  if (MOCK_AUTH_ENABLED && token === 'MOCK_TOKEN_DEV') {
    req.user = buildMockUser(req);
    return next();
  }

  try {
    const payload = jwt.verify(token, SECRET);
    req.user = { id: payload.id, role: payload.role, email: payload.email };
  } catch (err) {
    req.user = null; // token présent mais invalide/expiré → traité comme anonyme
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
// Génère un JWT signé pour un utilisateur (utilisé dans authController)

export function generateToken(utilisateur) {
  return jwt.sign(
    { id: utilisateur.id, role: utilisateur.role, email: utilisateur.email },
    SECRET,
    { expiresIn: '24h' }
  );
}