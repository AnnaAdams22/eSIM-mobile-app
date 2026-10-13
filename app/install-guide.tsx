/**
 * Install guide — numbered steps with lavender step circles, a platform toggle
 * (iPhone / Android, defaulting to the user's platform), tips, and a "Need help?"
 * card that links to Support.
 *
 * Step text lives in en.json (`installGuide.iphoneSteps` / `androidSteps`).
 */

import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LifeBuoy } from 'lucide-react-native';

import { Card, Header, Screen, SegmentedControl, Text } from '@/components/ui';
import { selectionTap } from '@/lib/haptics';
import { useTheme, type Theme } from '@/theme';

type PlatformKey = 'iphone' | 'android';

const DEFAULT_PLATFORM: PlatformKey = Platform.OS === 'android' ? 'android' : 'iphone';

export default function InstallGuideScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [platform, setPlatform] = useState<PlatformKey>(DEFAULT_PLATFORM);

  const steps = t(platform === 'iphone' ? 'installGuide.iphoneSteps' : 'installGuide.androidSteps', {
    returnObjects: true,
  }) as unknown as string[];
  const tips = t('installGuide.tips', { returnObjects: true }) as unknown as string[];

  return (
    <Screen>
      <Header title={t('installGuide.title')} />

      <SegmentedControl
        options={[
          { value: 'iphone', label: t('installGuide.segments.iphone') },
          { value: 'android', label: t('installGuide.segments.android') },
        ]}
        value={platform}
        onChange={(v) => {
          selectionTap();
          setPlatform(v as PlatformKey);
        }}
        style={{ marginBottom: theme.spacing.xl }}
      />

      <Text variant="h2" accessibilityRole="header" style={{ marginBottom: theme.spacing.lg }}>
        {t(platform === 'iphone' ? 'installGuide.iphoneTitle' : 'installGuide.androidTitle')}
      </Text>

      <View style={{ gap: theme.spacing.lg }}>
        {steps.map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' }}>
            <View style={stepCircle(theme)} accessible accessibilityLabel={t('installGuide.stepA11y', { number: i + 1 })}>
              <Text variant="caption" dense style={{ color: theme.colors.accent, fontFamily: theme.fontFamily.semibold }}>
                {i + 1}
              </Text>
            </View>
            <Text variant="body" style={{ flex: 1, paddingTop: 3 }}>
              {step}
            </Text>
          </View>
        ))}
      </View>

      {platform === 'android' ? (
        <Text
          variant="bodySmall"
          color="textSecondary"
          style={{ marginTop: theme.spacing.lg, fontStyle: 'italic' }}
        >
          {t('installGuide.androidNote')}
        </Text>
      ) : null}

      {/* Tips */}
      <Text
        variant="h2"
        accessibilityRole="header"
        style={{ marginTop: theme.spacing.xxl, marginBottom: theme.spacing.md }}
      >
        {t('installGuide.tipsTitle')}
      </Text>
      <View style={{ gap: theme.spacing.md }}>
        {tips.map((tip, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Text variant="body" color="textSecondary" accessible={false}>
              •
            </Text>
            <Text variant="body" color="textSecondary" style={{ flex: 1 }}>
              {tip}
            </Text>
          </View>
        ))}
      </View>

      {/* Need help? → Support */}
      <Card
        onPress={() => router.push({ pathname: '/support' })}
        accessibilityHint={t('installGuide.needHelpAction')}
        style={{ marginTop: theme.spacing.xxl, backgroundColor: theme.colors.accentSoft }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <LifeBuoy size={24} color={theme.colors.accent} />
          <View style={{ flex: 1 }}>
            <Text variant="h3">{t('installGuide.needHelpTitle')}</Text>
            <Text variant="bodySmall" color="textSecondary" style={{ marginTop: theme.spacing.xxs }}>
              {t('installGuide.needHelpBody')}
            </Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

function stepCircle(theme: Theme) {
  return {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}
