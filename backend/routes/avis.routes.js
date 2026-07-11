import { Router } from 'express';
import { createAvis, getAvisRecus } from '../controllers/avisController.js';
import { verifyToken } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { schemas } from '../middlewares/schemas.js';

const router = Router();

router.post('/', verifyToken, validate(schemas.creerAvis), createAvis);
router.get('/:cibleId', getAvisRecus);

export default router;
