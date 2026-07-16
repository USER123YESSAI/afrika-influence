// backend/middlewares/auth.js
// Export : { verifyToken, requireRole, generateToken }

import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'monsecretafrikainfluence2026';

// ─── verifyToken ──────────────────────────────────────────────────────────────
// Vérifie le JWT dans le header Authorization: Bearer <token>
// Injecte req.user = { id, role, email } si valide

export function verifyToken(req, res, next) {
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
    req.user = { id: payload.id, role: payload.role, email: payload.email };
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

export function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) return next();

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = { id: payload.id, role: payload.role, email: payload.email };
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
// Génère un JWT signé pour un utilisateur (utilisé dans authController)

export function generateToken(utilisateur) {
  return jwt.sign(
    { id: utilisateur.id, role: utilisateur.role, email: utilisateur.email },
    SECRET,
    { expiresIn: '24h' }
  );
}

