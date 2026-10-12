/**
 * The top-up "replace" data-loss guard (pure).
 *
 * Attaching a DIFFERENT plan to an eSIM REPLACES its current plan and discards
 * whatever data is left. So before paying for a replacing option we warn the
 * customer — UNLESS there is demonstrably nothing to lose (the plan is expired or
 * already empty). This mirrors the backend's server-side guard
 * (../esim-backend/src/routes/esims.js) so the client asks the same question the
 * server would, and if we can't read the current state we assume there IS data
 * and confirm (fail safe).
 *
 * `replaceConfirmationInfo` recovers the numbers from the backend's 409 so the
 * app can re-ask with the server's figures if state changed between screens.
 */

import { ApiError } from '@/lib/api-error';

export interface ReplaceInfo {
  dataLeftMb: number | null;
  expiresAt: string | null;
}

export interface NeedsConfirmInput {
  /** True for an option that replaces the current plan (not the accumulate one). */
  replacesCurrent: boolean;
  /** Current plan's remaining data in MB; null when unknown. */
  dataLeftMb: number | null | undefined;
  /** Whether the current plan has already expired. */
  isExpired: boolean | null | undefined;
}

/**
 * Should we show the "this replaces your plan and loses remaining data" dialog
 * before paying?
 *   • never for an accumulate (same-plan) option;
 *   • only when there is data to lose (unknown data ⇒ assume yes) AND the plan
 *     isn't already expired.
 */
export function needsReplaceConfirm({
  replacesCurrent,
  dataLeftMb,
  isExpired,
}: NeedsConfirmInput): boolean {
  if (!replacesCurrent) return false;
  const hasData = dataLeftMb == null ? true : dataLeftMb > 0;
  const notExpired = isExpired !== true;
  return hasData && notExpired;
}

/**
 * If an error is the backend's 409 `replace_confirmation_required`, return the
 * data/expiry it carried; otherwise null (the caller rethrows).
 */
export function replaceConfirmationInfo(err: unknown): ReplaceInfo | null {
  if (!(err instanceof ApiError) || err.status !== 409) return null;
  if (err.body?.error !== 'replace_confirmation_required') return null;
  return {
    dataLeftMb: err.body?.data_left_mb ?? null,
    expiresAt: err.body?.expires_at ?? null,
  };
}
