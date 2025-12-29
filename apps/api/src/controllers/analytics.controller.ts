import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';

const periodSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year', 'all']).default('month'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

function getPeriodDates(period: string, startDateStr?: string, endDateStr?: string) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  if (startDateStr && endDateStr) {
    startDate = new Date(startDateStr);
    endDate = new Date(endDateStr);
  } else {
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  return { startDate, endDate };
}

export class AnalyticsController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { period, startDate, endDate } = periodSchema.parse(req.query);
      const { startDate: periodStart, endDate: periodEnd } = getPeriodDates(period, startDate, endDate);

      // Run all queries in parallel
      const [
        accounts,
        incomeTotal,
        expenseTotal,
        expensesByCategory,
        recentTransactions,
        budgets,
      ] = await Promise.all([
        // Total balance from accounts
        prisma.account.findMany({
          where: { userId, deletedAt: null, isActive: true, isArchived: false },
          select: { currentBalance: true, type: true },
        }),
        // Total income
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'INCOME',
            date: { gte: periodStart, lte: periodEnd },
            deletedAt: null,
          },
          _sum: { amount: true },
        }),
        // Total expenses
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'EXPENSE',
            date: { gte: periodStart, lte: periodEnd },
            deletedAt: null,
          },
          _sum: { amount: true },
        }),
        // Expenses by category
        prisma.transaction.groupBy({
          by: ['categoryId'],
          where: {
            userId,
            type: 'EXPENSE',
            date: { gte: periodStart, lte: periodEnd },
            deletedAt: null,
            categoryId: { not: null },
          },
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
          take: 8,
        }),
        // Recent transactions
        prisma.transaction.findMany({
          where: { userId, deletedAt: null },
          include: {
            category: { select: { id: true, name: true, icon: true, color: true } },
            account: { select: { id: true, name: true } },
          },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take: 10,
        }),
        // Budgets with spending
        prisma.budget.findMany({
          where: { userId, deletedAt: null, isActive: true },
          include: { category: { select: { id: true, name: true, icon: true, color: true } } },
        }),
      ]);

      // Calculate net worth
      const totalAssets = accounts
        .filter((a) => a.type !== 'CREDIT_CARD' && a.type !== 'LOAN')
        .reduce((sum, a) => sum + Number(a.currentBalance), 0);
      const totalLiabilities = accounts
        .filter((a) => a.type === 'CREDIT_CARD' || a.type === 'LOAN')
        .reduce((sum, a) => sum + Math.abs(Number(a.currentBalance)), 0);
      const netWorth = totalAssets - totalLiabilities;

      const income = Number(incomeTotal._sum.amount || 0);
      const expenses = Number(expenseTotal._sum.amount || 0);
      const balance = income - expenses;

      // Get category names for expenses
      const categoryIds = expensesByCategory.map((e) => e.categoryId).filter(Boolean) as string[];
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, icon: true, color: true },
      });
      const categoryMap = new Map(categories.map((c) => [c.id, c]));

      const expensesByCategoryWithNames = expensesByCategory.map((e) => ({
        categoryId: e.categoryId,
        category: e.categoryId ? categoryMap.get(e.categoryId) : null,
        amount: Number(e._sum.amount || 0),
      }));

      // Calculate budget progress
      const budgetsWithProgress = await Promise.all(
        budgets.map(async (budget) => {
          const spent = await prisma.transaction.aggregate({
            where: {
              userId,
              categoryId: budget.categoryId,
              type: 'EXPENSE',
              date: { gte: periodStart, lte: periodEnd },
              deletedAt: null,
            },
            _sum: { amount: true },
          });
          const spentAmount = Number(spent._sum.amount || 0);
          const budgetAmount = Number(budget.amount);
          return {
            ...budget,
            spent: spentAmount,
            remaining: budgetAmount - spentAmount,
            percentUsed: budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 100) : 0,
          };
        })
      );

      res.json({
        status: 'success',
        data: {
          summary: {
            netWorth,
            totalAssets,
            totalLiabilities,
            income,
            expenses,
            balance,
          },
          expensesByCategory: expensesByCategoryWithNames,
          recentTransactions,
          budgets: budgetsWithProgress,
          period: { start: periodStart, end: periodEnd },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCashFlow(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      periodSchema.parse(req.query);

      // Get last 12 months of data
      const months: { month: string; income: number; expenses: number }[] = [];
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const [income, expenses] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              userId,
              type: 'INCOME',
              date: { gte: monthStart, lte: monthEnd },
              deletedAt: null,
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId,
              type: 'EXPENSE',
              date: { gte: monthStart, lte: monthEnd },
              deletedAt: null,
            },
            _sum: { amount: true },
          }),
        ]);

        months.push({
          month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
          income: Number(income._sum.amount || 0),
          expenses: Number(expenses._sum.amount || 0),
        });
      }

      res.json({
        status: 'success',
        data: { cashFlow: months },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getExpensesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { period, startDate, endDate } = periodSchema.parse(req.query);
      const { startDate: periodStart, endDate: periodEnd } = getPeriodDates(period, startDate, endDate);

      const expenses = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          type: 'EXPENSE',
          date: { gte: periodStart, lte: periodEnd },
          deletedAt: null,
        },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      });

      const categoryIds = expenses
        .map((e) => e.categoryId)
        .filter((categoryId): categoryId is string => Boolean(categoryId));
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });
      const categoryMap = new Map(categories.map((c) => [c.id, c]));

      const total = expenses.reduce((sum, e) => sum + Number(e._sum.amount || 0), 0);

      const expensesByCategory = expenses.map((e) => ({
        categoryId: e.categoryId,
        category: e.categoryId ? categoryMap.get(e.categoryId) : null,
        amount: Number(e._sum.amount || 0),
        count: e._count,
        percentage: total > 0 ? Math.round((Number(e._sum.amount || 0) / total) * 10000) / 100 : 0,
      }));

      res.json({
        status: 'success',
        data: { expensesByCategory, total },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNetWorthEvolution(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const snapshots = await prisma.netWorthSnapshot.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
      });

      res.json({
        status: 'success',
        data: {
          evolution: snapshots.map((s) => ({
            date: s.date,
            netWorth: Number(s.netWorth),
            totalAssets: Number(s.totalAssets),
            totalLiabilities: Number(s.totalLiabilities),
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getIncomeVsExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { period, startDate, endDate } = periodSchema.parse(req.query);
      const { startDate: periodStart, endDate: periodEnd } = getPeriodDates(period, startDate, endDate);

      const [income, expenses] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'INCOME',
            date: { gte: periodStart, lte: periodEnd },
            deletedAt: null,
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'EXPENSE',
            date: { gte: periodStart, lte: periodEnd },
            deletedAt: null,
          },
          _sum: { amount: true },
        }),
      ]);

      const incomeAmount = Number(income._sum.amount || 0);
      const expensesAmount = Number(expenses._sum.amount || 0);
      const savingsRate = incomeAmount > 0
        ? Math.round(((incomeAmount - expensesAmount) / incomeAmount) * 10000) / 100
        : 0;

      res.json({
        status: 'success',
        data: {
          income: incomeAmount,
          expenses: expensesAmount,
          balance: incomeAmount - expensesAmount,
          savingsRate,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
