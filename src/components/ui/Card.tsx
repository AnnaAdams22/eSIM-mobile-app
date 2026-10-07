/**
 * Card — a white rounded surface with the standard soft shadow. The default
 * container for grouped content (rows, info blocks). Optionally pressable.
 */

import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type RadiusToken, type ShadowToken, type SpacingToken } from '@/theme';

export interface CardProps {
  children: ReactNode;
  padding?: SpacingToken;
  radius?: RadiusToken;
  shadow?: ShadowToken;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Card({
  children,
  padding = 'lg',
  radius = 'lg',
  shadow = 'md',
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const theme = useTheme();

  const base: StyleProp<ViewStyle> = [
    {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii[radius],
      padding: theme.spacing[padding],
    },
    theme.shadows[shadow],
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [base, { opacity: pressed ? 0.9 : 1 }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={base}>{children}</View>;
}
