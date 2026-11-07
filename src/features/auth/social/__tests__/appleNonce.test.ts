/* eslint-disable import/first -- jest.mock factories must precede the imports they mock. */
/**
 * Locks the Apple nonce wiring that caused the production bug ("Passed nonce and
 * nonce in id_token should either both exist or not"):
 *   - the HASHED (hex SHA-256) nonce is what we hand to Apple's signInAsync, so
 *     Apple embeds that hash in the identity token;
 *   - the RAW nonce is what we return for supabase.auth.signInWithIdToken, so
 *     Supabase re-hashes it and the two match.
 * Both must exist and differ — otherwise the grant fails.
 */

const mockSignInAsync = jest.fn();
const mockIsAvailable = jest.fn();

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: (...a: unknown[]) => mockIsAvailable(...a),
  signInAsync: (...a: unknown[]) => mockSignInAsync(...a),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

const mockGetRandomBytes = jest.fn();
const mockDigest = jest.fn();

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  getRandomBytesAsync: (...a: unknown[]) => mockGetRandomBytes(...a),
  digestStringAsync: (...a: unknown[]) => mockDigest(...a),
}));

import { signInWithApple } from '../apple';
import { isRawNonce } from '../nonce';

describe('signInWithApple nonce wiring', () => {
  const expectedRaw = 'ab'.repeat(16); // 16 bytes of 0xAB -> hex raw nonce

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRandomBytes.mockResolvedValue(new Uint8Array(16).fill(0xab));
    // Stand-in for a real hex SHA-256 digest; echoes its input so the test can
    // prove the digest was taken over the RAW nonce.
    mockDigest.mockImplementation(async (_algo: string, data: string) => `hexsha256:${data}`);
    mockSignInAsync.mockResolvedValue({
      identityToken: 'apple.identity.token',
      authorizationCode: 'auth-code',
      fullName: { givenName: 'Ada', familyName: 'Lovelace' },
    });
  });

  it('sends the hashed nonce to Apple and returns the raw nonce for Supabase', async () => {
    const result = await signInWithApple();

    // Apple is given the HASH of the raw nonce, not the raw nonce itself.
    expect(mockSignInAsync).toHaveBeenCalledTimes(1);
    const appleOptions = mockSignInAsync.mock.calls[0][0] as { nonce: string };
    expect(appleOptions.nonce).toBe(`hexsha256:${expectedRaw}`);

    // The digest is taken over the RAW nonce, with the default (HEX) encoding —
    // called with exactly (algorithm, rawNonce), no explicit non-hex option.
    expect(mockDigest).toHaveBeenCalledWith('SHA-256', expectedRaw);

    // Supabase receives the RAW nonce...
    expect(result.status).toBe('success');
    if (result.status !== 'success') return;
    expect(result.rawNonce).toBe(expectedRaw);
    expect(isRawNonce(result.rawNonce)).toBe(true);

    // ...and the two values differ (both exist, so the grant's nonce check passes).
    expect(appleOptions.nonce).not.toBe(result.rawNonce);
    expect(result.identityToken).toBe('apple.identity.token');
  });

  it('reports cancellation (never surfaced as an error)', async () => {
    mockSignInAsync.mockRejectedValueOnce({ code: 'ERR_REQUEST_CANCELED' });
    const result = await signInWithApple();
    expect(result.status).toBe('cancelled');
  });
});
