import { sanitizeDigits, codeCells, activeCellIndex, isCodeComplete } from '../codeInput';

describe('sanitizeDigits', () => {
  it('keeps only digits', () => {
    expect(sanitizeDigits('a1b2c3')).toBe('123');
  });
  it('strips spaces and dashes from a pasted code', () => {
    expect(sanitizeDigits('123 456')).toBe('123456');
    expect(sanitizeDigits('123-456')).toBe('123456');
  });
  it('clamps to the code length', () => {
    expect(sanitizeDigits('1234567890', 6)).toBe('123456');
  });
  it('returns empty for no digits', () => {
    expect(sanitizeDigits('abc')).toBe('');
  });
});

describe('codeCells', () => {
  it('splits into fixed-length cells padded with empty strings', () => {
    expect(codeCells('123', 6)).toEqual(['1', '2', '3', '', '', '']);
  });
  it('fills all cells when complete', () => {
    expect(codeCells('123456', 6)).toEqual(['1', '2', '3', '4', '5', '6']);
  });
});

describe('activeCellIndex', () => {
  it('points at the first empty cell', () => {
    expect(activeCellIndex('', 6)).toBe(0);
    expect(activeCellIndex('123', 6)).toBe(3);
  });
  it('clamps to the last cell when full', () => {
    expect(activeCellIndex('123456', 6)).toBe(5);
  });
});

describe('isCodeComplete', () => {
  it('is true only at full length', () => {
    expect(isCodeComplete('123456', 6)).toBe(true);
    expect(isCodeComplete('12345', 6)).toBe(false);
    expect(isCodeComplete('12 34 56', 6)).toBe(true);
  });
});
