import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export type AssetClass = 'ACOES' | 'FII' | 'CRIPTO' | 'OUTROS';

export interface MonthlyTaxGroup {
  month: string;
  assetClass: AssetClass;
  totalSaleValue: number;
  totalGain: number;
  exempt: boolean;
  taxDue: number;
}

export interface CapitalGainEvent {
  id: string;
  investmentId: string;
  saleDate: string;
  quantity: number;
  saleValue: number;
  costBasis: number;
  gain: number;
  assetClass: AssetClass;
  month: string;
  investment?: { name: string; ticker: string | null };
}

export interface TaxSummary {
  monthly: MonthlyTaxGroup[];
  totalTaxDue: number;
  totalGain: number;
  events: CapitalGainEvent[];
}

export interface DarfResult {
  month: string;
  darf: MonthlyTaxGroup[];
  totalTaxDue: number;
  dueDate: string;
  available: boolean;
}

export function useTaxSummary(year?: number) {
  return useQuery({
    queryKey: ['tax', 'summary', year],
    queryFn: async () => {
      const search = year ? `?year=${year}` : '';
      const response = await api.get<{ data: TaxSummary }>(`/tax/summary${search}`);
      return response.data.data;
    },
  });
}

export function useDarf(month: string) {
  return useQuery({
    queryKey: ['tax', 'darf', month],
    queryFn: async () => {
      const response = await api.get<{ data: DarfResult }>(`/tax/darf?month=${month}`);
      return response.data.data;
    },
    enabled: !!month,
  });
}
