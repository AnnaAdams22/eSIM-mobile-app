import { classifySocialError, SOCIAL_ERROR_KEYS, AUTH_ERROR_KEYS } from '../errors';

describe('classifySocialError', () => {
  it('is silent when a sign-in is already in progress', () => {
    expect(classifySocialError('in_progress')).toEqual({ silent: true });
  });

  it('maps missing/outdated Play services to its own key', () => {
    expect(classifySocialError('play_services')).toEqual({
      silent: false,
      key: SOCIAL_ERROR_KEYS.googlePlayServices,
    });
  });

  it('defers an unknown reason to the shared auth error mapper (network)', () => {
    const err = { message: 'Network request failed' };
    expect(classifySocialError('unknown', err)).toEqual({
      silent: false,
      key: AUTH_ERROR_KEYS.network,
    });
  });

  it('maps a Supabase rate-limit error through the shared mapper', () => {
    const err = { status: 429, code: 'over_request_rate_limit' };
    expect(classifySocialError('unknown', err)).toEqual({
      silent: false,
      key: AUTH_ERROR_KEYS.rateLimited,
    });
  });

  it('falls back to generic for an unrecognised error', () => {
    expect(classifySocialError('unknown', { message: 'boom' })).toEqual({
      silent: false,
      key: AUTH_ERROR_KEYS.generic,
    });
  });
});
