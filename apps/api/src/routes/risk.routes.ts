import { Router } from 'express';
import { RiskController } from '../controllers/risk.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/metrics', RiskController.getMetrics);
router.get('/benchmark', RiskController.getBenchmark);

export default router;
