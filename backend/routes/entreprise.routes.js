import { Router } from 'express';
import {
  getEntreprisesPubliques, getEntreprise, getMonProfil, updateEntreprise, uploadLogo,
  rechargerSolde, getHistoriqueSolde,
} from '../controllers/entrepriseController.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';
import { uploadLogo as uploadLogoMiddlewares } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import { schemas } from '../middlewares/schemas.js';
import { publicListLimiter } from '../middlewares/antiBot.js';

const router = Router();

router.get('/',           publicListLimiter, getEntreprisesPubliques);
router.get('/mon-profil', verifyToken, requireRole('ENTREPRISE'), getMonProfil);

// Solde — routes fixes déclarées avant '/:id' pour ne pas être capturées par lui
router.post('/solde/recharger',  verifyToken, requireRole('ENTREPRISE'), validate(schemas.rechargerSolde), rechargerSolde);
router.get('/solde/historique',  verifyToken, requireRole('ENTREPRISE'), getHistoriqueSolde);

router.get('/:id',        getEntreprise);
router.put('/:id',        verifyToken, requireRole('ENTREPRISE'), updateEntreprise);
router.post('/:id/logo',  verifyToken, requireRole('ENTREPRISE'), ...uploadLogoMiddlewares, uploadLogo);

export default router;
