import { Router } from 'express';
import multer from 'multer';
import { TransactionController } from '../controllers/transaction.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// All routes require authentication
router.use(authMiddleware);

router.get('/', TransactionController.getAll);
router.post('/', TransactionController.create);
router.get('/search', TransactionController.search);
router.post('/bulk-delete', TransactionController.bulkDelete);
router.post('/import', TransactionController.import);
router.post('/extract-receipt', upload.single('file'), TransactionController.extractReceipt);
router.get('/:id', TransactionController.getById);
router.patch('/:id', TransactionController.update);
router.delete('/:id', TransactionController.delete);

export default router;
