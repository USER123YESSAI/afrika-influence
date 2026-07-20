import { Router } from 'express';
import * as ctrl from '../controllers/collaborationController.js';
import { validate } from '../middlewares/validate.js';
import { schemas } from '../middlewares/schemas.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';
import { soumissionUpload, handleUploadError } from '../middlewares/upload.js';

const router = Router();

// Inviter (ENTREPRISE) / Postuler (CREATEUR)
router.post(
  '/inviter',
  verifyToken,
  requireRole('ENTREPRISE'),
  validate(schemas.inviter),               // ← Joi valide campagneId + createurId (UUID)
  ctrl.inviter
);
router.post(
  '/postuler',
  verifyToken,
  requireRole('CREATEUR'),
  validate(schemas.postuler),
  ctrl.postuler
);

// Lister
router.get('/', verifyToken, ctrl.lister);

// Lignes de contenu — routes fixes déclarées avant '/:id' pour éviter toute ambiguïté
router.put(
  '/lignes/:ligneId',
  verifyToken,
  requireRole('CREATEUR'),
  validate(schemas.modifierLigne),
  ctrl.modifierLigne
);
router.delete('/lignes/:ligneId', verifyToken, requireRole('CREATEUR'), ctrl.supprimerLigne);
router.patch(
  '/lignes/:ligneId/traiter',
  verifyToken,
  requireRole('ENTREPRISE'),
  validate(schemas.traiterLigne),
  ctrl.traiterLigne
);
router.patch(
  '/lignes/:ligneId/soumettre',
  verifyToken,
  requireRole('CREATEUR'),
  soumissionUpload,
  handleUploadError,
  validate(schemas.soumettreLigne),
  ctrl.soumettreLigne
);
router.patch('/soumissions/:soumissionId/valider', verifyToken, requireRole('ENTREPRISE'), ctrl.validerSoumission);
router.patch(
  '/soumissions/:soumissionId/refuser',
  verifyToken,
  requireRole('ENTREPRISE'),
  validate(schemas.refuserSoumission),
  ctrl.refuserSoumission
);
router.put(
  '/soumissions/:soumissionId',
  verifyToken,
  requireRole('CREATEUR'),
  soumissionUpload,
  handleUploadError,
  validate(schemas.modifierSoumission),
  ctrl.modifierSoumission
);
router.delete('/soumissions/:soumissionId', verifyToken, requireRole('CREATEUR'), ctrl.supprimerSoumission);

// Détail
router.get('/:id', verifyToken, ctrl.detail);

// Actions : accepter (créateur sur invitation, entreprise sur candidature)
router.patch('/:id/accepter', verifyToken, requireRole('CREATEUR', 'ENTREPRISE'), ctrl.accepter);

// Refuser la collaboration entière — créateur ou entreprise, à tout moment
router.patch('/:id/refuser', verifyToken, requireRole('CREATEUR', 'ENTREPRISE'), ctrl.refuser);

// Proposer une ligne de contenu (créateur)
router.post(
  '/:id/lignes',
  verifyToken,
  requireRole('CREATEUR'),
  validate(schemas.proposerLigne),         // ← Joi valide offreId (UUID) + quantite + prixUnitaire
  ctrl.proposerLigne
);
router.get('/:id/lignes', verifyToken, ctrl.listerContenus);

// Alias rétrocompatible
router.get('/:id/contenus', verifyToken, ctrl.listerContenus);

export default router;
