// backend/middlewares/sanitize.js
//
// Défense XSS côté backend : nettoie récursivement toutes les chaînes de
// caractères reçues dans req.body (et req.query) en supprimant toute
// balise HTML/JS (<script>, <img onerror=...>, <a href="javascript:...">,
// etc.), quel que soit le module qui reçoit la donnée (P1, P2 ou P3).
//
// Pourquoi ici et pas dans chaque contrôleur : le frontend React échappe
// déjà l'affichage par défaut, mais une donnée stockée "sale" en base
// reste dangereuse si elle est un jour réutilisée hors de React (export
// PDF de facture, e-mail Brevo, futur tableau de bord admin en HTML brut,
// etc.). Nettoyer à l'entrée protège tous les usages futurs d'un coup,
// sans toucher à la logique métier de chaque module.
//
// Champs exclus (jamais sanitizés) : mots de passe et jetons — leur
// contenu ne sera jamais interprété comme du HTML, et les altérer casserait
// l'authentification.
import sanitizeHtml from 'sanitize-html';
import he from 'he';

const CHAMPS_EXCLUS = /mot.?de.?passe|password|token|hash/i;

const SANITIZE_OPTS = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

// Supprime les balises puis décode les entités HTML résiduelles (&amp; → &)
// pour ne pas polluer l'affichage — le texte reste du texte brut, jamais
// interprété comme du HTML côté client (React échappe déjà à l'affichage).
function nettoyerChaine(valeur) {
  return he.decode(sanitizeHtml(valeur, SANITIZE_OPTS));
}

function nettoyerRecursif(donnee, cheminParent = '') {
  if (typeof donnee === 'string') {
    return nettoyerChaine(donnee);
  }
  if (Array.isArray(donnee)) {
    return donnee.map((item) => nettoyerRecursif(item, cheminParent));
  }
  if (donnee && typeof donnee === 'object') {
    const resultat = {};
    for (const [cle, valeur] of Object.entries(donnee)) {
      if (CHAMPS_EXCLUS.test(cle)) {
        resultat[cle] = valeur; // on ne touche pas aux mots de passe / tokens
      } else {
        resultat[cle] = nettoyerRecursif(valeur, cle);
      }
    }
    return resultat;
  }
  return donnee; // nombres, booléens, null, undefined : inchangés
}

// Middleware global — à monter juste après express.json()/urlencoded().
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = nettoyerRecursif(req.body);
  }
  next();
}
