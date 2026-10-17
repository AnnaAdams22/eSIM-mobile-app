import { USAGE_MIN_REFRESH_AGE_MS, shouldRefetchUsage } from '../refresh';

describe('shouldRefetchUsage', () => {
  const now = 1_000_000;

  it('refetches when the cached data is older than the min age', () => {
    expect(shouldRefetchUsage(now - (USAGE_MIN_REFRESH_AGE_MS + 1), now)).toBe(true);
  });

  it('does not refetch when the cached data is younger than the min age', () => {
    expect(shouldRefetchUsage(now - (USAGE_MIN_REFRESH_AGE_MS - 1), now)).toBe(false);
  });

  it('refetches when nothing has ever loaded (updatedAt 0)', () => {
    expect(shouldRefetchUsage(0, now)).toBe(true);
  });

  it('honours a custom minimum age', () => {
    expect(shouldRefetchUsage(now - 5_000, now, 10_000)).toBe(false);
    expect(shouldRefetchUsage(now - 15_000, now, 10_000)).toBe(true);
  });
});
