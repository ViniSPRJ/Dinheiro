import { Request, Response, NextFunction } from 'express';
import { WealthService } from '../services/wealth.service.ts';

export class WealthController {
  
  static async getHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const data = await WealthService.validateInvestmentStrategy(userId);

      res.json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHurdleRate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const data = await WealthService.calculatePersonalHurdleRate(userId);

      res.json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  }
}
