/**
 * Language selection — the catalogue of available app languages and the pure
 * resolution rule that decides which one to use at startup.
 *
 * Adding a language later is a small, mechanical change in two files:
 *   1. Drop a `<code>.json` next to `en.json` and register it in
 *      `src/i18n/resources.ts` (the single map of code → translations).
 *   2. Add an entry to `AVAILABLE_LANGUAGES` below (code + native name).
 * Nothing else in the app needs to change — the Language screen, the startup
 * resolver and the completeness test all read from these two lists.
 *
 * The stored choice (see `languageStore`) overrides the device language; the
 * special value `DEVICE` means "follow the device language", which is the
 * default. English is the guaranteed final fallback and the source of truth.
 */

/** Stored preference meaning "use the device language". */
export const DEVICE = 'device';

export interface LanguageOption {
  /** i18n language code, e.g. "en". */
  code: string;
  /** Endonym shown in the list (the language's own name). */
  label: string;
}

/**
 * Languages the app currently ships. English is the source/fallback; the other
 * three are the client's launch languages. Labels are endonyms (each shown in
 * its own language), per the Language screen design.
 */
export const AVAILABLE_LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
] as const;

/** Guaranteed fallback. */
export const FALLBACK_LANGUAGE = 'en';

/**
 * Reduce a BCP-47 tag to its base language subtag, lower-cased: `es-MX` → `es`,
 * `de_AT` → `de`, `RU` → `ru`. This is how regional device variants map onto a
 * shipped language — we only ship the base languages, so the region is dropped.
 */
export function baseCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const base = code.split(/[-_]/)[0]?.toLowerCase();
  return base || null;
}

function isSupported(code: string | null | undefined): boolean {
  const base = baseCode(code);
  return !!base && AVAILABLE_LANGUAGES.some((l) => l.code === base);
}

/**
 * Resolve the effective language from the stored preference, the device's
 * ordered locale list, and the shipped languages.
 *
 * Precedence: a valid stored choice → the first supported device locale →
 * English. A stored `DEVICE` (or null / unsupported) falls through to the
 * device locales. Regional variants (`es-MX`, `de-AT`, `ru-UA`) collapse to
 * their base language; anything we don't ship falls back to English.
 *
 * @param stored        the persisted preference (a language code, `DEVICE`, or null)
 * @param deviceLocales ordered language codes from the device (most-preferred first)
 */
export function resolveLanguage(
  stored: string | null | undefined,
  deviceLocales: readonly (string | null | undefined)[]
): string {
  if (stored && stored !== DEVICE && isSupported(stored)) {
    return baseCode(stored) as string;
  }
  for (const code of deviceLocales) {
    if (isSupported(code)) return baseCode(code) as string;
  }
  return FALLBACK_LANGUAGE;
}
