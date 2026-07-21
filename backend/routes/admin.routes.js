import { Router } from 'express';
import * as ctrl from '../controllers/adminController.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { schemas } from '../middlewares/schemas.js';

const router = Router();
const adminOnly = [verifyToken, requireRole('ADMINISTRATEUR', 'MODERATEUR')];

// Utilisateurs
router.get('/utilisateurs',              ...adminOnly, validate(schemas.filtreUtilisateurs, 'query'), ctrl.getUtilisateurs);
router.patch('/utilisateurs/:id/statut', ...adminOnly, ctrl.changerStatut);

// Transactions (solde entreprises)
router.get('/transactions', ...adminOnly, ctrl.getTransactions);

// Logs
router.get('/logs', ...adminOnly, validate(schemas.filtreLogs, 'query'), ctrl.getLogs);

// Signalements
router.get('/signalements',       ...adminOnly, validate(schemas.filtreSignalements, 'query'), ctrl.getSignalements);
router.patch('/signalements/:id', ...adminOnly, ctrl.traiterSignalement);

export default router;