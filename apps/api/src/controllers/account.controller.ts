import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CRYPTO', 'CASH', 'LOAN', 'PROPERTY', 'OTHER']),
  institution: z.string().max(100).optional(),
  currency: z.enum(['BRL', 'USD']).default('BRL'),
  initialBalance: z.number(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const updateAccountSchema = createAccountSchema.partial();

export class AccountController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { includeArchived } = req.query;

      const accounts = await prisma.account.findMany({
        where: {
          userId,
          deletedAt: null,
          ...(includeArchived !== 'true' && { isArchived: false }),
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate total balance
      const totalBalance = accounts
        .filter(a => a.isActive && !a.isArchived)
        .reduce((sum, a) => sum + Number(a.currentBalance), 0);

      res.json({
        status: 'success',
        data: {
          accounts,
          totalBalance,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const data = createAccountSchema.parse(req.body);

      const account = await prisma.account.create({
        data: {
          userId,
          name: data.name,
          type: data.type,
          institution: data.institution,
          currency: data.currency,
          initialBalance: data.initialBalance,
          currentBalance: data.initialBalance,
          color: data.color,
          icon: data.icon,
        },
      });

      res.status(201).json({
        status: 'success',
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const account = await prisma.account.findFirst({
        where: { id, userId, deletedAt: null },
        include: {
          transactions: {
            where: { deletedAt: null },
            orderBy: { date: 'desc' },
            take: 10,
          },
        },
      });

      if (!account) {
        throw new NotFoundError('Account not found');
      }

      res.json({
        status: 'success',
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const data = updateAccountSchema.parse(req.body);

      // Check ownership
      const existing = await prisma.account.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError('Account not found');
      }

      const account = await prisma.account.update({
        where: { id },
        data,
      });

      res.json({
        status: 'success',
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check ownership
      const existing = await prisma.account.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError('Account not found');
      }

      // Soft delete
      await prisma.account.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      res.json({
        status: 'success',
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check ownership
      const existing = await prisma.account.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError('Account not found');
      }

      const account = await prisma.account.update({
        where: { id },
        data: { isArchived: true },
      });

      res.json({
        status: 'success',
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  }

  static async unarchive(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check ownership
      const existing = await prisma.account.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError('Account not found');
      }

      const account = await prisma.account.update({
        where: { id },
        data: { isArchived: false },
      });

      res.json({
        status: 'success',
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  }
}
