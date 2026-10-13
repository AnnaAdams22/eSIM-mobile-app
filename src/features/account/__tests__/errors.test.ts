import { PASSWORD_CHANGE_ERRORS, mapPasswordChangeError } from '../errors';

describe('mapPasswordChangeError', () => {
  it('treats any failed re-auth as an incorrect current password', () => {
    expect(mapPasswordChangeError({ code: 'invalid_credentials' }, 'reauth')).toBe(
      PASSWORD_CHANGE_ERRORS.incorrectCurrent
    );
    expect(
      mapPasswordChangeError({ message: 'Invalid login credentials' }, 'reauth')
    ).toBe(PASSWORD_CHANGE_ERRORS.incorrectCurrent);
  });

  it('maps same_password on update to sameAsCurrent', () => {
    expect(mapPasswordChangeError({ code: 'same_password' }, 'update')).toBe(
      PASSWORD_CHANGE_ERRORS.sameAsCurrent
    );
    expect(
      mapPasswordChangeError(
        { message: 'New password should be different from the old password.' },
        'update'
      )
    ).toBe(PASSWORD_CHANGE_ERRORS.sameAsCurrent);
  });

  it('maps weak passwords on update', () => {
    expect(mapPasswordChangeError({ code: 'weak_password' }, 'update')).toBe(
      PASSWORD_CHANGE_ERRORS.weakPassword
    );
  });

  it('maps rate limiting from either stage', () => {
    expect(mapPasswordChangeError({ status: 429 }, 'reauth')).toBe(
      PASSWORD_CHANGE_ERRORS.rateLimited
    );
    expect(mapPasswordChangeError({ code: 'over_request_rate_limit' }, 'update')).toBe(
      PASSWORD_CHANGE_ERRORS.rateLimited
    );
  });

  it('maps network/timeout failures from either stage', () => {
    expect(mapPasswordChangeError({ name: 'TimeoutError' }, 'update')).toBe(
      PASSWORD_CHANGE_ERRORS.network
    );
    expect(
      mapPasswordChangeError({ message: 'Network request failed' }, 'reauth')
    ).toBe(PASSWORD_CHANGE_ERRORS.network);
  });

  it('falls back to generic for an unknown update failure', () => {
    expect(mapPasswordChangeError({ code: 'something_else' }, 'update')).toBe(
      PASSWORD_CHANGE_ERRORS.generic
    );
    expect(mapPasswordChangeError(null, 'update')).toBe(PASSWORD_CHANGE_ERRORS.generic);
  });
});
