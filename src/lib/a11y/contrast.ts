/**
 * WCAG 2.1 contrast helpers (pure).
 *
 * Used by a test to guard the theme's text/background token pairs against
 * regressions, and available to any code that needs to reason about contrast.
 * No React/native imports — safe to unit-test in isolation.
 */

/** WCAG AA minimum contrast ratios. */
export const AA_NORMAL = 4.5;
export const AA_LARGE = 3;

/** Parse a #RGB or #RRGGBB string into 0–255 channels. */
export function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.trim().replace(/^#/, '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Invalid hex colour: ${hex}`);
  }
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** sRGB channel (0–255) → linearised value, per WCAG. */
function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Relative luminance of a colour, per WCAG 2.1. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** Contrast ratio between two colours (1–21). Order-independent. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** True when the pair meets WCAG AA (4.5:1 normal text, 3:1 large text). */
export function meetsAA(a: string, b: string, large = false): boolean {
  // Round to 2dp so a value like 4.497 that displays as "4.50" is treated as a pass.
  const ratio = Math.round(contrastRatio(a, b) * 100) / 100;
  return ratio >= (large ? AA_LARGE : AA_NORMAL);
}
