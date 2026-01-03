import { useQuery } from '@tanstack/react-query';
import { wealthService } from '../services/wealth.service';

export function useWealthHealth() {
  return useQuery({
    queryKey: ['wealth', 'health'],
    queryFn: () => wealthService.getHealth(),
  });
}

export function useHurdleRate() {
  return useQuery({
    queryKey: ['wealth', 'hurdle-rate'],
    queryFn: () => wealthService.getHurdleRate(),
  });
}
