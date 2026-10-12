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
  it('returns the sheet on a clean first attempt and keeps the id', async () => {
    const createSheet = jest.fn().mockResolvedValue(SHEET);
    const confirmReplace = jest.fn();
    const newRequestId = jest.fn();

    const result = await requestTopupSheet(
      { planId: 'plan_a', clientRequestId: 'id-1', acceptReplace: false },
      { createSheet, confirmReplace, newRequestId }
    );

    expect(result).toEqual({ ok: true, sheet: SHEET, clientRequestId: 'id-1' });
    expect(createSheet).toHaveBeenCalledTimes(1);
    expect(createSheet).toHaveBeenCalledWith({
      plan_id: 'plan_a',
      client_request_id: 'id-1',
      promo_code: undefined,
      accept_replace: false,
    });
    expect(confirmReplace).not.toHaveBeenCalled();
    expect(newRequestId).not.toHaveBeenCalled();
  });

  it('on a 409 confirms, retries with accept_replace and a NEW id', async () => {
    const createSheet = jest
      .fn()
      .mockRejectedValueOnce(replace409())
      .mockResolvedValueOnce(SHEET);
    const confirmReplace = jest.fn().mockResolvedValue(true);
    const newRequestId = jest.fn().mockReturnValue('id-2');

    const result = await requestTopupSheet(
      { planId: 'plan_b', promoCode: 'SAVE', clientRequestId: 'id-1', acceptReplace: false },
      { createSheet, confirmReplace, newRequestId }
    );

    expect(confirmReplace).toHaveBeenCalledWith({
      dataLeftMb: 420,
      expiresAt: '2026-05-01T00:00:00Z',
    });
    expect(createSheet).toHaveBeenCalledTimes(2);
    // Retry uses the fresh id and forces accept_replace true.
    expect(createSheet).toHaveBeenLastCalledWith({
      plan_id: 'plan_b',
      client_request_id: 'id-2',
      promo_code: 'SAVE',
      accept_replace: true,
    });
    expect(result).toEqual({ ok: true, sheet: SHEET, clientRequestId: 'id-2' });
  });

  it('on a 409 the user can cancel — no retry, no charge', async () => {
    const createSheet = jest.fn().mockRejectedValueOnce(replace409());
    const confirmReplace = jest.fn().mockResolvedValue(false);
    const newRequestId = jest.fn();

    const result = await requestTopupSheet(
      { planId: 'plan_b', clientRequestId: 'id-1', acceptReplace: false },
      { createSheet, confirmReplace, newRequestId }
    );

    expect(result).toEqual({ ok: false, reason: 'cancelled' });
    expect(createSheet).toHaveBeenCalledTimes(1);
    expect(newRequestId).not.toHaveBeenCalled();
  });

  it('rethrows a non-replace error untouched', async () => {
    const boom = new ApiError(503, { error: 'plans are temporarily unavailable' });
    const createSheet = jest.fn().mockRejectedValueOnce(boom);
    const confirmReplace = jest.fn();

    await expect(
      requestTopupSheet(
        { planId: 'plan_b', clientRequestId: 'id-1', acceptReplace: false },
        { createSheet, confirmReplace, newRequestId: jest.fn() }
      )
    ).rejects.toBe(boom);
    expect(confirmReplace).not.toHaveBeenCalled();
  });

  it('passes a pre-accepted replace straight through', async () => {
    const createSheet = jest.fn().mockResolvedValue(SHEET);
    await requestTopupSheet(
      { planId: 'plan_b', clientRequestId: 'id-1', acceptReplace: true },
      { createSheet, confirmReplace: jest.fn(), newRequestId: jest.fn() }
    );
    expect(createSheet).toHaveBeenCalledWith(
      expect.objectContaining({ accept_replace: true, client_request_id: 'id-1' })
    );
  });
});
