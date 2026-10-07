/**
 * SearchBar — a muted, pill-shaped search input with a leading search icon,
 * matching the Home and destination-list screens. Controlled component.
 */

import { View, TextInput, type StyleProp, type ViewStyle } from 'react-native';
import { Search } from 'lucide-react-native';

import { useTheme } from '@/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Accessible label; defaults to the placeholder. */
  accessibilityLabel?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  onSubmitEditing,
  autoFocus,
  style,
  accessibilityLabel,
}: SearchBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.pill,
          paddingHorizontal: theme.spacing.lg,
          minHeight: theme.layout.minTouchTarget,
        },
        style,
      ]}
    >
      <Search size={20} color={theme.colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        returnKeyType="search"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityRole="search"
        style={{
          flex: 1,
          paddingVertical: theme.spacing.md,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.typography.body.fontSize,
          color: theme.colors.text,
        }}
      />
    </View>
  );
}
