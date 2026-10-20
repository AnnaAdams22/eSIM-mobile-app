/**
 * HeroImage — the banner visual for the Home hero, destination detail hero, and
 * Explore region cards.
 *
 * COPYRIGHT-SAFE: when no licensed photo is registered for the `slot` (see
 * `src/features/catalog/images.ts`), it renders a tasteful warm brand gradient
 * instead of hotlinking a random photo. A translucent navy scrim is always laid
 * over the top so white overlay content stays legible on either a photo or a
 * gradient. Dropping a real photo into the registry swaps the background with no
 * change here.
 */

import type { ReactNode } from 'react';
import {
  View,
  type DimensionValue,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { heroImage, type HeroSlot } from '@/features/catalog';
import { useTheme, type RadiusToken } from '@/theme';

/** Warm, brand-compatible gradient pairs. Chosen to sit well beside ivory + navy. */
const GRADIENTS: [string, string][] = [
  ['#E8C9A0', '#C98A6B'], // sand → terracotta
  ['#D9B8C4', '#9B7CA8'], // dusty rose → mauve
  ['#BFD3C1', '#6FA69A'], // sage → teal
  ['#EBD6A6', '#D7A95C'], // golden → amber
  ['#CFC9E8', '#8E86C2'], // lavender → periwinkle
  ['#BFD0DE', '#6E8CA6'], // sky → slate blue
];

/** Deterministic gradient choice from a seed string (stable across renders). */
function gradientFor(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export interface HeroImageProps {
  /** Registry slot to look up a real photo; falls back to a gradient if none. */
  slot?: HeroSlot | string;
  /** A resolved photo source that wins over `slot` (e.g. a per-country photo). */
  source?: ImageSourcePropType | null;
  /** Seed for the placeholder gradient (e.g. a continent or country name). */
  seed?: string;
  height?: number;
  width?: DimensionValue;
  /** Corner radius — a theme token or an explicit number (0 for full-bleed). */
  radius?: RadiusToken | number;
  /** Strength of the bottom scrim (0–1). Higher = darker for better contrast. */
  scrim?: number;
  /** Overlay content (title, icon, flag …). Rendered above the scrim. */
  children?: ReactNode;
  /** Padding inside the hero around the overlay content. */
  contentPadding?: keyof ReturnType<typeof useTheme>['spacing'];
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function HeroImage({
  slot,
  source,
  seed = slot ?? 'hero',
  height = 160,
  width = '100%',
  radius = 'lg',
  scrim = 0.55,
  children,
  contentPadding = 'lg',
  style,
  accessibilityLabel,
}: HeroImageProps) {
  const theme = useTheme();
  const photo = source ?? (slot ? heroImage(slot) : null);
  const [from, to] = gradientFor(seed);
  const gradientId = `hero-${seed.replace(/[^a-zA-Z0-9]/g, '')}`;
  const borderRadius = typeof radius === 'number' ? radius : theme.radii[radius];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          height,
          width,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceMuted,
          justifyContent: 'flex-end',
        },
        style,
      ]}
    >
      {/* Background: a real photo if licensed, otherwise a brand gradient. */}
      {photo ? (
        <Image
          source={photo}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      ) : (
        <Svg
          width="100%"
          height="100%"
          style={{ position: 'absolute' }}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={from} />
              <Stop offset="1" stopColor={to} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
        </Svg>
      )}

      {/* Scrim: keeps white overlay text legible over photo or gradient. */}
      <Svg
        width="100%"
        height="100%"
        style={{ position: 'absolute' }}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id={`${gradientId}-scrim`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1C2430" stopOpacity={String(scrim * 0.35)} />
            <Stop offset="0.5" stopColor="#1C2430" stopOpacity="0" />
            <Stop offset="1" stopColor="#1C2430" stopOpacity={String(scrim)} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId}-scrim)`} />
      </Svg>

      {children ? <View style={{ padding: theme.spacing[contentPadding] }}>{children}</View> : null}
    </View>
  );
}
