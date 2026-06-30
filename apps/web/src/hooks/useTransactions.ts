import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export interface Transaction {
  id: string;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  amount: number;
  description: string;
  date: string;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  accountId: string | null;
  account: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  tags: Array<{ id: string; name: string; color: string | null }>;
  notes: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'RECONCILED';
  mlCategorized: boolean;
  categoryConfidence: number | null;
  createdAt: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  categoryId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: string;
}

interface CreateTransactionData {
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  accountId?: string;
  transferFromId?: string;
  transferToId?: string;
  status?: string;
  notes?: string;
  tagIds?: string[];
}

export function useTransactions(filters: TransactionFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });

  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const response = await api.get<{ data: TransactionsResponse }>(
        `/transactions?${params.toString()}`
      );
      return response.data.data;
    },
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const response = await api.get<{ data: { transaction: Transaction } }>(
        `/transactions/${id}`
      );
      return response.data.data.transaction;
    },
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      const response = await api.post<{ data: { transaction: Transaction } }>(
        '/transactions',
        data
      );
      return response.data.data.transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transacao adicionada!');
    },
  });
}

export interface ReceiptExtraction {
  available: boolean;
  message?: string;
  amount: number | null;
  date: string | null;
  merchant: string | null;
  category_suggestion?: {
    category_id: string;
    category_name: string;
    confidence: number;
  } | null;
}

export function useExtractReceipt() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const response = await api.post<{ data: ReceiptExtraction }>(
        '/transactions/extract-receipt',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data;
    },
    onError: () => {
      toast.error('Nao foi possivel ler o recibo');
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTransactionData> }) => {
      const response = await api.patch<{ data: { transaction: Transaction } }>(
        `/transactions/${id}`,
        data
      );
      return response.data.data.transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transacao atualizada!');
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transacao excluida!');
    },
  });
}

export function useBulkDeleteTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await api.post('/transactions/bulk-delete', { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transacoes excluidas!');
    },
  });
}
