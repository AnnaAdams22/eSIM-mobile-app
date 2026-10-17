import { baseCode, DEVICE, FALLBACK_LANGUAGE, resolveLanguage } from '../language';

describe('resolveLanguage', () => {
  it('honours a valid stored preference over the device', () => {
    expect(resolveLanguage('en', ['de', 'ru'])).toBe('en');
    expect(resolveLanguage('de', ['en'])).toBe('de');
  });

  it('follows the device when the stored value is the DEVICE sentinel', () => {
    expect(resolveLanguage(DEVICE, ['en', 'fr'])).toBe('en');
    expect(resolveLanguage(DEVICE, ['ru', 'en'])).toBe('ru');
  });

  it('follows the device when nothing is stored', () => {
    expect(resolveLanguage(null, ['en'])).toBe('en');
    expect(resolveLanguage(undefined, ['es'])).toBe('es');
  });

  it('falls back to English when the stored language is unsupported', () => {
    expect(resolveLanguage('xx', ['xx', 'yy'])).toBe(FALLBACK_LANGUAGE);
  });

  it('falls back to English when no device locale is supported', () => {
    expect(resolveLanguage(DEVICE, ['fr', 'it'])).toBe(FALLBACK_LANGUAGE);
    expect(resolveLanguage(null, [])).toBe(FALLBACK_LANGUAGE);
  });

  it('picks the first supported device locale in order', () => {
    expect(resolveLanguage(DEVICE, ['fr', 'de', 'en'])).toBe('de');
  });

  it('maps regional variants to their base language', () => {
    expect(resolveLanguage('es-MX', ['en'])).toBe('es');
    expect(resolveLanguage(DEVICE, ['de-AT', 'en'])).toBe('de');
    expect(resolveLanguage(DEVICE, ['ru-UA'])).toBe('ru');
    expect(resolveLanguage(DEVICE, ['pt-BR', 'es-419'])).toBe('es');
  });

  it('ignores null entries in the device locale list', () => {
    expect(resolveLanguage(null, [null, undefined, 'en'])).toBe('en');
  });
});

describe('baseCode', () => {
  it('reduces a tag to its lower-cased base subtag', () => {
    expect(baseCode('es-MX')).toBe('es');
    expect(baseCode('de_AT')).toBe('de');
    expect(baseCode('RU')).toBe('ru');
    expect(baseCode('en')).toBe('en');
  });

  it('returns null for empty input', () => {
    expect(baseCode(null)).toBeNull();
    expect(baseCode(undefined)).toBeNull();
    expect(baseCode('')).toBeNull();
  });
});
