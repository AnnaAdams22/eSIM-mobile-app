/**
 * ConfigError — a clear, full-screen startup failure shown when required
 * EXPO_PUBLIC_* env vars are missing. In development it offers a bypass so the
 * design system preview is still reachable in Expo Go without keys set.
 */

import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export interface ConfigErrorProps {
  missing: string[];
  onBypass?: () => void;
}

export function ConfigError({ missing, onBypass }: ConfigErrorProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.lg }}>
        <Text variant="h1">{t('states.configTitle')}</Text>
        <Text variant="body" color="textSecondary">
          {t('states.configBody')}
        </Text>
        <View
          style={{
            backgroundColor: theme.colors.surfaceMuted,
            borderRadius: theme.radii.md,
            padding: theme.spacing.lg,
            gap: theme.spacing.sm,
          }}
        >
          {missing.map((key) => (
            <Text key={key} variant="bodySmall" style={{ fontFamily: theme.fontFamily.medium }}>
              {key}
            </Text>
          ))}
        </View>
        {__DEV__ && onBypass ? (
          <Button
            label="Continue to app (dev only)"
            variant="secondary"
            onPress={onBypass}
          />
        ) : null}
      </View>
    </Screen>
  );
}
