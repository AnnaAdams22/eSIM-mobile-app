/**
 * Chip — a selectable filter pill (e.g. All / Europe / Asia / Americas).
 * Selected = filled navy; unselected = muted surface. Use ChipGroup for a row.
 */

import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected = false, onPress, style }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        {
          height: 34,
          justifyContent: 'center',
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radii.pill,
          borderWidth: 1,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style,
      ]}
    >
      <Text variant="caption" dense color={selected ? 'onPrimary' : 'textSecondary'}>
        {label}
      </Text>
    </Pressable>
  );
}

export interface ChipGroupProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

/** A horizontal row of single-select chips. */
export function ChipGroup({ options, value, onChange, style }: ChipGroupProps) {
  const theme = useTheme();
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }, style]}>
      {options.map((opt) => (
        <Chip
          key={opt.value}
          label={opt.label}
          selected={opt.value === value}
          onPress={() => onChange(opt.value)}
        />
      ))}
    </View>
  );
}
