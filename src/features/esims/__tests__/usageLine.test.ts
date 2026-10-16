import { usageLineState } from '../classify';

describe('usageLineState (the card usage line: loading / loaded / error)', () => {
  it('shows a skeleton while usage is in flight for an active eSIM with no usage yet', () => {
    expect(
      usageLineState({ status: 'active', hasUsage: false, inFlight: true, isError: false })
    ).toBe('loading');
  });

  it('shows loaded once usage has arrived', () => {
    expect(
      usageLineState({ status: 'active', hasUsage: true, inFlight: false, isError: false })
    ).toBe('loaded');
  });

  it('shows the error state after a failed usage load with no usage', () => {
    expect(
      usageLineState({ status: 'active', hasUsage: false, inFlight: false, isError: true })
    ).toBe('error');
  });

  it('prefers the skeleton over the error state while retrying', () => {
    expect(
      usageLineState({ status: 'active', hasUsage: false, inFlight: true, isError: true })
    ).toBe('loading');
  });

  it('is loaded (calm, no skeleton/error) when active with no usage and nothing in flight', () => {
    expect(
      usageLineState({ status: 'active', hasUsage: false, inFlight: false, isError: false })
    ).toBe('loaded');
  });

  it('never shows loading/error for statuses that carry their own text', () => {
    for (const status of ['notActivated', 'processing', 'refunded', 'failed', 'expired'] as const) {
      expect(
        usageLineState({ status, hasUsage: false, inFlight: true, isError: false })
      ).toBe('loaded');
      expect(
        usageLineState({ status, hasUsage: false, inFlight: false, isError: true })
      ).toBe('loaded');
    }
  });
});
