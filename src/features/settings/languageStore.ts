/**
 * Persists the user's language preference in the secure keystore.
 *
 * The value is tiny (a language code or the `DEVICE` sentinel), so it fits well
 * under SecureStore's 2KB limit — no chunking needed. All reads/writes are
 * best-effort and swallow errors: a storage failure should never crash the app,
 * it just falls back to the device language on the next launch.
 */

import * as SecureStore from 'expo-secure-store';

import { DEVICE } from './language';

const KEY = 'app.language';

/** Read the stored preference, or null if none is set / on any error. */
export async function getStoredLanguage(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

/** Persist a language code, or the `DEVICE` sentinel for "follow the device". */
export async function setStoredLanguage(value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    // best-effort; ignore
  }
}

export { DEVICE };
