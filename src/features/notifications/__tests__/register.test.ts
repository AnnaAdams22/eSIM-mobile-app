import { nextRegistration } from '../register';

const eligible = {
  signedIn: true,
  permissionGranted: true,
  token: 'ExponentPushToken[aaa]',
  locale: 'en',
};

describe('nextRegistration', () => {
  it('registers when signed in and granted with no prior registration', () => {
    expect(nextRegistration(eligible, null)).toEqual({
      action: 'register',
      token: 'ExponentPushToken[aaa]',
      locale: 'en',
    });
  });

  it('does nothing when already registered with the same token and locale', () => {
    expect(
      nextRegistration(eligible, { token: 'ExponentPushToken[aaa]', locale: 'en' })
    ).toEqual({ action: 'none' });
  });

  it('re-registers when the token changes', () => {
    expect(
      nextRegistration(eligible, { token: 'ExponentPushToken[OLD]', locale: 'en' })
    ).toEqual({ action: 'register', token: 'ExponentPushToken[aaa]', locale: 'en' });
  });

  it('re-registers when the locale changes', () => {
    expect(
      nextRegistration(eligible, { token: 'ExponentPushToken[aaa]', locale: 'de' })
    ).toEqual({ action: 'register', token: 'ExponentPushToken[aaa]', locale: 'en' });
  });

  it('deregisters the previously-registered token on sign-out', () => {
    expect(
      nextRegistration(
        { ...eligible, signedIn: false },
        { token: 'ExponentPushToken[aaa]', locale: 'en' }
      )
    ).toEqual({ action: 'deregister', token: 'ExponentPushToken[aaa]' });
  });

  it('deregisters when permission is revoked', () => {
    expect(
      nextRegistration(
        { ...eligible, permissionGranted: false },
        { token: 'ExponentPushToken[aaa]', locale: 'en' }
      )
    ).toEqual({ action: 'deregister', token: 'ExponentPushToken[aaa]' });
  });

  it('does nothing when ineligible and nothing was ever registered', () => {
    expect(nextRegistration({ ...eligible, signedIn: false }, null)).toEqual({ action: 'none' });
  });

  it('does nothing (not register) when eligible but the token is not yet available', () => {
    expect(nextRegistration({ ...eligible, token: null }, null)).toEqual({ action: 'none' });
  });
});
