/**
 * The Order-success polling state machine (pure).
 *
 * After payment the app polls `GET /api/me/orders/by-payment-intent/:id` every
 * few seconds while the backend provisions the eSIM. This module decides, from
 * the latest poll result and how long we've been waiting, which screen state to
 * show — kept pure so it can be unit-tested without timers or the network.
 *
 *   processing → success   (eSIM provisioned/delivered)
 *   processing → failed    (payment failed / refunded)
 *   processing → timeout   (still processing after POLL_TIMEOUT_MS)
 *
 * A 404 from the endpoint means "order not created yet" — model it as a null
 * status, i.e. still processing.
 */

import type { SupportState } from '@/lib/api-types';

export type PollPhase = 'processing' | 'success' | 'failed' | 'timeout';

/** Order statuses that mean the eSIM is ready. */
export const SUCCESS_STATUSES = ['provisioned', 'delivered'] as const;

/** Order statuses that mean the purchase will be refunded / did not complete. */
export const FAILURE_STATUSES = ['failed', 'refunded'] as const;

/** How long we poll before telling the user we'll email them instead. */
export const POLL_TIMEOUT_MS = 60_000;

/** How often to poll while processing. */
export const POLL_INTERVAL_MS = 2_000;

export interface PollInput {
  /** Latest order status, or null when the order isn't found yet (404). */
  status: string | null;
  /** Derived support state from the backend, if present. */
  supportState?: SupportState;
}

/** Resolve the current phase from the latest poll result and elapsed time. */
export function pollPhase(input: PollInput, elapsedMs: number): PollPhase {
  const status = input.status?.toLowerCase().trim() ?? null;

  if (status && (SUCCESS_STATUSES as readonly string[]).includes(status)) {
    return 'success';
  }

  const failedByStatus = status && (FAILURE_STATUSES as readonly string[]).includes(status);
  const failedBySupport =
    input.supportState === 'refunded' || input.supportState === 'refund_pending';
  if (failedByStatus || failedBySupport) {
    return 'failed';
  }

  // Still processing — but give up waiting on-screen after the timeout.
  if (elapsedMs >= POLL_TIMEOUT_MS) {
    return 'timeout';
  }
  return 'processing';
}

/** Whether polling should stop (any terminal phase). */
export function isTerminal(phase: PollPhase): boolean {
  return phase !== 'processing';
}
