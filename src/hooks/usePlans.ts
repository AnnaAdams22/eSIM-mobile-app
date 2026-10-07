/**
 * usePlans — the public catalog query.
 *
 * GET /api/plans is public (no auth) and changes rarely, so a long stale time
 * keeps the shopping screens instant and spares the backend. Transient/network
 * errors are retried by the shared queryClient (which already skips 4xx); the
 * screens surface a retryable ErrorState via `refetch`.
 */

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Plan } from '@/lib/api-types';

export const PLANS_QUERY_KEY = ['plans'] as const;

const TEN_MINUTES = 10 * 60 * 1000;

export function usePlans() {
  return useQuery({
    queryKey: PLANS_QUERY_KEY,
    queryFn: () => api.getPlans(),
    staleTime: TEN_MINUTES,
    // Select just the array so consumers don't repeat `.plans` everywhere.
    select: (data): Plan[] => data.plans ?? [],
  });
}
