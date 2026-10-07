/**
 * SegmentedControl — a two-or-more-option toggle inside a muted track, with the
 * active segment lifted onto a navy pill (the "Active / Past" toggle).
 */

import { useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './Text';

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl({ options, value, onChange, style }: SegmentedControlProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const padding = theme.spacing.xs;
  const segWidth = width > 0 ? (width - padding * 2) / options.length : 0;

  return (
    <View
      accessibilityRole="tablist"
      onLayout={onLayout}
      style={[
        {
          flexDirection: 'row',
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.pill,
          padding,
          minHeight: theme.layout.minTouchTarget,
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
            style={[
              {
                width: segWidth || undefined,
                flex: segWidth ? undefined : 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radii.pill,
                backgroundColor: active ? theme.colors.primary : 'transparent',
              },
              active ? theme.shadows.sm : null,
            ]}
          >
            <Text variant="button" color={active ? 'onPrimary' : 'textSecondary'}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
