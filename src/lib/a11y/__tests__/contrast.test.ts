import { contrastRatio, meetsAA, parseHex, relativeLuminance } from '../contrast';
import { lightColors } from '@/theme/colors';

describe('contrast math', () => {
  it('parses shorthand and full hex', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex('#1C2430')).toEqual({ r: 28, g: 36, b: 48 });
  });

  it('rejects invalid hex', () => {
    expect(() => parseHex('nope')).toThrow();
    expect(() => parseHex('#12')).toThrow();
  });

  it('black on white is 21:1 and is symmetric', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
  });

  it('identical colours are 1:1', () => {
    expect(contrastRatio('#8A8580', '#8A8580')).toBeCloseTo(1, 5);
  });

  it('luminance increases with lightness', () => {
    expect(relativeLuminance('#FFFFFF')).toBeGreaterThan(relativeLuminance('#1C2430'));
  });

  it('meetsAA respects the large-text threshold', () => {
    // ~3.6:1 — fails normal, passes large.
    expect(meetsAA('#8A8580', '#FFFFFF', false)).toBe(false);
    expect(meetsAA('#767169', '#FFFFFF', true)).toBe(true);
  });
});

/**
 * Regression guard: every text/background token pairing the app actually uses
 * must meet WCAG AA. If someone lightens a token back below the threshold, this
 * fails with the offending ratio.
 */
describe('theme token contrast (WCAG AA)', () => {
  const c = lightColors;

  const normalTextPairs: [string, string, string][] = [
    ['text on background', c.text, c.background],
    ['text on surface', c.text, c.surface],
    ['text on surfaceMuted', c.text, c.surfaceMuted],
    ['textSecondary on background', c.textSecondary, c.background],
    ['textSecondary on surface', c.textSecondary, c.surface],
    ['textSecondary on surfaceMuted', c.textSecondary, c.surfaceMuted],
    ['onPrimary on primary', c.onPrimary, c.primary],
    ['successText on successSoft', c.successText, c.successSoft],
    ['successText on surface', c.successText, c.surface],
    ['discountText on discountSoft', c.discountText, c.discountSoft],
    ['discountText on surface', c.discountText, c.surface],
    ['accent on accentSoft', c.accent, c.accentSoft],
  ];

  it.each(normalTextPairs)('%s meets AA for normal text', (_label, fg, bg) => {
    const ratio = contrastRatio(fg, bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
