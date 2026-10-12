/**
 * The top-up payment-sheet request flow (pure, dependency-injected).
 *
 * A replacing top-up can be rejected by the backend with 409
 * `replace_confirmation_required` even when the app pre-confirmed — the eSIM's
 * state may have changed between the options screen and the Pay tap. This flow
 * encapsulates the one well-defined recovery:
 *
 *   build sheet → 409? → confirm with the server's numbers →
 *     • cancelled → stop,
 *     • confirmed → retry with accept_replace=true and a NEW client_request_id
 *       (a different amount/intent attempt must not reuse the first id).
 *
 * The Stripe-specific presentation stays in the checkout screen; this is just the
 * request/confirm/retry decision, so it is unit-tested with a mocked api.
 */

import type { PaymentSheetResponse, TopupPaymentSheetRequest } from '@/lib/api-types';
import { replaceConfirmationInfo, type ReplaceInfo } from './replace';

export interface RequestTopupSheetParams {
  planId: string;
  promoCode?: string | null;
  /** The current idempotency id (reused on a Stripe retry, replaced on a 409 retry). */
  clientRequestId: string;
  /** Whether the user already accepted a replace on the previous screen. */
  acceptReplace: boolean;
}

export interface RequestTopupSheetDeps {
  /** Calls POST …/topup-payment-sheet; throws ApiError on non-2xx. */
  createSheet: (payload: TopupPaymentSheetRequest) => Promise<PaymentSheetResponse>;
  /** Ask the user to confirm a replace; resolve true to proceed. */
  confirmReplace: (info: ReplaceInfo) => Promise<boolean>;
  /** Mint a fresh client_request_id for the post-confirmation retry. */
  newRequestId: () => string;
}

export type RequestTopupSheetResult =
  | { ok: true; sheet: PaymentSheetResponse; clientRequestId: string }
  | { ok: false; reason: 'cancelled' };

/**
 * Build the top-up payment sheet, transparently handling a replace-confirmation
 * 409 by asking the user and retrying once with a new idempotency id. Any other
 * error propagates to the caller.
 */
export async function requestTopupSheet(
  params: RequestTopupSheetParams,
  deps: RequestTopupSheetDeps
): Promise<RequestTopupSheetResult> {
  const basePayload: TopupPaymentSheetRequest = {
    plan_id: params.planId,
    client_request_id: params.clientRequestId,
    promo_code: params.promoCode ?? undefined,
    accept_replace: params.acceptReplace,
  };

  try {
    const sheet = await deps.createSheet(basePayload);
    return { ok: true, sheet, clientRequestId: params.clientRequestId };
  } catch (err) {
    const info = replaceConfirmationInfo(err);
    if (!info) throw err; // not a replace prompt — real failure, let it bubble.

    const confirmed = await deps.confirmReplace(info);
    if (!confirmed) return { ok: false, reason: 'cancelled' };

    // A new attempt with a different intent → a brand-new idempotency id.
    const retryId = deps.newRequestId();
    const sheet = await deps.createSheet({
      ...basePayload,
      client_request_id: retryId,
      accept_replace: true,
    });
    return { ok: true, sheet, clientRequestId: retryId };
  }
}
