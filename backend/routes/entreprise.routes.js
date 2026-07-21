import { Router } from 'express';
import {
  getEntreprisesPubliques, getEntreprise, getMonProfil, updateEntreprise, uploadLogo,
  rechargerSolde, getHistoriqueSolde,
} from '../controllers/entrepriseController.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';
import { logoUpload } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import { schemas } from '../middlewares/schemas.js';

const router = Router();

router.get('/',           getEntreprisesPubliques);
router.get('/mon-profil', verifyToken, requireRole('ENTREPRISE'), getMonProfil);

// Solde — routes fixes déclarées avant '/:id' pour ne pas être capturées par lui
router.post('/solde/recharger',  verifyToken, requireRole('ENTREPRISE'), validate(schemas.rechargerSolde), rechargerSolde);
router.get('/solde/historique',  verifyToken, requireRole('ENTREPRISE'), getHistoriqueSolde);

router.get('/:id',        getEntreprise);
router.put('/:id',        verifyToken, requireRole('ENTREPRISE'), updateEntreprise);
router.post('/:id/logo',  verifyToken, requireRole('ENTREPRISE'), logoUpload.single('logo'), uploadLogo);

export default router;
