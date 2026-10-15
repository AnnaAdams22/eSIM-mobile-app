import { summarizeCheckoutError } from '../devDiagnostics';
import { ApiError } from '@/lib/api-error';

describe('summarizeCheckoutError', () => {
  it('summarises an ApiError from the create-sheet step with HTTP status + code', () => {
    const err = new ApiError(402, { error: 'card_declined', code: 'card_declined' });
    // message equals code here (ApiError defaults message to body.error) → not repeated.
    expect(summarizeCheckoutError('create-sheet', err)).toBe(
      'POST /api/me/payment-sheet · HTTP 402 · card_declined'
    );
  });

  it('keeps a distinct message alongside the code', () => {
    const err = new ApiError(500, { error: 'Internal error', code: 'server_error' });
    expect(summarizeCheckoutError('create-sheet', err)).toBe(
      'POST /api/me/payment-sheet · HTTP 500 · server_error · Internal error'
    );
  });

  it('summarises a Stripe init error with code + message', () => {
    const err = { code: 'Failed', message: 'No such payment_intent' };
    expect(summarizeCheckoutError('init', err)).toBe(
      'initPaymentSheet · Failed · No such payment_intent'
    );
  });

  it('summarises a Stripe present error (Canceled)', () => {
    const err = { code: 'Canceled', message: 'The payment flow has been canceled' };
    expect(summarizeCheckoutError('present', err)).toBe(
      'presentPaymentSheet · Canceled · The payment flow has been canceled'
    );
  });

  it('includes a numeric code', () => {
    expect(summarizeCheckoutError('init', { code: 409, message: 'conflict' })).toBe(
      'initPaymentSheet · 409 · conflict'
    );
  });

  it('degrades gracefully when there is no code', () => {
    expect(summarizeCheckoutError('init', { message: 'boom' })).toBe('initPaymentSheet · boom');
  });

  it('handles a bare string error', () => {
    expect(summarizeCheckoutError('present', 'network down')).toBe(
      'presentPaymentSheet · network down'
    );
  });

  it('falls back to just the step label for an empty/unknown error', () => {
    expect(summarizeCheckoutError('init', null)).toBe('initPaymentSheet');
    expect(summarizeCheckoutError('init', {})).toBe('initPaymentSheet');
  });

  it('never surfaces a client secret even if present on the error object', () => {
    const err = {
      code: 'Failed',
      message: 'bad intent',
      // These must NOT appear in the summary.
      paymentIntentClientSecret: 'pi_123_secret_SHOULDNOTLEAK',
      customerSessionClientSecret: 'cuss_secret_SHOULDNOTLEAK',
    };
    const out = summarizeCheckoutError('init', err);
    expect(out).toBe('initPaymentSheet · Failed · bad intent');
    expect(out).not.toContain('secret');
    expect(out).not.toContain('SHOULDNOTLEAK');
  });
});
