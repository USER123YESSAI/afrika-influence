import { Router } from 'express';
import * as ctrl from '../controllers/messageController.js';
import { validate } from '../middlewares/validate.js';

import { schemas } from '../middlewares/schemas.js';
import { uploadFichier, handleUploadError, verifierSignatureFichier } from '../middlewares/upload.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get('/:collaborationId', verifyToken, ctrl.getHistorique);

router.post(
  '/',
  verifyToken,
  validate(schemas.envoyerMessage),        // ← Joi valide collaborationId + contenu
  ctrl.envoyerMessage
);

router.post(
  '/fichier',
  verifyToken,
  (req, res, next) =>
    uploadFichier(req, res, (err) => (err ? handleUploadError(err, req, res, next) : next())),
  verifierSignatureFichier,
  ctrl.envoyerFichier
);

router.patch('/:id/lue', verifyToken, ctrl.marquerLu);

export default router;