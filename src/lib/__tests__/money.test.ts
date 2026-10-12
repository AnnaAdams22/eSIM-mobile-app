import { formatEurCents } from '../money';

describe('formatEurCents', () => {
  it('formats whole and fractional euros', () => {
    expect(formatEurCents(1180)).toBe('€11.80');
    expect(formatEurCents(490)).toBe('€4.90');
    expect(formatEurCents(0)).toBe('€0.00');
    expect(formatEurCents(5)).toBe('€0.05');
    expect(formatEurCents(100)).toBe('€1.00');
  });

  it('pads the cents to two digits', () => {
    expect(formatEurCents(1205)).toBe('€12.05');
    expect(formatEurCents(1250)).toBe('€12.50');
  });

  it('renders a leading minus for negative amounts (discounts)', () => {
    expect(formatEurCents(-300)).toBe('-€3.00');
    expect(formatEurCents(-5)).toBe('-€0.05');
  });
});
