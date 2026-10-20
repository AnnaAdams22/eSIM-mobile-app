/**
 * Where a notification tap should take the user.
 *
 * A pure decision over the (validated) payload and the current auth/ownership
 * state, so the policy is testable without a navigator:
 *
 *  - no valid iccid        → My eSIMs (safe fallback; never trust the payload)
 *  - valid iccid, signed   → open that eSIM's detail
 *  - valid iccid, signed   → if we already know the user's eSIMs and this one
 *    out                     isn't among them, My eSIMs (the eSIM "isn't found")
 *  - valid iccid, signed    → sign-in, carrying `/esim/<iccid>` as the return
 *    out                      path so the user lands on the eSIM after signing in
 *                             (the protected-route guard enforces this return).
 *
 * `knownIccids` is optional: on a cold start the eSIM list may not be cached
 * yet, in which case we open the detail screen and let it handle a not-found.
 */

import { extractNotificationIccid } from './iccid';

export type NavTarget =
  | { type: 'esim'; iccid: string }
  | { type: 'signin'; redirectTo: string }
  | { type: 'esims' };

export interface RouteInput {
  /** The notification's `data` object. */
  data: unknown;
  signedIn: boolean;
  /** The user's known ICCIDs, if the list is already loaded. */
  knownIccids?: readonly string[];
}

export function decideNotificationRoute({ data, signedIn, knownIccids }: RouteInput): NavTarget {
  const iccid = extractNotificationIccid(data);
  if (!iccid) return { type: 'esims' };

  if (!signedIn) return { type: 'signin', redirectTo: `/esim/${iccid}` };

  if (knownIccids && !knownIccids.includes(iccid)) return { type: 'esims' };

  return { type: 'esim', iccid };
}
