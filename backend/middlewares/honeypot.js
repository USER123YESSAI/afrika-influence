// backend/middlewares/honeypot.js

// Réponse volontairement identique à un succès classique pour ne pas
// révéler au bot qu'il a été détecté (sinon il adapte son script).
export function honeypot(req, res, next) {
  const { piegeBot, timestampAffichage } = req.body;

  // Champ honeypot rempli → bot détecté
  if (piegeBot) {
    console.warn('[HONEYPOT] Bot détecté (champ piégé rempli)', { ip: req.ip });
    return res.status(201).json({ success: true, message: 'Inscription en cours de traitement.' });
  }

  // Soumission trop rapide (< 2s) → très probablement un script automatisé
  if (timestampAffichage) {
    const delai = Date.now() - Number(timestampAffichage);
    if (delai < 2000) {
      console.warn('[HONEYPOT] Bot détecté (soumission trop rapide)', { ip: req.ip, delai });
      return res.status(201).json({ success: true, message: 'Inscription en cours de traitement.' });
    }
  }

  // On nettoie les champs pièges avant de passer à la validation Joi
  delete req.body.piegeBot;
  delete req.body.timestampAffichage;
  next();
}