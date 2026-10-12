import { ApiError } from '@/lib/api-error';
import { needsReplaceConfirm, replaceConfirmationInfo } from '../replace';

describe('needsReplaceConfirm', () => {
  it('never confirms an accumulate (same-plan) option', () => {
    expect(needsReplaceConfirm({ replacesCurrent: false, dataLeftMb: 500, isExpired: false })).toBe(
      false
    );
  });

  it('confirms a replace when the live plan still has data', () => {
    expect(needsReplaceConfirm({ replacesCurrent: true, dataLeftMb: 500, isExpired: false })).toBe(
      true
    );
  });

  it('does not confirm when the plan is expired', () => {
    expect(needsReplaceConfirm({ replacesCurrent: true, dataLeftMb: 500, isExpired: true })).toBe(
      false
    );
  });

  it('does not confirm when there is no data left', () => {
    expect(needsReplaceConfirm({ replacesCurrent: true, dataLeftMb: 0, isExpired: false })).toBe(
      false
    );
  });

  it('assumes there is data (confirms) when the balance is unknown', () => {
    expect(
      needsReplaceConfirm({ replacesCurrent: true, dataLeftMb: null, isExpired: false })
    ).toBe(true);
    expect(
      needsReplaceConfirm({ replacesCurrent: true, dataLeftMb: undefined, isExpired: null })
    ).toBe(true);
  });
});

describe('replaceConfirmationInfo', () => {
  it('extracts the numbers from a 409 replace_confirmation_required', () => {
    const err = new ApiError(409, {
      error: 'replace_confirmation_required',
      data_left_mb: 420,
      expires_at: '2026-05-01T00:00:00Z',
    });
    expect(replaceConfirmationInfo(err)).toEqual({
      dataLeftMb: 420,
      expiresAt: '2026-05-01T00:00:00Z',
    });
  });

  it('defaults missing fields to null', () => {
    const err = new ApiError(409, { error: 'replace_confirmation_required' });
    expect(replaceConfirmationInfo(err)).toEqual({ dataLeftMb: null, expiresAt: null });
  });

  it('returns null for other errors', () => {
    expect(replaceConfirmationInfo(new ApiError(409, { error: 'something_else' }))).toBeNull();
    expect(replaceConfirmationInfo(new ApiError(400, { error: 'replace_confirmation_required' }))).toBeNull();
    expect(replaceConfirmationInfo(new Error('network'))).toBeNull();
    expect(replaceConfirmationInfo(null)).toBeNull();
  });
});
