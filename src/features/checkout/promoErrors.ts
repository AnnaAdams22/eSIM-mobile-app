/**
 * Map a backend promo-validation error code to a friendly i18n key.
 *
 * The backend returns `{ valid: false, error: '<code>' }` for an ineligible or
 * invalid code (a normal 200 preview answer, not an HTTP error). We translate the
 * known codes into reassuring, specific messages and fall back to a generic line
 * for anything unrecognised, so a new backend code never shows the user a raw
 * machine string.
 */

/** The promo error codes the backend is known to emit. */
export const PROMO_ERROR_KEYS = [
  'promo_not_found',
  'promo_expired',
  'promo_not_applicable',
  'promo_min_amount',
  'promo_exhausted',
  'promo_below_minimum',
] as const;

export type PromoErrorCode = (typeof PROMO_ERROR_KEYS)[number];

/** i18n key (under `checkout.promoErrors.*`) for a given backend error code. */
export function promoErrorKey(code: string | null | undefined): string {
  const normalized = code?.trim();
  if (normalized && (PROMO_ERROR_KEYS as readonly string[]).includes(normalized)) {
    return `checkout.promoErrors.${normalized}`;
  }
  return 'checkout.promoErrors.generic';
}
