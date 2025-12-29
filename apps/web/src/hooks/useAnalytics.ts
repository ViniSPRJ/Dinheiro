import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export type Period = 'week' | 'month' | 'quarter' | 'year' | 'all';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface ExpenseByCategory {
  categoryId: string | null;
  category: Category | null;
  amount: number;
  count?: number;
  percentage?: number;
}

interface CashFlowItem {
  month: string;
  income: number;
  expenses: number;
}

interface NetWorthEvolutionItem {
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

interface DashboardData {
  summary: {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    income: number;
    expenses: number;
    balance: number;
  };
  expensesByCategory: ExpenseByCategory[];
  recentTransactions: unknown[];
  budgets: unknown[];
  period: {
    start: string;
    end: string;
  };
}

interface CashFlowData {
  cashFlow: CashFlowItem[];
}

interface ExpensesByCategoryData {
  expensesByCategory: ExpenseByCategory[];
  total: number;
}

interface NetWorthEvolutionData {
  evolution: NetWorthEvolutionItem[];
}

interface IncomeVsExpensesData {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

export function useDashboardAnalytics(period: Period = 'month') {
  return useQuery({
    queryKey: ['analytics', 'dashboard', period],
    queryFn: async () => {
      const response = await api.get<{ data: DashboardData }>(
        `/analytics/dashboard?period=${period}`
      );
      return response.data.data;
    },
  });
}

export function useCashFlow() {
  return useQuery({
    queryKey: ['analytics', 'cashFlow'],
    queryFn: async () => {
      const response = await api.get<{ data: CashFlowData }>(
        '/analytics/cash-flow'
      );
      return response.data.data;
    },
  });
}

export function useExpensesByCategory(period: Period = 'month') {
  return useQuery({
    queryKey: ['analytics', 'expensesByCategory', period],
    queryFn: async () => {
      const response = await api.get<{ data: ExpensesByCategoryData }>(
        `/analytics/expenses-by-category?period=${period}`
      );
      return response.data.data;
    },
  });
}

export function useNetWorthEvolution() {
  return useQuery({
    queryKey: ['analytics', 'netWorthEvolution'],
    queryFn: async () => {
      const response = await api.get<{ data: NetWorthEvolutionData }>(
        '/analytics/net-worth-evolution'
      );
      return response.data.data;
    },
  });
}

export function useIncomeVsExpenses(period: Period = 'month') {
  return useQuery({
    queryKey: ['analytics', 'incomeVsExpenses', period],
    queryFn: async () => {
      const response = await api.get<{ data: IncomeVsExpensesData }>(
        `/analytics/income-vs-expenses?period=${period}`
      );
      return response.data.data;
    },
  });
}
