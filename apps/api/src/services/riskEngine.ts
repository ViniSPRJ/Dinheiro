/**
 * Deterministic portfolio math: CAPM, volatility/Sharpe/correlation, Kelly
 * sizing, and a simplified efficient-frontier point. No LLM calls, no network
 * I/O — this is the literal embodiment of "allocation/risk math must be
 * deterministic" (CAPM/Kelly/MPT). Any natural-language narration belongs in a
 * layer on top of these numbers, mirroring how the OpenSwarm advisor keeps its
 * deterministic core.py separate from optional LLM narration.
 */

export function calculateCAPM(beta: number, riskFreeRate: number, marketReturn: number): number {
  return riskFreeRate + beta * (marketReturn - riskFreeRate);
}

/** Day-over-day % change from a series of absolute values (e.g. portfolio totalValue). */
export function periodReturnsFromValues(values: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const previous = values[i - 1];
    if (previous === 0) continue;
    returns.push(((values[i] - previous) / previous) * 100);
  }
  return returns;
}

/** Compounds a series of period returns (in %) into a single cumulative return (in %). */
export function cumulativeReturn(returns: number[]): number {
  const compounded = returns.reduce((acc, r) => acc * (1 + r / 100), 1);
  return (compounded - 1) * 100;
}

export function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance);
}

export function calculateSharpe(returns: number[], riskFreeRate: number): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const volatility = calculateVolatility(returns);
  if (volatility === 0) return 0;
  return (mean - riskFreeRate) / volatility;
}

export function calculateCorrelation(seriesA: number[], seriesB: number[]): number {
  const n = Math.min(seriesA.length, seriesB.length);
  if (n < 2) return 0;
  const a = seriesA.slice(0, n);
  const b = seriesB.slice(0, n);
  const meanA = a.reduce((sum, v) => sum + v, 0) / n;
  const meanB = b.reduce((sum, v) => sum + v, 0) / n;

  let covariance = 0;
  let varianceA = 0;
  let varianceB = 0;
  for (let i = 0; i < n; i++) {
    const diffA = a[i] - meanA;
    const diffB = b[i] - meanB;
    covariance += diffA * diffB;
    varianceA += diffA ** 2;
    varianceB += diffB ** 2;
  }

  const denominator = Math.sqrt(varianceA * varianceB);
  return denominator === 0 ? 0 : covariance / denominator;
}

/**
 * Standard Kelly criterion for a binary bet (win rate + payoff ratio).
 * `fractional` scales the result down (0.5 = "half Kelly") since full Kelly is
 * well known to be too aggressive for real position sizing.
 */
export function kellyFraction(winRate: number, winLossRatio: number, fractional = 0.5): number {
  if (winLossRatio <= 0) return 0;
  const fullKelly = winRate - (1 - winRate) / winLossRatio;
  return Math.max(0, fullKelly) * fractional;
}

export interface EfficientFrontierPoint {
  riskyWeight: number;
  riskFreeWeight: number;
  expectedReturn: number;
  expectedVolatility: number;
}

/**
 * ponytail: this is the two-fund Capital Allocation Line point (mix of one
 * risky portfolio + the risk-free asset to hit a target volatility), not a
 * full N-asset quadratic-programming efficient frontier — that would need a
 * covariance matrix and a QP solver. The OpenSwarm advisor already owns full
 * N-asset allocation optimization; this answers the narrower "how much risky
 * exposure for my target vol" question as a supplementary risk metric. Upgrade
 * to a real QP solver if per-asset-class frontier points are needed later.
 */
export function efficientFrontierPoint(
  riskyReturn: number,
  riskyVolatility: number,
  riskFreeRate: number,
  targetVolatility: number
): EfficientFrontierPoint {
  if (riskyVolatility <= 0) {
    return { riskyWeight: 0, riskFreeWeight: 1, expectedReturn: riskFreeRate, expectedVolatility: 0 };
  }

  const riskyWeight = Math.max(0, Math.min(targetVolatility / riskyVolatility, 1));
  const riskFreeWeight = 1 - riskyWeight;
  const expectedReturn = riskFreeWeight * riskFreeRate + riskyWeight * riskyReturn;
  const expectedVolatility = riskyWeight * riskyVolatility;

  return { riskyWeight, riskFreeWeight, expectedReturn, expectedVolatility };
}
