/**
 * Thin runtime wrapper over expo-apple-authentication (iOS only) + expo-crypto.
 *
 * Nonce handling (per the Supabase Apple docs): generate a random RAW nonce, send
 * its SHA-256 HASH to Apple, and hand the RAW nonce back so the hook can pass it
 * to `supabase.auth.signInWithIdToken({ nonce })`. Supabase re-hashes the raw
 * nonce and matches it against the hash inside Apple's identity token.
 *
 * Captures the Apple `authorizationCode` so that, once the backend revocation
 * endpoint exists, we can revoke Apple tokens on account deletion (App Store
 * requirement). See ./revocation.ts for the documented placeholder — the code is
 * NOT persisted anywhere today.
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import type { SocialErrorReason } from './errors';
import { rawNonceFromBytes, RAW_NONCE_BYTES } from './nonce';
import type { AppleFullName } from './flow';

export type AppleResult =
  | {
      status: 'success';
      identityToken: string;
      rawNonce: string;
      fullName: AppleFullName | null;
      /** Short-lived Apple authorization code — for later server-side revocation. */
      authorizationCode: string | null;
    }
  | { status: 'cancelled' }
  | { status: 'error'; reason: SocialErrorReason; error: unknown };

/** True when the device supports Sign in with Apple (iOS 13+). */
export async function isAppleAvailable(): Promise<boolean> {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Generate a raw nonce and its SHA-256 hash (hex). */
async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = await Crypto.getRandomBytesAsync(RAW_NONCE_BYTES);
  const raw = rawNonceFromBytes(bytes);
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  return { raw, hashed };
}

export async function signInWithApple(): Promise<AppleResult> {
  try {
    const { raw, hashed } = await makeNonce();
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashed,
    });

    if (!credential.identityToken) {
      return { status: 'error', reason: 'unknown', error: new Error('No Apple identity token') };
    }

    return {
      status: 'success',
      identityToken: credential.identityToken,
      rawNonce: raw,
      fullName: credential.fullName
        ? { givenName: credential.fullName.givenName, familyName: credential.fullName.familyName }
        : null,
      authorizationCode: credential.authorizationCode ?? null,
    };
  } catch (error) {
    // The user dismissed the native sheet.
    if (error && typeof error === 'object' && (error as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
      return { status: 'cancelled' };
    }
    return { status: 'error', reason: 'unknown', error };
  }
}
