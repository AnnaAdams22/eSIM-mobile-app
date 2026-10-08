/**
 * PressableScale — a Pressable that gives tactile press feedback: the content
 * springs down slightly on touch and back on release. Built on React Native's
 * Animated API (native driver), so it works in Expo Go with no extra native deps.
 *
 * Respects reduced-motion: when the user prefers reduced motion the scale is
 * skipped and a subtle opacity dim is used instead. An optional light haptic can
 * fire on press for primary/selection actions.
 */

import { useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { lightTap } from '@/lib/haptics';

export interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode;
  /** Scale applied while pressed. Default 0.97 (subtle). */
  scaleTo?: number;
  /** Fire a light haptic on press-in. Default false. */
  haptic?: boolean;
  /** Style for the animated visual container. */
  style?: StyleProp<ViewStyle>;
}

export function PressableScale({
  children,
  scaleTo = 0.97,
  haptic = false,
  onPressIn,
  onPressOut,
  style,
  disabled,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const [opacity] = useState(() => new Animated.Value(1));

  const spring = (toScale: number, toOpacity: number) => {
    Animated.spring(scale, { toValue: toScale, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
    Animated.timing(opacity, { toValue: toOpacity, duration: 90, useNativeDriver: true }).start();
  };

  const handlePressIn = (e: GestureResponderEvent) => {
    if (!disabled) {
      if (haptic) lightTap();
      spring(reduceMotion ? 1 : scaleTo, reduceMotion ? 0.7 : 1);
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    spring(1, 1);
    onPressOut?.(e);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled} {...rest}>
      <Animated.View style={[{ transform: [{ scale }], opacity }, style]}>{children}</Animated.View>
    </Pressable>
  );
}
