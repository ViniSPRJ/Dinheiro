import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import {
  calculateCAPM,
  calculateVolatility,
  calculateSharpe,
  calculateCorrelation,
  kellyFraction,
  efficientFrontierPoint,
  periodReturnsFromValues,
  cumulativeReturn,
} from "../services/riskEngine.js";

const BENCHMARK_NAMES = ["CDI", "IBOV", "IPCA"];
const DEFAULT_PERIOD_DAYS = 90;
const FALLBACK_DAILY_RISK_FREE_RATE = 0.04; // ~CDI daily, used only until indexSyncJob populates MarketIndex

function parsePeriodDays(req: Request): number {
  const days = req.query.days ? Number(req.query.days) : DEFAULT_PERIOD_DAYS;
  return Number.isFinite(days) && days > 0 ? days : DEFAULT_PERIOD_DAYS;
}

function sinceDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export class RiskController {
  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const days = parsePeriodDays(req);
      const since = sinceDate(days);

      const snapshots = await prisma.portfolioSnapshot.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: "asc" },
      });

      if (snapshots.length < 2) {
        res.json({
          status: "success",
          data: {
            available: false,
            message:
              "Historico insuficiente para metricas de risco (minimo 2 dias de snapshot de portfolio).",
          },
        });
        return;
      }

      const portfolioReturns = periodReturnsFromValues(
        snapshots.map((s) => Number(s.totalValue))
      );

      const [cdiRows, ibovRows] = await Promise.all([
        prisma.marketIndex.findMany({ where: { name: "CDI", date: { gte: since } }, orderBy: { date: "asc" } }),
        prisma.marketIndex.findMany({ where: { name: "IBOV", date: { gte: since } }, orderBy: { date: "asc" } }),
      ]);

      const riskFreeRate =
        cdiRows.length > 0
          ? cdiRows.reduce((sum, r) => sum + Number(r.value), 0) / cdiRows.length
          : FALLBACK_DAILY_RISK_FREE_RATE;

      const marketReturns = ibovRows.map((r) => Number(r.value));
      const marketVolatility = calculateVolatility(marketReturns);
      const marketMeanReturn =
        marketReturns.length > 0
          ? marketReturns.reduce((sum, r) => sum + r, 0) / marketReturns.length
          : riskFreeRate;

      const volatility = calculateVolatility(portfolioReturns);
      const sharpe = calculateSharpe(portfolioReturns, riskFreeRate);
      const correlationWithIbov = calculateCorrelation(portfolioReturns, marketReturns);
      // Textbook CAPM beta: corr(asset, market) * (assetVol / marketVol).
      const beta = marketVolatility > 0 ? correlationWithIbov * (volatility / marketVolatility) : 1;
      const expectedReturnCapm = calculateCAPM(beta, riskFreeRate, marketMeanReturn);

      const positiveReturns = portfolioReturns.filter((r) => r > 0);
      const negativeReturns = portfolioReturns.filter((r) => r < 0);
      const winRate = positiveReturns.length / portfolioReturns.length;
      const avgWin =
        positiveReturns.length > 0
          ? positiveReturns.reduce((sum, r) => sum + r, 0) / positiveReturns.length
          : 0;
      const avgLoss =
        negativeReturns.length > 0
          ? Math.abs(negativeReturns.reduce((sum, r) => sum + r, 0) / negativeReturns.length)
          : 0;
      const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

      const frontierPoint = efficientFrontierPoint(
        marketMeanReturn,
        marketVolatility,
        riskFreeRate,
        volatility
      );

      res.json({
        status: "success",
        data: {
          available: true,
          periodDays: days,
          riskFreeRate,
          volatility,
          sharpe,
          beta,
          expectedReturnCapm,
          correlationWithIbov,
          kellyFraction: kellyFraction(winRate, winLossRatio),
          winRate,
          frontierPoint,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBenchmark(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const days = parsePeriodDays(req);
      const since = sinceDate(days);

      const snapshots = await prisma.portfolioSnapshot.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: "asc" },
      });

      if (snapshots.length < 2) {
        res.json({
          status: "success",
          data: { available: false, message: "Historico insuficiente para comparar com benchmarks." },
        });
        return;
      }

      const portfolioReturns = periodReturnsFromValues(
        snapshots.map((s) => Number(s.totalValue))
      );

      const benchmarks = await Promise.all(
        BENCHMARK_NAMES.map(async (name) => {
          const rows = await prisma.marketIndex.findMany({
            where: { name, date: { gte: since } },
            orderBy: { date: "asc" },
          });
          const returns = rows.map((r) => Number(r.value));
          return {
            name,
            cumulativeReturnPercent: cumulativeReturn(returns),
            dataPoints: returns.length,
          };
        })
      );

      res.json({
        status: "success",
        data: {
          available: true,
          periodDays: days,
          portfolio: { cumulativeReturnPercent: cumulativeReturn(portfolioReturns) },
          benchmarks,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
