/**
 * Text — the typographic primitive. Renders a variant from the type scale using
 * theme tokens only. Supports a colour token, alignment, and all RN Text props.
 *
 * Accessibility: text scales with the system font size (allowFontScaling is on
 * by default). Variants use lineHeight metrics that leave room for larger sizes.
 */

import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme, type ColorName, type TextVariant } from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: ColorName;
  center?: boolean;
  children?: React.ReactNode;
}

export function Text({
  variant = 'body',
  color = 'text',
  center,
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const t = theme.typography[variant];

  return (
    <RNText
      style={[
        {
          fontFamily: t.fontFamily,
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          letterSpacing: t.letterSpacing,
          color: theme.colors[color],
          textAlign: center ? 'center' : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
