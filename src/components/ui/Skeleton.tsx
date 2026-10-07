/**
 * Skeleton — a loading placeholder block with a gentle pulse. Compose several to
 * mirror the shape of the content that is loading.
 *
 * Respects reduced-motion: the pulse is disabled when the user prefers it.
 */

import { useEffect, useState } from 'react';
import { Animated, Easing, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme, type RadiusToken } from '@/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: RadiusToken;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, radius = 'sm', style }: SkeletonProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  // Lazy state init gives a stable Animated.Value without reading a ref in render.
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.7);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: theme.radii[radius],
          backgroundColor: theme.colors.surfaceMuted,
          opacity,
        },
        style,
      ]}
    />
  );
}
