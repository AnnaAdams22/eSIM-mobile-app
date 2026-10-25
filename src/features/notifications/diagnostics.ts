/**
 * Push-registration diagnostics — pure helpers, no native imports, so they're
 * unit-testable and safe to use anywhere.
 *
 * The registration flow has several points that can fail silently on a device
 * (permission, physical-device check, EAS projectId, minting the Expo token, the
 * backend POST). `RegistrationDiag` records the outcome of an attempt so the
 * Notifications screen can both surface a friendly error and show a dev-only
 * panel, and `registrationErrorKey` maps the failing step to a translation key.
 */

import type { PushPermission } from './prompt';

/** The ordered steps a registration attempt passes through. */
export type RegistrationStep =
  | 'auth' // not signed in
  | 'permission' // OS permission not granted
  | 'device' // not a physical device
  | 'config' // no EAS projectId in the build
  | 'token' // getExpoPushTokenAsync returned nothing / threw
  | 'token-format' // token wasn't an Expo push token
  | 'server'; // POST /api/me/devices failed

export interface RegistrationDiag {
  signedIn: boolean;
  permission: PushPermission;
  canAskAgain: boolean;
  isDevice: boolean;
  projectId: string | null;
  tokenObtained: boolean;
  /** First 12 chars only — never the full token. */
  tokenPrefix: string | null;
  /** HTTP status of the POST (200 on success), or null if we never reached it. */
  postStatus: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  /** The step that failed, or null on success / not-yet-attempted. */
  failingStep: RegistrationStep | null;
  /** Epoch ms of the last attempt, or null. */
  attemptedAt: number | null;
}

export const EMPTY_DIAG: RegistrationDiag = {
  signedIn: false,
  permission: 'undetermined',
  canAskAgain: true,
  isDevice: false,
  projectId: null,
  tokenObtained: false,
  tokenPrefix: null,
  postStatus: null,
  errorCode: null,
  errorMessage: null,
  failingStep: null,
  attemptedAt: null,
};

interface ProjectIdSources {
  expoConfig?: { extra?: { eas?: { projectId?: unknown } } } | null;
  easConfig?: { projectId?: unknown } | null;
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

/**
 * Resolve the EAS projectId needed to mint an Expo push token. In Expo Go /
 * dev-server the id lives at `expoConfig.extra.eas.projectId`, but some built
 * clients only expose it via the legacy `easConfig.projectId` — check both.
 */
export function pickProjectId(sources: ProjectIdSources): string | null {
  return (
    asNonEmptyString(sources.expoConfig?.extra?.eas?.projectId) ??
    asNonEmptyString(sources.easConfig?.projectId)
  );
}

/** An Expo push token looks like `ExponentPushToken[…]` (or `ExpoPushToken[…]`). */
const EXPO_PUSH_TOKEN_RE = /^Expo(nent)?PushToken\[[^\]]+\]$/;

export function isValidExpoPushToken(token: unknown): token is string {
  return typeof token === 'string' && EXPO_PUSH_TOKEN_RE.test(token);
}

/** i18n error keys per failing step. */
export function registrationErrorKey(step: RegistrationStep): string {
  switch (step) {
    case 'permission':
      return 'notifications.errors.permission';
    case 'device':
      return 'notifications.errors.device';
    case 'config':
      return 'notifications.errors.config';
    case 'token':
    case 'token-format':
      return 'notifications.errors.token';
    case 'server':
      return 'notifications.errors.server';
    default:
      return 'notifications.errors.generic';
  }
}
