/**
 * Apple Pay gating for the Stripe PaymentSheet.
 *
 * The app registers the Apple Pay merchant id (`merchant.net.esimglobal.app`,
 * see app.json) so EAS can sync the Apple Pay capability onto the iOS build.
 * But Apple Pay only actually WORKS once Stripe holds an Apple Pay payment-
 * processing certificate for that merchant id. Until then, passing an `applePay`
 * option to `initPaymentSheet` could surface an Apple Pay button that fails.
 *
 * So we gate the option behind an explicit flag (default OFF): no Apple Pay
 * button ships until Apple Pay is confirmed fully set up in Stripe. Flipping
 * `EXPO_PUBLIC_APPLE_PAY_ENABLED=true` (once the Stripe cert exists) is all that's
 * needed to turn it on — no code change. Google Pay is unaffected (Android-only).
 *
 * This pure helper maps the flag to the option object so it can be unit-tested
 * without Stripe or the native sheet.
 */

export interface ApplePaySheetOption {
  merchantCountryCode: string;
}

/**
 * The `applePay` option for `initPaymentSheet`, or `undefined` when Apple Pay is
 * not enabled (so the sheet omits the Apple Pay button entirely).
 */
export function applePaySheetOption(
  enabled: boolean,
  merchantCountryCode = 'US'
): ApplePaySheetOption | undefined {
  return enabled ? { merchantCountryCode } : undefined;
}
