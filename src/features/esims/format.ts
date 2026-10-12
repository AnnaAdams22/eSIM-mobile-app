/**
 * Data-size formatting for usage display (pure).
 *
 * The backend reports balances in whole megabytes (`data_left_mb`, etc.). We show
 * them the way a traveller expects: megabytes under 1 GB, gigabytes above, with a
 * single decimal only when it isn't a round number ("620 MB", "1 GB", "1.5 GB").
 *
 * No i18n here — these are unit-suffixed numbers the screens drop into translated
 * sentences (e.g. "{{used}} used of {{total}}"); keeping them pure makes the
 * MB/GB rounding trivially testable.
 */

/** One gigabyte in megabytes, as the backend counts them. */
const MB_PER_GB = 1024;

/**
 * Format a megabyte count as a human data size.
 *   0        → "0 MB"
 *   620      → "620 MB"
 *   1024     → "1 GB"
 *   1536     → "1.5 GB"
 *   null/NaN → null (caller shows a dash / "—")
 */
export function formatDataSize(mb: number | null | undefined): string | null {
  if (mb == null || !Number.isFinite(mb)) return null;
  const safe = Math.max(0, mb);
  if (safe < MB_PER_GB) {
    // Whole MB; the vendor already reports integers, but guard against decimals.
    return `${Math.round(safe)} MB`;
  }
  const gb = safe / MB_PER_GB;
  // One decimal, then trim a trailing ".0" so "1 GB" never shows as "1.0 GB".
  const rounded = Math.round(gb * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} GB`;
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
