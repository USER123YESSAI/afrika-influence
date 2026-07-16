import { Router } from 'express';
import {
  createCampagne,
  getMesCampagnes,
  getCampagnesPubliques,
  getCampagne,
  updateCampagne,
  deleteCampagne,
  publierCampagne,
  annulerCampagne,
  terminerCampagne,
  addMedia,
} from '../controllers/campagneController.js';
import { getRecommandations } from '../controllers/recommandationController.js';
import { verifyToken, requireRole, optionalAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { schemas } from '../middlewares/schemas.js';
import { mediaUpload, verifierSignatureFichier } from '../middlewares/upload.js';
import { publicListLimiter } from '../middlewares/antiBot.js';

const router = Router();

// ─── PUBLIC (pour créateurs) ───────────────────────────────────────────────────
router.get('/publiques', publicListLimiter, getCampagnesPubliques); // Campagnes publiées accessibles aux créateurs
router.get('/:id', optionalAuth, getCampagne); // Détails d'une campagne — BROUILLON restreinte au propriétaire (voir contrôleur)

// ─── PROTÉGÉ : ENTREPRISE ─────────────────────────────────────────────────────
router.post('/', verifyToken, requireRole('ENTREPRISE'), validate(schemas.creerCampagne), createCampagne);
router.get('/', verifyToken, getMesCampagnes); // Mes campagnes (entreprise connectée)
router.put('/:id', verifyToken, requireRole('ENTREPRISE'), validate(schemas.modifierCampagne), updateCampagne);
router.delete('/:id', verifyToken, requireRole('ENTREPRISE'), deleteCampagne);
router.patch('/:id/publier', verifyToken, requireRole('ENTREPRISE'), publierCampagne);
router.patch('/:id/annuler', verifyToken, requireRole('ENTREPRISE'), annulerCampagne);
router.patch('/:id/terminer', verifyToken, requireRole('ENTREPRISE'), terminerCampagne);
router.post('/:id/medias', verifyToken, requireRole('ENTREPRISE'), mediaUpload.single('media'), verifierSignatureFichier, addMedia);
router.get('/:id/recommandations', verifyToken, requireRole('ENTREPRISE'), getRecommandations);

export default router;