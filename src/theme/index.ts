/**
 * Theme tokens and the `useTheme()` hook.
 *
 * Light mode only for now. The structure (a `Theme` object selected by scheme)
 * is ready for a dark theme: add a `darkColors` set and a `dark` Theme, then
 * have `useTheme()` pick based on the system scheme.
 */

import { lightColors, palette, type ColorTokens } from './colors';
import { radii, spacing, layout } from './spacing';
import { shadows } from './shadows';
import { typography, fontFamily } from './typography';

export interface Theme {
  dark: boolean;
  colors: ColorTokens;
  palette: typeof palette;
  spacing: typeof spacing;
  radii: typeof radii;
  layout: typeof layout;
  shadows: typeof shadows;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
}

export const lightTheme: Theme = {
  dark: false,
  colors: lightColors,
  palette,
  spacing,
  radii,
  layout,
  shadows,
  typography,
  fontFamily,
};

/**
 * Returns the active theme. Light mode only today; kept as a hook so screens
 * never import tokens directly and dark mode can be switched on in one place.
 */
export function useTheme(): Theme {
  return lightTheme;
}

export { lightColors, palette } from './colors';
export { spacing, radii, layout } from './spacing';
export { shadows } from './shadows';
export { typography, fontFamily } from './typography';
export type { ColorTokens, ColorName } from './colors';
export type { TextVariant, TypeStyle } from './typography';
export type { SpacingToken, RadiusToken } from './spacing';
export type { ShadowToken } from './shadows';
