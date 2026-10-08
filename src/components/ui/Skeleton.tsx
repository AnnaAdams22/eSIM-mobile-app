/**
 * Skeleton — a loading placeholder block with a gentle shimmer sweep. Compose
 * several to mirror the shape of the content that is loading.
 *
 * A soft highlight travels left→right across the muted surface (via react-native-svg
 * + the Animated native driver). Respects reduced-motion: the sweep is disabled and
 * the block simply sits at a steady, slightly dimmed opacity.
 */

import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme, type RadiusToken } from '@/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: RadiusToken;
  style?: StyleProp<ViewStyle>;
}

// Stable, collision-free gradient ids without Math.random (unavailable in some envs).
let shimmerId = 0;

export function Skeleton({ width = '100%', height = 16, radius = 'sm', style }: SkeletonProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [progress] = useState(() => new Animated.Value(-1));
  const [gradientId] = useState(() => `sk-${shimmerId++}`);

  useEffect(() => {
    if (reduceMotion || measuredWidth === 0) return;
    progress.setValue(-1);
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [progress, reduceMotion, measuredWidth]);

  const translateX = progress.interpolate({
    inputRange: [-1, 1],
    outputRange: [-measuredWidth, measuredWidth],
  });

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setMeasuredWidth(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: theme.radii[radius],
          backgroundColor: theme.colors.surfaceMuted,
          overflow: 'hidden',
          opacity: reduceMotion ? 0.7 : 1,
        },
        style,
      ]}
    >
      {!reduceMotion && measuredWidth > 0 ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
          pointerEvents="none"
        >
          <Svg width={measuredWidth} height="100%">
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.5" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={measuredWidth} height="100%" fill={`url(#${gradientId})`} />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}
