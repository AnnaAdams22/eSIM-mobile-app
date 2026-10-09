/**
 * CodeInput — a 6-box numeric verification-code input.
 *
 * Implementation: a single transparent, full-width TextInput sits ON TOP of the
 * visible boxes. That one real input gives us, for free:
 *  - OS one-time-code autofill (iOS `oneTimeCode`, Android `sms-otp`),
 *  - native paste of a whole code,
 *  - a single caret and sane keyboard handling.
 * The boxes below are purely presentational, derived from the input value.
 *
 * All digit handling (stripping non-digits, clamping, splitting into cells)
 * lives in the pure, unit-tested helpers in features/auth/codeInput.ts.
 *
 * Accessibility: the real input carries the label; the boxes are hidden from
 * assistive tech (`accessibilityElementsHidden`).
 */

import { useRef, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';
// Import the pure helpers directly (not via the feature barrel) to avoid a
// components/ui ⇄ features/auth import cycle.
import { CODE_LENGTH, activeCellIndex, codeCells, sanitizeDigits } from '@/features/auth/codeInput';
import { Text } from './Text';

export interface CodeInputProps {
  value: string;
  onChangeText: (next: string) => void;
  /** Called once the code reaches full length. */
  onComplete?: (code: string) => void;
  length?: number;
  /** Accessibility label for the input (i18n from the caller). */
  label: string;
  error?: string | null;
  autoFocus?: boolean;
  editable?: boolean;
}

export function CodeInput({
  value,
  onChangeText,
  onComplete,
  length = CODE_LENGTH,
  label,
  error,
  autoFocus,
  editable = true,
}: CodeInputProps) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const cells = codeCells(value, length);
  const active = activeCellIndex(value, length);
  const hasError = !!error;

  const handleChange = (raw: string) => {
    const next = sanitizeDigits(raw, length);
    onChangeText(next);
    if (next.length === length) onComplete?.(next);
  };

  return (
    <View>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        accessibilityRole="none"
        style={{ flexDirection: 'row', gap: theme.spacing.sm }}
      >
        {cells.map((digit, i) => {
          const isActive = editable && focused && i === active;
          return (
            <View
              key={i}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                flex: 1,
                aspectRatio: 0.82,
                maxWidth: 56,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radii.md,
                borderWidth: isActive || (hasError && !digit) ? 2 : 1,
                borderColor: hasError
                  ? theme.colors.danger
                  : isActive
                    ? theme.colors.primary
                    : theme.colors.border,
              }}
            >
              <Text variant="display" dense>
                {digit}
              </Text>
            </View>
          );
        })}
      </Pressable>

      {/* The real, invisible input layered over the boxes. */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        editable={editable}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        maxLength={length}
        accessibilityLabel={label}
        caretHidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0,
        }}
      />

      {hasError ? (
        <Text variant="caption" color="danger" center style={{ marginTop: theme.spacing.sm }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
