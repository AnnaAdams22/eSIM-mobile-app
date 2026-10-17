/**
 * Refresh live eSIM usage when a screen regains focus and when the app returns to
 * the foreground — so "how much have I used?" is close to real time without
 * hammering the rate-limited backend.
 *
 * Each target is a React Query result: we refetch only the ones that aren't
 * already fetching and whose cached reading is at least ~30s old (see
 * `shouldRefetchUsage`). Pull-to-refresh and the manual refresh button are
 * unaffected — they force a fetch regardless.
 */

import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { shouldRefetchUsage } from '@/features/esims';

export interface UsageRefreshTarget {
  /** React Query's `dataUpdatedAt` (0 if nothing has loaded yet). */
  dataUpdatedAt: number;
  /** Whether a fetch is already in flight for this query. */
  isFetching: boolean;
  /** Force a refetch (bypasses staleTime). */
  refetch: () => unknown;
}

export function useRefreshOnFocus(targets: UsageRefreshTarget[]): void {
  // Keep the latest targets in a ref so the callbacks below stay stable (the
  // array identity changes every render as queries update). Updated in an effect
  // rather than during render; `useRef(targets)` seeds the first value.
  const targetsRef = useRef(targets);
  useEffect(() => {
    targetsRef.current = targets;
  });

  const refreshStale = useCallback(() => {
    const now = Date.now();
    for (const target of targetsRef.current) {
      if (target && !target.isFetching && shouldRefetchUsage(target.dataUpdatedAt, now)) {
        target.refetch();
      }
    }
  }, []);

  // On every focus (including tab re-selection and returning from a pushed screen).
  useFocusEffect(refreshStale);

  // On returning to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshStale();
    });
    return () => sub.remove();
  }, [refreshStale]);
}
