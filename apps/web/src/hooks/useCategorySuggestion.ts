import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useCallback, useRef, useState } from 'react';

interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  confidence: number;
  source: 'ml' | 'history';
}

interface SuggestCategoryParams {
  description: string;
  amount?: number;
  accountType?: string;
}

interface SuggestionResponse {
  suggestion: CategorySuggestion | null;
  alternatives: Array<{
    categoryId: string;
    categoryName: string;
    confidence: number;
  }>;
}

export function useCategorySuggestion() {
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: async (params: SuggestCategoryParams) => {
      const response = await api.post<{ data: SuggestionResponse }>(
        '/ml/suggest-category',
        params
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      setSuggestion(data.suggestion);
      setIsLoading(false);
    },
    onError: () => {
      setSuggestion(null);
      setIsLoading(false);
    },
  });

  const suggest = useCallback((params: SuggestCategoryParams) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (params.description.length < 3) {
      setSuggestion(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Debounce the API call
    timeoutRef.current = setTimeout(() => {
      mutation.mutate(params);
    }, 500);
  }, [mutation]);

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    suggestion,
    isLoading,
    suggest,
    clearSuggestion,
  };
}

export function useRetrainModel() {
  return useMutation({
    mutationFn: async (params: {
      transactionId: string;
      description: string;
      categoryId: string;
    }) => {
      await api.post('/ml/retrain', params);
    },
  });
}
