/* eslint-disable import/first -- jest.mock factories must precede the imports they mock. */
/**
 * The Google wrapper: on iOS AND Android we take the id token and send NO nonce
 * (the library exposes none), relying on Supabase's "Skip nonce check". These
 * tests pin that the success result carries only an id token (never a nonce) and
 * that the Android error classification (Play services, in-progress, cancel) is
 * unchanged.
 */

const mockConfigure = jest.fn();
const mockHasPlayServices = jest.fn();
const mockSignIn = jest.fn();

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: (...a: unknown[]) => mockConfigure(...a),
    hasPlayServices: (...a: unknown[]) => mockHasPlayServices(...a),
    signIn: (...a: unknown[]) => mockSignIn(...a),
    signOut: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
  isErrorWithCode: (e: unknown) => !!(e && typeof e === 'object' && 'code' in e),
  isSuccessResponse: (r: unknown) =>
    !!(r && typeof r === 'object' && (r as { type?: string }).type === 'success'),
}));

jest.mock('../config', () => ({
  googleWebClientId: 'web-client-id',
  googleIosClientId: 'ios-client-id',
}));

import { signInWithGoogle } from '../google';

describe('signInWithGoogle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasPlayServices.mockResolvedValue(true);
  });

  it('returns only an id token on success — never a nonce', async () => {
    mockSignIn.mockResolvedValue({ type: 'success', data: { idToken: 'google.id.token' } });
    const result = await signInWithGoogle();
    expect(result).toEqual({ status: 'success', idToken: 'google.id.token' });
    // No nonce travels with Google (Supabase "Skip nonce check" must stay ON).
    expect(Object.prototype.hasOwnProperty.call(result, 'nonce')).toBe(false);
  });

  it('treats a non-success response as a silent cancellation', async () => {
    mockSignIn.mockResolvedValue({ type: 'noSavedCredentialFound' });
    expect(await signInWithGoogle()).toEqual({ status: 'cancelled' });
  });

  it('keeps the Android Play-services classification', async () => {
    mockHasPlayServices.mockRejectedValueOnce({ code: 'PLAY_SERVICES_NOT_AVAILABLE' });
    const result = await signInWithGoogle();
    expect(result).toMatchObject({ status: 'error', reason: 'play_services' });
  });

  it('keeps the in-progress (double-tap) classification', async () => {
    mockSignIn.mockRejectedValueOnce({ code: 'IN_PROGRESS' });
    const result = await signInWithGoogle();
    expect(result).toMatchObject({ status: 'error', reason: 'in_progress' });
  });

  it('maps a native cancellation code to cancelled', async () => {
    mockSignIn.mockRejectedValueOnce({ code: 'SIGN_IN_CANCELLED' });
    expect(await signInWithGoogle()).toEqual({ status: 'cancelled' });
  });
});
