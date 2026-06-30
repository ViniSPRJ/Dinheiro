import { describe, it, expect } from 'vitest';
import {
  calculateCAPM,
  calculateVolatility,
  calculateSharpe,
  calculateCorrelation,
  kellyFraction,
  efficientFrontierPoint,
  periodReturnsFromValues,
  cumulativeReturn,
} from '../services/riskEngine.js';

describe('riskEngine', () => {
  it('calculateCAPM matches the textbook formula', () => {
    // E(R) = Rf + beta * (Rm - Rf) = 2 + 1.5 * (10 - 2) = 14
    expect(calculateCAPM(1.5, 2, 10)).toBeCloseTo(14, 8);
  });

  it('calculateVolatility matches a hand-computed sample stdev', () => {
    // mean=3, sample variance = 10/4 = 2.5, stdev = sqrt(2.5)
    expect(calculateVolatility([1, 2, 3, 4, 5])).toBeCloseTo(Math.sqrt(2.5), 8);
  });

  it('calculateVolatility returns 0 for fewer than 2 points', () => {
    expect(calculateVolatility([5])).toBe(0);
    expect(calculateVolatility([])).toBe(0);
  });

  it('calculateSharpe matches (mean - riskFree) / volatility', () => {
    const sharpe = calculateSharpe([1, 2, 3, 4, 5], 1);
    expect(sharpe).toBeCloseTo((3 - 1) / Math.sqrt(2.5), 8);
  });

  it('calculateCorrelation is 1 for perfectly correlated series', () => {
    expect(calculateCorrelation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 8);
  });

  it('calculateCorrelation is -1 for perfectly inverse series', () => {
    expect(calculateCorrelation([1, 2, 3], [3, 2, 1])).toBeCloseTo(-1, 8);
  });

  it('kellyFraction matches the textbook formula and applies the fractional multiplier', () => {
    // full Kelly = winRate - (1 - winRate) / winLossRatio = 0.6 - 0.4/2 = 0.4
    expect(kellyFraction(0.6, 2, 1)).toBeCloseTo(0.4, 8);
    expect(kellyFraction(0.6, 2, 0.5)).toBeCloseTo(0.2, 8);
  });

  it('kellyFraction floors at 0 for a negative edge', () => {
    expect(kellyFraction(0.1, 1, 1)).toBe(0);
  });

  it('efficientFrontierPoint scales risky weight to hit the target volatility', () => {
    const point = efficientFrontierPoint(10, 20, 2, 10);
    expect(point.riskyWeight).toBeCloseTo(0.5, 8);
    expect(point.riskFreeWeight).toBeCloseTo(0.5, 8);
    expect(point.expectedReturn).toBeCloseTo(6, 8);
    expect(point.expectedVolatility).toBeCloseTo(10, 8);
  });

  it('periodReturnsFromValues derives % change between consecutive values', () => {
    expect(periodReturnsFromValues([100, 110, 121])).toEqual([10, 10]);
  });

  it('cumulativeReturn compounds period returns correctly', () => {
    // 1.1 * 1.1 = 1.21 -> 21% cumulative
    expect(cumulativeReturn([10, 10])).toBeCloseTo(21, 8);
  });
});
