/**
 * Thin runtime wrapper over expo-notifications / expo-device / expo-constants.
 *
 * Isolated here so the rest of the app (and the pure decision modules) never
 * import the native SDK directly, and so the behaviour is identical on iOS once
 * APNs credentials exist — nothing in here is Android-specific except the
 * channel, which iOS simply ignores.
 *
 * The functions return rich detail (permission + canAskAgain, token + error
 * code/message) so the caller can diagnose a failed registration. Security: a
 * push token is a device identifier; we NEVER log or expose it in full.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import type { PushPermission } from './prompt';
import { pickProjectId } from './diagnostics';

/** The Android channel the backend's alerts post to (low data / depleted / expiring). */
export const ANDROID_CHANNEL_ID = 'esim-alerts';

/**
 * Show alerts as a banner even when the app is foregrounded. Set once at module
 * load, before any notification can arrive.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** The request's `platform` field, or null on an unsupported platform (web). */
export function devicePlatform(): 'ios' | 'android' | null {
  return Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : null;
}

/** True on a real phone/tablet; push tokens can't be minted on a simulator. */
export function isPhysicalDevice(): boolean {
  return Device.isDevice;
}

export interface PermissionDetail {
  status: PushPermission;
  canAskAgain: boolean;
}

function mapPermission(p: Notifications.NotificationPermissionsStatus): PermissionDetail {
  if (p.status === 'granted') return { status: 'granted', canAskAgain: p.canAskAgain };
  if (p.status === 'undetermined') return { status: 'undetermined', canAskAgain: p.canAskAgain };
  // Denied: if the OS will still let us ask (e.g. Android before "don't ask
  // again"), treat it as undetermined so the soft prompt / toggle can retry;
  // only a permanent denial blocks us (→ Settings).
  return { status: p.canAskAgain ? 'undetermined' : 'denied', canAskAgain: p.canAskAgain };
}

export async function getPermissionDetail(): Promise<PermissionDetail> {
  try {
    return mapPermission(await Notifications.getPermissionsAsync());
  } catch {
    return { status: 'undetermined', canAskAgain: true };
  }
}

/** Convenience: just the status (for the quick permission re-read on focus). */
export async function getPermissionStatus(): Promise<PushPermission> {
  return (await getPermissionDetail()).status;
}

/** Trigger the OS permission prompt (only from an explicit "Turn on"). */
export async function requestPermissionDetail(): Promise<PermissionDetail> {
  try {
    return mapPermission(await Notifications.requestPermissionsAsync());
  } catch {
    return { status: 'undetermined', canAskAgain: true };
  }
}

/** The EAS projectId, required to mint an Expo push token (checks both sources). */
export function resolveProjectId(): string | null {
  return pickProjectId({
    expoConfig: Constants.expoConfig,
    // easConfig is a legacy field some built clients still carry it on.
    easConfig: (Constants as { easConfig?: { projectId?: unknown } }).easConfig,
  });
}

export interface PushTokenResult {
  token: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

/**
 * Mint this device's Expo push token. Returns the token, or a structured error
 * (code + message) so the caller can diagnose/surface the failure. Never throws.
 */
export async function getExpoPushToken(projectId: string): Promise<PushTokenResult> {
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return { token: data ?? null, errorCode: null, errorMessage: null };
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code) : null;
    const message = err instanceof Error ? err.message : String(err);
    return { token: null, errorCode: code, errorMessage: message };
  }
}

/** Create/refresh the Android alerts channel with a localised name. No-op on iOS. */
export async function ensureAndroidChannel(name: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch {
    // best-effort
  }
}

export { Notifications };
