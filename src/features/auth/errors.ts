/**
 * Maps auth failures (Supabase AuthError, our ApiError/TimeoutError, or a raw
 * network error) to a friendly i18n key. The UI NEVER shows raw error text —
 * every failure resolves to one of these keys.
 *
 * We duck-type on `name` / `code` / `status` / `message` rather than importing
 * the error classes, so this module stays pure and cheap to unit-test.
 */

export const AUTH_ERROR_KEYS = {
  invalidCredentials: 'auth.errors.invalidCredentials',
  emailNotConfirmed: 'auth.errors.emailNotConfirmed',
  userAlreadyExists: 'auth.errors.userAlreadyExists',
  invalidCode: 'auth.errors.invalidCode',
  weakPassword: 'auth.errors.weakPassword',
  rateLimited: 'auth.errors.rateLimited',
  network: 'auth.errors.network',
  accountDeleted: 'auth.errors.accountDeleted',
  generic: 'auth.errors.generic',
} as const;

export type AuthErrorKey = (typeof AUTH_ERROR_KEYS)[keyof typeof AUTH_ERROR_KEYS];

interface ErrorLike {
  name?: string;
  code?: string;
  status?: number;
  message?: string;
}

export function mapAuthError(err: unknown): AuthErrorKey {
  const e = (err ?? {}) as ErrorLike;
  const name = typeof e.name === 'string' ? e.name : '';
  const code = typeof e.code === 'string' ? e.code : '';
  const status = typeof e.status === 'number' ? e.status : undefined;
  const msg = typeof e.message === 'string' ? e.message.toLowerCase() : '';

  // Network / timeout (our TimeoutError, or fetch's own failure messages).
  if (
    name === 'TimeoutError' ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('timed out') ||
    msg.includes('network error')
  ) {
    return AUTH_ERROR_KEYS.network;
  }

  // Backend soft-deleted account (from GET /api/me).
  if (code === 'account_deleted' || msg.includes('account_deleted')) {
    return AUTH_ERROR_KEYS.accountDeleted;
  }

  // Rate limiting (Supabase returns 429 + an over_*_rate_limit code).
  if (
    status === 429 ||
    code.includes('rate_limit') ||
    msg.includes('rate limit') ||
    msg.includes('too many')
  ) {
    return AUTH_ERROR_KEYS.rateLimited;
  }

  switch (code) {
    case 'invalid_credentials':
      return AUTH_ERROR_KEYS.invalidCredentials;
    case 'email_not_confirmed':
      return AUTH_ERROR_KEYS.emailNotConfirmed;
    case 'user_already_exists':
    case 'email_exists':
    case 'phone_exists':
      return AUTH_ERROR_KEYS.userAlreadyExists;
    case 'otp_expired':
    case 'otp_disabled':
      return AUTH_ERROR_KEYS.invalidCode;
    case 'weak_password':
      return AUTH_ERROR_KEYS.weakPassword;
  }

  // Message fallbacks for older Supabase responses that lack a structured code.
  if (msg.includes('invalid login credentials')) return AUTH_ERROR_KEYS.invalidCredentials;
  if (msg.includes('email not confirmed')) return AUTH_ERROR_KEYS.emailNotConfirmed;
  if (
    msg.includes('already registered') ||
    msg.includes('already exists') ||
    msg.includes('user already')
  ) {
    return AUTH_ERROR_KEYS.userAlreadyExists;
  }
  if (
    msg.includes('token has expired') ||
    msg.includes('invalid or has expired') ||
    msg.includes('is invalid') ||
    msg.includes('otp')
  ) {
    return AUTH_ERROR_KEYS.invalidCode;
  }
  if (msg.includes('password')) return AUTH_ERROR_KEYS.weakPassword;

  return AUTH_ERROR_KEYS.generic;
}
