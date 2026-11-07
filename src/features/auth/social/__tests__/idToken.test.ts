import { appleIdTokenExchange, googleIdTokenExchange } from '../idToken';

describe('idToken exchange (what reaches supabase.auth.signInWithIdToken)', () => {
  it('Apple carries the RAW nonce (Supabase re-hashes it to match the token claim)', () => {
    const ex = appleIdTokenExchange('apple.identity.token', 'rawnonce123abc');
    expect(ex).toEqual({
      provider: 'apple',
      token: 'apple.identity.token',
      nonce: 'rawnonce123abc',
    });
  });

  it('Google carries NO nonce on either platform (relies on "Skip nonce check")', () => {
    const ex = googleIdTokenExchange('google.id.token');
    expect(ex).toEqual({ provider: 'google', token: 'google.id.token' });
    expect(ex.nonce).toBeUndefined();
    // The object must not even define the key, so spreading it never sends nonce:null.
    expect(Object.prototype.hasOwnProperty.call(ex, 'nonce')).toBe(false);
  });
});
