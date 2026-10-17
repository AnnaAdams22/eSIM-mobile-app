/**
 * Localised country names, keyed by ISO-3166 alpha-2.
 *
 * Uses the pure-JS `i18n-iso-countries` dataset (NOT `Intl.DisplayNames`, which
 * isn't reliably present on Hermes/Android). Only the app's shipped languages
 * are registered, keeping the bundle small. Everything here is pure and has no
 * dependency on the i18n instance, so the catalog transforms and their unit
 * tests can use it directly.
 *
 * The backend's English `countries_included` string remains the source of truth
 * and the fallback: if a code has no translation (or an unknown language is
 * asked for), callers fall back to the backend name.
 */

import countries from 'i18n-iso-countries';
import de from 'i18n-iso-countries/langs/de.json';
import en from 'i18n-iso-countries/langs/en.json';
import es from 'i18n-iso-countries/langs/es.json';
import ru from 'i18n-iso-countries/langs/ru.json';

import { baseCode } from '@/features/settings/language';

countries.registerLocale(en);
countries.registerLocale(ru);
countries.registerLocale(de);
countries.registerLocale(es);

/** Languages we hold country-name translations for (mirrors the shipped UI languages). */
export const COUNTRY_NAME_LOCALES = ['en', 'ru', 'de', 'es'] as const;

/**
 * The country name for an ISO2 code in a given language, or `undefined` when the
 * code/language is unknown. The language is reduced to its base subtag, so
 * `es-MX` resolves against Spanish.
 */
export function localizedCountryName(
  iso2: string | null | undefined,
  lang: string | null | undefined
): string | undefined {
  if (!iso2) return undefined;
  const code = baseCode(lang) ?? 'en';
  const name = countries.getName(iso2.toUpperCase(), code);
  return name || undefined;
}

/**
 * Build a resolver bound to one language: `(iso2, fallback) => name`. Returns the
 * localised name when known, otherwise the caller's fallback (the backend's
 * English name). Pass this into `buildDestinations` so names AND their sort order
 * follow the selected language.
 */
export function countryNameResolver(
  lang: string | null | undefined
): (iso2: string, fallback: string) => string {
  return (iso2, fallback) => localizedCountryName(iso2, lang) ?? fallback;
}

/**
 * Reverse-lookup: the ISO2 code for an English country name, or `undefined`.
 * Region plans carry only a names string (no codes), so this bridges a member
 * country name back to a code we can localise / expand into search terms.
 */
export function iso2ForEnglishName(name: string | null | undefined): string | undefined {
  if (!name) return undefined;
  return countries.getAlpha2Code(name, 'en') || undefined;
}

/**
 * Localise an English country name into `lang`, falling back to the original
 * name when the code or translation is unknown. Used for region member-country
 * lists, where only the backend's English name is available.
 */
export function localizeEnglishCountryName(name: string, lang: string | null | undefined): string {
  const iso2 = iso2ForEnglishName(name);
  return (iso2 && localizedCountryName(iso2, lang)) || name;
}

/**
 * Every known name for an ISO2 code across all shipped languages (deduplicated).
 * Used to build search terms so a country is found by its name in ANY shipped
 * language regardless of the current UI language.
 */
export function allCountryNames(iso2: string | null | undefined): string[] {
  if (!iso2) return [];
  const code = iso2.toUpperCase();
  const seen = new Set<string>();
  for (const lang of COUNTRY_NAME_LOCALES) {
    const name = countries.getName(code, lang);
    if (name) seen.add(name);
  }
  return [...seen];
}
