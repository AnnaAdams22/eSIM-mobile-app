/**
 * Pure helpers for the Apple-aware account-deletion flow.
 *
 * Apple App Store Guideline 5.1.1(v): an app offering Sign in with Apple that
 * also offers account deletion MUST revoke the user's Apple tokens when the
 * account is deleted. The backend performs the revocation, but it needs a fresh
 * Apple `authorizationCode`; the app obtains one by re-authenticating with Apple
 * at deletion time and forwards it on `DELETE /api/me`.
 *
 * These two decisions are pure so they can be unit-tested without the native
 * Apple module or a Supabase session:
 *  - `hasAppleIdentity` — does this account have an Apple identity at all? (Only
 *    then must we re-authenticate.) It reads the SAME signals Supabase exposes
 *    (`identities[].provider` and `app_metadata.provider(s)`); it never trusts
 *    user-editable `user_metadata`.
 *  - `resolveAppleReauth` — given the native re-auth result, do we proceed with
 *    deletion, and with what code? (cancel → don't delete; error → delete without
 *    a code so the backend can still revoke a stored token; success → send it.)
 */

import type { User } from '@supabase/supabase-js';

/** The result of the native Apple re-authentication step (see social/apple.ts). */
export type AppleReauthResult =
  | { status: 'success'; authorizationCode: string | null }
  | { status: 'cancelled' }
  | { status: 'error'; error?: unknown };

/** Decision for the delete flow after (maybe) re-authenticating with Apple. */
export type AppleReauthDecision =
  | { proceed: true; code: string | null }
  | { proceed: false };

/** True when the signed-in account has an Apple identity (provider 'apple'). */
export function hasAppleIdentity(user: User | null | undefined): boolean {
  if (!user) return false;

  // Primary signal: the linked identities list.
  if (Array.isArray(user.identities)) {
    if (user.identities.some((i) => i?.provider === 'apple')) return true;
  }

  // Secondary: app_metadata (server-controlled, unlike user_metadata).
  const meta = user.app_metadata as
    | { provider?: unknown; providers?: unknown }
    | undefined;
  if (meta) {
    if (meta.provider === 'apple') return true;
    if (Array.isArray(meta.providers) && meta.providers.includes('apple')) return true;
  }

  return false;
}

/**
 * Map a native Apple re-auth result to the deletion decision.
 *  - cancelled → do NOT delete (the user must confirm with Apple).
 *  - error     → proceed WITHOUT a code; the backend still revokes a stored
 *                token if one exists, and a revoke failure never blocks deletion.
 *  - success   → proceed and forward the fresh authorization code.
 */
export function resolveAppleReauth(result: AppleReauthResult): AppleReauthDecision {
  switch (result.status) {
    case 'cancelled':
      return { proceed: false };
    case 'error':
      return { proceed: true, code: null };
    case 'success':
      return { proceed: true, code: result.authorizationCode };
  }
}
