/**
 * Registers a before-sign-out hook that signs the Google SDK out whenever the
 * app signs out, so the next sign-in shows the account picker again (Google
 * otherwise silently reuses the last account). Mounted once at the app root.
 *
 * Kept as its own always-mounted component so the native Google wrapper is never
 * imported by AuthProvider (which stays native-free) — this mirrors how the
 * notifications feature registers its own before-sign-out cleanup.
 */

import { useEffect } from 'react';

import { registerBeforeSignOut } from '../signOutHooks';
import { signOutGoogle } from './google';

export function SocialSignOutRegistrar() {
  useEffect(() => registerBeforeSignOut(() => signOutGoogle()), []);
  return null;
}
