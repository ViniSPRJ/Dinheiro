import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { NotFoundError } from "../middleware/errorHandler.js";

const createInvestmentSchema = z.object({
  type: z.enum([
    "STOCK",
    "FII",
    "CRYPTO",
    "TESOURO_DIRETO",
    "CDB",
    "LCI",
    "LCA",
    "FUND",
    "PROPERTY",
    "OTHER",
  ]),
  name: z.string().min(1).max(200),
  ticker: z.string().max(20).optional(),
  quantity: z.number().optional(),
  averagePrice: z.number().positive(),
  totalInvested: z.number().positive(),
  accountId: z.string().optional(),
  institution: z.string().max(100).optional(),
  interestRate: z.number().optional(),
  maturityDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  address: z.string().optional(),
  estimatedValue: z.number().optional(),
  notes: z.string().optional(),
  acquisitionDate: z.string().transform((str) => new Date(str)),
});

const updateInvestmentSchema = createInvestmentSchema.partial();

export class InvestmentController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { type } = req.query;

      const investments = await prisma.investment.findMany({
        where: {
          userId,
          deletedAt: null,
          ...(type && { type: type as any }),
        },
        include: {
          account: { select: { id: true, name: true } },
        },
        orderBy: { totalInvested: "desc" },
      });

      // Calculate totals
      const totalInvested = investments.reduce(
        (sum, inv) => sum + Number(inv.totalInvested),
        0
      );

      res.json({
        status: "success",
        data: {
          investments,
          totalInvested,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const data = createInvestmentSchema.parse(req.body);

      const investment = await prisma.investment.create({
        data: {
          userId,
          ...data,
        },
        include: {
          account: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({
        status: "success",
        data: { investment },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const investment = await prisma.investment.findFirst({
        where: { id, userId, deletedAt: null },
        include: {
          account: true,
        },
      });

      if (!investment) {
        throw new NotFoundError("Investment not found");
      }

      res.json({
        status: "success",
        data: { investment },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const data = updateInvestmentSchema.parse(req.body);

      const existing = await prisma.investment.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError("Investment not found");
      }

      const investment = await prisma.investment.update({
        where: { id },
        data,
        include: {
          account: { select: { id: true, name: true } },
        },
      });

      res.json({
        status: "success",
        data: { investment },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const existing = await prisma.investment.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError("Investment not found");
      }

      await prisma.investment.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      res.json({
        status: "success",
        message: "Investment deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { performance, totals } =
        await InvestmentController.getPerformanceInternal(userId);

      res.json({
        status: "success",
        data: { performance, totals },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPerformanceInternal(userId: string) {
    const investments = await prisma.investment.findMany({
      where: { userId, deletedAt: null },
    });

    // TODO: Fetch current prices from external APIs
    // For now, return calculated values based on stored data
    const performance = investments.map((inv) => {
      const currentValue = inv.estimatedValue
        ? Number(inv.estimatedValue)
        : Number(inv.quantity || 1) * Number(inv.averagePrice);
      const invested = Number(inv.totalInvested);
      const profit = currentValue - invested;
      const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;

      return {
        id: inv.id,
        name: inv.name,
        ticker: inv.ticker,
        type: inv.type,
        invested,
        currentValue,
        profit,
        profitPercent: Math.round(profitPercent * 100) / 100,
      };
    });

    const totals = {
      totalInvested: performance.reduce((sum, p) => sum + p.invested, 0),
      totalCurrentValue: performance.reduce(
        (sum, p) => sum + p.currentValue,
        0
      ),
      totalProfit: performance.reduce((sum, p) => sum + p.profit, 0),
      totalProfitPercent: 0,
    };

    totals.totalProfitPercent =
      totals.totalInvested > 0
        ? Math.round((totals.totalProfit / totals.totalInvested) * 10000) / 100
        : 0;

    return { performance, totals };
  }

  static async getAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      const investments = await prisma.investment.findMany({
        where: { userId, deletedAt: null },
      });

      // Group by type
      const allocationByType: Record<
        string,
        { type: string; value: number; count: number }
      > = {};

      investments.forEach((inv) => {
        const value = inv.estimatedValue
          ? Number(inv.estimatedValue)
          : Number(inv.totalInvested);

        if (!allocationByType[inv.type]) {
          allocationByType[inv.type] = { type: inv.type, value: 0, count: 0 };
        }
        allocationByType[inv.type].value += value;
        allocationByType[inv.type].count += 1;
      });

      const totalValue = Object.values(allocationByType).reduce(
        (sum, a) => sum + a.value,
        0
      );

      const allocation = Object.values(allocationByType)
        .map((a) => ({
          ...a,
          percentage:
            totalValue > 0
              ? Math.round((a.value / totalValue) * 10000) / 100
              : 0,
        }))
        .sort((a, b) => b.value - a.value);

      res.json({
        status: "success",
        data: { allocation, totalValue },
      });
    } catch (error) {
      next(error);
    }
  }
}
