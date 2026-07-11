import { Router } from 'express';
import * as ctrl from '../controllers/adminController.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';

const router = Router();
const adminOnly = [verifyToken, requireRole('ADMINISTRATEUR', 'MODERATEUR')];

// Utilisateurs
router.get('/utilisateurs',              ...adminOnly, ctrl.getUtilisateurs);
router.patch('/utilisateurs/:id/statut', ...adminOnly, ctrl.changerStatut);

// Logs
router.get('/logs', ...adminOnly, ctrl.getLogs);

// Signalements
router.get('/signalements',     ...adminOnly, ctrl.getSignalements);
router.patch('/signalements/:id', ...adminOnly, ctrl.traiterSignalement);

export default router;
