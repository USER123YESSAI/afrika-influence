import { Router } from 'express';
import { getEntreprisesPubliques, getEntreprise, getMonProfil, updateEntreprise, uploadLogo } from '../controllers/entrepriseController.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';
import { logoUpload, verifierSignatureFichier } from '../middlewares/upload.js';

const router = Router();

router.get('/',           getEntreprisesPubliques);
router.get('/mon-profil', verifyToken, requireRole('ENTREPRISE'), getMonProfil);
router.get('/:id',        getEntreprise);
router.put('/:id',        verifyToken, requireRole('ENTREPRISE'), updateEntreprise);
router.post('/:id/logo',  verifyToken, requireRole('ENTREPRISE'), logoUpload.single('logo'), verifierSignatureFichier, uploadLogo);

export default router;