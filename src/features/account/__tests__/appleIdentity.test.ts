import type { User } from '@supabase/supabase-js';

import { hasAppleIdentity, resolveAppleReauth } from '../appleIdentity';

/** Minimal User-shaped fixture; only the fields the helpers read matter. */
function userWith(partial: Partial<User>): User {
  return { id: 'u1', app_metadata: {}, user_metadata: {}, aud: 'authenticated', ...partial } as User;
}

describe('hasAppleIdentity', () => {
  it('is false for a null/undefined user', () => {
    expect(hasAppleIdentity(null)).toBe(false);
    expect(hasAppleIdentity(undefined)).toBe(false);
  });

  it('detects an Apple identity in the identities list', () => {
    const user = userWith({
      identities: [{ provider: 'apple' } as User['identities'][number]],
    });
    expect(hasAppleIdentity(user)).toBe(true);
  });

  it('detects Apple via app_metadata.provider', () => {
    expect(hasAppleIdentity(userWith({ app_metadata: { provider: 'apple' } }))).toBe(true);
  });

  it('detects Apple via app_metadata.providers', () => {
    expect(
      hasAppleIdentity(userWith({ app_metadata: { providers: ['email', 'apple'] } }))
    ).toBe(true);
  });

  it('is false for an email-only user', () => {
    const user = userWith({
      identities: [{ provider: 'email' } as User['identities'][number]],
      app_metadata: { provider: 'email', providers: ['email'] },
    });
    expect(hasAppleIdentity(user)).toBe(false);
  });

  it('is false for a Google-only user (must not re-auth with Apple)', () => {
    const user = userWith({
      identities: [{ provider: 'google' } as User['identities'][number]],
      app_metadata: { provider: 'google', providers: ['google'] },
    });
    expect(hasAppleIdentity(user)).toBe(false);
  });

  it('never trusts user_metadata', () => {
    const user = userWith({ user_metadata: { provider: 'apple' } as User['user_metadata'] });
    expect(hasAppleIdentity(user)).toBe(false);
  });
});

describe('resolveAppleReauth', () => {
  it('does not delete when the user cancels the Apple prompt', () => {
    expect(resolveAppleReauth({ status: 'cancelled' })).toEqual({ proceed: false });
  });

  it('proceeds WITHOUT a code on an Apple error (backend can revoke a stored token)', () => {
    expect(resolveAppleReauth({ status: 'error', error: new Error('x') })).toEqual({
      proceed: true,
      code: null,
    });
  });

  it('proceeds and forwards the fresh code on success', () => {
    expect(resolveAppleReauth({ status: 'success', authorizationCode: 'abc123' })).toEqual({
      proceed: true,
      code: 'abc123',
    });
  });

  it('proceeds with a null code when success carries no code', () => {
    expect(resolveAppleReauth({ status: 'success', authorizationCode: null })).toEqual({
      proceed: true,
      code: null,
    });
  });
});
