import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

// Types
export interface UserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatarUrl: string | null;
  currency: string;
  locale: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'auto';
  onboardingCompleted: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UserPreferences {
  currency: string;
  locale: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface UpdateProfileData {
  name?: string;
  avatarUrl?: string | null;
}

export interface UpdatePreferencesData {
  currency?: 'BRL' | 'USD';
  locale?: string;
  dateFormat?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export interface ExportData {
  exportDate: string;
  user: object;
  accounts: object[];
  transactions: object[];
  categories: object[];
  budgets: object[];
  investments: object[];
  goals: object[];
  tags: object[];
}

// Hooks
export function useProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await api.get<{ data: { user: UserProfile } }>('/users/me');
      return response.data.data.user;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await api.patch<{ data: { user: UserProfile } }>('/users/me', data);
      return response.data.data.user;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      setUser(data);
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar perfil');
    },
  });
}

export function usePreferences() {
  return useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: async () => {
      const response = await api.get<{ data: { preferences: UserPreferences } }>(
        '/users/preferences'
      );
      return response.data.data.preferences;
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePreferencesData) => {
      const response = await api.patch<{ data: { preferences: UserPreferences } }>(
        '/users/preferences',
        data
      );
      return response.data.data.preferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast.success('Preferencias atualizadas!');
    },
    onError: () => {
      toast.error('Erro ao atualizar preferencias');
    },
  });
}

export function useDeleteAccount() {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await api.delete('/users/me');
    },
    onSuccess: () => {
      toast.success('Conta excluida com sucesso');
      logout();
    },
    onError: () => {
      toast.error('Erro ao excluir conta');
    },
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get<{ data: ExportData }>('/users/export');
      return response.data.data;
    },
    onSuccess: (data) => {
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dinheiro-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Dados exportados com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao exportar dados');
    },
  });
}

// Currency options
export const currencyOptions = [
  { value: 'BRL', label: 'Real Brasileiro (R$)', symbol: 'R$' },
  { value: 'USD', label: 'Dolar Americano ($)', symbol: '$' },
] as const;

// Theme options
export const themeOptions = [
  { value: 'light', label: 'Claro', description: 'Tema claro para uso diurno' },
  { value: 'dark', label: 'Escuro', description: 'Tema escuro para uso noturno' },
  { value: 'auto', label: 'Automatico', description: 'Segue a preferencia do sistema' },
] as const;

// Date format options
export const dateFormatOptions = [
  { value: 'dd/MM/yyyy', label: 'DD/MM/AAAA', example: '31/12/2024' },
  { value: 'MM/dd/yyyy', label: 'MM/DD/AAAA', example: '12/31/2024' },
  { value: 'yyyy-MM-dd', label: 'AAAA-MM-DD', example: '2024-12-31' },
] as const;
