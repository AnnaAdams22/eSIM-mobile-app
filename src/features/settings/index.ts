/** Barrel for the settings feature: language catalogue, resolution and storage. */

export {
  AVAILABLE_LANGUAGES,
  DEVICE,
  FALLBACK_LANGUAGE,
  resolveLanguage,
} from './language';
export type { LanguageOption } from './language';

export { getStoredLanguage, setStoredLanguage } from './languageStore';
