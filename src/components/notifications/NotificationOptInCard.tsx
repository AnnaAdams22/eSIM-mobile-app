/**
 * The soft permission prompt, shown on Order success after a purchase.
 *
 * We never ask for notification permission at launch. Here, once a purchase has
 * succeeded, we gently offer it: only "Turn on" triggers the OS prompt. "Not now"
 * is remembered so we re-offer at most once, and only on a later purchase (see
 * `decideSoftPrompt`). The card decides its own visibility and renders nothing
 * when it shouldn't appear — so the caller can drop it in unconditionally.
 */

import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BellRing } from 'lucide-react-native';

import { Button, Card, Text } from '@/components/ui';
import { useNotifications } from '@/features/notifications/NotificationsProvider';
import { decideSoftPrompt } from '@/features/notifications';
import {
  getNotifPrefs,
  incrementPurchaseCount,
  recordSoftPromptDismissed,
} from '@/features/notifications/store';
import { lightTap } from '@/lib/haptics';
import { useTheme } from '@/theme';

export function NotificationOptInCard() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { permission, enable } = useNotifications();

  const [visible, setVisible] = useState(false);
  const purchaseCountRef = useRef(0);
  const decided = useRef(false);

  // Count this purchase once, then decide whether to offer the prompt.
  useEffect(() => {
    if (decided.current) return;
    decided.current = true;
    (async () => {
      const count = await incrementPurchaseCount();
      purchaseCountRef.current = count;
      const prefs = await getNotifPrefs();
      setVisible(
        decideSoftPrompt({
          permission,
          timesDismissed: prefs.softPromptTimesDismissed,
          dismissedAtPurchaseCount: prefs.softPromptDismissedAtPurchaseCount,
          purchaseCount: count,
        })
      );
    })();
  }, [permission]);

  if (!visible) return null;

  const onTurnOn = async () => {
    lightTap();
    setVisible(false);
    await enable();
  };

  const onNotNow = async () => {
    lightTap();
    setVisible(false);
    await recordSoftPromptDismissed(purchaseCountRef.current);
  };

  return (
    <Card
      padding="lg"
      radius="lg"
      shadow="sm"
      style={{ gap: theme.spacing.md, backgroundColor: theme.colors.accentSoft }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <BellRing size={24} color={theme.colors.accent} />
        <Text variant="h3" style={{ flex: 1 }}>
          {t('notifications.softPromptTitle')}
        </Text>
      </View>
      <Text variant="bodySmall" color="textSecondary">
        {t('notifications.softPromptBody')}
      </Text>
      <View style={{ gap: theme.spacing.sm }}>
        <Button label={t('notifications.softPromptTurnOn')} onPress={onTurnOn} />
        <Button
          label={t('notifications.softPromptNotNow')}
          variant="ghost"
          onPress={onNotNow}
        />
      </View>
    </Card>
  );
}
