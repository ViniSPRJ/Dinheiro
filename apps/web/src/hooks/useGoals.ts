import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  notes: string | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  icon: string | null;
  color: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
  contributions: GoalContribution[];
  percentComplete: number;
  remaining: number;
  daysLeft: number;
  requiredMonthly: number;
  createdAt: string;
}

interface GoalsResponse {
  goals: Goal[];
}

export interface CreateGoalData {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate: string;
  icon?: string;
  color?: string;
  categoryId?: string;
}

export interface AddContributionData {
  amount: number;
  date: string;
  notes?: string;
}

export function useGoals(includeCompleted = false) {
  return useQuery({
    queryKey: ['goals', { includeCompleted }],
    queryFn: async () => {
      const response = await api.get<{ data: GoalsResponse }>(
        `/goals${includeCompleted ? '?includeCompleted=true' : ''}`
      );
      return response.data.data;
    },
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: async () => {
      const response = await api.get<{ data: { goal: Goal } }>(`/goals/${id}`);
      return response.data.data.goal;
    },
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGoalData) => {
      const response = await api.post<{ data: { goal: Goal } }>('/goals', data);
      return response.data.data.goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Meta criada!');
    },
    onError: () => {
      toast.error('Erro ao criar meta');
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateGoalData>;
    }) => {
      const response = await api.patch<{ data: { goal: Goal } }>(
        `/goals/${id}`,
        data
      );
      return response.data.data.goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Meta atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar meta');
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Meta excluida!');
    },
    onError: () => {
      toast.error('Erro ao excluir meta');
    },
  });
}

export function useAddContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      goalId,
      data,
    }: {
      goalId: string;
      data: AddContributionData;
    }) => {
      const response = await api.post<{ data: { contribution: GoalContribution } }>(
        `/goals/${goalId}/contributions`,
        data
      );
      return response.data.data.contribution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Contribuicao adicionada!');
    },
    onError: () => {
      toast.error('Erro ao adicionar contribuicao');
    },
  });
}

// Goal icon options
export const goalIcons = [
  { value: '🏠', label: 'Casa' },
  { value: '🚗', label: 'Carro' },
  { value: '✈️', label: 'Viagem' },
  { value: '🎓', label: 'Educacao' },
  { value: '💍', label: 'Casamento' },
  { value: '👶', label: 'Filho' },
  { value: '🏝️', label: 'Ferias' },
  { value: '💻', label: 'Tecnologia' },
  { value: '🏋️', label: 'Saude' },
  { value: '🎯', label: 'Objetivo' },
  { value: '💰', label: 'Reserva' },
  { value: '🎁', label: 'Presente' },
];

// Goal color options
export const goalColors = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Ciano' },
  { value: '#F97316', label: 'Laranja' },
];
