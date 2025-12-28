import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const createBudgetSchema = z.object({
  categoryId: z.string(),
  amount: z.number().positive(),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  rolloverEnabled: z.boolean().default(false),
  startDate: z.string().transform((str) => new Date(str)),
});

const updateBudgetSchema = createBudgetSchema.partial();

export class BudgetController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { period } = req.query;

      // Get current period dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const budgets = await prisma.budget.findMany({
        where: {
          userId,
          deletedAt: null,
          isActive: true,
          ...(period && { period: period as 'WEEKLY' | 'MONTHLY' | 'YEARLY' }),
        },
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
        orderBy: { category: { name: 'asc' } },
      });

      // Calculate spent amount for each budget
      const budgetsWithSpent = await Promise.all(
        budgets.map(async (budget) => {
          const spent = await prisma.transaction.aggregate({
            where: {
              userId,
              categoryId: budget.categoryId,
              type: 'EXPENSE',
              date: { gte: startOfMonth, lte: endOfMonth },
              deletedAt: null,
            },
            _sum: { amount: true },
          });

          const spentAmount = Number(spent._sum.amount || 0);
          const budgetAmount = Number(budget.amount) + Number(budget.rolloverBalance);
          const percentUsed = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

          return {
            ...budget,
            spent: spentAmount,
            remaining: budgetAmount - spentAmount,
            percentUsed: Math.round(percentUsed * 100) / 100,
            effectiveAmount: budgetAmount,
          };
        })
      );

      res.json({
        status: 'success',
        data: { budgets: budgetsWithSpent },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const data = createBudgetSchema.parse(req.body);

      const budget = await prisma.budget.create({
        data: {
          userId,
          categoryId: data.categoryId,
          amount: data.amount,
          period: data.period,
          rolloverEnabled: data.rolloverEnabled,
          startDate: data.startDate,
        },
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      });

      res.status(201).json({
        status: 'success',
        data: { budget },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const budget = await prisma.budget.findFirst({
        where: { id, userId, deletedAt: null },
        include: {
          category: true,
        },
      });

      if (!budget) {
        throw new NotFoundError('Budget not found');
      }

      res.json({
        status: 'success',
        data: { budget },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const data = updateBudgetSchema.parse(req.body);

      const existing = await prisma.budget.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError('Budget not found');
      }

      const budget = await prisma.budget.update({
        where: { id },
        data,
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      });

      res.json({
        status: 'success',
        data: { budget },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const existing = await prisma.budget.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError('Budget not found');
      }

      await prisma.budget.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      res.json({
        status: 'success',
        message: 'Budget deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      // Get last 3 months of spending by category
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const spending = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          type: 'EXPENSE',
          date: { gte: threeMonthsAgo },
          deletedAt: null,
          categoryId: { not: null },
        },
        _sum: { amount: true },
        _count: true,
      });

      // Get category details
      const categoryIds = spending
        .filter((s) => s.categoryId)
        .map((s) => s.categoryId as string);

      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });

      const categoryMap = new Map(categories.map((c) => [c.id, c]));

      // Calculate suggested budgets (average monthly spending + 10% buffer)
      const suggestions = spending
        .filter((s) => s.categoryId && categoryMap.has(s.categoryId))
        .map((s) => {
          const category = categoryMap.get(s.categoryId!)!;
          const totalSpent = Number(s._sum.amount || 0);
          const monthlyAverage = totalSpent / 3;
          const suggestedAmount = Math.ceil(monthlyAverage * 1.1 / 10) * 10; // Round up to nearest 10

          return {
            categoryId: s.categoryId,
            category: {
              id: category.id,
              name: category.name,
              icon: category.icon,
              color: category.color,
            },
            monthlyAverage: Math.round(monthlyAverage * 100) / 100,
            suggestedAmount,
            transactionCount: s._count,
          };
        })
        .sort((a, b) => b.monthlyAverage - a.monthlyAverage);

      res.json({
        status: 'success',
        data: { suggestions },
      });
    } catch (error) {
      next(error);
    }
  }
}
