/**
 * Spacing, radii and layout tokens.
 *
 * Spacing is a 4-based scale. The reference uses generous, calm spacing — most
 * screen gutters are `lg` (20) and cards breathe with `md`–`lg` internal padding.
 */

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Corner radii. `pill` is effectively fully rounded. */
export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radii;

/** Screen gutter and the smallest accessible touch target. */
export const layout = {
  screenPadding: spacing.xl, // 20
  minTouchTarget: 44, // iOS HIG / WCAG minimum
} as const;
