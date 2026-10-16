import { pickGreeting } from '../greeting';

describe('pickGreeting', () => {
  it('personalises the greeting for a signed-in user with a name', () => {
    expect(pickGreeting({ status: 'signedIn', displayName: 'Anna Green' })).toEqual({
      key: 'home.greeting',
      name: 'Anna',
    });
  });

  it('shows the guest greeting when signed out (no name leaks after sign-out)', () => {
    expect(pickGreeting({ status: 'signedOut', displayName: null })).toEqual({
      key: 'home.greetingGuest',
    });
    // Even if a stale name were somehow passed, a signed-out status never personalises.
    expect(pickGreeting({ status: 'signedOut', displayName: 'Anna Green' })).toEqual({
      key: 'home.greetingGuest',
    });
  });

  it('shows the guest greeting while loading', () => {
    expect(pickGreeting({ status: 'loading', displayName: null })).toEqual({
      key: 'home.greetingGuest',
    });
  });

  it('falls back to guest when signed in without a usable name', () => {
    expect(pickGreeting({ status: 'signedIn', displayName: null })).toEqual({
      key: 'home.greetingGuest',
    });
    expect(pickGreeting({ status: 'signedIn', displayName: '   ' })).toEqual({
      key: 'home.greetingGuest',
    });
  });
});
