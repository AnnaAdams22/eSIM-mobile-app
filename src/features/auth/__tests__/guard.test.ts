import { guardDecision } from '../guard';

describe('guardDecision', () => {
  it('waits while auth state is still loading (no flash, no premature redirect)', () => {
    expect(
      guardDecision({ status: 'loading', isProtected: true, isAuthRoute: false, requireSignIn: false })
    ).toBe('wait');
    expect(
      guardDecision({ status: 'loading', isProtected: false, isAuthRoute: false, requireSignIn: true })
    ).toBe('wait');
  });

  it('redirects a signed-out user away from a protected route', () => {
    expect(
      guardDecision({ status: 'signedOut', isProtected: true, isAuthRoute: false, requireSignIn: false })
    ).toBe('redirect');
  });

  it('allows a signed-out user on a public route (guest browsing)', () => {
    expect(
      guardDecision({ status: 'signedOut', isProtected: false, isAuthRoute: false, requireSignIn: false })
    ).toBe('allow');
  });

  it('allows a signed-in user on a protected route', () => {
    expect(
      guardDecision({ status: 'signedIn', isProtected: true, isAuthRoute: false, requireSignIn: false })
    ).toBe('allow');
  });

  it('never blocks the auth screens, even signed out with the global flag on', () => {
    expect(
      guardDecision({ status: 'signedOut', isProtected: false, isAuthRoute: true, requireSignIn: true })
    ).toBe('allow');
  });

  describe('REQUIRE_SIGN_IN_TO_BROWSE = true', () => {
    it('redirects every non-auth route when signed out', () => {
      expect(
        guardDecision({ status: 'signedOut', isProtected: false, isAuthRoute: false, requireSignIn: true })
      ).toBe('redirect');
      expect(
        guardDecision({ status: 'signedOut', isProtected: true, isAuthRoute: false, requireSignIn: true })
      ).toBe('redirect');
    });

    it('still allows signed-in users everywhere', () => {
      expect(
        guardDecision({ status: 'signedIn', isProtected: false, isAuthRoute: false, requireSignIn: true })
      ).toBe('allow');
    });

    it('still waits during loading', () => {
      expect(
        guardDecision({ status: 'loading', isProtected: false, isAuthRoute: false, requireSignIn: true })
      ).toBe('wait');
    });
  });
});
