import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export type DividendType = 'DIVIDENDO' | 'JCP' | 'RENDIMENTO';

export interface Dividend {
  id: string;
  investmentId: string;
  type: DividendType;
  amountPerShare: number;
  totalAmount: number;
  paymentDate: string;
  exDate: string | null;
  withholdingTax: number;
  notes: string | null;
  investment?: { id: string; name: string; ticker: string | null; type: string };
  createdAt: string;
}

export interface CreateDividendData {
  investmentId: string;
  type: DividendType;
  amountPerShare: number;
  totalAmount: number;
  paymentDate: string;
  exDate?: string;
  withholdingTax?: number;
  notes?: string;
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

export function useDividends(params?: { investmentId?: string; year?: number }) {
  return useQuery({
    queryKey: ['dividends', params],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params?.investmentId) search.append('investmentId', params.investmentId);
      if (params?.year) search.append('year', String(params.year));
      const response = await api.get<{ data: { dividends: Dividend[] } }>(
        `/dividends${search.toString() ? `?${search}` : ''}`
      );
      return response.data.data.dividends;
    },
  });
}

export function useDividendSummary(year?: number) {
  return useQuery({
    queryKey: ['dividends', 'summary', year],
    queryFn: async () => {
      const search = year ? `?year=${year}` : '';
      const response = await api.get<{ data: DividendSummary }>(`/dividends/summary${search}`);
      return response.data.data;
    },
  });
}

export function useCreateDividend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDividendData) => {
      const response = await api.post<{ data: { dividend: Dividend } }>('/dividends', data);
      return response.data.data.dividend;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dividends'] });
      toast.success('Provento lancado!');
    },
    onError: () => {
      toast.error('Erro ao lancar provento');
    },
  });
}

export function useDeleteDividend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dividends/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dividends'] });
      toast.success('Provento removido!');
    },
    onError: () => {
      toast.error('Erro ao remover provento');
    },
  });
}
