/**
 * Tiny auth event bus (pure, no native imports).
 *
 * Used to surface a *forced* sign-out — when the API client finds a session it
 * can't refresh (401 after a refresh attempt) — as a friendly, user-facing
 * message. A user-initiated sign-out does NOT emit this, so the two are
 * distinguishable at the UI layer.
 */

type Listener = () => void;

const sessionExpiredListeners = new Set<Listener>();

export function onSessionExpired(listener: Listener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

export function emitSessionExpired(): void {
  sessionExpiredListeners.forEach((l) => {
    try {
      l();
    } catch {
      // A broken listener must not stop the others (or the sign-out path).
    }
  });
}
