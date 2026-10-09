/**
 * A centred "prefix + inline link" row used at the foot of the auth screens
 * (e.g. "New here? Create an account").
 */

import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

export interface LinkRowProps {
  prefix: string;
  linkLabel: string;
  onPress: () => void;
}

export function LinkRow({ prefix, linkLabel, onPress }: LinkRowProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
      }}
    >
      <Text variant="bodySmall" color="textSecondary">
        {prefix}
      </Text>
      <Text
        variant="bodySmall"
        color="accent"
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={linkLabel}
        style={{ fontFamily: theme.fontFamily.semibold }}
      >
        {linkLabel}
      </Text>
    </View>
  );
}
