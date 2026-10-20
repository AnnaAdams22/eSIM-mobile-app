/**
 * Thin runtime wrapper over @react-native-google-signin/google-signin.
 *
 * Isolated here so the rest of the app (and the pure decision modules) never
 * import the native SDK directly. It normalises the SDK's result/errors into a
 * small, stable shape the hook consumes:
 *   - success   → the Google id token (exchanged with Supabase).
 *   - cancelled → the user dismissed the sheet (handled silently).
 *   - error     → a stable `reason` for `classifySocialError`.
 *
 * Google's native id-token flow does not carry a nonce (the library doesn't
 * expose one), so the Supabase Google provider must have "Skip nonce check"
 * enabled. See CLAUDE.md § "Social sign-in".
 */

import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

import type { SocialErrorReason } from './errors';
import { googleWebClientId, googleIosClientId } from './config';

export type GoogleResult =
  | { status: 'success'; idToken: string }
  | { status: 'cancelled' }
  | { status: 'error'; reason: SocialErrorReason; error: unknown };

let configured = false;

/** Configure the SDK once (idempotent). Safe to call on every attempt. */
function ensureConfigured(): void {
  if (configured) return;
  GoogleSignin.configure({
    // The web client id is the audience of the id token Supabase verifies.
    webClientId: googleWebClientId,
    // Optional; only used on iOS once an iOS client id is provided.
    ...(googleIosClientId ? { iosClientId: googleIosClientId } : {}),
  });
  configured = true;
}

export async function signInWithGoogle(): Promise<GoogleResult> {
  ensureConfigured();
  try {
    // Android: ensures Play services are present/updated (no-op on iOS).
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      // Newer versions resolve with a non-success type on cancellation.
      return { status: 'cancelled' };
    }
    const idToken = response.data?.idToken;
    if (!idToken) {
      return { status: 'error', reason: 'unknown', error: new Error('No Google id token') };
    }
    return { status: 'success', idToken };
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return { status: 'cancelled' };
        case statusCodes.IN_PROGRESS:
          return { status: 'error', reason: 'in_progress', error };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return { status: 'error', reason: 'play_services', error };
      }
    }
    return { status: 'error', reason: 'unknown', error };
  }
}

/**
 * Sign out of the Google SDK so the next sign-in shows the account picker again
 * (otherwise Google silently reuses the last account). Best-effort, never throws.
 */
export async function signOutGoogle(): Promise<void> {
  try {
    ensureConfigured();
    await GoogleSignin.signOut();
  } catch {
    // best-effort: a failed SDK sign-out must never block app sign-out.
  }
}
