/**
 * Support — an FAQ accordion, contact options, and a "We're here to help" banner.
 *
 * FAQ answers live in en.json (`support.faqItems`). Contact details come from a
 * single config file (`src/config/support.ts`); any channel whose value is empty
 * is hidden rather than opening a broken link. Links are built by the pure
 * `buildWhatsappUrl` / `buildInstagramUrl` / `buildMailtoUrl` helpers and opened
 * with Linking.
 */

import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Mail } from 'lucide-react-native';

import { Card, Divider, Header, ListRow, Screen, Text } from '@/components/ui';
import { HeroImage } from '@/components/HeroImage';
import { InstagramIcon, WhatsAppIcon } from '@/components/icons/BrandIcons';
import { support } from '@/config/support';
import { buildInstagramUrl, buildMailtoUrl, buildWhatsappUrl } from '@/features/support';
import { selectionTap } from '@/lib/haptics';
import { useTheme } from '@/theme';

interface Faq {
  q: string;
  a: string;
}

interface Contact {
  key: string;
  title: string;
  subtitle: string;
  url: string;
  icon: React.ReactNode;
}

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function SupportScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const faqs = t('support.faqItems', { returnObjects: true }) as unknown as Faq[];

  const whatsappUrl = buildWhatsappUrl(support.whatsappNumber, support.whatsappUrl);
  const instagramUrl = buildInstagramUrl(support.instagramHandle);
  const mailtoUrl = buildMailtoUrl(
    support.supportEmail,
    t('support.emailSubject', { version: APP_VERSION })
  );

  const iconColor = theme.colors.textSecondary;
  const contacts: Contact[] = [
    whatsappUrl && {
      key: 'whatsapp',
      title: t('support.whatsapp'),
      subtitle: t('support.whatsappSubtitle'),
      url: whatsappUrl,
      icon: <WhatsAppIcon size={22} color={iconColor} />,
    },
    instagramUrl && {
      key: 'instagram',
      title: t('support.instagram'),
      subtitle: t('support.instagramSubtitle'),
      url: instagramUrl,
      icon: <InstagramIcon size={22} color={iconColor} />,
    },
    mailtoUrl && {
      key: 'email',
      title: t('support.email'),
      subtitle: support.supportEmail,
      url: mailtoUrl,
      icon: <Mail size={22} color={iconColor} />,
    },
  ].filter(Boolean) as Contact[];

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Screen>
      <Header title={t('support.title')} />

      {/* FAQs */}
      <Text variant="h2" accessibilityRole="header">
        {t('support.faqTitle')}
      </Text>
      <Text variant="bodySmall" color="textSecondary" style={{ marginTop: theme.spacing.xxs }}>
        {t('support.faqSubtitle')}
      </Text>
      <Card padding="xs" style={{ marginTop: theme.spacing.md }}>
        {faqs.map((faq, i) => (
          <View key={i}>
            {i > 0 ? <Divider inset={theme.spacing.md} /> : null}
            <FaqRow faq={faq} />
          </View>
        ))}
      </Card>

      {/* Contact options */}
      {contacts.length > 0 ? (
        <>
          <Text
            variant="h2"
            accessibilityRole="header"
            style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.md }}
          >
            {t('support.contactTitle')}
          </Text>
          <Card padding="xs">
            {contacts.map((c, i) => (
              <View key={c.key}>
                {i > 0 ? <Divider inset={theme.spacing.md} /> : null}
                <ListRow
                  title={c.title}
                  subtitle={c.subtitle}
                  leading={c.icon}
                  accessibilityHint={t('support.openHint', { channel: c.title })}
                  onPress={() => openUrl(c.url)}
                  style={{ paddingHorizontal: theme.spacing.md }}
                />
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {/* "We're here to help" banner */}
      <HeroImage
        slot="support:banner"
        seed="support"
        height={150}
        scrim={0.6}
        style={{ marginTop: theme.spacing.xl }}
        accessibilityLabel={t('support.bannerTitle')}
      >
        <Text variant="h2" color="onPrimary">
          {t('support.bannerTitle')}
        </Text>
        <Text variant="bodySmall" color="onPrimary" style={{ marginTop: theme.spacing.xxs }}>
          {t('support.bannerSubtitle')}
        </Text>
      </HeroImage>
    </Screen>
  );
}

/** A single expandable FAQ row. */
function FaqRow({ faq }: { faq: Faq }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    selectionTap();
    setOpen((o) => !o);
  };

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={faq.q}
      accessibilityHint={open ? t('support.collapseHint') : t('support.expandHint')}
      accessibilityState={{ expanded: open }}
      style={({ pressed }) => ({
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Text variant="h3" style={{ flex: 1 }}>
          {faq.q}
        </Text>
        <ChevronDown
          size={20}
          color={theme.colors.textSecondary}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </View>
      {open ? (
        <Text variant="bodySmall" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
          {faq.a}
        </Text>
      ) : null}
    </Pressable>
  );
}
