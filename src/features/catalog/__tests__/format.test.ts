import { formatData, formatDays, formatPlanLabel, dataAmountGb } from '../format';
import { makePlan, fakeT } from './fixtures';

describe('formatData', () => {
  it('returns the value verbatim for normal data', () => {
    expect(formatData('3 GB', fakeT)).toBe('3 GB');
    expect(formatData('0.49 GB', fakeT)).toBe('0.49 GB');
  });

  it('localises Unlimited (any case)', () => {
    expect(formatData('Unlimited', fakeT)).toBe('Unlimited');
    expect(formatData('UNLIMITED data', fakeT)).toBe('Unlimited');
  });

  it('falls back for null/empty data', () => {
    expect(formatData(null, fakeT)).toBe('Data');
    expect(formatData('   ', fakeT)).toBe('Data');
  });
});

describe('formatDays', () => {
  it('uses singular for 1 day and plural otherwise', () => {
    expect(formatDays(1, fakeT)).toBe('1 day');
    expect(formatDays(7, fakeT)).toBe('7 days');
    expect(formatDays(30, fakeT)).toBe('30 days');
  });

  it('falls back for unknown/invalid day counts', () => {
    expect(formatDays(null, fakeT)).toBe('Flexible');
    expect(formatDays(0, fakeT)).toBe('Flexible');
  });
});

describe('formatPlanLabel', () => {
  it('never shows the raw vendor name, only "{data} · {days}"', () => {
    const label = formatPlanLabel(makePlan({ data: '3 GB', days: 7 }), fakeT);
    expect(label).toBe('3 GB · 7 days');
    expect(label).not.toContain('_2025');
  });

  it('handles the singular day case', () => {
    expect(formatPlanLabel(makePlan({ data: '0.49 GB', days: 1 }), fakeT)).toBe('0.49 GB · 1 day');
  });

  it('handles unlimited data gracefully', () => {
    expect(formatPlanLabel(makePlan({ data: 'Unlimited', days: 30 }), fakeT)).toBe(
      'Unlimited · 30 days'
    );
  });
});

describe('dataAmountGb (sorting only)', () => {
  it('parses GB values', () => {
    expect(dataAmountGb('3 GB')).toBe(3);
    expect(dataAmountGb('0.49 GB')).toBeCloseTo(0.49);
  });

  it('normalises MB and TB to GB', () => {
    expect(dataAmountGb('500 MB')).toBeCloseTo(500 / 1024);
    expect(dataAmountGb('1 TB')).toBe(1024);
  });

  it('sorts Unlimited highest and junk lowest', () => {
    expect(dataAmountGb('Unlimited')).toBe(Number.POSITIVE_INFINITY);
    expect(dataAmountGb(null)).toBe(-1);
    expect(dataAmountGb('n/a')).toBe(-1);
  });
});
