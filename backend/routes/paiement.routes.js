import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { initierPaiement, confirmerPaiement, getFacture, getHistorique } from '../controllers/paiementController.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { schemas } from '../middlewares/schemas.js';

const router = Router();

// Endpoint public (pas de JWT possible côté PayTech) : on limite quand même
// le débit pour éviter qu'il ne serve de vecteur de déni de service ou de
// brute-force sur la vérification de signature (voir verifierIPN côté service).
const ipnLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes sur ce endpoint.' },
});

router.post('/initier', verifyToken, requireRole('ENTREPRISE'), validate(schemas.initierPaiement), initierPaiement);
router.post('/confirmer', ipnLimiter, confirmerPaiement); // webhook PayTech — pas d'auth JWT, sécurisé par signature
router.get('/historique', verifyToken, getHistorique);
router.get('/:id/facture', verifyToken, getFacture);

export default router;