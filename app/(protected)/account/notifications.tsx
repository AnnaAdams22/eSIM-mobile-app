/**
 * Notifications settings — the real push-notification controls.
 *
 * Shows the true on/off state (OS permission AND backend registration). Turning
 * the toggle on requests permission (if needed) and registers the device;
 * turning it off deregisters it. If registration fails we show a friendly error
 * (instead of letting the toggle silently snap back), and if the OS permission
 * is permanently denied we explain that and offer a shortcut to Settings.
 *
 * In __DEV__ a small diagnostics panel shows exactly where registration failed,
 * with a Retry button. All user-facing strings are translated (en/ru/de/es).
 */

import { useCallback, useState } from 'react';
import { Linking, Switch, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BellRing, Clock, Settings, SignalLow } from 'lucide-react-native';

import { Button, Card, Header, Screen, Text } from '@/components/ui';
import { useNotifications } from '@/features/notifications/NotificationsProvider';
import { registrationErrorKey } from '@/features/notifications';
import { lightTap } from '@/lib/haptics';
import { useTheme } from '@/theme';

export default function NotificationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { permission, isOn, enable, disable, retry, refreshPermission } = useNotifications();
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

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
    setErrorKey(null);
    try {
      if (next) {
        const result = await enable();
        // If it didn't end up registered, tell the user why instead of letting
        // the switch silently snap back.
        if (result.failingStep) setErrorKey(registrationErrorKey(result.failingStep));
      } else {
        await disable();
      }
    } finally {
      setBusy(false);
    }
  };

  const onRetry = async () => {
    if (busy) return;
    lightTap();
    setBusy(true);
    setErrorKey(null);
    try {
      const result = await retry();
      if (result.failingStep) setErrorKey(registrationErrorKey(result.failingStep));
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
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

      {errorKey && !denied ? (
        <Card
          padding="lg"
          radius="lg"
          shadow="sm"
          style={{ gap: theme.spacing.md, backgroundColor: theme.colors.discountSoft }}
        >
          <Text variant="bodySmall" color="textSecondary" accessibilityLiveRegion="polite">
            {t(errorKey)}
          </Text>
          <Button
            label={t('notifications.retry')}
            variant="secondary"
            onPress={onRetry}
            loading={busy}
          />
        </Card>
      ) : null}

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

      {__DEV__ ? <DebugPanel /> : null}
    </Screen>
  );
}

// ─── Dev-only diagnostics panel ─────────────────────────────────────────────

function DebugPanel() {
  const theme = useTheme();
  const { permission, userDisabled, isRegistered, isOn, diag, retry } = useNotifications();
  const [busy, setBusy] = useState(false);

  const when = diag.attemptedAt ? new Date(diag.attemptedAt).toLocaleTimeString() : '—';
  const rows: [string, string][] = [
    ['permission', `${permission} (canAskAgain=${diag.canAskAgain})`],
    ['signedIn', String(diag.signedIn)],
    ['isDevice', String(diag.isDevice)],
    ['projectId', diag.projectId ?? 'MISSING'],
    ['tokenObtained', diag.tokenObtained ? `yes (${diag.tokenPrefix}…)` : 'no'],
    ['postStatus', diag.postStatus == null ? '—' : String(diag.postStatus)],
    ['failingStep', diag.failingStep ?? '— (none)'],
    ['errorCode', diag.errorCode ?? '—'],
    ['errorMessage', diag.errorMessage ?? '—'],
    ['lastAttempt', when],
    ['userDisabled', String(userDisabled)],
    ['isRegistered / isOn', `${isRegistered} / ${isOn}`],
  ];

  return (
    <Card padding="lg" radius="lg" shadow="sm" style={{ gap: theme.spacing.sm }}>
      <Text variant="h3">DEV · push diagnostics</Text>
      {rows.map(([k, v]) => (
        <View key={k} style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Text variant="caption" color="textSecondary" style={{ width: 120 }}>
            {k}
          </Text>
          <Text variant="caption" style={{ flex: 1 }}>
            {v}
          </Text>
        </View>
      ))}
      <Button
        label="Retry registration"
        variant="secondary"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await retry();
          } finally {
            setBusy(false);
          }
        }}
      />
    </Card>
  );
}
