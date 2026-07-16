import { Router } from 'express';
import { ajouterFavori, retirerFavori, listerFavoris } from '../controllers/favoriController.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', verifyToken, requireRole('CREATEUR'), listerFavoris);
router.post('/', verifyToken, requireRole('CREATEUR'), ajouterFavori);
router.delete('/:campagneId', verifyToken, requireRole('CREATEUR'), retirerFavori);

export default router;
