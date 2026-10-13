/**
 * About ESIM Global — the logo, app name/version, company, and links to the
 * legal documents (opened in an in-app browser). Version comes from
 * expo-constants (app.json `version`).
 */

import { View } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';

import { Card, Divider, Header, ListRow, Logo, Screen, Text } from '@/components/ui';
import { legal } from '@/config';
import { useTheme } from '@/theme';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function AboutScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const open = (url: string) => () => {
    WebBrowser.openBrowserAsync(url).catch(() => {});
  };

  return (
    <Screen>
      <Header title={t('about.title')} />

      <View style={{ alignItems: 'center', gap: theme.spacing.md, marginVertical: theme.spacing.xl }}>
        <Logo variant="full" size={40} />
        <Text variant="bodySmall" color="textSecondary" center>
          {t('about.tagline')}
        </Text>
        <Text variant="caption" color="textSecondary" dense>
          {t('about.versionLabel', { version: APP_VERSION })}
        </Text>
        <Text variant="caption" color="textSecondary" dense>
          {t('about.company')}
        </Text>
      </View>

      <Text
        variant="caption"
        color="textSecondary"
        style={{ marginBottom: theme.spacing.sm, marginLeft: theme.spacing.xs }}
      >
        {t('about.legalTitle')}
      </Text>
      <Card padding="xs">
        <ListRow
          title={t('about.terms')}
          accessibilityHint={t('about.openHint')}
          onPress={open(legal.termsUrl)}
          style={{ paddingHorizontal: theme.spacing.md }}
        />
        <Divider inset={theme.spacing.md} />
        <ListRow
          title={t('about.privacy')}
          accessibilityHint={t('about.openHint')}
          onPress={open(legal.privacyUrl)}
          style={{ paddingHorizontal: theme.spacing.md }}
        />
        <Divider inset={theme.spacing.md} />
        <ListRow
          title={t('about.refund')}
          accessibilityHint={t('about.openHint')}
          onPress={open(legal.refundUrl)}
          style={{ paddingHorizontal: theme.spacing.md }}
        />
      </Card>
    </Screen>
  );
}
