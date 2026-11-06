import { applePaySheetOption } from '../applePay';

describe('applePaySheetOption', () => {
  it('returns undefined when Apple Pay is disabled (no broken button ships)', () => {
    expect(applePaySheetOption(false)).toBeUndefined();
  });

  it('returns the merchant country option when enabled', () => {
    expect(applePaySheetOption(true)).toEqual({ merchantCountryCode: 'US' });
  });

  it('honours a custom merchant country code', () => {
    expect(applePaySheetOption(true, 'GB')).toEqual({ merchantCountryCode: 'GB' });
  });
});
