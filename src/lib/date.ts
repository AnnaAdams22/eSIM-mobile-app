/**
 * Small date helpers for user-facing dates. Locale-aware via the runtime's Intl
 * (Hermes ships it); all inputs are the backend's ISO-8601 UTC strings.
 */

/** "Apr 28, 2025", or null for a missing/unparseable date. */
export function formatShortDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export type RelativeUnit = 'now' | 'seconds' | 'minutes' | 'hours' | 'days';

/**
 * Break the gap between a past ISO time and `nowMs` into a coarse unit + value,
 * so the caller can translate ("{{count}} min ago") with proper pluralisation.
 * Future or unparseable times collapse to `now`.
 */
export function relativeTimeParts(
  iso: string | null | undefined,
  nowMs: number
): { unit: RelativeUnit; value: number } {
  if (!iso) return { unit: 'now', value: 0 };
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return { unit: 'now', value: 0 };
  const deltaSec = Math.max(0, Math.round((nowMs - t) / 1000));
  if (deltaSec < 10) return { unit: 'now', value: 0 };
  if (deltaSec < 60) return { unit: 'seconds', value: deltaSec };
  const min = Math.floor(deltaSec / 60);
  if (min < 60) return { unit: 'minutes', value: min };
  const hours = Math.floor(min / 60);
  if (hours < 24) return { unit: 'hours', value: hours };
  return { unit: 'days', value: Math.floor(hours / 24) };
}
