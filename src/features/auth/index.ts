/** Barrel for the auth feature: provider/hook plus the pure, tested helpers. */

export { AuthProvider, useAuth } from './AuthProvider';
export { deriveAuthState } from './authState';
export type { DerivedAuthState } from './authState';
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

export { safeRedirect, pathWithParams } from './redirect';

export { registerBeforeSignOut, runBeforeSignOutHooks } from './signOutHooks';

export { guardDecision } from './guard';
export type { GuardDecision, GuardInput } from './guard';

export { pickGreeting } from './greeting';
export type { Greeting } from './greeting';

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
