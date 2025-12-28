import { Router } from 'express';
import { AccountController } from '../controllers/account.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', AccountController.getAll);
router.post('/', AccountController.create);
router.get('/:id', AccountController.getById);
router.patch('/:id', AccountController.update);
router.delete('/:id', AccountController.delete);
router.post('/:id/archive', AccountController.archive);
router.post('/:id/unarchive', AccountController.unarchive);

export default router;
