/**
 * Pure builders for the Support screen's contact links.
 *
 * Each builder takes a raw config value (which may be an empty placeholder until
 * the client provides real details) and returns a ready-to-open URL, or `null`
 * when the value is empty/blank. A `null` result means the Support screen hides
 * that contact row entirely rather than opening a broken link.
 *
 * Dependency-free so they can be unit-tested without React Native's Linking.
 */

/** Strip everything but digits — wa.me wants a bare international number. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * WhatsApp click-to-chat link. Accepts a number in any human format
 * ("+44 7700 900000", "(044) 7700-900000") and normalises to digits.
 * Returns null when no digits are present.
 */
export function buildWhatsappUrl(whatsappNumber: string): string | null {
  const digits = digitsOnly(whatsappNumber ?? '');
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

/**
 * Instagram profile URL. Accepts a handle with or without a leading "@".
 * Returns null when the handle is empty.
 */
export function buildInstagramUrl(instagramHandle: string): string | null {
  const handle = (instagramHandle ?? '').trim().replace(/^@+/, '');
  if (!handle) return null;
  return `https://instagram.com/${handle}`;
}

/**
 * mailto: link with a pre-filled subject that includes the app version (so
 * support can see which build the user is on). Returns null when there's no
 * address. The subject is URL-encoded.
 */
export function buildMailtoUrl(supportEmail: string, subject: string): string | null {
  const email = (supportEmail ?? '').trim();
  if (!email) return null;
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return `mailto:${email}${query}`;
}
