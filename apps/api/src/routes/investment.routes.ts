import { Router } from 'express';
import { InvestmentController } from '../controllers/investment.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', InvestmentController.getAll);
router.post('/', InvestmentController.create);
router.get('/performance', InvestmentController.getPerformance);
router.get('/allocation', InvestmentController.getAllocation);
router.get('/:id', InvestmentController.getById);
router.patch('/:id', InvestmentController.update);
router.delete('/:id', InvestmentController.delete);

router.post('/:id/lots', InvestmentController.addLot);
router.get('/:id/lots', InvestmentController.getLots);
router.delete('/:id/lots/:lotId', InvestmentController.deleteLot);

export default router;
