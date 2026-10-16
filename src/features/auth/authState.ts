/**
 * Pure derivation of the public auth state from a Supabase session.
 *
 * Kept dependency-free (type-only Supabase import) so it can be unit-tested
 * without pulling in the Supabase client / React Query. A null session — the end
 * state of EVERY sign-out path (manual sign-out, account deletion, a forced
 * sign-out from a 401 that can't be refreshed, or account_deleted) — always
 * yields a null user and null displayName.
 *
 * `displayName` is user_metadata.full_name and is DISPLAY ONLY.
 */

import type { Session, User } from '@supabase/supabase-js';

export interface DerivedAuthState {
  user: User | null;
  displayName: string | null;
  status: 'signedIn' | 'signedOut';
}

export function deriveAuthState(session: Session | null): DerivedAuthState {
  const user = session?.user ?? null;
  const fullName = user?.user_metadata?.full_name;
  const displayName = (typeof fullName === 'string' && fullName.trim()) || null;
  return { user, displayName, status: session ? 'signedIn' : 'signedOut' };
}
