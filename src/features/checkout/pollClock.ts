/**
 * Background-aware elapsed clock for order-success polling (pure).
 *
 * The order-success timeout (60s) is driven by elapsed time. If the app is
 * backgrounded mid-poll, wall-clock keeps advancing while JS timers are frozen,
 * so on resume the screen could jump straight to "timed out" even though the
 * backend was still provisioning. We exclude background time by shifting the
 * `startedAt` baseline forward by however long we spent backgrounded — so the
 * countdown effectively pauses and resumes.
 */

/**
 * New `startedAt` baseline after returning to the foreground.
 * Adds the backgrounded duration to the original baseline.
 *
 * @param startedAt      current baseline (ms epoch)
 * @param backgroundedAt when the app went to background (ms epoch)
 * @param resumedAt      when the app returned to active (ms epoch)
 */
export function backgroundAdjustedStart(
  startedAt: number,
  backgroundedAt: number,
  resumedAt: number
): number {
  // Guard against clock skew / out-of-order events: never move the baseline
  // backwards (which would *add* elapsed time).
  const backgroundMs = Math.max(0, resumedAt - backgroundedAt);
  return startedAt + backgroundMs;
}
