import { Router } from 'express';
import * as ctrl from '../controllers/createurController.js';
import { validate } from '../middlewares/validate.js';

import { schemas } from '../middlewares/schemas.js';
import { uploadPhoto, handleUploadError, verifierSignatureFichier } from '../middlewares/upload.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';
import { publicListLimiter } from '../middlewares/antiBot.js';


const router = Router();

// ─── PUBLIC (pour entreprises) ───────────────────────────────────────────────────
router.get('/mon-profil', verifyToken, requireRole('CREATEUR'), ctrl.getMonProfil);
router.get('/', publicListLimiter, ctrl.listerCreateurs); // Liste tous les créateurs avec filtres
router.get('/:id', publicListLimiter, ctrl.getProfil); // Profil détaillé d'un créateur
router.get('/:id/offres', ctrl.getOffresCreateur); // Offres d'un créateur

// ─── PROTÉGÉ : CRÉATEUR ───────────────────────────────────────────────────────
router.put(
  '/:id',
  verifyToken,
  requireRole('CREATEUR'),
  validate(schemas.updateProfil),          // ← Joi valide req.body
  ctrl.mettreAJourProfil
);

router.post(
  '/:id/photo',
  verifyToken,
  requireRole('CREATEUR'),
  (req, res, next) => uploadPhoto(req, res, (err) => err ? handleUploadError(err, req, res, next) : next()),
  verifierSignatureFichier,
  ctrl.uploadPhoto
);

router.post(
  '/:id/niches',
  verifyToken,
  requireRole('CREATEUR'),
  validate(schemas.ajouterNiche),          // ← Joi valide { niche }
  ctrl.ajouterNiche
);

router.delete(
  '/:id/niches/:niche',
  verifyToken,
  requireRole('CREATEUR'),
  ctrl.supprimerNiche
);

export default router;