import { Router } from 'express';
import * as ctrl from '../controllers/collaborationController.js';
import { validate } from '../middlewares/validate.js';
import { schemas } from '../middlewares/schemas.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';

const router = Router();

// Inviter (ENTREPRISE uniquement)
router.post(
  '/inviter',
  verifyToken,
  requireRole('ENTREPRISE'),
  validate(schemas.inviter),               // ← Joi valide campagneId + createurId (UUID)
  ctrl.inviter
);

// Lister
router.get('/', verifyToken, ctrl.lister);

// Détail
router.get('/:id', verifyToken, ctrl.detail);

// Actions créateur
router.patch('/:id/accepter', verifyToken, requireRole('CREATEUR'), ctrl.accepter);
router.patch('/:id/refuser',  verifyToken, requireRole('CREATEUR'), ctrl.refuser);

router.patch(
  '/:id/soumettre',
  verifyToken,
  requireRole('CREATEUR'),
  validate(schemas.soumettre),             // ← Joi valide contenuUrl (URI obligatoire)
  ctrl.soumettre
);

// Validation entreprise
router.patch('/:id/valider', verifyToken, requireRole('ENTREPRISE'), ctrl.valider);

// Lignes de contenu
router.post(
  '/:id/contenus',
  verifyToken,
  requireRole('CREATEUR'),
  validate(schemas.ajouterContenu),        // ← Joi valide offreId (UUID) + quantite (int min 1)
  ctrl.ajouterContenu
);

router.get('/:id/contenus', verifyToken, ctrl.listerContenus);

export default router;
