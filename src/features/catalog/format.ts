/**
 * Pure display formatting for catalog plans.
 *
 * NEVER shows the raw vendor plan name (e.g. "Albania 0.49GB_20250318"). A plan
 * is shown as "{data} · {days}" (e.g. "3 GB · 7 days"), with graceful handling of
 * unlimited/odd data and 1-day vs N-day pluralisation.
 *
 * These functions are deliberately i18next-free so they can be unit-tested without
 * initialising i18n. Screens pass the real `t`; tests pass a small stub. The one
 * requirement is that `t` applies i18next's count-based pluralisation to the
 * `catalog.dayWithCount` / `catalog.*Count` keys.
 */

import type { Plan } from '@/lib/api-types';

/** The subset of i18next's TFunction these helpers rely on. TFunction satisfies it. */
export type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Re-renders the numeric part of a data string with the locale's decimal separator. */
function localizeDecimal(value: string, locale?: string): string {
  // Only the leading number varies ("0.49 GB" → "0,49 GB"); the unit is invariant.
  return value.replace(/^(\d+(?:\.\d+)?)/, (num) => {
    const n = Number.parseFloat(num);
    if (!Number.isFinite(n)) return num;
    try {
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 3,
        useGrouping: false,
      }).format(n);
    } catch {
      return num;
    }
  });
}

/**
 * Normalises the vendor's `data` field into a display string.
 * - null / empty            → localised "Data"
 * - "unlimited" (any case)  → localised "Unlimited"
 * - otherwise               → the value with a locale decimal ("0,49 GB" in de)
 */
export function formatData(data: string | null | undefined, t: Translate, locale?: string): string {
  const trimmed = data?.trim();
  if (!trimmed) return t('catalog.dataUnknown');
  if (/unlimited|∞/i.test(trimmed)) return t('catalog.unlimited');
  return localizeDecimal(trimmed, locale);
}

/** "{{count}} day" / "{{count}} days" via i18next pluralisation; "Flexible" if unknown. */
export function formatDays(days: number | null | undefined, t: Translate): string {
  if (days == null || !Number.isFinite(days) || days <= 0) return t('catalog.daysUnknown');
  return t('catalog.dayWithCount', { count: days });
}

/** The canonical plan label: "{data} · {days}", e.g. "3 GB · 7 days". */
export function formatPlanLabel(
  plan: Pick<Plan, 'data' | 'days'>,
  t: Translate,
  locale?: string
): string {
  return `${formatData(plan.data, t, locale)} · ${formatDays(plan.days, t)}`;
}

/**
 * Parses the vendor's `data` string into a comparable amount in GB, for SORTING
 * only (never for display). Units are normalised (MB → GB, TB → GB). "Unlimited"
 * sorts highest; unparseable/empty values sort lowest.
 */
export function dataAmountGb(data: string | null | undefined): number {
  const trimmed = data?.trim();
  if (!trimmed) return -1;
  if (/unlimited|∞/i.test(trimmed)) return Number.POSITIVE_INFINITY;

  const match = trimmed.match(/([\d.]+)\s*(TB|GB|MB|KB)?/i);
  if (!match) return -1;

  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return -1;

  const unit = (match[2] ?? 'GB').toUpperCase();
  switch (unit) {
    case 'TB':
      return value * 1024;
    case 'MB':
      return value / 1024;
    case 'KB':
      return value / (1024 * 1024);
    default:
      return value; // GB
  }
}
