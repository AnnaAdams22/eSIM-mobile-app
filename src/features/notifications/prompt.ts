/**
 * The soft permission-prompt decision.
 *
 * We never ask for notification permission at first launch. Instead we show a
 * gentle in-app card on Order success ("Get notified when your data is running
 * low…"); only tapping "Turn on" triggers the OS prompt. This pure function
 * decides whether that card should appear, so the policy is testable in isolation.
 *
 * Rules (so we invite, but never nag):
 *  - If permission is already granted, there is nothing to ask — don't show it.
 *  - If permission is denied, the OS will not re-prompt, so the card is pointless
 *    (the real path back is Settings → the Notifications screen explains that).
 *  - Otherwise ("undetermined"): offer on the first purchase; if the user chose
 *    "Not now", re-offer at most once, and only on a LATER purchase. Two
 *    dismissals means we stop asking for good.
 */

export type PushPermission = 'granted' | 'denied' | 'undetermined';

export interface SoftPromptInput {
  /** Current OS permission status. */
  permission: PushPermission;
  /** How many times the user has tapped "Not now" (0, 1 or 2+). */
  timesDismissed: number;
  /** The purchase count at which it was last dismissed (null if never). */
  dismissedAtPurchaseCount: number | null;
  /** The user's lifetime successful-purchase count (this purchase included). */
  purchaseCount: number;
}

export function decideSoftPrompt({
  permission,
  timesDismissed,
  dismissedAtPurchaseCount,
  purchaseCount,
}: SoftPromptInput): boolean {
  if (permission !== 'undetermined') return false; // granted or denied → don't ask
  if (timesDismissed <= 0) return true; // first offer
  if (timesDismissed === 1) {
    // Re-offer only on a purchase later than the one we were dismissed on.
    return purchaseCount > (dismissedAtPurchaseCount ?? -1);
  }
  return false; // dismissed twice → stop asking
}
