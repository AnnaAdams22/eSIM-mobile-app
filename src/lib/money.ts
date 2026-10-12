/**
 * Display formatting for EUR amounts the BACKEND has already decided.
 *
 * The app never calculates prices, discounts or totals (CLAUDE.md rule 7). Some
 * endpoints (promo/validate, payment-sheet) return only integer `*_cents` with
 * no `*_display` string, so we need to render those server-provided integers.
 * This is pure display formatting of a value the server computed — never
 * arithmetic on prices.
 *
 * Mirrors the backend's `formatEurCents` (../esim-backend/src/routes/checkout.js)
 * byte-for-byte so the app and the receipt/email always read identically.
 */

/** "1180" -> "€11.80", by integer arithmetic only. */
export function formatEurCents(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}€${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}
