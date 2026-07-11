import { Router } from 'express';
import * as ctrl from '../controllers/adminController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get('/',        verifyToken, ctrl.getNotifications);
router.patch('/:id/lue', verifyToken, ctrl.marquerNotifLue);

export default router;
