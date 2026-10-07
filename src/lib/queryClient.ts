/**
 * Shared React Query client.
 *
 * Defaults tuned for a mobile shop: a short stale time so prices/usage stay
 * fresh, no refetch spam, and no retry on 4xx (client errors won't fix on retry).
 */

import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // Don't retry client errors (401/403/404/409/4xx) — only transient ones.
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
