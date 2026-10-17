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

/**
 * Build the canonical LPA activation string from its parts, for rendering a QR
 * code the eSIM installer can scan: `LPA:1$<SM-DP+ address>$<activation code>`.
 * (The optional 4th confirmation-code segment is intentionally omitted — it's
 * not used for eSIM download here.)
 */
export function buildLpaString({ smdpAddress, activationCode }: LpaActivation): string {
  return `LPA:1$${smdpAddress}$${activationCode}`;
}

/**
 * The value to encode in a scannable QR from an iOS tap link, or null when the
 * link has no parseable LPA (caller should fall back to the backend QR image).
 */
export function lpaQrValueFromTapLink(tapLink: string | null | undefined): string | null {
  const activation = parseActivationFromTapLink(tapLink);
  return activation ? buildLpaString(activation) : null;
}

/**
 * Google's universal one-tap eSIM install link (Android 10+, Google Play services
 * 25.14.34+). Opening it externally hands the LPA to the system eSIM installer,
 * exactly like Apple's link does on iOS:
 *
 *   https://esimsetup.android.com/esim_qrcode_provisioning?carddata=LPA:1$<addr>$<code>
 *
 * The base URL MUST be lowercase; the carddata value must keep the LPA's literal
 * `$` and `:` delimiters — the installer expects them unencoded (verified against
 * Google/AOSP and vendor docs) — while the activation code keeps its capitals.
 * We still percent-encode anything else unsafe for a URL query (spaces, `&`, `#`,
 * …) so an unusual code can't break the link, then restore the two structural
 * delimiters.
 */
export const ANDROID_INSTALL_BASE =
  'https://esimsetup.android.com/esim_qrcode_provisioning';

function encodeCarddata(lpa: string): string {
  return encodeURIComponent(lpa).replace(/%24/g, '$').replace(/%3A/gi, ':');
}

/** Build the Android install URL from parsed activation parts, or null if absent. */
export function androidInstallUrlFromLpa(activation: LpaActivation | null): string | null {
  if (!activation) return null;
  return `${ANDROID_INSTALL_BASE}?carddata=${encodeCarddata(buildLpaString(activation))}`;
}

/** Convenience: tap link → Android install URL, or null when no LPA is parseable. */
export function androidInstallUrlFromTapLink(
  tapLink: string | null | undefined
): string | null {
  return androidInstallUrlFromLpa(parseActivationFromTapLink(tapLink));
}
