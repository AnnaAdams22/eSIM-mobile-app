/**
 * Language selection.
 *
 * Lists "Use device language" (the default) followed by each shipped language,
 * with a checkmark on the active choice. The selection is persisted (SecureStore)
 * and applied immediately; it overrides the device language on the next launch
 * too (see `applyStoredLanguage` in src/i18n).
 *
 * Only English ships today, but adding a language is just a JSON file + one entry
 * in `AVAILABLE_LANGUAGES` — this screen needs no change.
 */

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { getLocales } from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';

import { Card, Divider, Header, ListRow, Screen, Text } from '@/components/ui';
import {
  AVAILABLE_LANGUAGES,
  DEVICE,
  getStoredLanguage,
  resolveLanguage,
  setStoredLanguage,
} from '@/features/settings';
import { selectionTap } from '@/lib/haptics';
import { useTheme } from '@/theme';

export default function LanguageScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<string>(DEVICE);

  useEffect(() => {
    let active = true;
    getStoredLanguage().then((stored) => {
      if (active) setSelected(stored ?? DEVICE);
    });
    return () => {
      active = false;
    };
  }, []);

  const choose = async (value: string) => {
    selectionTap();
    setSelected(value);
    await setStoredLanguage(value);
    const deviceCodes = getLocales().map((l) => l.languageCode);
    const effective = resolveLanguage(value, deviceCodes);
    if (effective !== i18n.language) {
      await i18n.changeLanguage(effective);
    }
  };

  const checkFor = (value: string) =>
    selected === value ? <Check size={20} color={theme.colors.primary} /> : null;

  return (
    <Screen>
      <Header title={t('language.title')} />

      <Card padding="xs">
        <ListRow
          title={t('language.useDevice')}
          subtitle={t('language.useDeviceSubtitle')}
          trailing={checkFor(DEVICE)}
          chevron={false}
          onPress={() => void choose(DEVICE)}
          style={{ paddingHorizontal: theme.spacing.md }}
        />
        {AVAILABLE_LANGUAGES.map((lang) => (
          <View key={lang.code}>
            <Divider inset={theme.spacing.md} />
            <ListRow
              title={lang.label}
              trailing={checkFor(lang.code)}
              chevron={false}
              onPress={() => void choose(lang.code)}
              accessibilityHint={t('language.selectHint', { language: lang.label })}
              style={{ paddingHorizontal: theme.spacing.md }}
            />
          </View>
        ))}
      </Card>

      <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.lg }}>
        {t('language.comingSoonNote')}
      </Text>
    </Screen>
  );
}
