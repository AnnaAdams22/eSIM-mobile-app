import { formatPrice } from '../price';

describe('formatPrice', () => {
  it('formats cents as EUR in English', () => {
    expect(formatPrice(499, 'en')).toBe('€4.99');
    expect(formatPrice(1180, 'en')).toBe('€11.80');
  });

  it('uses the locale decimal separator and symbol placement', () => {
    // Non-breaking space before the symbol in these locales.
    expect(formatPrice(499, 'de')).toBe('4,99 €');
    expect(formatPrice(499, 'es')).toBe('4,99 €');
    expect(formatPrice(499, 'ru')).toBe('4,99 €');
  });

  it('always shows two fraction digits', () => {
    expect(formatPrice(500, 'en')).toBe('€5.00');
  });

  it('handles negative amounts (discounts)', () => {
    expect(formatPrice(-300, 'en')).toBe('-€3.00');
  });

  it('falls back to the backend display (or empty) for a missing amount', () => {
    expect(formatPrice(null, 'en', '€9.99')).toBe('€9.99');
    expect(formatPrice(undefined, 'en')).toBe('');
  });
});
