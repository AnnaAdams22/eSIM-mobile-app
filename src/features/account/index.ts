/** Barrel for the account feature: pure, tested helpers for the account area. */

export { DELETE_CONFIRM_WORD, isDeleteConfirmed } from './deleteConfirm';

export {
  PASSWORD_CHANGE_ERROR_KEYS,
  PASSWORD_MIN_LENGTH,
  validatePasswordChange,
} from './passwordValidation';
export type { PasswordChangeErrorKey, PasswordChangeInput } from './passwordValidation';

export { PASSWORD_CHANGE_ERRORS, mapPasswordChangeError } from './errors';
export type { PasswordChangeError } from './errors';
