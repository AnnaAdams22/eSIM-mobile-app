import { mapAuthError, AUTH_ERROR_KEYS } from '../errors';

describe('mapAuthError', () => {
  it('maps invalid credentials (by code and by message)', () => {
    expect(mapAuthError({ code: 'invalid_credentials' })).toBe(AUTH_ERROR_KEYS.invalidCredentials);
    expect(mapAuthError({ message: 'Invalid login credentials' })).toBe(
      AUTH_ERROR_KEYS.invalidCredentials
    );
  });

  it('maps email not confirmed', () => {
    expect(mapAuthError({ code: 'email_not_confirmed' })).toBe(AUTH_ERROR_KEYS.emailNotConfirmed);
    expect(mapAuthError({ message: 'Email not confirmed' })).toBe(
      AUTH_ERROR_KEYS.emailNotConfirmed
    );
  });

  it('maps an already-registered user', () => {
    expect(mapAuthError({ code: 'user_already_exists' })).toBe(AUTH_ERROR_KEYS.userAlreadyExists);
    expect(mapAuthError({ message: 'User already registered' })).toBe(
      AUTH_ERROR_KEYS.userAlreadyExists
    );
  });

  it('maps an invalid or expired code', () => {
    expect(mapAuthError({ code: 'otp_expired' })).toBe(AUTH_ERROR_KEYS.invalidCode);
    expect(mapAuthError({ message: 'Token has expired or is invalid' })).toBe(
      AUTH_ERROR_KEYS.invalidCode
    );
  });

  it('maps rate limiting (by status, by code, by message)', () => {
    expect(mapAuthError({ status: 429 })).toBe(AUTH_ERROR_KEYS.rateLimited);
    expect(mapAuthError({ code: 'over_email_send_rate_limit' })).toBe(AUTH_ERROR_KEYS.rateLimited);
    expect(mapAuthError({ message: 'Email rate limit exceeded' })).toBe(
      AUTH_ERROR_KEYS.rateLimited
    );
  });

  it('maps network / timeout errors', () => {
    expect(mapAuthError({ name: 'TimeoutError' })).toBe(AUTH_ERROR_KEYS.network);
    expect(mapAuthError({ message: 'Network request failed' })).toBe(AUTH_ERROR_KEYS.network);
  });

  it('maps a deleted account', () => {
    expect(mapAuthError({ code: 'account_deleted', status: 403 })).toBe(
      AUTH_ERROR_KEYS.accountDeleted
    );
  });

  it('maps weak passwords', () => {
    expect(mapAuthError({ code: 'weak_password' })).toBe(AUTH_ERROR_KEYS.weakPassword);
  });

  it('falls back to generic for unknown errors', () => {
    expect(mapAuthError({ message: 'Something odd' })).toBe(AUTH_ERROR_KEYS.generic);
    expect(mapAuthError(null)).toBe(AUTH_ERROR_KEYS.generic);
    expect(mapAuthError(undefined)).toBe(AUTH_ERROR_KEYS.generic);
  });

  it('prioritises network over rate-limit when both could match', () => {
    // A timeout should read as a network problem, not a rate limit.
    expect(mapAuthError({ name: 'TimeoutError', status: 429 })).toBe(AUTH_ERROR_KEYS.network);
  });
});
