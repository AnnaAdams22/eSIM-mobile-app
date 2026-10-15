/**
 * Dev-only checkout diagnostics.
 *
 * Produces a compact, secret-free one-line summary of a failure at a given
 * checkout step, for __DEV__ console logging and the on-screen dev hint. It
 * reads ONLY status / code / message — never a client secret, token or key — so
 * it is safe to print. Pure (no React Native deps) so it can be unit-tested.
 */

export type CheckoutStep = 'create-sheet' | 'init' | 'present';

const STEP_LABEL: Record<CheckoutStep, string> = {
  'create-sheet': 'POST /api/me/payment-sheet',
  init: 'initPaymentSheet',
  present: 'presentPaymentSheet',
};

interface ErrorLike {
  status?: unknown;
  code?: unknown;
  message?: unknown;
}

/**
 * e.g. "initPaymentSheet · Canceled · The payment flow has been canceled" or
 * "POST /api/me/payment-sheet · HTTP 402 · insufficient_funds".
 *
 * Deliberately pulls only status (HTTP), code and message. Both `ApiError`
 * (status + code + message) and Stripe's error object (code + message) are
 * covered; anything else degrades to just the step label.
 */
export function summarizeCheckoutError(step: CheckoutStep, err: unknown): string {
  const parts: string[] = [STEP_LABEL[step]];
  const e = (err ?? {}) as ErrorLike;

  if (typeof e.status === 'number') parts.push(`HTTP ${e.status}`);

  const code = e.code;
  let codeStr: string | null = null;
  if ((typeof code === 'string' && code !== '') || typeof code === 'number') {
    codeStr = String(code);
    parts.push(codeStr);
  }

  // Append the message, but skip it when it's just a repeat of the code
  // (ApiError sets its message to the backend's `error`, which often equals `code`).
  const message =
    typeof e.message === 'string' && e.message.trim() !== ''
      ? e.message.trim()
      : typeof err === 'string' && err.trim() !== ''
        ? err.trim()
        : null;
  if (message && message !== codeStr) parts.push(message);

  return parts.join(' · ');
}
