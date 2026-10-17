/**
 * The ONE price formatter used everywhere a price is shown (lists, detail,
 * checkout, order history, top-up, success screens).
 *
 * The backend decides the amount; the app only FORMATS the integer
 * `price_eur_cents` it is given, per the current locale, as EUR — "€4.99" in
 * English, "4,99 €" in German/Spanish/Russian. This is display formatting, never
 * calculation (CLAUDE.md rule 7).
 *
 * `Intl.NumberFormat` is available on Hermes in this SDK (full-ICU), but we guard
 * it: if it ever throws or yields something unexpected, we fall back to the
 * backend's `price_display` string when the caller provides one, otherwise to a
 * plain "€X.XX" so a price never renders blank.
 */

/** Manual, locale-free "€X.XX" from cents, by integer arithmetic (matches the backend). */
function plainEur(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}€${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/**
 * Format an integer cent amount as a localised EUR price.
 *
 * @param cents    integer euro-cents from the backend (e.g. 499 → "€4.99")
 * @param locale   BCP-47 language (e.g. i18n.language); undefined uses the default
 * @param fallback the backend's `price_display` to use if Intl fails (optional)
 */
export function formatPrice(
  cents: number | null | undefined,
  locale?: string,
  fallback?: string | null
): string {
  if (cents == null || !Number.isFinite(cents)) return fallback ?? '';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return fallback ?? plainEur(cents);
  }
}
