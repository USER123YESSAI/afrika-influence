import { Router } from 'express';
import { initierPaiement, confirmerPaiement, getFacture, getHistorique } from '../controllers/paiementController.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { schemas } from '../middlewares/schemas.js';

const router = Router();

router.post('/initier', verifyToken, requireRole('ENTREPRISE'), validate(schemas.initierPaiement), initierPaiement);
router.post('/confirmer', confirmerPaiement); // webhook PayTech — pas d'auth JWT
router.get('/historique', verifyToken, getHistorique);
router.get('/:id/facture', verifyToken, getFacture);

export default router;
