/**
 * Badge — a small status pill. Tones map to semantic colour pairs:
 *  - success:  the "Active" badge (soft green)
 *  - discount: the "-50% OFF" badge (soft red)
 *  - neutral:  muted surface, for generic labels
 */

import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './Text';

export type BadgeTone = 'success' | 'discount' | 'neutral';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const theme = useTheme();

  const bg: Record<BadgeTone, string> = {
    success: theme.colors.successSoft,
    discount: theme.colors.discountSoft,
    neutral: theme.colors.surfaceMuted,
  };
  const fg: Record<BadgeTone, 'success' | 'discount' | 'textSecondary'> = {
    success: 'success',
    discount: 'discount',
    neutral: 'textSecondary',
  };

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: bg[tone],
          borderRadius: theme.radii.pill,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xxs + 1,
        },
        style,
      ]}
    >
      <Text variant="caption" color={fg[tone]}>
        {label}
      </Text>
    </View>
  );
}
