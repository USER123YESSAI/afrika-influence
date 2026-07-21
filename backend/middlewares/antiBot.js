// backend/middlewares/antiBot.js
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// ─── Ralentissement progressif sur /connexion ──────────────────────────────
// Après 5 tentatives, chaque requête suivante est retardée de 500ms de plus,
// jusqu'à un plafond de 10s. Ça casse la rentabilité d'un bot de brute-force
// sans bloquer un utilisateur légitime qui se trompe 2-3 fois.
export const connexionSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 5,
  delayMs: (hits) => hits * 500,
  maxDelayMs: 10000,
  keyGenerator: (req) => `${req.ip}:${req.body?.email || 'anonyme'}`,
});

// ─── Blocage dur après trop de tentatives ──────────────────────────────────
export const connexionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.body?.email || 'anonyme'}`,
  message: { success: false, message: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.' },
});

// ─── Limiteur générique pour tout endpoint public exposé aux bots ──────────
// (inscription, formulaire de contact, etc.)
export const publicFormLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes. Réessayez plus tard.' },
});

// ─── Limiteur générique pour tout endpoint public exposé aux bots ──────────
export const publicListLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60, // 60 requêtes/5min/IP — large pour un humain, contraignant pour un scraper
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes sur cette ressource. Réessayez plus tard.' },
});