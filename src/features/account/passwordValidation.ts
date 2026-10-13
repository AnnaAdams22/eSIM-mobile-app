/**
 * Pure validation for the Change-password form.
 *
 * Mirrors the auth screens' rules (reusing the shared `isValidPassword` /
 * `passwordsMatch` / `PASSWORD_MIN_LENGTH`) and adds the two rules unique to a
 * change: the current password must be entered, and the new password can't be
 * identical to the current one. Each failure resolves to an i18n key so the UI
 * never shows raw text.
 *
 * This only covers rules we can check locally (before any network call). The
 * server-side checks — whether the current password is actually correct, or the
 * provider's own "weak"/"rate limit" responses — are mapped separately by
 * `mapPasswordChangeError` at call time.
 */

import { PASSWORD_MIN_LENGTH, isValidPassword, passwordsMatch } from '@/features/auth/validation';

export const PASSWORD_CHANGE_ERROR_KEYS = {
  currentRequired: 'changePassword.validation.currentRequired',
  tooShort: 'changePassword.validation.tooShort',
  mismatch: 'changePassword.validation.mismatch',
  sameAsCurrent: 'changePassword.validation.sameAsCurrent',
} as const;

export type PasswordChangeErrorKey =
  (typeof PASSWORD_CHANGE_ERROR_KEYS)[keyof typeof PASSWORD_CHANGE_ERROR_KEYS];

export interface PasswordChangeInput {
  current: string;
  next: string;
  confirm: string;
}

/**
 * Returns the first failing rule's i18n key, or `null` when the form is valid.
 * Order matters: we surface the earliest problem the user should fix first.
 */
export function validatePasswordChange({
  current,
  next,
  confirm,
}: PasswordChangeInput): PasswordChangeErrorKey | null {
  if (current.length === 0) return PASSWORD_CHANGE_ERROR_KEYS.currentRequired;
  if (!isValidPassword(next)) return PASSWORD_CHANGE_ERROR_KEYS.tooShort;
  if (!passwordsMatch(next, confirm)) return PASSWORD_CHANGE_ERROR_KEYS.mismatch;
  if (next === current) return PASSWORD_CHANGE_ERROR_KEYS.sameAsCurrent;
  return null;
}

export { PASSWORD_MIN_LENGTH };
