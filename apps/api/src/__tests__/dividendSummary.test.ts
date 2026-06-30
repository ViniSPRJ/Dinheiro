import { describe, it, expect } from 'vitest';
import { summarizeDividends, DividendForSummary } from '../services/dividendSummary.js';

function dividend(
  investmentId: string,
  type: string,
  totalAmount: number,
  totalInvested: number,
  name = 'PETR4'
): DividendForSummary {
  return { investmentId, type, totalAmount, investment: { name, ticker: name, totalInvested } };
}

describe('summarizeDividends', () => {
  it('returns zeroed summary for no dividends', () => {
    const summary = summarizeDividends([]);
    expect(summary.totalReceived).toBe(0);
    expect(summary.byType).toEqual({});
    expect(summary.byInvestment).toEqual([]);
  });

  it('computes yield-on-cost against the fixture: R$100 invested, R$5 dividends -> 5%', () => {
    const summary = summarizeDividends([dividend('inv-1', 'DIVIDENDO', 5, 100)]);
    expect(summary.totalReceived).toBe(5);
    expect(summary.byInvestment[0].yieldOnCostPercent).toBe(5);
  });

  it('aggregates multiple dividends for the same investment before computing yield', () => {
    const summary = summarizeDividends([
      dividend('inv-1', 'DIVIDENDO', 3, 100),
      dividend('inv-1', 'JCP', 2, 100),
    ]);
    expect(summary.byInvestment).toHaveLength(1);
    expect(summary.byInvestment[0].totalReceived).toBe(5);
    expect(summary.byInvestment[0].yieldOnCostPercent).toBe(5);
    expect(summary.byType).toEqual({ DIVIDENDO: 3, JCP: 2 });
  });

  it('keeps investments separate and zeroes yield when cost basis is 0', () => {
    const summary = summarizeDividends([
      dividend('inv-1', 'DIVIDENDO', 5, 100, 'PETR4'),
      dividend('inv-2', 'RENDIMENTO', 10, 0, 'MXRF11'),
    ]);
    expect(summary.totalReceived).toBe(15);
    expect(summary.byInvestment).toHaveLength(2);
    const inv2 = summary.byInvestment.find((i) => i.investmentId === 'inv-2');
    expect(inv2?.yieldOnCostPercent).toBe(0);
  });
});
