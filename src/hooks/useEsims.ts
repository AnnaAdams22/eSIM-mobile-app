/**
 * React Query hooks for the "My eSIMs" area.
 *
 * All four endpoints are authenticated. Live usage is special: the backend
 * caches it for 60s and rate-limits it (30/min per user), so we mirror that with
 * a 60s `staleTime` (no refetch within the window) and leave 429s to fall through
 * untouched — React Query keeps the last good `data` when a refetch errors, so a
 * rate-limited reload simply shows the cached balance and retries later (on the
 * next stale read or a pull-to-refresh). The shared queryClient already skips
 * retrying 4xx, so a 429 is never hammered.
 */

import {
  useQuery,
  useQueries,
  type QueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { EsimDetail, EsimListItem, EsimUsage, TopupOptionsResponse } from '@/lib/api-types';

/** How long live usage stays fresh — matches the backend's 60s cache. */
const USAGE_STALE_MS = 60_000;

/** Centralised query keys so screens and invalidation never drift apart. */
export const esimsKeys = {
  list: ['esims'] as const,
  detail: (iccid: string) => ['esim', iccid] as const,
  usage: (iccid: string) => ['esim-usage', iccid] as const,
  topupOptions: (iccid: string) => ['esim-topup-options', iccid] as const,
};

/** The user's eSIMs, newest-first and grouped by ICCID (backend does the grouping). */
export function useEsims() {
  return useQuery({
    queryKey: esimsKeys.list,
    queryFn: () => api.getEsims(),
    select: (data): EsimListItem[] => data.esims ?? [],
  });
}

/** Shared query config for one eSIM's live usage (used by the hook and useQueries). */
function usageQueryOptions(
  iccid: string | null | undefined,
  enabled: boolean
): UseQueryOptions<EsimUsage, Error, EsimUsage, readonly unknown[]> {
  return {
    queryKey: esimsKeys.usage(iccid ?? '_none_'),
    queryFn: () => api.getEsimUsage(iccid as string),
    enabled: Boolean(iccid) && enabled,
    staleTime: USAGE_STALE_MS,
  };
}

/** Live usage for a single eSIM. */
export function useEsimUsage(iccid: string | null | undefined, enabled = true) {
  return useQuery(usageQueryOptions(iccid, enabled));
}

/**
 * Live usage for many eSIMs at once — one query per ICCID so the list can
 * classify Active/Past without blocking the list render. Items with no ICCID
 * (still provisioning) are skipped.
 */
export function useEsimUsages(iccids: (string | null | undefined)[]) {
  return useQueries({
    queries: iccids.map((iccid) => usageQueryOptions(iccid, true)),
  });
}

/** Full detail for one eSIM (plan, QR, order history). */
export function useEsim(iccid: string | null | undefined) {
  return useQuery({
    queryKey: esimsKeys.detail(iccid ?? '_none_'),
    queryFn: () => api.getEsim(iccid as string),
    enabled: Boolean(iccid),
    select: (data): EsimDetail => data,
  });
}

/** Top-up options for one eSIM (same-plan first, then same-geography replacements). */
export function useTopupOptions(iccid: string | null | undefined) {
  return useQuery({
    queryKey: esimsKeys.topupOptions(iccid ?? '_none_'),
    queryFn: () => api.getTopupOptions(iccid as string),
    enabled: Boolean(iccid),
    select: (data): TopupOptionsResponse => data,
  });
}

/**
 * Invalidate everything about one eSIM after a mutation (e.g. a top-up landed):
 * the list, its detail, its usage and its top-up options.
 */
export async function invalidateEsim(queryClient: QueryClient, iccid: string): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: esimsKeys.list }),
    queryClient.invalidateQueries({ queryKey: esimsKeys.detail(iccid) }),
    queryClient.invalidateQueries({ queryKey: esimsKeys.usage(iccid) }),
    queryClient.invalidateQueries({ queryKey: esimsKeys.topupOptions(iccid) }),
  ]);
}
