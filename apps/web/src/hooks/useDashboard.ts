import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface DashboardSummary {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  income: number;
  expenses: number;
  balance: number;
}

interface CategoryExpense {
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  amount: number;
}

interface BudgetProgress {
  id: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

interface RecentTransaction {
  id: string;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  amount: number;
  description: string;
  date: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  account: {
    id: string;
    name: string;
  } | null;
}

interface DashboardData {
  summary: DashboardSummary;
  expensesByCategory: CategoryExpense[];
  recentTransactions: RecentTransaction[];
  budgets: BudgetProgress[];
  period: {
    start: string;
    end: string;
  };
}

interface CashFlowData {
  cashFlow: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

export function useDashboard(period: string = 'month') {
  return useQuery({
    queryKey: ['dashboard', period],
    queryFn: async () => {
      const response = await api.get<{ data: DashboardData }>(
        `/analytics/dashboard?period=${period}`
      );
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCashFlow() {
  return useQuery({
    queryKey: ['cashFlow'],
    queryFn: async () => {
      const response = await api.get<{ data: CashFlowData }>('/analytics/cash-flow');
      return response.data.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useExpensesByCategory(period: string = 'month') {
  return useQuery({
    queryKey: ['expensesByCategory', period],
    queryFn: async () => {
      const response = await api.get<{ data: { expensesByCategory: CategoryExpense[]; total: number } }>(
        `/analytics/expenses-by-category?period=${period}`
      );
      return response.data.data;
    },
  });
}

export function useNetWorthEvolution() {
  return useQuery({
    queryKey: ['netWorthEvolution'],
    queryFn: async () => {
      const response = await api.get<{
        data: {
          evolution: Array<{
            date: string;
            netWorth: number;
            totalAssets: number;
            totalLiabilities: number;
          }>;
        };
      }>('/analytics/net-worth-evolution');
      return response.data.data;
    },
  });
}
