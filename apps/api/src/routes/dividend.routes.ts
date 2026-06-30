import { Router } from 'express';
import { DividendController } from '../controllers/dividend.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', DividendController.getAll);
router.post('/', DividendController.create);
router.get('/summary', DividendController.getSummary);
router.patch('/:id', DividendController.update);
router.delete('/:id', DividendController.delete);

export default router;
