import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export type InvestmentType =
  | 'STOCK'
  | 'FII'
  | 'CRYPTO'
  | 'TESOURO_DIRETO'
  | 'CDB'
  | 'LCI'
  | 'LCA'
  | 'FUND'
  | 'PROPERTY'
  | 'OTHER';

export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;
  ticker: string | null;
  quantity: number | null;
  averagePrice: number;
  totalInvested: number;
  currentPrice: number | null;
  estimatedValue: number | null;
  institution: string | null;
  interestRate: number | null;
  maturityDate: string | null;
  address: string | null;
  notes: string | null;
  acquisitionDate: string;
  accountId: string | null;
  account: { id: string; name: string } | null;
  createdAt: string;
}

interface InvestmentsResponse {
  investments: Investment[];
  totalInvested: number;
}

interface PerformanceItem {
  id: string;
  name: string;
  ticker: string | null;
  type: InvestmentType;
  invested: number;
  currentValue: number;
  profit: number;
  profitPercent: number;
}

interface PerformanceResponse {
  performance: PerformanceItem[];
  totals: {
    totalInvested: number;
    totalCurrentValue: number;
    totalProfit: number;
    totalProfitPercent: number;
  };
}

interface AllocationItem {
  type: InvestmentType;
  value: number;
  count: number;
  percentage: number;
}

interface AllocationResponse {
  allocation: AllocationItem[];
  totalValue: number;
}

export interface CreateInvestmentData {
  type: InvestmentType;
  name: string;
  ticker?: string;
  quantity?: number;
  averagePrice: number;
  totalInvested: number;
  accountId?: string;
  institution?: string;
  interestRate?: number;
  maturityDate?: string;
  address?: string;
  estimatedValue?: number;
  notes?: string;
  acquisitionDate: string;
}

export function useInvestments(type?: InvestmentType) {
  return useQuery({
    queryKey: ['investments', { type }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      const response = await api.get<{ data: InvestmentsResponse }>(
        `/investments${params.toString() ? `?${params}` : ''}`
      );
      return response.data.data;
    },
  });
}

export function useInvestment(id: string) {
  return useQuery({
    queryKey: ['investment', id],
    queryFn: async () => {
      const response = await api.get<{ data: { investment: Investment } }>(
        `/investments/${id}`
      );
      return response.data.data.investment;
    },
    enabled: !!id,
  });
}

export function useInvestmentPerformance() {
  return useQuery({
    queryKey: ['investments', 'performance'],
    queryFn: async () => {
      const response = await api.get<{ data: PerformanceResponse }>(
        '/investments/performance'
      );
      return response.data.data;
    },
  });
}

export function useInvestmentAllocation() {
  return useQuery({
    queryKey: ['investments', 'allocation'],
    queryFn: async () => {
      const response = await api.get<{ data: AllocationResponse }>(
        '/investments/allocation'
      );
      return response.data.data;
    },
  });
}

export function useCreateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvestmentData) => {
      const response = await api.post<{ data: { investment: Investment } }>(
        '/investments',
        data
      );
      return response.data.data.investment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Investimento adicionado!');
    },
    onError: () => {
      toast.error('Erro ao adicionar investimento');
    },
  });
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateInvestmentData>;
    }) => {
      const response = await api.patch<{ data: { investment: Investment } }>(
        `/investments/${id}`,
        data
      );
      return response.data.data.investment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Investimento atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar investimento');
    },
  });
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/investments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Investimento removido!');
    },
    onError: () => {
      toast.error('Erro ao remover investimento');
    },
  });
}

// Helper to get investment type label and color
export const investmentTypeConfig: Record<
  InvestmentType,
  { label: string; color: string; bgColor: string }
> = {
  STOCK: { label: 'Acoes', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  FII: { label: 'FIIs', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  CRYPTO: { label: 'Crypto', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  TESOURO_DIRETO: { label: 'Tesouro Direto', color: 'text-green-600', bgColor: 'bg-green-50' },
  CDB: { label: 'CDB', color: 'text-teal-600', bgColor: 'bg-teal-50' },
  LCI: { label: 'LCI', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  LCA: { label: 'LCA', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  FUND: { label: 'Fundos', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  PROPERTY: { label: 'Imoveis', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  OTHER: { label: 'Outros', color: 'text-gray-600', bgColor: 'bg-gray-50' },
};
