/**
 * Post-failure payment decision (pure).
 *
 * The dangerous moment in checkout is a connectivity drop AFTER the Stripe sheet
 * was presented: the PaymentIntent may already have been confirmed on Stripe's
 * side even though we never received the result. Suggesting "try again" there
 * risks a confusing second attempt on an intent that already succeeded.
 *
 * Rule: once we hold a `payment_intent_id` and the failure happened while the
 * sheet was open (`present`), a connectivity-shaped error means the payment MAY
 * have succeeded → send the user to order-success polling (which reads the real
 * backend state: processing / success / failed). Everything else — a failure
 * before we had an intent, or a definite non-connectivity error — stays on
 * checkout and shows the error, where the reused `client_request_id` makes a
 * retry idempotent (no double charge).
 */

import { isOfflineError } from '@/lib/network/offline';
import type { CheckoutStep } from './devDiagnostics';

export type PaymentOutcome = 'poll' | 'show-error';

export interface PaymentFailureContext {
  /** Which step threw (create-sheet | init | present). */
  step: CheckoutStep;
  /** The thrown error. */
  error: unknown;
  /** True once the backend returned a payment_intent_id we can poll on. */
  hasPaymentIntentId: boolean;
}

export function decidePaymentOutcome(ctx: PaymentFailureContext): PaymentOutcome {
  const { step, error, hasPaymentIntentId } = ctx;
  // Only the "present" step can have confirmed a charge, and only if we actually
  // have an intent id to poll. A connectivity-shaped error there is ambiguous.
  if (step === 'present' && hasPaymentIntentId && isOfflineError(error)) {
    return 'poll';
  }
  return 'show-error';
}
