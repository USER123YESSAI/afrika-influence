// backend/routes/moderateur.routes.js
import { Router } from 'express';
import * as ctrl from '../controllers/moderateurController.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';

const router = Router();
const mod = [verifyToken, requireRole('MODERATEUR', 'ADMINISTRATEUR')];

// Tableau de bord
router.get('/dashboard',        ...mod, ctrl.getDashboard);

// Campagnes
router.get('/campagnes',        ...mod, ctrl.getCampagnesAControler);
router.patch('/campagnes/:id',  ...mod, ctrl.modererCampagne);

// Signalements
router.get('/signalements',         ...mod, ctrl.getSignalements);
router.patch('/signalements/:id',   ...mod, ctrl.traiterSignalement);

// Contenus collaborations — visibilité uniquement (voir getContenus)
router.get('/contenus',         ...mod, ctrl.getContenus);

// Sanctions
router.patch('/sanctions/:id',  ...mod, ctrl.appliquerSanction);

// Historique des actions du modérateur
router.get('/historique',       ...mod, ctrl.getHistoriqueActions);

export default router;
