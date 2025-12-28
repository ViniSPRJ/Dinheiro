import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/dashboard', AnalyticsController.getDashboard);
router.get('/cash-flow', AnalyticsController.getCashFlow);
router.get('/expenses-by-category', AnalyticsController.getExpensesByCategory);
router.get('/net-worth-evolution', AnalyticsController.getNetWorthEvolution);
router.get('/income-vs-expenses', AnalyticsController.getIncomeVsExpenses);

export default router;
