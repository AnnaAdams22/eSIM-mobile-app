/**
 * Divider — a hairline separator in the border colour. Horizontal by default.
 */

import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type SpacingToken } from '@/theme';

export interface DividerProps {
  /** Vertical margin token applied above and below. */
  spacing?: SpacingToken;
  /** Inset from the leading edge (e.g. to align under row text). */
  inset?: number;
  style?: StyleProp<ViewStyle>;
}

export function Divider({ spacing = 'none', inset = 0, style }: DividerProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          height: 1,
          backgroundColor: theme.colors.border,
          marginVertical: theme.spacing[spacing],
          marginLeft: inset,
        },
        style,
      ]}
    />
  );
}
