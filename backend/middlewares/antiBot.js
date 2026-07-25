// backend/middlewares/antiBot.js
//
// Regroupe les défenses anti-robots du module P1 :
//   1. Honeypot (champ piège invisible sur les formulaires publics)
//   2. Ralentissement progressif + blocage dur sur /connexion (anti brute-force)
//   3. Limiteurs génériques pour les formulaires publics et les listes publiques
//
// Tous les seuils sont volontairement plus généreux en développement
// (NODE_ENV !== 'production') pour ne jamais bloquer le travail normal :
// on peut toujours les déclencher volontairement pour les tester (voir
// les instructions de test fournies avec chaque mesure).
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

const isProd = process.env.NODE_ENV === 'production';

// ─── 1. Honeypot ────────────────────────────────────────────────────────────
// Ajoute un champ invisible (ex. "siteInternet") au formulaire. Un humain ne
// le voit jamais et le laisse donc vide ; un robot qui remplit tous les
// champs d'un formulaire HTML le remplira. Si le champ arrive non-vide,
// on ne traite jamais la requête, mais on répond comme si tout s'était
// bien passé : on ne révèle jamais au robot qu'il a été détecté (piège
// silencieux), ce qui l'empêche d'adapter son script.
//
// IMPORTANT : ce middleware doit être placé AVANT validate(schema) dans la
// chaîne de la route, car le middleware validate() (Joi, stripUnknown:true)
// supprime silencieusement tout champ non déclaré dans le schéma — y
// compris notre champ piège — avant qu'on ait pu le lire.
export function honeypot(champ = 'siteInternet') {
  return (req, res, next) => {
    const valeur = req.body?.[champ];
    if (valeur !== undefined && valeur !== null && String(valeur).trim() !== '') {
      console.warn(`[antiBot] Honeypot déclenché sur ${req.originalUrl} — IP ${req.ip}`);
      // Réponse « fausse-positive » : le robot voit un succès, rien n'est créé.
      return res.status(200).json({ success: true, message: 'Requête reçue.' });
    }
    next();
  };
}

// ─── 2. Ralentissement progressif sur /connexion ───────────────────────────
// Après quelques tentatives, chaque requête suivante est retardée un peu
// plus, jusqu'à un plafond. Ça casse la rentabilité d'un bot de
// brute-force sans jamais bloquer complètement un utilisateur légitime
// qui se trompe deux ou trois fois de mot de passe.
export const connexionSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: isProd ? 5 : 20,
  delayMs: (hits) => hits * 500,
  maxDelayMs: 10000,
  keyGenerator: (req) => `${req.ip}:${req.body?.email || 'anonyme'}`,
});

// ─── Blocage dur après trop de tentatives ──────────────────────────────────
export const connexionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.body?.email || 'anonyme'}`,
  message: { success: false, message: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.' },
});

// ─── 3. Limiteur générique pour tout endpoint public exposé aux bots ───────
// (inscription, formulaire de contact, etc.)
export const publicFormLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isProd ? 8 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes. Réessayez plus tard.' },
});

// ─── Limiteur générique pour les listes publiques (annuaires) ──────────────
export const publicListLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isProd ? 60 : 300, // large pour un humain, contraignant pour un scraper
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes sur cette ressource. Réessayez plus tard.' },
});
