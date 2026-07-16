// backend/middlewares/sanitize.js
// SECURITE (XSS) : les champs texte libres (bio, description de campagne,
// commentaires d'avis, messages, directives spéciales...) sont stockés tels
// quels puis réaffichés à d'autres utilisateurs (créateur <-> entreprise <->
// modérateur/admin). React échappe déjà le texte affiché côté frontend (aucun
// dangerouslySetInnerHTML détecté dans le code actuel), ce qui protège
// l'affichage web tel qu'il existe aujourd'hui. Mais ce n'est pas une
// garantie structurelle : le même champ peut demain être injecté dans un PDF
// (pdfkit, factures), un email, un export CSV/Excel, ou un futur client qui
// n'échappe pas automatiquement. On applique donc une défense en profondeur
// à la source, côté serveur : aucun tag HTML n'est censé apparaître dans un
// nom, une bio, un message ou un commentaire sur cette plateforme, donc on
// les retire avant stockage plutôt que de les encoder — ce qui préserve un
// texte lisible dans tous les contextes de consommation, contrairement à un
// encodage HTML qui ne serait correct qu'affiché tel quel dans une page HTML.

const BALISE_REGEX = /<[^>]*>/g;
// Neutralise aussi les schémas d'URL exécutables, au cas où un champ texte
// libre contiendrait une URL affichée telle quelle par un client qui la
// transformerait en lien cliquable (javascript:, vbscript:, data:).
const SCHEMA_DANGEREUX_REGEX = /\b(javascript|vbscript|data):/gi;

function nettoyerChaine(valeur) {
  return valeur
    .replace(BALISE_REGEX, '')
    .replace(SCHEMA_DANGEREUX_REGEX, '');
}

function nettoyerRecursif(valeur) {
  if (typeof valeur === 'string') return nettoyerChaine(valeur);
  if (Array.isArray(valeur)) return valeur.map(nettoyerRecursif);
  if (valeur && typeof valeur === 'object') {
    const resultat = {};
    for (const [cle, val] of Object.entries(valeur)) {
      resultat[cle] = nettoyerRecursif(val);
    }
    return resultat;
  }
  return valeur;
}

// Champs volontairement exclus : mots de passe et tokens, où toute
// altération casserait la valeur (ex: un mot de passe contenant "<" serait
// tronqué, un token hex n'a de toute façon jamais de balise).
const CHAMPS_EXCLUS = new Set(['password', 'nouveauMotDePasse', 'token']);

// Middleware global : nettoie TOUT req.body, quelle que soit la route.
// Placé après express.json()/urlencoded() et AVANT les routes dans app.js,
// donc en amont de la validation Joi — Joi voit déjà les chaînes nettoyées.
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    const nettoye = {};
    for (const [cle, val] of Object.entries(req.body)) {
      nettoye[cle] = CHAMPS_EXCLUS.has(cle) ? val : nettoyerRecursif(val);
    }
    req.body = nettoye;
  }
  next();
}