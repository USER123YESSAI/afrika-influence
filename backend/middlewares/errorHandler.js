export function errorHandler(err, req, res, next) {
  // Erreur de validation Joi remontée via next(err)
  if (err.isJoi) {
    return res.status(422).json({
      success: false,
      message: 'Données invalides.',
      erreurs: err.details.map((d) => ({
        champ: d.path.join('.'),
        message: d.message,
      })),
    });
  }

  // Erreur Sequelize de contrainte d'unicité
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Cette valeur existe déjà.',
      champ: err.errors?.[0]?.path,
    });
  }

  // Erreur Sequelize de clé étrangère
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Référence invalide : l\'élément associé n\'existe pas.',
    });
  }

  // Erreur Sequelize de validation de modèle
  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Données invalides.',
      erreurs: err.errors.map((e) => ({ champ: e.path, message: e.message })),
    });
  }

  // Erreur métier explicite (throw { status, message })
  if (err.status && err.message) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  // Erreur inattendue (bug serveur)
  console.error('[ERREUR SERVEUR]', {
    url: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  return res.status(500).json({
    success: false,
    message: 'Une erreur interne est survenue. Veuillez réessayer.',
    ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
  });
}
