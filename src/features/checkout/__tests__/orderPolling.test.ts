import { POLL_TIMEOUT_MS, isTerminal, pollPhase } from '../orderPolling';

describe('pollPhase', () => {
  it('treats a 404 (null status) as still processing', () => {
    expect(pollPhase({ status: null }, 0)).toBe('processing');
    expect(pollPhase({ status: null }, 10_000)).toBe('processing');
  });

  it('stays processing for in-flight statuses before the timeout', () => {
    expect(pollPhase({ status: 'paid' }, 0)).toBe('processing');
    expect(pollPhase({ status: 'provisioning' }, 5_000)).toBe('processing');
  });

  it('resolves to success on provisioned/delivered', () => {
    expect(pollPhase({ status: 'provisioned' }, 2_000)).toBe('success');
    expect(pollPhase({ status: 'delivered' }, 2_000)).toBe('success');
    expect(pollPhase({ status: 'DELIVERED' }, 2_000)).toBe('success'); // case-insensitive
  });

  it('resolves to failed on failed/refunded status', () => {
    expect(pollPhase({ status: 'failed' }, 2_000)).toBe('failed');
    expect(pollPhase({ status: 'refunded' }, 2_000)).toBe('failed');
  });

  it('resolves to failed when the support state indicates a refund', () => {
    expect(pollPhase({ status: 'paid', supportState: 'refunded' }, 1_000)).toBe('failed');
    expect(pollPhase({ status: 'paid', supportState: 'refund_pending' }, 1_000)).toBe('failed');
  });

  it('times out when still processing past the limit', () => {
    expect(pollPhase({ status: 'provisioning' }, POLL_TIMEOUT_MS)).toBe('timeout');
    expect(pollPhase({ status: null }, POLL_TIMEOUT_MS + 1)).toBe('timeout');
  });

  it('prefers a terminal success/failure over a timeout', () => {
    expect(pollPhase({ status: 'delivered' }, POLL_TIMEOUT_MS + 5_000)).toBe('success');
    expect(pollPhase({ status: 'failed' }, POLL_TIMEOUT_MS + 5_000)).toBe('failed');
  });
});

describe('isTerminal', () => {
  it('is true for every phase except processing', () => {
    expect(isTerminal('processing')).toBe(false);
    expect(isTerminal('success')).toBe(true);
    expect(isTerminal('failed')).toBe(true);
    expect(isTerminal('timeout')).toBe(true);
  });
});
