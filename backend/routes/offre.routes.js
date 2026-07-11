import { Router } from 'express';
import * as ctrl from '../controllers/createurController.js';
import { validate } from '../middlewares/validate.js';

import { schemas } from '../middlewares/schemas.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.post(
  '/',
  verifyToken,
  requireRole('CREATEUR'),
  validate(schemas.creerOffre),            // ← Joi valide tous les champs
  ctrl.creerOffre
);

router.get(
  '/',
  verifyToken,
  requireRole('CREATEUR'),
  ctrl.listerOffres
);

router.put(
  '/:id',
  verifyToken,
  requireRole('CREATEUR'),
  validate(schemas.modifierOffre),         // ← Joi valide les champs modifiés
  ctrl.modifierOffre
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('CREATEUR'),
  ctrl.supprimerOffre
);

export default router;
