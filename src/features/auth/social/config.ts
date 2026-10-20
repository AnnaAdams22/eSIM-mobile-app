/**
 * Social sign-in configuration, read from OPTIONAL public env vars.
 *
 * None of these are required for the app to run (unlike the keys in
 * src/config.ts). When the Google web client id is absent the Google button is
 * simply hidden — the app never crashes. Apple sign-in stays off until its flag
 * is explicitly set to "true" (the Apple Developer account isn't active yet).
 *
 * Only PUBLIC OAuth client ids live here — a Google OAuth *client id* is not a
 * secret (it ships in every native app). No secret keys ever. See CLAUDE.md.
 */

/** Google OAuth Web client id — the audience of the id token Supabase verifies. */
export const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || '';

/** Google OAuth iOS client id — optional, only needed for the iOS build (later). */
export const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || '';

/** True once a Google web client id is configured (required to get an id token). */
export const googleConfigured = googleWebClientId.length > 0;

/** True only when Apple sign-in is explicitly switched on. Default: off. */
export const appleSignInEnabled =
  process.env.EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED?.trim() === 'true';

export const socialConfig = {
  googleWebClientId,
  googleIosClientId,
  googleConfigured,
  appleSignInEnabled,
} as const;
