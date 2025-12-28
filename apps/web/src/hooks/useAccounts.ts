import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export interface Account {
  id: string;
  name: string;
  type: string;
  institution: string | null;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
}

interface AccountsResponse {
  accounts: Account[];
  totalBalance: number;
}

interface CreateAccountData {
  name: string;
  type: string;
  institution?: string;
  currency?: string;
  initialBalance: number;
  color?: string;
  icon?: string;
}

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: ['accounts', { includeArchived }],
    queryFn: async () => {
      const response = await api.get<{ data: AccountsResponse }>(
        `/accounts${includeArchived ? '?includeArchived=true' : ''}`
      );
      return response.data.data;
    },
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const response = await api.get<{ data: { account: Account } }>(`/accounts/${id}`);
      return response.data.data.account;
    },
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAccountData) => {
      const response = await api.post<{ data: { account: Account } }>('/accounts', data);
      return response.data.data.account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta criada com sucesso!');
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateAccountData> }) => {
      const response = await api.patch<{ data: { account: Account } }>(`/accounts/${id}`, data);
      return response.data.data.account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta atualizada!');
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta excluida!');
    },
  });
}

export function useArchiveAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      await api.post(`/accounts/${id}/${archive ? 'archive' : 'unarchive'}`);
    },
    onSuccess: (_, { archive }) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(archive ? 'Conta arquivada!' : 'Conta restaurada!');
    },
  });
}
