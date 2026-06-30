export interface DividendForSummary {
  investmentId: string;
  type: string;
  totalAmount: number;
  investment: { name: string; ticker: string | null; totalInvested: number };
}

export interface DividendSummary {
  totalReceived: number;
  byType: Record<string, number>;
  byInvestment: Array<{
    investmentId: string;
    name: string;
    ticker: string | null;
    totalReceived: number;
    totalInvested: number;
    yieldOnCostPercent: number;
  }>;
}

/**
 * Pure aggregation over a list of dividends: totals, breakdown by type, and
 * yield-on-cost per investment (dividends received / cost basis from Fase 1's
 * lot-based totalInvested). Kept separate from DividendController so it's
 * unit-testable without a DB.
 */
export function summarizeDividends(dividends: DividendForSummary[]): DividendSummary {
  const totalReceived = dividends.reduce((sum, d) => sum + d.totalAmount, 0);

  const byType: Record<string, number> = {};
  dividends.forEach((d) => {
    byType[d.type] = (byType[d.type] ?? 0) + d.totalAmount;
  });

  const byInvestmentMap = new Map<
    string,
    { investmentId: string; name: string; ticker: string | null; totalReceived: number; totalInvested: number }
  >();
  dividends.forEach((d) => {
    const entry = byInvestmentMap.get(d.investmentId) ?? {
      investmentId: d.investmentId,
      name: d.investment.name,
      ticker: d.investment.ticker,
      totalReceived: 0,
      totalInvested: d.investment.totalInvested,
    };
    entry.totalReceived += d.totalAmount;
    byInvestmentMap.set(d.investmentId, entry);
  });

  const byInvestment = Array.from(byInvestmentMap.values()).map((entry) => ({
    ...entry,
    yieldOnCostPercent:
      entry.totalInvested > 0
        ? Math.round((entry.totalReceived / entry.totalInvested) * 10000) / 100
        : 0,
  }));

  return { totalReceived, byType, byInvestment };
}
