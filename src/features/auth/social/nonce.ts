/**
 * Nonce helpers for Sign in with Apple.
 *
 * The flow (see the Supabase Apple docs): a random RAW nonce is generated, its
 * SHA-256 hash is sent to Apple (`signInAsync({ nonce })`), and the RAW nonce is
 * sent to Supabase (`signInWithIdToken({ nonce })`). Supabase hashes the raw
 * nonce and checks it against the hash embedded in Apple's identity token — this
 * binds the token to this sign-in attempt (replay protection).
 *
 * The random-byte source and SHA-256 (expo-crypto) live in the native wrapper
 * (`apple.ts`); this module holds only the pure, deterministic transform so it
 * can be unit-tested without native modules.
 */

/** Default raw-nonce length in bytes (→ 32 hex chars). 16 bytes = 128 bits. */
export const RAW_NONCE_BYTES = 16;

/** Encode random bytes as a lowercase hex string (the raw nonce). */
export function rawNonceFromBytes(bytes: Uint8Array | number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += (bytes[i] & 0xff).toString(16).padStart(2, '0');
  }
  return out;
}

/** True when `value` looks like a raw nonce we produced (lowercase hex, long enough). */
export function isRawNonce(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{16,}$/.test(value);
}
