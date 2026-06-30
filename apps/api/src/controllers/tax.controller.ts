import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { calculateTaxForGroup, AssetClassValue } from "../services/taxEngine.js";

interface GroupAccumulator {
  month: string;
  assetClass: AssetClassValue;
  totalSaleValue: number;
  totalGain: number;
}

/**
 * Groups raw CapitalGainEvent facts by (month, assetClass) across ALL of the
 * user's investments -- the monthly exemption is portfolio-wide per asset
 * class, not per investment, so this is the only place tax is authoritatively
 * computed (see the CapitalGainEvent model comment on why the per-event cache
 * isn't trusted here).
 */
function groupEvents(
  events: Array<{ month: string; assetClass: AssetClassValue; saleValue: unknown; gain: unknown }>
): GroupAccumulator[] {
  const map = new Map<string, GroupAccumulator>();
  events.forEach((event) => {
    const key = `${event.month}:${event.assetClass}`;
    const entry = map.get(key) ?? {
      month: event.month,
      assetClass: event.assetClass,
      totalSaleValue: 0,
      totalGain: 0,
    };
    entry.totalSaleValue += Number(event.saleValue);
    entry.totalGain += Number(event.gain);
    map.set(key, entry);
  });
  return Array.from(map.values());
}

export class TaxController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { year } = req.query;

      const where: Record<string, unknown> = {
        investment: { userId, deletedAt: null },
      };
      if (year) {
        where.month = { startsWith: String(year) };
      }

      const events = await prisma.capitalGainEvent.findMany({
        where,
        include: { investment: { select: { name: true, ticker: true } } },
        orderBy: { saleDate: "desc" },
      });

      const monthly = groupEvents(events)
        .map((group) => ({ ...group, ...calculateTaxForGroup(group) }))
        .sort((a, b) => (a.month < b.month ? 1 : -1));

      const totalTaxDue = monthly.reduce((sum, m) => sum + m.taxDue, 0);
      const totalGain = monthly.reduce((sum, m) => sum + m.totalGain, 0);

      res.json({
        status: "success",
        data: { monthly, totalTaxDue, totalGain, events },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDarf(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { month } = req.query;

      if (!month || typeof month !== "string" || !/^\d{4}-\d{2}$/.test(month)) {
        res.status(400).json({ status: "error", message: "Informe o parametro 'month' no formato YYYY-MM" });
        return;
      }

      const events = await prisma.capitalGainEvent.findMany({
        where: { month, investment: { userId, deletedAt: null } },
      });

      const darf = groupEvents(events).map((group) => ({ ...group, ...calculateTaxForGroup(group) }));
      const totalTaxDue = darf.reduce((sum, g) => sum + g.taxDue, 0);

      // DARF for capital gains is due by the last business day of the month
      // FOLLOWING the sale month. ponytail: uses the calendar last day, not the
      // business-day-adjusted one -- good enough for a planning estimate, not a
      // substitute for the real DARF generation tool come filing time.
      const [year, monthNum] = month.split("-").map(Number);
      const dueDate = new Date(Date.UTC(year, monthNum + 1, 0));

      res.json({
        status: "success",
        data: { month, darf, totalTaxDue, dueDate: dueDate.toISOString(), available: totalTaxDue > 0 },
      });
    } catch (error) {
      next(error);
    }
  }
}
