import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { NotFoundError } from "../middleware/errorHandler.js";
import { summarizeDividends } from "../services/dividendSummary.js";

const createDividendSchema = z.object({
  investmentId: z.string(),
  type: z.enum(["DIVIDENDO", "JCP", "RENDIMENTO"]),
  amountPerShare: z.number().positive(),
  totalAmount: z.number().positive(),
  paymentDate: z.string().transform((str) => new Date(str)),
  exDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  withholdingTax: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const updateDividendSchema = createDividendSchema.partial().omit({ investmentId: true });

export class DividendController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { investmentId, type, year } = req.query;

      const where: Record<string, unknown> = {
        investment: { userId, deletedAt: null },
        ...(investmentId && { investmentId: investmentId as string }),
        ...(type && { type: type as string }),
      };
      if (year) {
        const y = Number(year);
        where.paymentDate = {
          gte: new Date(`${y}-01-01`),
          lt: new Date(`${y + 1}-01-01`),
        };
      }

      const dividends = await prisma.dividend.findMany({
        where,
        include: {
          investment: { select: { id: true, name: true, ticker: true, type: true } },
        },
        orderBy: { paymentDate: "desc" },
      });

      res.json({ status: "success", data: { dividends } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const data = createDividendSchema.parse(req.body);

      const investment = await prisma.investment.findFirst({
        where: { id: data.investmentId, userId, deletedAt: null },
      });
      if (!investment) {
        throw new NotFoundError("Investment not found");
      }

      const dividend = await prisma.dividend.create({
        data: { ...data, withholdingTax: data.withholdingTax ?? 0 },
      });

      res.status(201).json({ status: "success", data: { dividend } });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const data = updateDividendSchema.parse(req.body);

      const existing = await prisma.dividend.findFirst({
        where: { id, investment: { userId, deletedAt: null } },
      });
      if (!existing) {
        throw new NotFoundError("Dividend not found");
      }

      const dividend = await prisma.dividend.update({ where: { id }, data });

      res.json({ status: "success", data: { dividend } });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const existing = await prisma.dividend.findFirst({
        where: { id, investment: { userId, deletedAt: null } },
      });
      if (!existing) {
        throw new NotFoundError("Dividend not found");
      }

      await prisma.dividend.delete({ where: { id } });

      res.json({ status: "success", message: "Dividend deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { year } = req.query;

      const where: Record<string, unknown> = {
        investment: { userId, deletedAt: null },
      };
      if (year) {
        const y = Number(year);
        where.paymentDate = {
          gte: new Date(`${y}-01-01`),
          lt: new Date(`${y + 1}-01-01`),
        };
      }

      const dividends = await prisma.dividend.findMany({
        where,
        include: {
          investment: { select: { id: true, name: true, ticker: true, totalInvested: true } },
        },
      });

      const summary = summarizeDividends(
        dividends.map((d) => ({
          investmentId: d.investmentId,
          type: d.type,
          totalAmount: Number(d.totalAmount),
          investment: {
            name: d.investment.name,
            ticker: d.investment.ticker,
            totalInvested: Number(d.investment.totalInvested),
          },
        }))
      );

      res.json({ status: "success", data: summary });
    } catch (error) {
      next(error);
    }
  }
}
