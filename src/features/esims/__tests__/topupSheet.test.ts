import { ApiError } from '@/lib/api-error';
import type { PaymentSheetResponse } from '@/lib/api-types';
import { requestTopupSheet } from '../topupSheet';

const SHEET: PaymentSheetResponse = {
  payment_intent_client_secret: 'pi_secret',
  payment_intent_id: 'pi_123',
  customer_id: 'cus_1',
  customer_session_client_secret: 'cs_secret',
  publishable_key: 'pk_test',
  list_price_cents: 1200,
  discount_cents: 0,
  amount_cents: 1200,
  currency: 'eur',
};

const replace409 = () =>
  new ApiError(409, {
    error: 'replace_confirmation_required',
    data_left_mb: 420,
    expires_at: '2026-05-01T00:00:00Z',
  });

describe('requestTopupSheet', () => {
  it('builds the sheet and always sends accept_replace:false', async () => {
    const createSheet = jest.fn().mockResolvedValue(SHEET);

    const result = await requestTopupSheet(
      { planId: 'plan_a', clientRequestId: 'id-1' },
      { createSheet }
    );

    expect(result).toEqual({ ok: true, sheet: SHEET });
    expect(createSheet).toHaveBeenCalledTimes(1);
    expect(createSheet).toHaveBeenCalledWith({
      plan_id: 'plan_a',
      client_request_id: 'id-1',
      promo_code: undefined,
      accept_replace: false,
    });
  });

  it('forwards a promo code', async () => {
    const createSheet = jest.fn().mockResolvedValue(SHEET);
    await requestTopupSheet(
      { planId: 'plan_a', promoCode: 'SAVE', clientRequestId: 'id-1' },
      { createSheet }
    );
    expect(createSheet).toHaveBeenCalledWith(
      expect.objectContaining({ promo_code: 'SAVE', accept_replace: false })
    );
  });

  it('on a 409 replace_confirmation_required returns cannot_add — never replaces, never retries', async () => {
    const createSheet = jest.fn().mockRejectedValueOnce(replace409());

    const result = await requestTopupSheet(
      { planId: 'plan_b', clientRequestId: 'id-1' },
      { createSheet }
    );

    expect(result).toEqual({ ok: false, reason: 'cannot_add' });
    expect(createSheet).toHaveBeenCalledTimes(1);
  });

  it('rethrows a non-replace error untouched', async () => {
    const boom = new ApiError(503, { error: 'plans are temporarily unavailable' });
    const createSheet = jest.fn().mockRejectedValueOnce(boom);

    await expect(
      requestTopupSheet({ planId: 'plan_b', clientRequestId: 'id-1' }, { createSheet })
    ).rejects.toBe(boom);
  });
});
