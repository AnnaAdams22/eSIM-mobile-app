/**
 * i18n setup (i18next + react-i18next).
 *
 * Ships English (source + fallback), Russian, German and Spanish. Device
 * language is detected via expo-localization, with English as the guaranteed
 * fallback. The language bundles live in `./resources.ts`; adding a locale is a
 * JSON file + one entry there (see that file's header).
 *
 * Rule: every user-visible string must come from a translation key. See CLAUDE.md.
 */

import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from './resources';
import { resolveLanguage } from '@/features/settings/language';
import { getStoredLanguage } from '@/features/settings/languageStore';

export const defaultNS = 'translation';

export { resources };

const supportedLngs = Object.keys(resources);

/** Ordered device language codes (most-preferred first). */
function deviceLocales(): string[] {
  return getLocales()
    .map((l) => l.languageCode)
    .filter((c): c is string => !!c);
}

// Initialise synchronously with the device language so the first render is in
// the right language; the stored preference (which can override the device) is
// applied moments later by `applyStoredLanguage()` at startup.
const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(null, deviceLocales()),
  fallbackLng: 'en',
  defaultNS,
  supportedLngs,
  interpolation: {
    escapeValue: false, // React already escapes
  },
  returnNull: false,
});

/**
 * Apply the persisted language preference (stored → device → English). Called
 * once at app startup. A no-op when the resolved language already matches, so it
 * won't trigger an extra re-render in the common case.
 */
export async function applyStoredLanguage(): Promise<void> {
  const stored = await getStoredLanguage();
  const next = resolveLanguage(stored, deviceLocales());
  if (next !== i18n.language) {
    await i18n.changeLanguage(next);
  }
}

export default i18n;
