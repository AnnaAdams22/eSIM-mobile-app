/**
 * Offline-error classification (pure).
 *
 * We do NOT ship a native connectivity module (@react-native-community/netinfo
 * would force a native rebuild), so "offline" is inferred from the shape of
 * failed requests: a thrown `TimeoutError`, or a fetch that rejected before any
 * HTTP response (React Native throws a `TypeError: Network request failed`).
 *
 * A request that resolves with ANY HTTP status — even 5xx — proves we reached
 * the server, so an `ApiError` is never treated as offline. This keeps the
 * offline banner honest: it only appears when the network itself is unreachable.
 */

import { ApiError, TimeoutError } from '../api-error';

export function isOfflineError(err: unknown): boolean {
  // Reaching the server (any HTTP status) means we are online.
  if (err instanceof ApiError) return false;

  // Our own timeout wrapper around AbortController.
  if (err instanceof TimeoutError) return true;

  // React Native / fetch connectivity failures.
  if (err instanceof TypeError) {
    return /network request failed|failed to fetch|network error/i.test(err.message);
  }

  // Generic error objects (e.g. from the Stripe SDK) that describe connectivity.
  if (err && typeof err === 'object') {
    const message = String((err as { message?: unknown }).message ?? '');
    const code = String((err as { code?: unknown }).code ?? '');
    if (
      /network request failed|failed to fetch|network error|connection (was )?lost|not connected to the internet|timed? ?out|offline|unreachable/i.test(
        message
      )
    ) {
      return true;
    }
    if (/network|timeout|timedout|etimedout|econn|connection|offline/i.test(code)) return true;
  }

  return false;
}
