import { deriveAuthState } from '../authState';
import type { Session } from '@supabase/supabase-js';

/** A minimal Session stub — only the fields deriveAuthState reads. */
function sessionWith(fullName?: string): Session {
  return {
    user: {
      id: 'u1',
      email: 'a@b.co',
      user_metadata: fullName ? { full_name: fullName } : {},
    },
  } as unknown as Session;
}

describe('deriveAuthState', () => {
  it('exposes a null user and displayName when signed out (session is null)', () => {
    // A null session is the end state of EVERY sign-out path: manual signOut,
    // account deletion, and a forced sign-out (401 that cannot be refreshed, or
    // account_deleted). All funnel through here.
    expect(deriveAuthState(null)).toEqual({
      user: null,
      displayName: null,
      status: 'signedOut',
    });
  });

  it('derives the display name from user_metadata.full_name when signed in', () => {
    const state = deriveAuthState(sessionWith('Anna Green'));
    expect(state.status).toBe('signedIn');
    expect(state.user).not.toBeNull();
    expect(state.displayName).toBe('Anna Green');
  });

  it('treats a missing/blank full_name as no display name', () => {
    expect(deriveAuthState(sessionWith()).displayName).toBeNull();
    expect(deriveAuthState(sessionWith('   ')).displayName).toBeNull();
  });
});
