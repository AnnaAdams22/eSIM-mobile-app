/**
 * Shadow tokens matching the reference's subtle card elevation.
 *
 * iOS uses `shadow*` props; Android uses `elevation`. Both are provided on each
 * token so cards look the same on both platforms. Shadows are intentionally soft
 * and low-contrast — the design is calm, not glossy.
 */

import type { ViewStyle } from 'react-native';

export type ShadowToken = 'none' | 'sm' | 'md' | 'lg';

type Shadow = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

const SHADOW_COLOR = '#1C2430'; // navy, tinted rather than pure black

export const shadows: Record<ShadowToken, Shadow> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // Chips / small raised elements.
  sm: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  // Default card elevation (country rows, info cards).
  md: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  // Prominent surfaces (sticky CTAs, modals).
  lg: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
};
