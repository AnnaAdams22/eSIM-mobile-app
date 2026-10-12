/**
 * Parse the eSIM activation details out of the order's `ios_tap_link`.
 *
 * Apple's one-tap link wraps the raw LPA activation string in a `carddata` query
 * parameter:
 *
 *   https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=LPA%3A1%24smdp.io%24CODE
 *
 * The decoded LPA string is `LPA:1$<SM-DP+ address>$<activation code>` (an
 * optional 4th `$`-segment confirmation code may follow, which we ignore). We
 * extract the SM-DP+ address and activation code so Android / manual-setup users
 * can enter them by hand. Mirrors the backend's `activationCodeFromTapLink`
 * (../esim-backend/src/templates/esim-delivery.js).
 *
 * Everything here fails gracefully: a malformed or unexpected input returns
 * `null` rather than throwing, because this drives a UI the user still needs
 * even when the QR code is the primary path.
 */

export interface LpaActivation {
  /** SM-DP+ server address, e.g. "smdp.io". */
  smdpAddress: string;
  /** Matching ID / activation code. */
  activationCode: string;
}

/** Pull the raw (URL-decoded) `carddata` LPA string out of an iOS tap link. */
export function activationStringFromTapLink(tapLink: string | null | undefined): string | null {
  const match = /[?&]carddata=([^&]+)/.exec(String(tapLink ?? ''));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Parse an `LPA:1$address$code` string into its parts, or null if malformed. */
export function parseLpa(lpaString: string | null | undefined): LpaActivation | null {
  const trimmed = lpaString?.trim();
  if (!trimmed) return null;

  // Must be an LPA scheme string. Case-insensitive on the scheme only.
  if (!/^LPA:/i.test(trimmed)) return null;

  // Drop the "LPA:" scheme, then split the remaining "1$address$code".
  const parts = trimmed.slice(4).split('$');
  // parts[0] is the format version ("1"); we need an address and a code.
  if (parts.length < 3) return null;

  const smdpAddress = parts[1]?.trim() ?? '';
  const activationCode = parts[2]?.trim() ?? '';
  if (!smdpAddress || !activationCode) return null;

  return { smdpAddress, activationCode };
}

/** Convenience: tap link → parsed activation, or null if anything is missing. */
export function parseActivationFromTapLink(
  tapLink: string | null | undefined
): LpaActivation | null {
  return parseLpa(activationStringFromTapLink(tapLink));
}
