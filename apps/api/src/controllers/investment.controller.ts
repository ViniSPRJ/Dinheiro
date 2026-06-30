import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Investment } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { NotFoundError } from "../middleware/errorHandler.js";
import { quotesService } from "../services/quotesService.js";
import { recomputeInvestmentFromLots } from "../services/lotService.js";
import { regenerateCapitalGainEvents } from "../services/taxEngine.js";

const QUOTABLE_TYPES = ["STOCK", "FII", "CRYPTO"];

const addLotSchema = z.object({
  side: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  fees: z.number().min(0).optional(),
  tradeDate: z.string().transform((str) => new Date(str)),
  notes: z.string().optional(),
});

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
          // Seed the lot ledger with the position entered at creation time, so
          // later addLot/deleteLot recomputes start from a consistent history
          // instead of zeroing out a position that predates lot tracking.
          lots: {
            create: {
              side: "BUY",
              quantity: data.quantity ?? 1,
              unitPrice: data.averagePrice,
              tradeDate: data.acquisitionDate,
            },
          },
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

    const performance = await Promise.all(
      investments.map(async (inv) => {
        const currentValue = await InvestmentController.resolveCurrentValue(inv);
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
      })
    );

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

  /**
   * Resolves a position's current market value, falling back gracefully when a
   * live quote isn't available: live quote -> last cached quote (quoteRefreshJob)
   * -> manually entered estimatedValue -> quantity * averagePrice.
   */
  private static async resolveCurrentValue(inv: Investment): Promise<number> {
    const quantity = Number(inv.quantity || 1);

    if (inv.ticker && QUOTABLE_TYPES.includes(inv.type)) {
      const quote = await quotesService.getQuote(inv.ticker, inv.type);
      if (quote) return quote.price * quantity;
      if (inv.currentPrice) return Number(inv.currentPrice) * quantity;
    }

    if (inv.estimatedValue) return Number(inv.estimatedValue);
    return quantity * Number(inv.averagePrice);
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

  static async addLot(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const data = addLotSchema.parse(req.body);

      const investment = await prisma.investment.findFirst({
        where: { id, userId, deletedAt: null },
      });
      if (!investment) {
        throw new NotFoundError("Investment not found");
      }

      const lot = await prisma.investmentLot.create({
        data: { investmentId: id, ...data, fees: data.fees ?? 0 },
      });

      await recomputeInvestmentFromLots(id);
      await regenerateCapitalGainEvents(id);
      const updated = await prisma.investment.findUnique({ where: { id } });

      res.status(201).json({
        status: "success",
        data: { lot, investment: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLots(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const investment = await prisma.investment.findFirst({
        where: { id, userId, deletedAt: null },
      });
      if (!investment) {
        throw new NotFoundError("Investment not found");
      }

      const lots = await prisma.investmentLot.findMany({
        where: { investmentId: id },
        orderBy: { tradeDate: "desc" },
      });

      res.json({ status: "success", data: { lots } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLot(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id, lotId } = req.params;

      const investment = await prisma.investment.findFirst({
        where: { id, userId, deletedAt: null },
      });
      if (!investment) {
        throw new NotFoundError("Investment not found");
      }

      const lot = await prisma.investmentLot.findFirst({
        where: { id: lotId, investmentId: id },
      });
      if (!lot) {
        throw new NotFoundError("Lot not found");
      }

      await prisma.investmentLot.delete({ where: { id: lotId } });
      await recomputeInvestmentFromLots(id);
      await regenerateCapitalGainEvents(id);

      res.json({ status: "success", message: "Lot deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
