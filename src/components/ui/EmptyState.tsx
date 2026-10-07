/**
 * EmptyState — a calm, centred placeholder for "nothing here yet" screens, with
 * an optional icon and call-to-action. Empty screens are an invitation to act.
 */

import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

export interface EmptyStateProps {
  title: string;
  body?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ title, body, icon, actionLabel, onAction, style }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: theme.spacing.huge,
          gap: theme.spacing.md,
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginBottom: theme.spacing.sm }}>{icon}</View> : null}
      <Text variant="h2" center>
        {title}
      </Text>
      {body ? (
        <Text variant="body" color="textSecondary" center style={{ maxWidth: 300 }}>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} style={{ marginTop: theme.spacing.sm }} />
      ) : null}
    </View>
  );
}
