import { Router } from 'express';
import * as ctrl from '../controllers/authController.js';
import { verifyToken } from '../middlewares/auth.js';
import { validate }    from '../middlewares/validate.js';
import { schemas } from '../middlewares/schemas.js';
import { honeypot, connexionSlowDown, connexionLimiter, publicFormLimiter } from '../middlewares/antiBot.js';


const router = Router();

// ⚠️ Ordre important : le honeypot doit être vérifié AVANT validate(), car
// validate() (Joi, stripUnknown:true) supprime le champ piège du body avant
// qu'on ait pu le lire s'il est placé après.
router.post('/inscription',       honeypot('siteInternet'), publicFormLimiter, validate(schemas.inscription), ctrl.inscription);
router.post('/connexion',         connexionSlowDown, connexionLimiter, validate(schemas.connexion),   ctrl.connexion);
router.post('/deconnexion',       verifyToken,                   ctrl.deconnexion);

// Réinitialisation de mot de passe en deux temps (demande → email → confirmation par jeton)
router.post('/reinitialiser-mdp',           publicFormLimiter, validate(schemas.resetMdp),          ctrl.reinitialiserMdp);
router.post('/reinitialiser-mdp/confirmer', publicFormLimiter, validate(schemas.confirmerResetMdp), ctrl.confirmerReinitialisationMdp);

router.post('/changer-mdp',       verifyToken, validate(schemas.changerMdp), ctrl.changerMdp);
router.get('/profil',             verifyToken,                   ctrl.profil);

export default router;
