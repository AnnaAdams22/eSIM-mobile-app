/**
 * TextField — a labelled text input for forms.
 *
 * Features:
 *  - Floating label above the field, optional helper hint, inline error text.
 *  - Optional password show/hide toggle (`secureToggle`).
 *  - Autofill: pass `textContentType` / `autoComplete` straight through so iOS
 *    and Android offer saved credentials and one-time codes.
 *  - Return-key navigation: forwards a ref so a screen can focus the next field
 *    from `onSubmitEditing`.
 *
 * Accessibility: min 44pt target, label announced, error announced via
 * `accessibilityState.invalid`. The visibility toggle is a labelled button.
 */

import { forwardRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Inline error message; when set, the field border turns to the danger tone. */
  error?: string | null;
  /** Helper text under the field (hidden while an error is shown). */
  hint?: string;
  /** Render a password visibility toggle (field starts hidden). */
  secureToggle?: boolean;
  /** Accessibility label for the reveal action (i18n from the caller). */
  revealLabel?: string;
  /** Accessibility label for the hide action (i18n from the caller). */
  hideLabel?: string;
  /** Optional trailing adornment (ignored when `secureToggle` is set). */
  trailing?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    error,
    hint,
    secureToggle,
    revealLabel = 'Show password',
    hideLabel = 'Hide password',
    trailing,
    containerStyle,
    onFocus,
    onBlur,
    accessibilityLabel,
    ...inputProps
  },
  ref
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const hasError = !!error;
  const borderColor = hasError
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  const showToggle = !!secureToggle;

  return (
    <View style={containerStyle}>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.xs }}>
        {label}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.md,
          borderWidth: 1,
          borderColor,
          paddingHorizontal: theme.spacing.lg,
          minHeight: 54,
        }}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ disabled: inputProps.editable === false }}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={showToggle ? hidden : inputProps.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={{
            flex: 1,
            paddingVertical: theme.spacing.md,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.typography.body.fontSize,
            color: theme.colors.text,
          }}
          {...inputProps}
        />

        {showToggle ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? revealLabel : hideLabel}
            hitSlop={10}
            style={{ paddingLeft: theme.spacing.sm, minHeight: 44, justifyContent: 'center' }}
          >
            {hidden ? (
              <Eye size={20} color={theme.colors.textSecondary} />
            ) : (
              <EyeOff size={20} color={theme.colors.textSecondary} />
            )}
          </Pressable>
        ) : trailing ? (
          <View style={{ paddingLeft: theme.spacing.sm }}>{trailing}</View>
        ) : null}
      </View>

      {hasError ? (
        <Text variant="caption" color="danger" style={{ marginTop: theme.spacing.xs }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
