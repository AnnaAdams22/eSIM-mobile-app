/**
 * Notifications — a placeholder until push notifications ship (a later task).
 * Explains that settings are coming soon rather than showing empty controls.
 */

import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BellRing } from 'lucide-react-native';

import { EmptyState, Header, Screen } from '@/components/ui';
import { useTheme } from '@/theme';

export default function NotificationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Screen scroll={false}>
      <Header title={t('notifications.title')} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          icon={<BellRing size={40} color={theme.colors.textSecondary} />}
          title={t('notifications.comingSoonTitle')}
          body={t('notifications.comingSoonBody')}
        />
      </View>
    </Screen>
  );
}
