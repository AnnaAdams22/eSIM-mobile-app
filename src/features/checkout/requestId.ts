/**
 * A holder for the checkout `client_request_id`.
 *
 * The backend keys payment idempotency on `client_request_id`: one id must be
 * generated once per checkout attempt and REUSED across retries, so a retried
 * "Pay" returns the same PaymentIntent instead of double-charging. `reset()`
 * begins a fresh attempt (a new id on next read).
 *
 * Pure and generator-injected so it can be unit-tested without a real UUID
 * source; the checkout screen wires it to `uuidv4` in a ref.
 */

export interface RequestIdHolder {
  /** The current id, generated lazily on first read and reused thereafter. */
  current: () => string;
  /** Discard the current id so the next `current()` generates a fresh one. */
  reset: () => void;
}

export function makeRequestIdHolder(generate: () => string): RequestIdHolder {
  let id: string | null = null;
  return {
    current: () => (id ??= generate()),
    reset: () => {
      id = null;
    },
  };
}
