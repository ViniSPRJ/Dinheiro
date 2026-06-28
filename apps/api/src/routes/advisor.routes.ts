import { Router } from 'express';
import { AdvisorController } from '../controllers/advisor.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Autonomous portfolio review + optimized allocation proposal
router.get('/review', AdvisorController.getReview);

// Persist the user's investor risk profile (conservador | moderado | arrojado)
router.patch('/profile', AdvisorController.updateProfile);

export default router;
