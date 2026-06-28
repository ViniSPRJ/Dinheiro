import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { advisorService, RiskProfile } from '../services/advisor.service';

/**
 * Autonomous portfolio review for the current user. The advisor reads the
 * user's discriminated allocation and returns insights + an optimized
 * portfolio. Pass a `riskProfile` to preview a different profile without
 * persisting it.
 */
export function usePortfolioReview(riskProfile?: RiskProfile) {
  return useQuery({
    queryKey: ['advisor', 'review', riskProfile ?? 'default'],
    queryFn: () => advisorService.getReview(riskProfile),
    staleTime: 5 * 60 * 1000, // reviews are stable for a few minutes
  });
}

export function useUpdateRiskProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (riskProfile: RiskProfile) => advisorService.updateProfile(riskProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisor'] });
      toast.success('Perfil de investidor atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar perfil de investidor');
    },
  });
}
