/**
 * Forward the Apple `authorizationCode` to the backend for later token
 * revocation (App Store Guideline 5.1.1(v)).
 *
 * The backend endpoint `POST /api/me/apple/authorization-code` exchanges the
 * short-lived code and stores the resulting Apple refresh token ENCRYPTED against
 * the user, so it can call Apple's `/auth/revoke` when the account is deleted.
 * The code expires in ~5 minutes and is single-use, so we send it IMMEDIATELY
 * after sign-in.
 *
 * This is strictly best-effort: it must NEVER block or fail sign-in, so it never
 * throws. We never persist the code on the device and never log the code itself.
 *
 * The backend call is injected (default: the real `api`) via a lazy import so
 * this module stays unit-testable without pulling the Supabase-backed api client
 * into the test environment.
 */

export type SubmitAppleAuthorizationCode = (code: string) => Promise<void>;

async function defaultSubmit(code: string): Promise<void> {
  // Lazy import so merely importing this module (or testing it with an injected
  // submit) never loads the native-backed api/supabase client.
  const { api } = await import('@/lib/api');
  await api.submitAppleAuthorizationCode(code);
}

/**
 * Send the Apple authorization code to the backend. No-op for an empty code.
 * Swallows every error (best-effort) — a failure here must not affect sign-in.
 */
export async function queueAppleAuthorizationCode(
  code: string | null | undefined,
  submit: SubmitAppleAuthorizationCode = defaultSubmit
): Promise<void> {
  if (!code) return;
  try {
    await submit(code);
    if (__DEV__) {
      // Never log the code itself — only that it was forwarded.
      console.log('[apple] authorization code forwarded for revocation.');
    }
  } catch {
    // Best-effort: swallow. The app re-captures a fresh code at deletion time if
    // this never succeeded, and the backend only needs it to have arrived once.
  }
}
