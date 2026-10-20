/**
 * Apple token revocation — PLACEHOLDER (backend work pending).
 *
 * App Store requirement: an app offering Sign in with Apple that also offers
 * account deletion MUST revoke the user's Apple token when the account is
 * deleted. Revocation is a server-side call to Apple's token endpoint and needs
 * the Apple private key (.p8), Team ID, Services/Client ID and Key ID — none of
 * which belong in the app. So the app's only job is to CAPTURE the short-lived
 * `authorizationCode` Apple returns at sign-in and forward it to the backend,
 * which performs the revocation on account deletion.
 *
 * TODO(backend): add a revocation endpoint (e.g. POST /api/me/apple/authorization
 * -code) that stores the code server-side and uses it during account deletion.
 * The backend already notes this gap (see ../esim-backend account-deletion).
 * Until that endpoint exists this is intentionally a no-op: we do NOT persist the
 * authorization code on the device (it would be insecure and pointless), we just
 * log in dev that we received one.
 */

/**
 * Forward the Apple authorization code to the backend for later revocation.
 * No-op until the backend endpoint exists. Never throws (best-effort, and must
 * never block sign-in).
 */
export async function queueAppleAuthorizationCode(code: string | null | undefined): Promise<void> {
  if (!code) return;

  // TODO(backend): once the endpoint exists, replace this no-op with:
  //   await api.submitAppleAuthorizationCode(code);
  // The backend stores it (securely) against the user and calls Apple's
  // /auth/revoke during account deletion. Do NOT store `code` on the device.
  if (__DEV__) {
    // Never log the code itself — just that we captured one.
    console.log('[apple] authorization code captured (revocation endpoint pending).');
  }
}
