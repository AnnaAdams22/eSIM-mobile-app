/**
 * i18n setup (i18next + react-i18next).
 *
 * English only for now. Device language is detected via expo-localization, with
 * English as the guaranteed fallback. Adding a locale later = drop a `<lang>.json`
 * next to `en.json` and register it in `resources`.
 *
 * Rule: every user-visible string must come from a translation key. See CLAUDE.md.
 */

import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';

export const defaultNS = 'translation';

export const resources = {
  en: { translation: en },
} as const;

const supportedLngs = Object.keys(resources);

/** Best-effort device language, falling back to English. */
function detectLanguage(): string {
  const locales = getLocales();
  const code = locales[0]?.languageCode ?? 'en';
  return supportedLngs.includes(code) ? code : 'en';
}

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: 'en',
  defaultNS,
  supportedLngs,
  interpolation: {
    escapeValue: false, // React already escapes
  },
  returnNull: false,
});

export default i18n;
