/**
 * The top-up payment-sheet request flow (pure, dependency-injected).
 *
 * The app only ever ADDS data to the same plan — it never replaces a plan, so it
 * always sends `accept_replace: false`. If the backend nonetheless answers 409
 * `replace_confirmation_required` (e.g. the chosen plan isn't same-plan on the
 * server), we do NOT offer to replace: the flow reports `cannot_add` and the
 * screen tells the customer to buy a new eSIM instead. Any other error bubbles.
 *
 * The Stripe-specific presentation stays in the checkout screen; this is just the
 * request decision, so it is unit-tested with a mocked api.
 */

import { ApiError } from '@/lib/api-error';
import type { PaymentSheetResponse, TopupPaymentSheetRequest } from '@/lib/api-types';

export interface RequestTopupSheetParams {
  planId: string;
  promoCode?: string | null;
  /** The current idempotency id (reused across a Stripe retry on the same amount). */
  clientRequestId: string;
}

export interface RequestTopupSheetDeps {
  /** Calls POST …/topup-payment-sheet; throws ApiError on non-2xx. */
  createSheet: (payload: TopupPaymentSheetRequest) => Promise<PaymentSheetResponse>;
}

export type RequestTopupSheetResult =
  | { ok: true; sheet: PaymentSheetResponse }
  | { ok: false; reason: 'cannot_add' };

/** True when an error is the backend's 409 `replace_confirmation_required`. */
function isReplaceConfirmationError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    err.status === 409 &&
    err.body?.error === 'replace_confirmation_required'
  );
}

/**
 * Build the top-up payment sheet for a same-plan "add data" top-up. Returns
 * `cannot_add` if the backend rejects it as a replacement; rethrows anything else.
 */
export async function requestTopupSheet(
  params: RequestTopupSheetParams,
  deps: RequestTopupSheetDeps
): Promise<RequestTopupSheetResult> {
  const payload: TopupPaymentSheetRequest = {
    plan_id: params.planId,
    client_request_id: params.clientRequestId,
    promo_code: params.promoCode ?? undefined,
    // Never replace — a different plan is bought as a new eSIM instead.
    accept_replace: false,
  };

  try {
    const sheet = await deps.createSheet(payload);
    return { ok: true, sheet };
  } catch (err) {
    if (isReplaceConfirmationError(err)) return { ok: false, reason: 'cannot_add' };
    throw err;
  }
}
