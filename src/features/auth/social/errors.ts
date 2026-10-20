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

export type SocialErrorResult =
  | { silent: true }
  | { silent: false; key: SocialErrorKey };

export function classifySocialError(reason: SocialErrorReason, error?: unknown): SocialErrorResult {
  if (reason === 'in_progress') {
    return { silent: true };
  }
  if (reason === 'play_services') {
    return { silent: false, key: SOCIAL_ERROR_KEYS.googlePlayServices };
  }
  return { silent: false, key: mapAuthError(error) };
}

export { AUTH_ERROR_KEYS };
