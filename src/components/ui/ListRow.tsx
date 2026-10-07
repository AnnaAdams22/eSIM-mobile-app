/**
 * ListRow — a tappable row: leading element (flag / icon) + title + optional
 * subtitle, with an optional right-side value (e.g. "From €4.90") and a chevron.
 * Matches the country list and profile menu rows.
 */

import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { Text } from './Text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Leading visual — a Flag, icon, or any node. */
  leading?: ReactNode;
  /** Right-side value shown before the chevron (e.g. a price). */
  value?: string;
  /** Right-side custom node (overrides `value`). */
  trailing?: ReactNode;
  /** Show the chevron. Default true when onPress is set. */
  chevron?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function ListRow({
  title,
  subtitle,
  leading,
  value,
  trailing,
  chevron,
  onPress,
  style,
  accessibilityHint,
}: ListRowProps) {
  const theme = useTheme();
  const showChevron = chevron ?? !!onPress;

  const a11yLabel = [title, subtitle, value].filter(Boolean).join(', ');

  const content = (
    <>
      {leading ? <View accessible={false}>{leading}</View> : null}
      <View style={{ flex: 1 }}>
        <Text variant="h3" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? (value ? <Text variant="bodySmall" color="textSecondary">{value}</Text> : null)}
      {showChevron ? <ChevronRight size={20} color={theme.colors.textSecondary} /> : null}
    </>
  );

  const rowStyle: StyleProp<ViewStyle> = [
    {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      minHeight: theme.layout.minTouchTarget,
      paddingVertical: theme.spacing.sm,
    },
    style,
  ];

  if (!onPress) {
    return (
      <View accessibilityRole="text" accessibilityLabel={a11yLabel} style={rowStyle}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [rowStyle, { opacity: pressed ? 0.6 : 1 }]}
    >
      {content}
    </Pressable>
  );
}
