import { PROMO_ERROR_KEYS, promoErrorKey } from '../promoErrors';

describe('promoErrorKey', () => {
  it('maps each known backend code to its namespaced i18n key', () => {
    for (const code of PROMO_ERROR_KEYS) {
      expect(promoErrorKey(code)).toBe(`checkout.promoErrors.${code}`);
    }
  });

  it('trims surrounding whitespace before matching', () => {
    expect(promoErrorKey('  promo_expired  ')).toBe('checkout.promoErrors.promo_expired');
  });

  it('falls back to a generic key for unknown / empty codes', () => {
    expect(promoErrorKey('something_new')).toBe('checkout.promoErrors.generic');
    expect(promoErrorKey('')).toBe('checkout.promoErrors.generic');
    expect(promoErrorKey(null)).toBe('checkout.promoErrors.generic');
    expect(promoErrorKey(undefined)).toBe('checkout.promoErrors.generic');
  });
});
