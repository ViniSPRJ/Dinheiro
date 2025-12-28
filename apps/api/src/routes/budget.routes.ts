import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', BudgetController.getAll);
router.post('/', BudgetController.create);
router.get('/suggestions', BudgetController.getSuggestions);
router.get('/:id', BudgetController.getById);
router.patch('/:id', BudgetController.update);
router.delete('/:id', BudgetController.delete);

export default router;
