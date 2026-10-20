/**
 * ICCID validation for push-notification payloads.
 *
 * A push alert carries `{ type, iccid }` in its `data`. Before we navigate
 * anywhere off the back of a tap we validate the iccid — a malformed or hostile
 * payload must never steer the app to an arbitrary route.
 *
 * An ICCID is the 18–20 digit serial number of a SIM profile (ITU E.118). We
 * accept 18–22 digits to be lenient about check-digit/padding variations across
 * providers while still rejecting anything that isn't a plain numeric id.
 */

const ICCID_RE = /^\d{18,22}$/;

/** True when `value` is a string that looks like an ICCID. */
export function isValidIccid(value: unknown): value is string {
  return typeof value === 'string' && ICCID_RE.test(value);
}

/**
 * Pull the target ICCID out of a notification's `data` object, or null if the
 * payload has no valid iccid. Tolerant of surrounding whitespace; strict about
 * everything else.
 */
export function extractNotificationIccid(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const raw = (data as { iccid?: unknown }).iccid;
  if (typeof raw !== 'string') return null;
  const iccid = raw.trim();
  return isValidIccid(iccid) ? iccid : null;
}
