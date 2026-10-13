/**
 * Maps the server-side failures of a password change to a friendly i18n key.
 *
 * Two network calls can fail: the re-authentication (`signInWithPassword` with
 * the current password) and the update (`updateUser({ password })`). We
 * duck-type on `name`/`code`/`status`/`message` — like `mapAuthError` — so this
 * stays pure and cheap to unit-test.
 *
 *  - A re-auth that returns invalid credentials → the current password is wrong.
 *  - Supabase's `same_password` → the new password equals the current one.
 *  - Weak / rate-limit / network fall through to their shared messages.
 */

export const PASSWORD_CHANGE_ERRORS = {
  incorrectCurrent: 'changePassword.errors.incorrectCurrent',
  sameAsCurrent: 'changePassword.errors.sameAsCurrent',
  weakPassword: 'changePassword.errors.weakPassword',
  rateLimited: 'changePassword.errors.rateLimited',
  network: 'changePassword.errors.network',
  generic: 'changePassword.errors.generic',
} as const;

export type PasswordChangeError =
  (typeof PASSWORD_CHANGE_ERRORS)[keyof typeof PASSWORD_CHANGE_ERRORS];

interface ErrorLike {
  name?: string;
  code?: string;
  status?: number;
  message?: string;
}

/**
 * @param err      the thrown error
 * @param stage    which call failed — a failed re-auth means the *current*
 *                 password was wrong, which we must phrase differently from a
 *                 generic credential error.
 */
export function mapPasswordChangeError(
  err: unknown,
  stage: 'reauth' | 'update'
): PasswordChangeError {
  const e = (err ?? {}) as ErrorLike;
  const name = typeof e.name === 'string' ? e.name : '';
  const code = typeof e.code === 'string' ? e.code : '';
  const status = typeof e.status === 'number' ? e.status : undefined;
  const msg = typeof e.message === 'string' ? e.message.toLowerCase() : '';

  // Network / timeout first (our TimeoutError or fetch's own failure messages).
  if (
    name === 'TimeoutError' ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('timed out') ||
    msg.includes('network error')
  ) {
    return PASSWORD_CHANGE_ERRORS.network;
  }

  // Rate limiting (Supabase returns 429 + an over_*_rate_limit code).
  if (
    status === 429 ||
    code.includes('rate_limit') ||
    msg.includes('rate limit') ||
    msg.includes('too many')
  ) {
    return PASSWORD_CHANGE_ERRORS.rateLimited;
  }

  // A failed re-authentication (that isn't a network/rate-limit issue, handled
  // above) can only mean the current password was wrong.
  if (stage === 'reauth') {
    return PASSWORD_CHANGE_ERRORS.incorrectCurrent;
  }

  // The update call: new password rejected.
  if (code === 'same_password' || msg.includes('should be different') || msg.includes('same as')) {
    return PASSWORD_CHANGE_ERRORS.sameAsCurrent;
  }
  if (code === 'weak_password' || msg.includes('password')) {
    return PASSWORD_CHANGE_ERRORS.weakPassword;
  }

  return PASSWORD_CHANGE_ERRORS.generic;
}
