/** Barrel for the auth feature: provider/hook plus the pure, tested helpers. */

export { AuthProvider, useAuth } from './AuthProvider';
export type {
  AuthStatus,
  AuthContextValue,
  SignUpParams,
  SignUpResult,
  ResetPasswordParams,
  ChangePasswordParams,
  PasswordChangeStage,
} from './AuthProvider';

export {
  PASSWORD_MIN_LENGTH,
  isValidEmail,
  isNonEmptyName,
  isValidPassword,
  passwordsMatch,
  passwordStrength,
} from './validation';
export type { PasswordStrength } from './validation';

export { mapAuthError, AUTH_ERROR_KEYS } from './errors';
export type { AuthErrorKey } from './errors';

export { safeRedirect } from './redirect';

export { useAuthNavigation } from './useAuthNavigation';

export { AuthScaffold } from './components/AuthScaffold';
export type { AuthScaffoldProps } from './components/AuthScaffold';
export { LinkRow } from './components/LinkRow';
export type { LinkRowProps } from './components/LinkRow';

export {
  CODE_LENGTH,
  sanitizeDigits,
  codeCells,
  activeCellIndex,
  isCodeComplete,
} from './codeInput';
