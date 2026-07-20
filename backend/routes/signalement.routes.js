import { Router } from 'express';
import { creerSignalement } from '../controllers/signalementController.js';
import { verifyToken } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { schemas } from '../middlewares/schemas.js';

const router = Router();

router.post('/', verifyToken, validate(schemas.creerSignalement), creerSignalement);

export default router;
