/**
 * Pure helper for the Home greeting. Keeps the "signed-in shows the name,
 * signed-out shows the generic text" rule out of the component so it's testable
 * and can't accidentally read a stale name after sign-out.
 */

import type { AuthStatus } from './AuthProvider';

export interface Greeting {
  /** i18n key to render. */
  key: 'home.greeting' | 'home.greetingGuest';
  /** First name for interpolation, present only for the signed-in greeting. */
  name?: string;
}

/**
 * Only a signed-in user with a non-empty name gets the personalised greeting;
 * every other case (signed out, loading, or no name) gets the guest text.
 */
export function pickGreeting({
  status,
  displayName,
}: {
  status: AuthStatus;
  displayName: string | null | undefined;
}): Greeting {
  const firstName = displayName?.trim().split(/\s+/)[0];
  if (status === 'signedIn' && firstName) {
    return { key: 'home.greeting', name: firstName };
  }
  return { key: 'home.greetingGuest' };
}
