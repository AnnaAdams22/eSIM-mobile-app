/**
 * A large-value-safe storage adapter for Supabase's auth session, backed by
 * expo-secure-store (Keychain on iOS, Keystore-backed EncryptedSharedPreferences
 * on Android).
 *
 * Why chunking: SecureStore rejects values larger than 2048 bytes. A Supabase
 * session (access + refresh JWTs) can exceed that, which would silently break
 * session persistence. This adapter transparently splits large values across
 * numbered chunk keys and reassembles them on read, so the whole session stays
 * in the secure keystore (no plaintext in AsyncStorage).
 *
 * Works in Expo Go — expo-secure-store is supported there.
 */

import * as SecureStore from 'expo-secure-store';

// Keep a safety margin under the 2048-byte native limit for UTF-8 overhead.
const CHUNK_SIZE = 1800;
const META_SUFFIX = '__chunks';

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
};

function chunkKey(key: string, i: number): string {
  return `${key}.${i}`;
}

async function clearChunks(key: string, count: number): Promise<void> {
  const deletions: Promise<void>[] = [];
  for (let i = 0; i < count; i++) {
    deletions.push(SecureStore.deleteItemAsync(chunkKey(key, i), options));
  }
  deletions.push(SecureStore.deleteItemAsync(`${key}${META_SUFFIX}`, options));
  await Promise.all(deletions);
}

export const secureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const meta = await SecureStore.getItemAsync(`${key}${META_SUFFIX}`, options);
    if (meta === null) {
      // Not chunked — read directly (covers small values and pre-existing keys).
      return SecureStore.getItemAsync(key, options);
    }
    const count = parseInt(meta, 10);
    if (!Number.isFinite(count) || count <= 0) return null;

    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i), options);
      if (part === null) return null; // corrupted / partial write
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    // Always clear any previous representation first (chunked or direct).
    const prevMeta = await SecureStore.getItemAsync(`${key}${META_SUFFIX}`, options);
    if (prevMeta !== null) {
      const prevCount = parseInt(prevMeta, 10);
      if (Number.isFinite(prevCount)) await clearChunks(key, prevCount);
    }

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.deleteItemAsync(`${key}${META_SUFFIX}`, options);
      await SecureStore.setItemAsync(key, value, options);
      return;
    }

    // Large value: remove the direct key and write numbered chunks + meta.
    await SecureStore.deleteItemAsync(key, options);
    const chunks: Promise<void>[] = [];
    let count = 0;
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(
        SecureStore.setItemAsync(chunkKey(key, count), value.slice(i, i + CHUNK_SIZE), options)
      );
      count++;
    }
    await Promise.all(chunks);
    await SecureStore.setItemAsync(`${key}${META_SUFFIX}`, String(count), options);
  },

  async removeItem(key: string): Promise<void> {
    const meta = await SecureStore.getItemAsync(`${key}${META_SUFFIX}`, options);
    if (meta !== null) {
      const count = parseInt(meta, 10);
      if (Number.isFinite(count)) await clearChunks(key, count);
    }
    await SecureStore.deleteItemAsync(key, options);
  },
};
