import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export interface Budget {
  id: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
  amount: number;
  period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  rolloverEnabled: boolean;
  rolloverBalance: number;
  startDate: string;
  isActive: boolean;
  spent: number;
  remaining: number;
  percentUsed: number;
  effectiveAmount: number;
}

interface BudgetsResponse {
  budgets: Budget[];
}

interface BudgetSuggestion {
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
  monthlyAverage: number;
  suggestedAmount: number;
  transactionCount: number;
}

interface SuggestionsResponse {
  suggestions: BudgetSuggestion[];
}

interface CreateBudgetData {
  categoryId: string;
  amount: number;
  period?: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  rolloverEnabled?: boolean;
  startDate: string;
}

export function useBudgets(period?: 'WEEKLY' | 'MONTHLY' | 'YEARLY') {
  const params = period ? `?period=${period}` : '';

  return useQuery({
    queryKey: ['budgets', period],
    queryFn: async () => {
      const response = await api.get<{ data: BudgetsResponse }>(
        `/budgets${params}`
      );
      return response.data.data.budgets;
    },
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: ['budget', id],
    queryFn: async () => {
      const response = await api.get<{ data: { budget: Budget } }>(
        `/budgets/${id}`
      );
      return response.data.data.budget;
    },
    enabled: !!id,
  });
}

export function useBudgetSuggestions() {
  return useQuery({
    queryKey: ['budget-suggestions'],
    queryFn: async () => {
      const response = await api.get<{ data: SuggestionsResponse }>(
        '/budgets/suggestions'
      );
      return response.data.data.suggestions;
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBudgetData) => {
      const response = await api.post<{ data: { budget: Budget } }>(
        '/budgets',
        data
      );
      return response.data.data.budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-suggestions'] });
      toast.success('Orcamento criado!');
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateBudgetData> }) => {
      const response = await api.patch<{ data: { budget: Budget } }>(
        `/budgets/${id}`,
        data
      );
      return response.data.data.budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Orcamento atualizado!');
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-suggestions'] });
      toast.success('Orcamento excluido!');
    },
  });
}
