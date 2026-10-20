/**
 * Notifications settings — the real push-notification controls.
 *
 * Shows the true on/off state (OS permission AND backend registration). Turning
 * the toggle on requests permission (if needed) and registers the device;
 * turning it off deregisters it. If the OS permission is permanently denied we
 * can't re-prompt, so we explain that and offer a shortcut to system Settings.
 *
 * All strings are translated (en/ru/de/es). Theme tokens only.
 */

import { useCallback, useState } from 'react';
import { Linking, Switch, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BellRing, Clock, Settings, SignalLow } from 'lucide-react-native';

import { Button, Card, Header, Screen, Text } from '@/components/ui';
import { useNotifications } from '@/features/notifications/NotificationsProvider';
import { lightTap } from '@/lib/haptics';
import { useTheme } from '@/theme';

export default function NotificationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { permission, isOn, enable, disable, refreshPermission } = useNotifications();
  const [busy, setBusy] = useState(false);

  // The user may change the OS permission in Settings and return — re-read it.
  useFocusEffect(
    useCallback(() => {
      void refreshPermission();
    }, [refreshPermission])
  );

  const denied = permission === 'denied';

  const onToggle = async (next: boolean) => {
    if (busy) return;
    lightTap();
    setBusy(true);
    try {
      if (next) await enable();
      else await disable();
    } finally {
      setBusy(false);
    }
  };

  const bullets: { icon: React.ReactNode; text: string }[] = [
    {
      icon: <SignalLow size={20} color={theme.colors.accent} />,
      text: t('notifications.alertLowData'),
    },
    {
      icon: <BellRing size={20} color={theme.colors.accent} />,
      text: t('notifications.alertDepleted'),
    },
    {
      icon: <Clock size={20} color={theme.colors.accent} />,
      text: t('notifications.alertExpiring'),
    },
  ];

  return (
    <Screen scroll contentStyle={{ gap: theme.spacing.lg }}>
      <Header title={t('notifications.title')} />

      <Card padding="lg" radius="lg" shadow="sm">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
          }}
        >
          <View style={{ flex: 1, gap: theme.spacing.xxs }}>
            <Text variant="h3">{t('notifications.toggleTitle')}</Text>
            <Text variant="bodySmall" color="textSecondary">
              {t('notifications.toggleSubtitle')}
            </Text>
          </View>
          <Switch
            value={isOn}
            onValueChange={onToggle}
            disabled={busy || denied}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.surface}
            accessibilityRole="switch"
            accessibilityLabel={t('notifications.toggleTitle')}
          />
        </View>
      </Card>

      {denied ? (
        <Card
          padding="lg"
          radius="lg"
          shadow="sm"
          style={{ gap: theme.spacing.md, backgroundColor: theme.colors.accentSoft }}
        >
          <Text variant="bodySmall" color="textSecondary">
            {t('notifications.deniedBody')}
          </Text>
          <Button
            label={t('notifications.openSettings')}
            variant="secondary"
            icon={<Settings size={18} color={theme.colors.primary} />}
            onPress={() => {
              lightTap();
              void Linking.openSettings();
            }}
          />
        </Card>
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="h3">{t('notifications.whatYouGetTitle')}</Text>
        <Card padding="lg" radius="lg" shadow="sm" style={{ gap: theme.spacing.md }}>
          {bullets.map((b, i) => (
            <View
              key={i}
              style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
            >
              {b.icon}
              <Text variant="body" style={{ flex: 1 }}>
                {b.text}
              </Text>
            </View>
          ))}
        </Card>
      </View>
    </Screen>
  );
}
