import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', CategoryController.getAll);
router.post('/', CategoryController.create);
router.get('/:id', CategoryController.getById);
router.patch('/:id', CategoryController.update);
router.delete('/:id', CategoryController.delete);

export default router;
