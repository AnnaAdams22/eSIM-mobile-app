import {
  classifySocialError,
  socialErrorCode,
  SOCIAL_ERROR_KEYS,
  AUTH_ERROR_KEYS,
} from '../errors';

describe('classifySocialError', () => {
  it('is silent when a sign-in is already in progress', () => {
    expect(classifySocialError('in_progress')).toEqual({ silent: true });
  });

  it('maps missing/outdated Play services to its own key and code', () => {
    expect(classifySocialError('play_services')).toEqual({
      silent: false,
      key: SOCIAL_ERROR_KEYS.googlePlayServices,
      code: 'play_services',
    });
  });

  it('defers an unknown reason to the shared auth error mapper (network)', () => {
    const err = { message: 'Network request failed' };
    expect(classifySocialError('unknown', err)).toEqual({
      silent: false,
      key: AUTH_ERROR_KEYS.network,
      code: 'network',
    });
  });

  it('maps a Supabase rate-limit error through the shared mapper', () => {
    const err = { status: 429, code: 'over_request_rate_limit' };
    expect(classifySocialError('unknown', err)).toEqual({
      silent: false,
      key: AUTH_ERROR_KEYS.rateLimited,
      code: 'rate_limited',
    });
  });

  it('falls back to generic key + auth_failed code for an unrecognised error', () => {
    expect(classifySocialError('unknown', { message: 'boom' })).toEqual({
      silent: false,
      key: AUTH_ERROR_KEYS.generic,
      code: 'auth_failed',
    });
  });
});

describe('socialErrorCode (non-sensitive diagnostic codes)', () => {
  it('flags the id-token nonce bug as nonce_mismatch', () => {
    // The exact Supabase message from the production logs.
    expect(
      socialErrorCode({
        message: 'Passed nonce and nonce in id_token should either both exist or not.',
      })
    ).toBe('nonce_mismatch');
    expect(socialErrorCode({ message: 'nonce mismatch' })).toBe('nonce_mismatch');
  });

  it('maps audience/client failures to audience', () => {
    expect(socialErrorCode({ message: 'Unacceptable audience in id_token' })).toBe('audience');
    expect(socialErrorCode({ code: 'invalid_client' })).toBe('audience');
  });

  it('maps a disabled/unenabled provider', () => {
    expect(socialErrorCode({ message: 'Provider is not enabled' })).toBe('provider_disabled');
    expect(socialErrorCode({ message: 'Unsupported provider: provider is disabled' })).toBe(
      'provider_disabled'
    );
  });

  it('maps a malformed id token to bad_id_token', () => {
    expect(socialErrorCode({ message: 'invalid JWT: unable to parse id_token' })).toBe(
      'bad_id_token'
    );
  });

  it('maps network, rate limit and cancellation', () => {
    expect(socialErrorCode({ message: 'Network request failed' })).toBe('network');
    expect(socialErrorCode({ status: 429 })).toBe('rate_limited');
    expect(socialErrorCode({ message: 'The user canceled the sign-in' })).toBe('cancelled');
  });

  it('prioritises the reason for the native (Android) Play-services path', () => {
    expect(socialErrorCode(new Error('whatever'), 'play_services')).toBe('play_services');
    expect(socialErrorCode(undefined, 'in_progress')).toBe('in_progress');
  });

  it('never throws and defaults to auth_failed for unknown shapes', () => {
    expect(socialErrorCode(undefined)).toBe('auth_failed');
    expect(socialErrorCode({})).toBe('auth_failed');
    expect(socialErrorCode('a string')).toBe('auth_failed');
  });
});
