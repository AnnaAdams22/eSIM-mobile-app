/**
 * Thin runtime wrapper over expo-notifications / expo-device / expo-constants.
 *
 * Isolated here so the rest of the app (and the pure decision modules) never
 * import the native SDK directly, and so the behaviour is identical on iOS once
 * APNs credentials exist — nothing in here is Android-specific except the
 * channel, which iOS simply ignores.
 *
 * Security: a push token is a device identifier; we NEVER log it in full.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import type { PushPermission } from './prompt';

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

function mapPermission(p: Notifications.NotificationPermissionsStatus): PushPermission {
  if (p.status === 'granted') return 'granted';
  if (p.status === 'undetermined') return 'undetermined';
  // Denied: if the OS will still let us ask (e.g. Android before "don't ask
  // again"), treat it as undetermined so the soft prompt / toggle can retry;
  // only a permanent denial blocks us (→ Settings).
  return p.canAskAgain ? 'undetermined' : 'denied';
}

export async function getPermissionStatus(): Promise<PushPermission> {
  try {
    return mapPermission(await Notifications.getPermissionsAsync());
  } catch {
    return 'undetermined';
  }
}

/** Trigger the OS permission prompt (only from an explicit "Turn on"). */
export async function requestPermission(): Promise<PushPermission> {
  try {
    return mapPermission(await Notifications.requestPermissionsAsync());
  } catch {
    return 'undetermined';
  }
}

/** The EAS projectId, required to mint an Expo push token. */
function projectId(): string | null {
  const id = Constants.expoConfig?.extra?.eas?.projectId;
  return typeof id === 'string' && id ? id : null;
}

/**
 * Obtain this device's Expo push token, or null if it can't be minted (not a
 * physical device, missing projectId, or no push credentials yet — e.g. iOS
 * before APNs). Never throws.
 */
export async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const id = projectId();
  if (!id) return null;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    return data ?? null;
  } catch {
    // No credentials yet (iOS without APNs) or a transient failure — not fatal.
    return null;
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
