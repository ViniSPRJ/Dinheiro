import { Router } from 'express';
import { GoalController } from '../controllers/goal.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', GoalController.getAll);
router.post('/', GoalController.create);
router.get('/:id', GoalController.getById);
router.patch('/:id', GoalController.update);
router.delete('/:id', GoalController.delete);
router.post('/:id/contributions', GoalController.addContribution);

export default router;
