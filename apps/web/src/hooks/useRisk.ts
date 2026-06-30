import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface RiskMetrics {
  available: boolean;
  message?: string;
  periodDays?: number;
  riskFreeRate?: number;
  volatility?: number;
  sharpe?: number;
  beta?: number;
  expectedReturnCapm?: number;
  correlationWithIbov?: number;
  kellyFraction?: number;
  winRate?: number;
  frontierPoint?: {
    riskyWeight: number;
    riskFreeWeight: number;
    expectedReturn: number;
    expectedVolatility: number;
  };
}

export interface BenchmarkComparison {
  available: boolean;
  message?: string;
  periodDays?: number;
  portfolio?: { cumulativeReturnPercent: number };
  benchmarks?: Array<{ name: string; cumulativeReturnPercent: number; dataPoints: number }>;
}

export function useRiskMetrics(days = 90) {
  return useQuery({
    queryKey: ['risk', 'metrics', days],
    queryFn: async () => {
      const response = await api.get<{ data: RiskMetrics }>(`/risk/metrics?days=${days}`);
      return response.data.data;
    },
  });
}

export function useBenchmarkComparison(days = 90) {
  return useQuery({
    queryKey: ['risk', 'benchmark', days],
    queryFn: async () => {
      const response = await api.get<{ data: BenchmarkComparison }>(`/risk/benchmark?days=${days}`);
      return response.data.data;
    },
  });
}
