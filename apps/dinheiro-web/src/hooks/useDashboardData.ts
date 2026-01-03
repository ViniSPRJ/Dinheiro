import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

export function useDashboardData(selectedPeriod: string) {
  const { data: transactions, isLoading: loadingTx } = useQuery({
    queryKey: ['transactions', selectedPeriod],
    queryFn: () => api.getTransactions(),
  });

  const { data: budgets, isLoading: loadingBudgets } = useQuery({
    queryKey: ['budgets', selectedPeriod],
    queryFn: () => api.getBudgets(),
  });

  const { data: cashFlow, isLoading: loadingFlow } = useQuery({
    queryKey: ['cashFlow', selectedPeriod],
    queryFn: () => api.getCashFlow(),
  });

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['metrics', selectedPeriod],
    queryFn: () => api.getMetrics(),
  });

  const isLoading = loadingTx || loadingBudgets || loadingFlow || loadingMetrics;

  return {
    transactions: transactions || [],
    budgets: budgets || [],
    cashFlow: cashFlow || [],
    metrics: metrics || [],
    isLoading,
  };
}
