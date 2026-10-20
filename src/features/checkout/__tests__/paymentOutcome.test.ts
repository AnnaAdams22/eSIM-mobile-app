import { decidePaymentOutcome } from '../paymentOutcome';
import { ApiError, TimeoutError } from '../../../lib/api-error';

describe('decidePaymentOutcome', () => {
  it('polls when the sheet was presented, we have an intent, and the error is connectivity', () => {
    expect(
      decidePaymentOutcome({
        step: 'present',
        error: new TimeoutError(),
        hasPaymentIntentId: true,
      })
    ).toBe('poll');
    expect(
      decidePaymentOutcome({
        step: 'present',
        error: new TypeError('Network request failed'),
        hasPaymentIntentId: true,
      })
    ).toBe('poll');
  });

  it('shows the error (never polls) when we have no intent id yet', () => {
    expect(
      decidePaymentOutcome({
        step: 'present',
        error: new TimeoutError(),
        hasPaymentIntentId: false,
      })
    ).toBe('show-error');
  });

  it('shows the error for connectivity drops before the sheet was presented', () => {
    for (const step of ['create-sheet', 'init'] as const) {
      expect(
        decidePaymentOutcome({ step, error: new TimeoutError(), hasPaymentIntentId: true })
      ).toBe('show-error');
    }
  });

  it('shows the error for a definite non-connectivity failure at present (e.g. declined)', () => {
    expect(
      decidePaymentOutcome({
        step: 'present',
        error: { code: 'Failed', message: 'Your card was declined.' },
        hasPaymentIntentId: true,
      })
    ).toBe('show-error');
  });

  it('a reached-server ApiError at present is not connectivity → show error', () => {
    expect(
      decidePaymentOutcome({
        step: 'present',
        error: new ApiError(402, { error: 'payment_failed' }),
        hasPaymentIntentId: true,
      })
    ).toBe('show-error');
  });
});
