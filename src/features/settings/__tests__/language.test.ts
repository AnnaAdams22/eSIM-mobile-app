import { DEVICE, FALLBACK_LANGUAGE, resolveLanguage } from '../language';

describe('resolveLanguage', () => {
  it('honours a valid stored preference over the device', () => {
    expect(resolveLanguage('en', ['fr', 'de'])).toBe('en');
  });

  it('follows the device when the stored value is the DEVICE sentinel', () => {
    expect(resolveLanguage(DEVICE, ['en', 'fr'])).toBe('en');
  });

  it('follows the device when nothing is stored', () => {
    expect(resolveLanguage(null, ['en'])).toBe('en');
    expect(resolveLanguage(undefined, ['en'])).toBe('en');
  });

  it('falls back to English when the stored language is unsupported', () => {
    expect(resolveLanguage('xx', ['xx', 'yy'])).toBe(FALLBACK_LANGUAGE);
  });

  it('falls back to English when no device locale is supported', () => {
    expect(resolveLanguage(DEVICE, ['fr', 'de'])).toBe(FALLBACK_LANGUAGE);
    expect(resolveLanguage(null, [])).toBe(FALLBACK_LANGUAGE);
  });

  it('picks the first supported device locale in order', () => {
    // Only 'en' is supported today, so a later 'en' still wins over unsupported earlier ones.
    expect(resolveLanguage(DEVICE, ['fr', 'en', 'de'])).toBe('en');
  });

  it('ignores null entries in the device locale list', () => {
    expect(resolveLanguage(null, [null, undefined, 'en'])).toBe('en');
  });
});
