/**
 * InstallSection — the shared eSIM install UI.
 *
 * One place for the QR card, the iOS one-tap install button, and the manual
 * SM-DP+ / activation-code details, so the post-purchase success screen and the
 * eSIM detail screen install an eSIM exactly the same way. Reuses the LPA parser
 * from the checkout feature; copy actions use the clipboard with haptic feedback.
 */

import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { Image } from 'expo-image';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ChevronDown, ChevronUp, Copy, Smartphone } from 'lucide-react-native';

import { Button, Card, Text } from '@/components/ui';
import { lpaQrValueFromTapLink, parseActivationFromTapLink } from '@/features/checkout';
import { lightTap } from '@/lib/haptics';
import { useTheme } from '@/theme';

/** Side length (px) of the rendered QR — large enough to scan from another phone. */
const QR_SIZE = 220;

/** Normalise a stored QR (raw base64 or an already-complete data URI) to a URI. */
export function qrDataUri(qr: string | null | undefined): string | null {
  if (!qr) return null;
  return qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`;
}

export interface InstallSectionProps {
  qrCode: string | null | undefined;
  iosTapLink: string | null | undefined;
  style?: object;
}

export function InstallSection({ qrCode, iosTapLink, style }: InstallSectionProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  // Prefer a QR we render ourselves from the parsed LPA activation string, so it
  // works offline and doesn't depend on the backend's image. Fall back to the
  // backend's qr_code image only when the LPA can't be parsed.
  const lpaValue = lpaQrValueFromTapLink(iosTapLink);
  const qrUri = qrDataUri(qrCode);
  const hasQr = !!lpaValue || !!qrUri;
  const manual = parseActivationFromTapLink(iosTapLink);
  const canTapInstall = Platform.OS === 'ios' && !!iosTapLink;

  const openTapLink = () => {
    if (!iosTapLink) return;
    lightTap();
    Linking.openURL(iosTapLink).catch(() => {});
  };

  return (
    <View style={[{ gap: theme.spacing.lg }, style]}>
      {hasQr ? (
        <Card padding="lg" radius="lg" shadow="sm" style={{ alignItems: 'center' }}>
          <Text variant="h3" center>
            {t('install.scanTitle')}
          </Text>
          <Text
            variant="bodySmall"
            color="textSecondary"
            center
            style={{ marginTop: theme.spacing.xs, marginBottom: theme.spacing.md, maxWidth: 280 }}
          >
            {t('install.scanBody')}
          </Text>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={t('install.scanTitle')}
            style={{
              backgroundColor: '#FFFFFF',
              padding: theme.spacing.md,
              borderRadius: theme.radii.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            {lpaValue ? (
              // Rendered from the LPA string — black on white with a quiet-zone
              // margin, high error correction for a reliable scan.
              <QRCode
                value={lpaValue}
                size={QR_SIZE}
                color="#000000"
                backgroundColor="#FFFFFF"
                quietZone={12}
                ecl="M"
              />
            ) : (
              <Image
                source={{ uri: qrUri as string }}
                style={{ width: QR_SIZE, height: QR_SIZE }}
                contentFit="contain"
                accessibilityLabel={t('install.scanTitle')}
              />
            )}
          </View>
        </Card>
      ) : null}

      {canTapInstall ? (
        <Button
          label={t('install.installIphone')}
          onPress={openTapLink}
          accessibilityHint={t('install.installIphoneHint')}
          icon={<Smartphone size={18} color={theme.colors.onPrimary} />}
        />
      ) : null}

      {manual ? (
        <ManualSetup smdpAddress={manual.smdpAddress} activationCode={manual.activationCode} />
      ) : null}
    </View>
  );
}

export function ManualSetup({
  smdpAddress,
  activationCode,
}: {
  smdpAddress: string;
  activationCode: string;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(Platform.OS === 'android');

  return (
    <Card padding="lg" radius="lg" shadow="sm">
      <Button
        label={t('install.installManualTitle')}
        variant="ghost"
        size="md"
        fullWidth={false}
        onPress={() => {
          lightTap();
          setOpen((v) => !v);
        }}
        icon={
          open ? (
            <ChevronUp size={18} color={theme.colors.primary} />
          ) : (
            <ChevronDown size={18} color={theme.colors.primary} />
          )
        }
        style={{ alignSelf: 'flex-start' }}
      />
      {open ? (
        <View style={{ marginTop: theme.spacing.sm, gap: theme.spacing.md }}>
          <Text variant="bodySmall" color="textSecondary">
            {t(
              Platform.OS === 'android'
                ? 'install.installManualHintAndroid'
                : 'install.installManualHintIos'
            )}
          </Text>
          <CopyField label={t('install.smdpLabel')} value={smdpAddress} />
          <CopyField label={t('install.activationLabel')} value={activationCode} />
        </View>
      ) : null}
    </Card>
  );
}

export function CopyField({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const copy = async () => {
    await Clipboard.setStringAsync(value);
    lightTap();
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.md,
          paddingLeft: theme.spacing.md,
          paddingRight: theme.spacing.xs,
          paddingVertical: theme.spacing.xs,
          minHeight: theme.layout.minTouchTarget,
        }}
      >
        <Text
          variant="body"
          style={{ flex: 1, fontFamily: theme.fontFamily.medium }}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Button
          label={copied ? t('install.copied') : t('install.copy')}
          variant="ghost"
          size="md"
          fullWidth={false}
          onPress={copy}
          accessibilityHint={t('install.copyHint')}
          icon={
            copied ? (
              <CheckCircle2 size={16} color={theme.colors.success} />
            ) : (
              <Copy size={16} color={theme.colors.primary} />
            )
          }
        />
      </View>
    </View>
  );
}
