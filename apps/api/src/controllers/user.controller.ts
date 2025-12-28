import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

const updatePreferencesSchema = z.object({
  currency: z.enum(['BRL', 'USD']).optional(),
  locale: z.string().optional(),
  dateFormat: z.string().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
});

export class UserController {
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          name: true,
          avatarUrl: true,
          currency: true,
          locale: true,
          dateFormat: true,
          theme: true,
          onboardingCompleted: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const data = updateUserSchema.parse(req.body);

      const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      });

      res.json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      // Soft delete - set deletedAt timestamp
      await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });

      // Revoke all refresh tokens
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      });

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      logger.info(`User deleted (soft): ${userId}`);

      res.json({
        status: 'success',
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          currency: true,
          locale: true,
          dateFormat: true,
          theme: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({
        status: 'success',
        data: { preferences: user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const data = updatePreferencesSchema.parse(req.body);

      const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          currency: true,
          locale: true,
          dateFormat: true,
          theme: true,
        },
      });

      res.json({
        status: 'success',
        data: { preferences: user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      // Fetch all user data (LGPD compliance)
      const [user, accounts, transactions, categories, budgets, investments, goals, tags] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            currency: true,
            locale: true,
          },
        }),
        prisma.account.findMany({ where: { userId, deletedAt: null } }),
        prisma.transaction.findMany({ where: { userId, deletedAt: null } }),
        prisma.category.findMany({ where: { OR: [{ userId }, { userId: null }] } }),
        prisma.budget.findMany({ where: { userId, deletedAt: null } }),
        prisma.investment.findMany({ where: { userId, deletedAt: null } }),
        prisma.goal.findMany({ where: { userId, deletedAt: null } }),
        prisma.tag.findMany({ where: { userId } }),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user,
        accounts,
        transactions,
        categories,
        budgets,
        investments,
        goals,
        tags,
      };

      res.json({
        status: 'success',
        data: exportData,
      });
    } catch (error) {
      next(error);
    }
  }

  static async completeOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      await prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
      });

      logger.info(`User completed onboarding: ${userId}`);

      res.json({
        status: 'success',
        message: 'Onboarding completed',
      });
    } catch (error) {
      next(error);
    }
  }
}
