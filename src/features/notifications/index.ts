/** Public surface of the notifications feature — pure, tested logic only. */

export { isValidIccid, extractNotificationIccid } from './iccid';

export { decideSoftPrompt } from './prompt';
export type { PushPermission, SoftPromptInput } from './prompt';

export { nextRegistration } from './register';
export type {
  RegistrationState,
  RegisteredSnapshot,
  RegistrationAction,
} from './register';

export { decideNotificationRoute } from './routing';
export type { NavTarget, RouteInput } from './routing';

export {
  registrationErrorKey,
  pickProjectId,
  isValidExpoPushToken,
  EMPTY_DIAG,
} from './diagnostics';
export type { RegistrationStep, RegistrationDiag } from './diagnostics';
