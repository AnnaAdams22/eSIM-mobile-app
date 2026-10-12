import { formatDataSize, usedFraction } from '../format';

describe('formatDataSize', () => {
  it('shows whole megabytes under 1 GB', () => {
    expect(formatDataSize(0)).toBe('0 MB');
    expect(formatDataSize(620)).toBe('620 MB');
    expect(formatDataSize(1023)).toBe('1023 MB');
  });

  it('shows gigabytes at and above 1024 MB, trimming a trailing .0', () => {
    expect(formatDataSize(1024)).toBe('1 GB');
    expect(formatDataSize(1536)).toBe('1.5 GB');
    expect(formatDataSize(5120)).toBe('5 GB');
  });

  it('rounds gigabytes to a single decimal', () => {
    expect(formatDataSize(1100)).toBe('1.1 GB');
    expect(formatDataSize(1126)).toBe('1.1 GB');
  });

  it('clamps negatives to zero and returns null for unknowns', () => {
    expect(formatDataSize(-50)).toBe('0 MB');
    expect(formatDataSize(null)).toBeNull();
    expect(formatDataSize(undefined)).toBeNull();
    expect(formatDataSize(Number.NaN)).toBeNull();
  });
});

describe('usedFraction', () => {
  it('prefers explicit used over total/left', () => {
    expect(usedFraction({ data_used_mb: 620, data_total_mb: 1024 })).toBeCloseTo(620 / 1024);
  });

  it('derives used from total minus left when used is absent', () => {
    expect(usedFraction({ data_left_mb: 404, data_total_mb: 1024 })).toBeCloseTo(620 / 1024);
  });

  it('clamps to [0, 1]', () => {
    expect(usedFraction({ data_used_mb: 2000, data_total_mb: 1024 })).toBe(1);
    expect(usedFraction({ data_used_mb: -10, data_total_mb: 1024 })).toBe(0);
  });

  it('returns null when there is no usable total', () => {
    expect(usedFraction({ data_used_mb: 100, data_total_mb: null })).toBeNull();
    expect(usedFraction({ data_used_mb: 100, data_total_mb: 0 })).toBeNull();
    expect(usedFraction({ data_total_mb: 1024 })).toBeNull(); // neither used nor left
  });
});
