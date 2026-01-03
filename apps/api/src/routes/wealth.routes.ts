import { Router } from 'express';
import { WealthController } from '../controllers/wealth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const wealthRouter = Router();

wealthRouter.use(authMiddleware);

wealthRouter.get('/health', WealthController.getHealth);
wealthRouter.get('/hurdle-rate', WealthController.getHurdleRate);
