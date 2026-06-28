import { Router } from 'express';
import { WealthController } from '../controllers/wealth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const wealthRouter = Router();

wealthRouter.use(authMiddleware);

wealthRouter.get('/health', WealthController.getHealth);
wealthRouter.get('/hurdle-rate', WealthController.getHurdleRate);

export default wealthRouter;
