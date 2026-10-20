/**
 * Small persisted state for push notifications, kept in the secure keystore
 * (consistent with the language preference; values are tiny and non-secret).
 *
 * Three things survive restarts:
 *  - `purchaseCount` — lifetime successful purchases, so the soft prompt can
 *    re-offer "on a later purchase" (see `decideSoftPrompt`).
 *  - the soft-prompt dismissal memory ("Not now" count + when).
 *  - `userDisabled` — the user turned the toggle OFF on the Notifications screen,
 *    so we must not silently re-register even though the OS permission is still
 *    granted. Turning it back on clears this.
 *
 * All reads/writes are best-effort: a storage error never crashes the app, it
 * just resets to the safe defaults.
 */

import * as SecureStore from 'expo-secure-store';

const KEY = 'notif.prefs.v1';

export interface NotifPrefs {
  purchaseCount: number;
  softPromptTimesDismissed: number;
  softPromptDismissedAtPurchaseCount: number | null;
  userDisabled: boolean;
}

const DEFAULTS: NotifPrefs = {
  purchaseCount: 0,
  softPromptTimesDismissed: 0,
  softPromptDismissedAtPurchaseCount: null,
  userDisabled: false,
};

export async function getNotifPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<NotifPrefs>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

async function patchNotifPrefs(patch: Partial<NotifPrefs>): Promise<NotifPrefs> {
  const next = { ...(await getNotifPrefs()), ...patch };
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(next));
  } catch {
    // best-effort; ignore
  }
  return next;
}

/** Increment and persist the lifetime purchase count; returns the new value. */
export async function incrementPurchaseCount(): Promise<number> {
  const current = await getNotifPrefs();
  const next = await patchNotifPrefs({ purchaseCount: current.purchaseCount + 1 });
  return next.purchaseCount;
}

/** Record that the user tapped "Not now" on the soft prompt at `purchaseCount`. */
export async function recordSoftPromptDismissed(purchaseCount: number): Promise<void> {
  const current = await getNotifPrefs();
  await patchNotifPrefs({
    softPromptTimesDismissed: current.softPromptTimesDismissed + 1,
    softPromptDismissedAtPurchaseCount: purchaseCount,
  });
}

/** Persist the user's explicit on/off choice from the Notifications screen. */
export async function setUserDisabled(disabled: boolean): Promise<void> {
  await patchNotifPrefs({ userDisabled: disabled });
}
