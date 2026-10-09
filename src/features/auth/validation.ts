/**
 * Pure, synchronous form-validation rules for the auth screens.
 *
 * These are deliberately dependency-free so they can be unit-tested and reused
 * by every screen. The password minimum (8) matches the Supabase project
 * setting — keep the two in sync (see the dashboard instructions in the task
 * report).
 */

/** Minimum password length. Mirrors the Supabase "Minimum password length". */
export const PASSWORD_MIN_LENGTH = 8;

// A pragmatic email shape check: exactly one "@", non-empty local part, and a
// dotted domain. Server-side validation (Supabase) is the real gate; this only
// catches obvious typos before we make a network call.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isNonEmptyName(name: string): boolean {
  return name.trim().length > 0;
}

export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}

/** True only when both are non-empty and identical. */
export function passwordsMatch(a: string, b: string): boolean {
  return a.length > 0 && a === b;
}

export type PasswordStrength = 'weak' | 'fair' | 'strong';

/**
 * A lightweight strength hint for the sign-up field. Not a security control —
 * the length minimum is the only hard rule; this just nudges toward better
 * passwords. Anything below the minimum is always "weak".
 */
export function passwordStrength(password: string): PasswordStrength {
  if (password.length < PASSWORD_MIN_LENGTH) return 'weak';

  let variety = 0;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) variety++;
  if (/\d/.test(password)) variety++;
  if (/[^A-Za-z0-9]/.test(password)) variety++;
  if (password.length >= 12) variety++;

  if (variety === 0) return 'weak';
  if (variety <= 2) return 'fair';
  return 'strong';
}
