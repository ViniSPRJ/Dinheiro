import { Router } from 'express';
import { TaxController } from '../controllers/tax.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/summary', TaxController.getSummary);
router.get('/darf', TaxController.getDarf);

export default router;
