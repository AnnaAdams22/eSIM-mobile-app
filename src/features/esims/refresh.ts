/**
 * When to re-fetch an eSIM's live usage on focus / foreground (pure).
 *
 * The backend caches usage for 60s and rate-limits it, so we don't want to hit
 * it every time a screen regains focus. But the default 60s staleTime is a little
 * too lazy for "how much have I used right now?", so on focus/foreground we force
 * a refresh only when the cached reading is at least ~30s old. Younger than that
 * and the number is effectively live — skip the call.
 */

/** Minimum age of cached usage before a focus/foreground refresh is worthwhile. */
export const USAGE_MIN_REFRESH_AGE_MS = 30_000;

/**
 * Should we refetch, given when the data last loaded (React Query's
 * `dataUpdatedAt`, 0 when nothing has loaded yet) and the current time?
 */
export function shouldRefetchUsage(
  dataUpdatedAt: number,
  now: number,
  minAgeMs: number = USAGE_MIN_REFRESH_AGE_MS
): boolean {
  return now - dataUpdatedAt >= minAgeMs;
}
