import { Router } from 'express';
import * as ctrl from '../controllers/authController.js';
import { verifyToken } from '../middlewares/auth.js';
import { validate }    from '../middlewares/validate.js';
import { schemas } from '../middlewares/schemas.js';


const router = Router();

router.post('/inscription',       validate(schemas.inscription), ctrl.inscription);
router.post('/connexion',         validate(schemas.connexion),   ctrl.connexion);
router.post('/deconnexion',       verifyToken,                   ctrl.deconnexion);
router.post('/reinitialiser-mdp', validate(schemas.resetMdp),   ctrl.reinitialiserMdp);
router.post('/changer-mdp',       verifyToken, validate(schemas.changerMdp), ctrl.changerMdp);
router.get('/profil',             verifyToken,                   ctrl.profil);

export default router;
