/**
 * Network monitor — infers connectivity WITHOUT a native module.
 *
 * We deliberately avoid @react-native-community/netinfo (it would force a native
 * rebuild). Instead the API client reports the outcome of every request here:
 *  - a connectivity-shaped failure (see isOfflineError) flips us offline;
 *  - any reached-server response (even 5xx) flips us back online.
 *
 * While offline we poll the backend's lightweight `GET /health` so we notice the
 * connection returning even if the user isn't actively triggering requests. The
 * state is pushed into React Query's `onlineManager`, which (with
 * refetchOnReconnect) auto-refetches queries the moment we come back online, and
 * drives the `useOnline()` banner.
 */

import { onlineManager } from '@tanstack/react-query';

import { config } from '@/config';
import { isOfflineError } from './offline';

const PING_INTERVAL_MS = 5_000;
const PING_TIMEOUT_MS = 8_000;

let pingTimer: ReturnType<typeof setTimeout> | null = null;

function stopPing(): void {
  if (pingTimer) {
    clearTimeout(pingTimer);
    pingTimer = null;
  }
}

async function pingHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    // Any HTTP response at all means the server is reachable.
    const res = await fetch(`${config.apiUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    return res.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function startPing(): void {
  if (pingTimer) return;
  const tick = async () => {
    pingTimer = null;
    if (onlineManager.isOnline()) return; // recovered via a real request meanwhile
    if (await pingHealth()) {
      setOnline(true);
      return;
    }
    pingTimer = setTimeout(tick, PING_INTERVAL_MS);
  };
  pingTimer = setTimeout(tick, PING_INTERVAL_MS);
}

function setOnline(next: boolean): void {
  if (onlineManager.isOnline() === next) {
    // Already in this state; just make sure the ping loop matches it.
    if (next) stopPing();
    return;
  }
  onlineManager.setOnline(next);
  if (next) stopPing();
  else startPing();
}

/** Call after a request resolves with any HTTP response. */
export function reportRequestOk(): void {
  setOnline(true);
}

/** Call when a request throws. Only connectivity-shaped errors flip us offline. */
export function reportRequestError(err: unknown): void {
  setOnline(!isOfflineError(err));
}
