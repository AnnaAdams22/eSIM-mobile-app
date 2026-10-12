/**
 * Order success — the post-payment screen.
 *
 * Polls `GET /api/me/orders/by-payment-intent/:id` every 2s while the backend
 * provisions the eSIM (a 404 means "not created yet" → still processing). The
 * visible state is decided by the pure `pollPhase` machine:
 *
 *   processing → a calm "Setting up your eSIM…" state
 *   success    → QR + one-tap iOS install + manual (SM-DP+ / activation) details
 *   timeout    → "Still processing, we'll email you" (after 60s)
 *   failed     → reassuring auto-refund message + support
 *
 * The user arrives here via `router.replace`, so "back" can't return to the paid
 * checkout.
 */

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Linking, Platform, View } from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  LifeBuoy,
  Smartphone,
} from 'lucide-react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { Flag } from '@/components/Flag';
import {
  POLL_INTERVAL_MS,
  isTerminal,
  parseActivationFromTapLink,
  pollPhase,
  type PollPhase,
} from '@/features/checkout';
import { api, ApiError } from '@/lib/api';
import type { OrderStatus } from '@/lib/api-types';
import { lightTap, successNotify } from '@/lib/haptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme';

export default function OrderSuccessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { paymentIntentId, flag, title, planLabel } = useLocalSearchParams<{
    paymentIntentId?: string;
    flag?: string;
    title?: string;
    planLabel?: string;
  }>();

  // The clock: `startedAt` is fixed at mount (lazy init); the ticking `now` state
  // drives re-renders so the 60s timeout transition fires on its own.
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const { data: order } = useQuery({
    queryKey: ['order-by-pi', paymentIntentId],
    enabled: !!paymentIntentId,
    // A 404 means the order row isn't there yet — model it as "still processing".
    queryFn: async (): Promise<OrderStatus | null> => {
      try {
        return await api.getOrderByPaymentIntent(paymentIntentId!);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      const phase = pollPhase(
        { status: data?.status ?? null, supportState: data?.support_state },
        Date.now() - startedAt
      );
      return isTerminal(phase) ? false : POLL_INTERVAL_MS;
    },
    // Each poll is a fresh snapshot; never serve stale across mounts.
    staleTime: 0,
    gcTime: 0,
  });

  const phase: PollPhase = pollPhase(
    { status: order?.status ?? null, supportState: order?.support_state },
    now - startedAt
  );
  const terminal = isTerminal(phase);

  // Tick once a second while processing so the 60s timeout transition fires even
  // if the poll result doesn't change. Stops as soon as we reach a terminal phase.
  useEffect(() => {
    if (terminal) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [terminal]);

  // A single success haptic when the eSIM lands.
  const celebrated = useRef(false);
  useEffect(() => {
    if (phase === 'success' && !celebrated.current) {
      celebrated.current = true;
      successNotify();
    }
  }, [phase]);

  const goToEsims = () => {
    lightTap();
    router.replace('/(tabs)/esims');
  };

  return (
    <Screen scroll edges={['top', 'bottom']} contentStyle={{ paddingBottom: theme.spacing.xl }}>
      {phase === 'processing' ? (
        <ProcessingState />
      ) : phase === 'timeout' ? (
        <TimeoutState onGoToEsims={goToEsims} />
      ) : phase === 'failed' ? (
        <FailedState onGoToEsims={goToEsims} />
      ) : (
        <SuccessState
          order={order!}
          flag={flag || null}
          title={title || ''}
          planLabel={planLabel || ''}
          onGoToEsims={goToEsims}
        />
      )}
    </Screen>
  );
}

// ─── Processing ─────────────────────────────────────────────────────────────

function ProcessingState() {
  const theme = useTheme();
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [pulse] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.6,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, pulse]);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.huge,
        gap: theme.spacing.lg,
      }}
    >
      <Animated.View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.accentSoft,
          opacity: reduced ? 1 : pulse,
        }}
      >
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </Animated.View>
      <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
        <Text variant="h2" center accessibilityRole="header">
          {t('orderSuccess.processingTitle')}
        </Text>
        <Text variant="body" color="textSecondary" center style={{ maxWidth: 300 }}>
          {t('orderSuccess.processingBody')}
        </Text>
      </View>
    </View>
  );
}

// ─── Success ────────────────────────────────────────────────────────────────

function SuccessState({
  order,
  flag,
  title,
  planLabel,
  onGoToEsims,
}: {
  order: OrderStatus;
  flag: string | null;
  title: string;
  planLabel: string;
  onGoToEsims: () => void;
}) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const qrUri = order.qr_code
    ? order.qr_code.startsWith('data:')
      ? order.qr_code
      : `data:image/png;base64,${order.qr_code}`
    : null;
  const manual = parseActivationFromTapLink(order.ios_tap_link);
  const canTapInstall = Platform.OS === 'ios' && !!order.ios_tap_link;

  const openTapLink = () => {
    if (!order.ios_tap_link) return;
    lightTap();
    Linking.openURL(order.ios_tap_link).catch(() => {});
  };

  return (
    <View style={{ gap: theme.spacing.lg }}>
      {/* Success header */}
      <View style={{ alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <CheckCircle2 size={56} color={theme.colors.success} />
        <Text variant="display" center accessibilityRole="header">
          {t('orderSuccess.successTitle')}
        </Text>
        <Text variant="body" color="textSecondary" center>
          {t('orderSuccess.successBody')}
        </Text>
      </View>

      {/* Plan summary */}
      {title ? (
        <Card padding="lg" radius="lg" shadow="sm">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <Flag uri={flag} size={40} />
            <View style={{ flex: 1 }}>
              <Text variant="h3" numberOfLines={1}>
                {title}
              </Text>
              {planLabel ? (
                <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
                  {planLabel}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>
      ) : null}

      {/* QR code on a white card, large enough to scan from another device */}
      {qrUri ? (
        <Card padding="lg" radius="lg" shadow="sm" style={{ alignItems: 'center' }}>
          <Text variant="h3" center>
            {t('orderSuccess.scanTitle')}
          </Text>
          <Text
            variant="bodySmall"
            color="textSecondary"
            center
            style={{ marginTop: theme.spacing.xs, marginBottom: theme.spacing.md, maxWidth: 280 }}
          >
            {t('orderSuccess.scanBody')}
          </Text>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              padding: theme.spacing.md,
              borderRadius: theme.radii.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Image
              source={{ uri: qrUri }}
              style={{ width: 220, height: 220 }}
              contentFit="contain"
              accessibilityLabel={t('orderSuccess.scanTitle')}
            />
          </View>
        </Card>
      ) : null}

      {/* iOS one-tap install */}
      {canTapInstall ? (
        <Button
          label={t('orderSuccess.installIphone')}
          onPress={openTapLink}
          accessibilityHint={t('orderSuccess.installIphoneHint')}
          icon={<Smartphone size={18} color={theme.colors.onPrimary} />}
        />
      ) : null}

      {/* Manual setup (Android + anyone who prefers it) */}
      {manual ? (
        <ManualSetup smdpAddress={manual.smdpAddress} activationCode={manual.activationCode} />
      ) : null}

      {/* Activation note */}
      <Text variant="bodySmall" color="textSecondary" center style={{ paddingHorizontal: theme.spacing.md }}>
        {t('orderSuccess.activationNote')}
      </Text>

      {/* Actions */}
      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        <Button label={t('orderSuccess.viewEsims')} onPress={onGoToEsims} />
        <Button
          label={t('orderSuccess.installGuide')}
          variant="secondary"
          onPress={() => {
            lightTap();
            router.push('/install-guide');
          }}
        />
      </View>
    </View>
  );
}

function ManualSetup({
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
        label={t('orderSuccess.installManualTitle')}
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
            {t('orderSuccess.installManualHint')}
          </Text>
          <CopyField label={t('orderSuccess.smdpLabel')} value={smdpAddress} />
          <CopyField label={t('orderSuccess.activationLabel')} value={activationCode} />
        </View>
      ) : null}
    </Card>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

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
        <Text variant="body" style={{ flex: 1, fontFamily: theme.fontFamily.medium }} numberOfLines={1}>
          {value}
        </Text>
        <Button
          label={copied ? t('orderSuccess.copied') : t('orderSuccess.copy')}
          variant="ghost"
          size="md"
          fullWidth={false}
          onPress={copy}
          accessibilityHint={t('orderSuccess.copyHint')}
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

// ─── Timeout ────────────────────────────────────────────────────────────────

function TimeoutState({ onGoToEsims }: { onGoToEsims: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <CenteredNotice
      icon={<Smartphone size={48} color={theme.colors.accent} />}
      title={t('orderSuccess.timeoutTitle')}
      body={t('orderSuccess.timeoutBody')}
    >
      <Button label={t('orderSuccess.viewEsims')} onPress={onGoToEsims} />
    </CenteredNotice>
  );
}

// ─── Failed / refunded ──────────────────────────────────────────────────────

function FailedState({ onGoToEsims }: { onGoToEsims: () => void }) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <CenteredNotice
      icon={<LifeBuoy size={48} color={theme.colors.discount} />}
      title={t('orderSuccess.failedTitle')}
      body={t('orderSuccess.failedBody')}
    >
      <Button
        label={t('orderSuccess.contactSupport')}
        onPress={() => {
          lightTap();
          router.push('/support');
        }}
      />
      <Button label={t('orderSuccess.viewEsims')} variant="secondary" onPress={onGoToEsims} />
    </CenteredNotice>
  );
}

function CenteredNotice({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ flex: 1, justifyContent: 'center', paddingVertical: theme.spacing.huge, gap: theme.spacing.lg }}
    >
      <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
        {icon}
        <Text variant="h2" center accessibilityRole="header">
          {title}
        </Text>
        <Text variant="body" color="textSecondary" center style={{ maxWidth: 320 }}>
          {body}
        </Text>
      </View>
      <View style={{ gap: theme.spacing.sm }}>{children}</View>
    </View>
  );
}
