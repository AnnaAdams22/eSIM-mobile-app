import { backgroundAdjustedStart } from '../pollClock';

describe('backgroundAdjustedStart', () => {
  it('shifts the baseline forward by the backgrounded duration', () => {
    // started at t=1000, backgrounded t=5000, resumed t=20000 → 15s in background.
    expect(backgroundAdjustedStart(1000, 5000, 20000)).toBe(16000);
  });

  it('excludes background time from elapsed', () => {
    const started = 0;
    const backgrounded = 10_000; // 10s of real polling happened
    const resumed = 70_000; // 60s in background
    const newStart = backgroundAdjustedStart(started, backgrounded, resumed);
    // Elapsed right after resume should still be ~10s, not 70s (no false timeout).
    expect(resumed - newStart).toBe(10_000);
  });

  it('never moves the baseline backwards on out-of-order timestamps', () => {
    expect(backgroundAdjustedStart(1000, 9000, 5000)).toBe(1000);
  });
});
