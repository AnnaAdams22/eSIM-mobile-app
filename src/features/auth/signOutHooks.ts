/**
 * Best-effort "run this before we clear the session" hooks.
 *
 * Some cleanup must happen while the session is still valid — notably
 * deregistering the push-notification device (DELETE /api/me/devices needs the
 * auth token). `AuthProvider.signOut` clears the session immediately (it doesn't
 * wait on Supabase's network revoke), so anything that needs the token has to
 * run first. These hooks give that seam without `AuthProvider` depending on the
 * notifications feature.
 *
 * Contract: `runBeforeSignOutHooks()` runs every hook, isolates failures (one
 * throwing hook never stops the others), and NEVER rejects — a flaky network
 * must never block sign-out.
 */

type BeforeSignOutHook = () => Promise<void> | void;

const hooks = new Set<BeforeSignOutHook>();

/** Register a hook; returns an unsubscribe function. */
export function registerBeforeSignOut(fn: BeforeSignOutHook): () => void {
  hooks.add(fn);
  return () => {
    hooks.delete(fn);
  };
}

/** Run all hooks concurrently, swallowing every error. Resolves to void. */
export async function runBeforeSignOutHooks(): Promise<void> {
  await Promise.all(
    [...hooks].map(async (fn) => {
      try {
        await fn();
      } catch {
        // best-effort: never block or fail sign-out
      }
    })
  );
}

/** Test-only: clear all registered hooks. */
export function _resetBeforeSignOutHooks(): void {
  hooks.clear();
}
