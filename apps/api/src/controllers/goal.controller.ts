import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const createGoalSchema = z.object({
  name: z.string().min(1).max(200),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.string().transform((str) => new Date(str)),
  icon: z.string().optional(),
  color: z.string().optional(),
  categoryId: z.string().optional(),
});

const updateGoalSchema = createGoalSchema.partial();

const contributionSchema = z.object({
  amount: z.number().positive(),
  date: z.string().transform((str) => new Date(str)),
  notes: z.string().optional(),
});

export class GoalController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { includeCompleted } = req.query;

      const goals = await prisma.goal.findMany({
        where: {
          userId,
          deletedAt: null,
          ...(includeCompleted !== 'true' && { isCompleted: false }),
        },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          contributions: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
        orderBy: { targetDate: 'asc' },
      });

      // Calculate progress for each goal
      const goalsWithProgress = goals.map((goal) => {
        const targetAmount = Number(goal.targetAmount);
        const currentAmount = Number(goal.currentAmount);
        const percentComplete = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
        const remaining = targetAmount - currentAmount;
        const daysLeft = Math.ceil((goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const monthsLeft = Math.max(0, Math.ceil(daysLeft / 30));
        const requiredMonthly = monthsLeft > 0 ? remaining / monthsLeft : remaining;

        return {
          ...goal,
          targetAmount,
          currentAmount,
          percentComplete: Math.min(100, Math.round(percentComplete * 100) / 100),
          remaining: Math.max(0, remaining),
          daysLeft: Math.max(0, daysLeft),
          requiredMonthly: Math.max(0, Math.ceil(requiredMonthly)),
        };
      });

      res.json({
        status: 'success',
        data: { goals: goalsWithProgress },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const data = createGoalSchema.parse(req.body);

      const goal = await prisma.goal.create({
        data: {
          userId,
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount,
          targetDate: data.targetDate,
          icon: data.icon,
          color: data.color,
          categoryId: data.categoryId,
        },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
        },
      });

      res.status(201).json({
        status: 'success',
        data: { goal },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const goal = await prisma.goal.findFirst({
        where: { id, userId, deletedAt: null },
        include: {
          category: true,
          contributions: {
            orderBy: { date: 'desc' },
          },
        },
      });

      if (!goal) {
        throw new NotFoundError('Goal not found');
      }

      const targetAmount = Number(goal.targetAmount);
      const currentAmount = Number(goal.currentAmount);
      const percentComplete = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

      res.json({
        status: 'success',
        data: {
          goal: {
            ...goal,
            percentComplete: Math.min(100, Math.round(percentComplete * 100) / 100),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const data = updateGoalSchema.parse(req.body);

      const existing = await prisma.goal.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError('Goal not found');
      }

      // Check if goal is now completed
      const newCurrentAmount = data.currentAmount ?? Number(existing.currentAmount);
      const targetAmount = data.targetAmount ?? Number(existing.targetAmount);
      const isCompleted = newCurrentAmount >= targetAmount;

      const goal = await prisma.goal.update({
        where: { id },
        data: {
          ...data,
          isCompleted,
          completedAt: isCompleted && !existing.isCompleted ? new Date() : existing.completedAt,
        },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
        },
      });

      res.json({
        status: 'success',
        data: { goal },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const existing = await prisma.goal.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError('Goal not found');
      }

      await prisma.goal.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      res.json({
        status: 'success',
        message: 'Goal deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async addContribution(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const data = contributionSchema.parse(req.body);

      const goal = await prisma.goal.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!goal) {
        throw new NotFoundError('Goal not found');
      }

      // Create contribution and update goal
      const [contribution] = await prisma.$transaction([
        prisma.goalContribution.create({
          data: {
            goalId: id,
            amount: data.amount,
            date: data.date,
            notes: data.notes,
          },
        }),
        prisma.goal.update({
          where: { id },
          data: {
            currentAmount: { increment: data.amount },
          },
        }),
      ]);

      // Check if goal is now completed
      const updatedGoal = await prisma.goal.findUnique({
        where: { id },
      });

      if (updatedGoal && Number(updatedGoal.currentAmount) >= Number(updatedGoal.targetAmount) && !updatedGoal.isCompleted) {
        await prisma.goal.update({
          where: { id },
          data: {
            isCompleted: true,
            completedAt: new Date(),
          },
        });

        // Create celebration notification
        await prisma.notification.create({
          data: {
            userId,
            type: 'GOAL_ACHIEVED',
            title: 'Meta alcancada!',
            message: `Parabens! Voce alcancou sua meta "${goal.name}"!`,
            actionUrl: `/goals/${id}`,
            actionLabel: 'Ver meta',
          },
        });
      }

      res.status(201).json({
        status: 'success',
        data: { contribution },
      });
    } catch (error) {
      next(error);
    }
  }
}
