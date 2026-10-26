/**
 * Logo — renders the brand asset at a given size and variant.
 *
 * Variants:
 *  - full:     symbol + "ESIM GLOBAL" wordmark (Home header)
 *  - symbol:   the interlocking-e mark only (splash, icon, compact spots)
 *  - wordmark: the "ESIM GLOBAL" wordmark only
 *
 * The logo keeps its own colour (black) and is never recoloured. `size` sets the
 * HEIGHT; width follows the asset's intrinsic aspect ratio.
 *
 * Assets are the official client logo (high-res transparent PNG derived from
 * design/logo-hires.png). See assets/brand/README. Files are named so they can
 * be swapped (e.g. for a future SVG) without code changes.
 */

import { Image } from 'expo-image';

import { useTranslation } from 'react-i18next';

export type LogoVariant = 'full' | 'symbol' | 'wordmark';

// Intrinsic pixel dimensions of the cropped assets (width / height).
const ASPECT: Record<LogoVariant, number> = {
  full: 1802 / 1187,
  symbol: 1368 / 851,
  wordmark: 1802 / 194,
};

const SOURCE: Record<LogoVariant, number> = {
  full: require('../../../assets/brand/esim-logo-full.png'),
  symbol: require('../../../assets/brand/esim-logo-symbol.png'),
  wordmark: require('../../../assets/brand/esim-logo-wordmark.png'),
};

export interface LogoProps {
  variant?: LogoVariant;
  /** Height in points. Width is derived from the asset aspect ratio. */
  size?: number;
}

export function Logo({ variant = 'full', size = 32 }: LogoProps) {
  const { t } = useTranslation();
  const width = size * ASPECT[variant];

  return (
    <Image
      source={SOURCE[variant]}
      style={{ width, height: size }}
      contentFit="contain"
      accessibilityRole="image"
      accessibilityLabel={t('common.appName')}
      transition={0}
    />
  );
}
