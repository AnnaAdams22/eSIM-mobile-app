/**
 * Home tab (placeholder). Shows the full brand logo in the header, as in the
 * reference. Real content (greeting, search, popular destinations) comes later.
 */

import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Logo, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Screen scroll={false}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 44,
        }}
      >
        <Logo variant="full" size={28} />
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.sm }}>
        <Text variant="display">{t('home.greeting', { name: 'Anna' })}</Text>
        <Text variant="body" color="textSecondary">
          {t('home.subtitle')}
        </Text>

        {__DEV__ ? (
          <Text
            variant="bodySmall"
            color="accent"
            onPress={() => router.push('/dev/design')}
            style={{ marginTop: theme.spacing.lg }}
            accessibilityRole="link"
          >
            Open design system preview →
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
