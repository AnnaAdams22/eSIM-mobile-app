/**
 * The device-registration decision.
 *
 * The backend keeps a device row per Expo push token (POST/DELETE
 * /api/me/devices, upsert). The app must keep it in sync without hammering the
 * endpoint, so this pure function compares the current state against the last
 * thing we registered and returns the single action to take:
 *
 *  - register    — signed in, permission granted, and the token OR locale differs
 *                  from what we last sent (covers first registration, token
 *                  rotation, and a language change). A same-token/same-locale
 *                  re-check is a no-op, so calling it on every app start is cheap.
 *  - deregister  — we previously registered but are no longer eligible (signed
 *                  out, or permission turned off): tell the backend to drop it.
 *  - none        — nothing to do.
 *
 * It is deliberately platform-agnostic: iOS behaves identically once APNs
 * credentials exist and a token can be obtained.
 */

export interface RegistrationState {
  signedIn: boolean;
  permissionGranted: boolean;
  /** The current Expo push token, or null if one isn't available yet. */
  token: string | null;
  /** The current app language (sent so alerts are localised). */
  locale: string;
}

export interface RegisteredSnapshot {
  token: string;
  locale: string;
}

export type RegistrationAction =
  | { action: 'register'; token: string; locale: string }
  | { action: 'deregister'; token: string }
  | { action: 'none' };

export function nextRegistration(
  current: RegistrationState,
  last: RegisteredSnapshot | null
): RegistrationAction {
  const eligible = current.signedIn && current.permissionGranted && !!current.token;

  if (!eligible) {
    // Drop any registration we still have on record; otherwise nothing to do.
    return last ? { action: 'deregister', token: last.token } : { action: 'none' };
  }

  const token = current.token as string;
  if (!last || last.token !== token || last.locale !== current.locale) {
    return { action: 'register', token, locale: current.locale };
  }
  return { action: 'none' };
}
