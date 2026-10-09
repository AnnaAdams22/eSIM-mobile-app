/**
 * Validates a post-auth `redirect` route param.
 *
 * Auth screens accept a `redirect` so that, e.g., tapping "Buy now" while
 * signed out returns to the same plan's checkout after signing in. An attacker
 * (or a malformed deep link) must never be able to bounce the user to an
 * external URL or back into the auth stack, so we accept ONLY internal,
 * absolute app routes and reject everything else.
 */

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * True if the string contains an ASCII control character (code <= 0x1F) or a
 * backslash — either can smuggle a host past a naive parser (e.g. "/\evil.com").
 * Checked by char code to avoid control characters in a regex literal. Normal
 * path/query characters ("?", "=", "&") are intentionally allowed.
 */
function hasUnsafeChars(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c <= 0x1f || c === 0x5c) return true;
  }
  return false;
}

export function safeRedirect(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const v = value.trim();
  if (!v) return null;

  // Must be an absolute, internal path.
  if (!v.startsWith('/')) return null;
  // Protocol-relative ("//evil.com") would be treated as an external host.
  if (v.startsWith('//')) return null;
  // Any scheme ("http://", "javascript:", "mailto:", custom deep-link schemes).
  if (v.includes('://') || HAS_SCHEME.test(v.slice(1))) return null;
  if (hasUnsafeChars(v)) return null;
  // Never redirect back into the auth flow (would loop).
  if (v === '/(auth)' || v.startsWith('/(auth)/') || v.startsWith('/(auth)?')) return null;

  return v;
}
