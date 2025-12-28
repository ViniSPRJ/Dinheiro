import { Router } from 'express';
import { MLController } from '../controllers/ml.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/suggest-category', MLController.suggestCategory);
router.post('/retrain', MLController.retrain);
router.get('/model-status', MLController.getModelStatus);

export default router;
