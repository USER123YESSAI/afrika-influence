import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/authController.js';
import { verifyToken } from '../middlewares/auth.js';
import { validate }    from '../middlewares/validate.js';
import { schemas } from '../middlewares/schemas.js';
import { connexionSlowDown, connexionLimiter, publicFormLimiter } from '../middlewares/antiBot.js';
import { honeypot } from '../middlewares/honeypot.js';

const router = Router();

router.post('/inscription',       validate(schemas.inscription), ctrl.inscription);
router.post('/connexion',         validate(schemas.connexion),   ctrl.connexion);
router.post('/deconnexion',       verifyToken,                   ctrl.deconnexion);
router.post('/reinitialiser-mdp', validate(schemas.resetMdp),   ctrl.reinitialiserMdp);
router.post('/changer-mdp',       verifyToken, validate(schemas.changerMdp), ctrl.changerMdp);
router.get('/profil',             verifyToken,                   ctrl.profil);
// Limite dédiée sur les endpoints sensibles à l'énumération / brute-force :
// bien plus stricte que le rate-limit global de app.js.
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de tentatives. Réessayez dans quelques minutes.' },
});




router.post('/inscription', publicFormLimiter, honeypot, validate(schemas.inscription), ctrl.inscription);
router.post('/connexion', connexionLimiter, connexionSlowDown, honeypot, validate(schemas.connexion), ctrl.connexion);
router.post('/deconnexion',        verifyToken,                         ctrl.deconnexion);
router.post('/mot-de-passe-oublie', resetLimiter, validate(schemas.demandeResetMdp),  ctrl.demanderResetMdp);
router.post('/reinitialiser-mdp',  resetLimiter, validate(schemas.confirmerResetMdp), ctrl.confirmerResetMdp);
router.get('/profil',              verifyToken,                         ctrl.profil);

export default router;