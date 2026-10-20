/** Barrel for the checkout feature: pure, tested helpers + the Stripe appearance. */

export {
  activationStringFromTapLink,
  parseLpa,
  parseActivationFromTapLink,
  buildLpaString,
  lpaQrValueFromTapLink,
  androidInstallUrlFromLpa,
  androidInstallUrlFromTapLink,
  ANDROID_INSTALL_BASE,
} from './lpa';
export type { LpaActivation } from './lpa';

export { PROMO_ERROR_KEYS, promoErrorKey } from './promoErrors';
export type { PromoErrorCode } from './promoErrors';

export {
  SUCCESS_STATUSES,
  FAILURE_STATUSES,
  POLL_TIMEOUT_MS,
  POLL_INTERVAL_MS,
  pollPhase,
  isTerminal,
} from './orderPolling';
export type { PollPhase, PollInput } from './orderPolling';

export { makeRequestIdHolder } from './requestId';
export type { RequestIdHolder } from './requestId';

export { buildPaymentSheetAppearance } from './stripeAppearance';

export { summarizeCheckoutError } from './devDiagnostics';
export type { CheckoutStep } from './devDiagnostics';

export { decidePaymentOutcome } from './paymentOutcome';
export type { PaymentOutcome, PaymentFailureContext } from './paymentOutcome';

export { backgroundAdjustedStart } from './pollClock';
