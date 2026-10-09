/**
 * Haptics — thin, crash-safe wrappers around expo-haptics (works in Expo Go).
 *
 * Every call is fire-and-forget and swallows errors: haptics are a nicety, never
 * a requirement, and some devices/emulators have no haptic engine.
 */

import * as Haptics from 'expo-haptics';

/** A light tap — e.g. confirming a primary action like "Buy now". */
export function lightTap(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** A selection tick — e.g. choosing a plan / toggling a selection. */
export function selectionTap(): void {
  Haptics.selectionAsync().catch(() => {});
}

/** A success notification — e.g. a completed sign-in or verification. */
export function successNotify(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** An error notification — e.g. a failed sign-in or an invalid code. */
export function errorNotify(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
