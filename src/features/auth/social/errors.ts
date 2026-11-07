/**
 * Maps a social sign-in failure to either "stay silent" (the user cancelled, or
 * a sign-in is already in progress) or a friendly i18n key. The native wrapper
 * (`google.ts` / `apple.ts`) does the platform-specific classification — it knows
 * the SDK's error codes — and hands us a stable `reason`; this module stays pure
 * and testable.
 *
 * Anything we don't recognise falls through to the shared `mapAuthError`, so a
 * Supabase error returned by `signInWithIdToken` (rate limit, network, …) is
 * mapped exactly like it is for email sign-in.
 */

import { AUTH_ERROR_KEYS, mapAuthError, type AuthErrorKey } from '../errors';

/** Extra key just for social sign-in (Google Play services missing/out of date). */
export const SOCIAL_ERROR_KEYS = {
  googlePlayServices: 'auth.errors.googlePlayServices',
} as const;

export type SocialErrorKey = AuthErrorKey | (typeof SOCIAL_ERROR_KEYS)[keyof typeof SOCIAL_ERROR_KEYS];

/**
 * Normalised reason from a native wrapper:
 *  - `in_progress`  — a sign-in is already running (double-tap); ignore silently.
 *  - `play_services`— Google Play services unavailable/outdated (Android).
 *  - `unknown`      — anything else; defer to `mapAuthError(error)`.
 * (User cancellation is handled earlier as a `cancelled` status, never an error.)
 */
export type SocialErrorReason = 'in_progress' | 'play_services' | 'unknown';

/**
 * A short, STABLE, non-sensitive code shown under the friendly message so a
 * failure is diagnosable from a TestFlight/production screenshot without reading
 * logs. It is derived only from error `code`/`status`/`message` shape — NEVER
 * from tokens, nonces, ids or any payload, so it is always safe to display.
 *
 * `nonce_mismatch` is the one this bug turns on: Supabase's id-token grant returns
 * "Passed nonce and nonce in id_token should either both exist or not" (and true
 * value mismatches) — both surface here as `nonce_mismatch`.
 */
export type SocialErrorCode =
  | 'cancelled'
  | 'in_progress'
  | 'play_services'
  | 'nonce_mismatch'
  | 'audience'
  | 'provider_disabled'
  | 'bad_id_token'
  | 'network'
  | 'rate_limited'
  | 'account_deleted'
  | 'auth_failed';

interface SocialErrorLike {
  name?: string;
  code?: string;
  status?: number;
  message?: string;
}

/**
 * Map a Supabase/provider error to a short diagnostic code. Pure and defensive:
 * it only inspects the error's shape, never its content, so nothing sensitive can
 * leak into the UI.
 */
export function socialErrorCode(error: unknown, reason?: SocialErrorReason): SocialErrorCode {
  if (reason === 'in_progress') return 'in_progress';
  if (reason === 'play_services') return 'play_services';

  const e = (error ?? {}) as SocialErrorLike;
  const name = typeof e.name === 'string' ? e.name : '';
  const code = typeof e.code === 'string' ? e.code.toLowerCase() : '';
  const status = typeof e.status === 'number' ? e.status : undefined;
  const msg = typeof e.message === 'string' ? e.message.toLowerCase() : '';
  const hay = `${code} ${msg}`;

  if (hay.includes('cancel')) return 'cancelled';
  // The headline symptom of this bug: nonce present on one side only, or mismatched.
  if (hay.includes('nonce')) return 'nonce_mismatch';
  if (hay.includes('audience') || hay.includes('unacceptable') || hay.includes('invalid_client')) {
    return 'audience';
  }
  if (
    (hay.includes('provider') && (hay.includes('not enabled') || hay.includes('disabled'))) ||
    hay.includes('unsupported provider') ||
    hay.includes('validation_failed')
  ) {
    return 'provider_disabled';
  }
  if (
    name === 'TimeoutError' ||
    hay.includes('network request failed') ||
    hay.includes('failed to fetch') ||
    hay.includes('timed out') ||
    hay.includes('network error')
  ) {
    return 'network';
  }
  if (status === 429 || hay.includes('rate limit') || hay.includes('rate_limit') || hay.includes('too many')) {
    return 'rate_limited';
  }
  if (hay.includes('account_deleted')) return 'account_deleted';
  if (
    (hay.includes('invalid') || hay.includes('malformed') || hay.includes('bad')) &&
    (hay.includes('token') || hay.includes('jwt') || hay.includes('id_token'))
  ) {
    return 'bad_id_token';
  }
  return 'auth_failed';
}

export type SocialErrorResult =
  | { silent: true }
  | { silent: false; key: SocialErrorKey; code: SocialErrorCode };

export function classifySocialError(reason: SocialErrorReason, error?: unknown): SocialErrorResult {
  if (reason === 'in_progress') {
    return { silent: true };
  }
  if (reason === 'play_services') {
    return { silent: false, key: SOCIAL_ERROR_KEYS.googlePlayServices, code: 'play_services' };
  }
  return { silent: false, key: mapAuthError(error), code: socialErrorCode(error) };
}

export { AUTH_ERROR_KEYS };
