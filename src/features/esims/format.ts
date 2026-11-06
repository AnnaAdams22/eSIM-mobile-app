/**
 * Data-size formatting for usage display (pure).
 *
 * The backend reports balances in whole megabytes (`data_left_mb`, etc.). We show
 * them the way a traveller expects: megabytes under 1 GB, gigabytes above, with a
 * single decimal only when it isn't a round number ("620 MB", "1 GB", "1.5 GB").
 *
 * The numeric part is rendered with the current locale's decimal separator
 * ("1.5 GB" in English, "1,5 GB" in German) via Intl, so screens can drop these
 * unit-suffixed numbers straight into translated sentences ("{{used}} used of
 * {{total}}"). An omitted locale uses the runtime default, keeping tests simple.
 */

/** One gigabyte in megabytes, as the backend counts them. */
const MB_PER_GB = 1024;

/** Locale-aware number formatting with a guarded fallback to a plain string. */
function formatNumber(value: number, locale?: string, maxFractionDigits = 0): string {
  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: maxFractionDigits,
      // Data sizes localise the decimal separator only ("1,5 GB"); no thousands
      // grouping ("1023 MB", not "1 023 MB").
      useGrouping: false,
    }).format(value);
  } catch {
    return maxFractionDigits > 0 && !Number.isInteger(value)
      ? value.toFixed(maxFractionDigits)
      : String(value);
  }
}

/**
 * Format a megabyte count as a human data size.
 *   0        → "0 MB"
 *   620      → "620 MB"
 *   1024     → "1 GB"
 *   1536     → "1.5 GB" / "1,5 GB" (de)
 *   null/NaN → null (caller shows a dash / "—")
 */
export function formatDataSize(mb: number | null | undefined, locale?: string): string | null {
  if (mb == null || !Number.isFinite(mb)) return null;
  const safe = Math.max(0, mb);
  if (safe < MB_PER_GB) {
    // Whole MB; the vendor already reports integers, but guard against decimals.
    return `${formatNumber(Math.round(safe), locale)} MB`;
  }
  const gb = safe / MB_PER_GB;
  // One decimal, then trim a trailing ".0" so "1 GB" never shows as "1.0 GB".
  const rounded = Math.round(gb * 10) / 10;
  return `${formatNumber(rounded, locale, 1)} GB`;
}

/**
 * True when a usage payload describes an UNLIMITED plan.
 *
 * The backend reports balances in whole megabytes, but an unlimited plan has no
 * finite cap: Yesim's package size is non-numeric, so `data_total_mb` comes back
 * null (or otherwise non-finite). We treat "no usable total, but we do know how
 * much has been used" as unlimited — distinct from "usage unknown" (where the
 * used figure is absent too, e.g. a plan not yet activated). The caller then
 * shows data used plus "Unlimited" instead of a misleading "X left of Y".
 */
export function isUnlimitedUsage(usage: {
  data_used_mb?: number | null;
  data_left_mb?: number | null;
  data_total_mb?: number | null;
}): boolean {
  const total = usage.data_total_mb;
  const totalKnown = total != null && Number.isFinite(total) && total > 0;
  if (totalKnown) return false;
  const used = usage.data_used_mb;
  return used != null && Number.isFinite(used);
}

/**
 * Fraction of the plan's data that has been USED, in [0, 1].
 *
 * Prefers an explicit `data_used_mb`; otherwise derives it from total − left.
 * Returns null when there's nothing meaningful to show (no total, or unparseable)
 * so the meter can render an indeterminate/empty state instead of a wrong bar.
 */
export function usedFraction(usage: {
  data_used_mb?: number | null;
  data_left_mb?: number | null;
  data_total_mb?: number | null;
}): number | null {
  const total = usage.data_total_mb;
  if (total == null || !Number.isFinite(total) || total <= 0) return null;

  let used: number | null = null;
  if (usage.data_used_mb != null && Number.isFinite(usage.data_used_mb)) {
    used = usage.data_used_mb;
  } else if (usage.data_left_mb != null && Number.isFinite(usage.data_left_mb)) {
    used = total - usage.data_left_mb;
  }
  if (used == null) return null;

  return Math.min(1, Math.max(0, used / total));
}
