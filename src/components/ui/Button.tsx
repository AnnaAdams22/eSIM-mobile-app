/**
 * Button — the primary action control.
 *
 * Variants:
 *  - primary:   filled navy pill, white label (the one bold element per screen)
 *  - secondary: white surface, navy label, hairline border
 *  - ghost:     transparent, navy label (low-emphasis / inline actions)
 *
 * States: loading (spinner, disabled) and disabled (dimmed, non-interactive).
 * Accessibility: role="button", min 44pt height, label/state announced.
 */

import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Optional leading element (e.g. an icon). */
  icon?: ReactNode;
  /** Stretch to fill the parent width. Default true. */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
  accessibilityHint,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const height = size === 'lg' ? 54 : theme.layout.minTouchTarget;

  const bg: Record<ButtonVariant, string> = {
    primary: theme.colors.primary,
    secondary: theme.colors.surface,
    ghost: 'transparent',
  };
  const fg: Record<ButtonVariant, 'onPrimary' | 'text' | 'primary'> = {
    primary: 'onPrimary',
    secondary: 'text',
    ghost: 'primary',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={6}
      style={({ pressed }) => [
        {
          minHeight: height,
          paddingHorizontal: theme.spacing.xl,
          borderRadius: theme.radii.pill,
          backgroundColor: bg[variant],
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: theme.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1,
          gap: theme.spacing.sm,
        },
        variant === 'primary' && !isDisabled ? theme.shadows.sm : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors[fg[variant]]} />
      ) : (
        <>
          {icon ? <View accessible={false}>{icon}</View> : null}
          <Text variant="button" color={fg[variant]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
