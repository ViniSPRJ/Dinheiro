import { Router } from 'express';
import { TagController } from '../controllers/tag.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', TagController.getAll);
router.post('/', TagController.create);
router.get('/:id', TagController.getById);
router.patch('/:id', TagController.update);
router.delete('/:id', TagController.delete);

export default router;
