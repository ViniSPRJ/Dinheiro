import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', TransactionController.getAll);
router.post('/', TransactionController.create);
router.get('/search', TransactionController.search);
router.post('/bulk-delete', TransactionController.bulkDelete);
router.post('/import', TransactionController.import);
router.get('/:id', TransactionController.getById);
router.patch('/:id', TransactionController.update);
router.delete('/:id', TransactionController.delete);

export default router;
