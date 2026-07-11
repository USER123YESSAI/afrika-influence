
import Joi from 'joi';
/**
 * @param {import('joi').Schema} schema  - Schéma Joi à appliquer
 * @param {'body'|'query'|'params'} [source='body'] - Source à valider
 * @returns {import('express').RequestHandler}
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,      // collecter TOUTES les erreurs, pas seulement la première
      stripUnknown: true,     // supprimer les champs non déclarés dans le schéma
      convert: true,          // convertir les types (ex: string → number si Joi.number())
    });

    if (error) {
      const erreurs = error.details.map((d) => ({
        champ: d.path.join('.'),
        message: d.message,
      }));

      return res.status(422).json({
        success: false,
        message: 'Données invalides.',
        erreurs,
      });
    }

    // Remplacer req[source] par la valeur nettoyée et convertie par Joi
    req[source] = value;
    next();
  };
}
