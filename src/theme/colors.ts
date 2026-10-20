/**
 * Colour tokens, extracted from design/reference.png.
 *
 * The brand look is calm and premium: a warm ivory ground (never pure white),
 * white cards, and a single deep navy-charcoal as the one bold element per
 * screen (primary buttons, the active tab, headings).
 *
 * Light mode only for now, but the palette is namespaced so a `dark` theme can
 * be added later without touching component code (see theme/index.ts).
 */

export const palette = {
  // Neutrals
  ivory: '#F4F1EC', // app background (warm ivory)
  white: '#FFFFFF', // cards / surfaces
  stone100: '#EDE9E3', // search bars, segmented controls, chips (muted surface)
  stone200: '#E5E0D8', // borders / hairlines
  navy900: '#1C2430', // primary (deep navy-charcoal)
  // Secondary text. Darkened from #8A8580 to meet WCAG AA (4.5:1) on ivory,
  // white AND the muted surface (was 3.0–3.6:1 — failing); still a calm warm grey.
  grey500: '#6B6660',

  // Status — success ("Active" badge)
  green600: '#3BA776', // fill / icon tint (graphical; ≥3:1 on white)
  green700: '#237049', // success TEXT on the soft tint / white (≥4.5:1)
  green50: '#E3F3EA',

  // Status — discount / danger (the "-50% OFF" badge, destructive actions)
  red600: '#C8475A', // fill / icon tint, and danger text on white (4.66:1)
  red700: '#A83346', // discount TEXT on the soft tint (≥4.5:1)
  red50: '#F8E1E4',

  // Accent — install-guide step circles
  violet600: '#6B5BA8',
  violet50: '#E9E4F5',
} as const;

export const lightColors = {
  background: palette.ivory,
  surface: palette.white,
  surfaceMuted: palette.stone100,

  primary: palette.navy900,
  onPrimary: palette.white,

  text: palette.navy900,
  textSecondary: palette.grey500,

  border: palette.stone200,

  success: palette.green600,
  successText: palette.green700,
  successSoft: palette.green50,

  discount: palette.red600,
  discountText: palette.red700,
  discountSoft: palette.red50,

  accent: palette.violet600,
  accentSoft: palette.violet50,

  danger: palette.red600,

  /** Translucent overlay for scrims / pressed states. */
  overlay: 'rgba(28, 36, 48, 0.5)',
} as const;

export type ColorTokens = typeof lightColors;
export type ColorName = keyof ColorTokens;
