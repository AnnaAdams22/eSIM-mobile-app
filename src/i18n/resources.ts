/**
 * The single map of language code → translation bundle.
 *
 * This is the ONE place that imports the per-language JSON files. Both the i18n
 * instance (`./index.ts`) and the translation-completeness test read from here,
 * so adding a language is: drop `<code>.json` next to `en.json`, import it here
 * and add one entry below, then add the matching entry to `AVAILABLE_LANGUAGES`
 * in `src/features/settings/language.ts`. No other code changes.
 *
 * English is the source of truth and the fallback; every other bundle is
 * validated against it by `__tests__/translations.test.ts`.
 */

import de from './de.json';
import en from './en.json';
import es from './es.json';
import ru from './ru.json';

export const translations = { en, ru, de, es } as const;

export type AppLanguageCode = keyof typeof translations;

/** i18next `resources` shape: `{ en: { translation: {...} }, ... }`. */
export const resources = Object.fromEntries(
  Object.entries(translations).map(([code, bundle]) => [code, { translation: bundle }])
) as Record<AppLanguageCode, { translation: (typeof translations)[AppLanguageCode] }>;
