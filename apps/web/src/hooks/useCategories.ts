import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export interface Category {
  id: string;
  name: string;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  icon: string | null;
  color: string | null;
  userId: string | null;
  parentId: string | null;
  children?: Category[];
}

interface CategoriesResponse {
  categories: Category[];
}

interface CreateCategoryData {
  name: string;
  type?: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  icon?: string;
  color?: string;
  parentId?: string;
}

export function useCategories(type?: 'EXPENSE' | 'INCOME' | 'TRANSFER') {
  const params = type ? `?type=${type}` : '';

  return useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      const response = await api.get<{ data: CategoriesResponse }>(
        `/categories${params}`
      );
      return response.data.data.categories;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryData) => {
      const response = await api.post<{ data: { category: Category } }>(
        '/categories',
        data
      );
      return response.data.data.category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria criada!');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCategoryData> }) => {
      const response = await api.patch<{ data: { category: Category } }>(
        `/categories/${id}`,
        data
      );
      return response.data.data.category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria atualizada!');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria excluida!');
    },
  });
}
