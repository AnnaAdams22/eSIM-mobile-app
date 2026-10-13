/**
 * Language selection — the catalogue of available app languages and the pure
 * resolution rule that decides which one to use at startup.
 *
 * Adding a language later is two steps and no code change here beyond this list:
 *   1. Drop a `<code>.json` next to `en.json` and register it in i18n `resources`.
 *   2. Add an entry to `AVAILABLE_LANGUAGES` below.
 *
 * The stored choice (see `languageStore`) overrides the device language; the
 * special value `DEVICE` means "follow the device language", which is the
 * default. English is the guaranteed final fallback.
 */

/** Stored preference meaning "use the device language". */
export const DEVICE = 'device';

export interface LanguageOption {
  /** i18n language code, e.g. "en". */
  code: string;
  /** Endonym shown in the list (its own language's name). */
  label: string;
}

/** Languages the app currently ships. English only for now. */
export const AVAILABLE_LANGUAGES: readonly LanguageOption[] = [{ code: 'en', label: 'English' }] as const;

/** Guaranteed fallback. */
export const FALLBACK_LANGUAGE = 'en';

function isSupported(code: string | null | undefined): boolean {
  return !!code && AVAILABLE_LANGUAGES.some((l) => l.code === code);
}

/**
 * Resolve the effective language from the stored preference, the device's
 * ordered locale list, and the shipped languages.
 *
 * Precedence: a valid stored choice → the first supported device locale →
 * English. A stored `DEVICE` (or null / unsupported) falls through to the
 * device locales.
 *
 * @param stored        the persisted preference (a language code, `DEVICE`, or null)
 * @param deviceLocales ordered language codes from the device (most-preferred first)
 */
export function resolveLanguage(
  stored: string | null | undefined,
  deviceLocales: readonly (string | null | undefined)[]
): string {
  if (stored && stored !== DEVICE && isSupported(stored)) {
    return stored;
  }
  for (const code of deviceLocales) {
    if (isSupported(code)) return code as string;
  }
  return FALLBACK_LANGUAGE;
}
