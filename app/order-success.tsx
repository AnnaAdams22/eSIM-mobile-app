/**
 * Order success — the post-payment screen, shared by new purchases and top-ups.
 *
 * Polls `GET /api/me/orders/by-payment-intent/:id` every 2s while the backend
 * provisions (a 404 means "not created yet" → still processing). The visible
 * state is decided by the pure `pollPhase` machine:
 *
 *   processing → a calm "Setting up…" state
 *   success    → purchase: QR + install details; top-up: updated balance, no QR
 *   timeout    → "Still processing, we'll email you" (after 60s)
 *   failed     → reassuring auto-refund message + support
 *
 * In `topup` mode there is no QR (the eSIM is already installed): we show the
 * refreshed usage and offer "View eSIM" / "Done". On success we invalidate the
 * eSIMs list (and, for a top-up, that eSIM's detail/usage/options) so every
 * screen reflects the new state. The user arrives via `router.replace`, so "back"
 * can't return to the paid checkout.
 */

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, LifeBuoy, Smartphone } from 'lucide-react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { Flag } from '@/components/Flag';
import { InstallSection, UsageMeter } from '@/components/esim';
import {
  POLL_INTERVAL_MS,
  isTerminal,
  pollPhase,
  type PollPhase,
} from '@/features/checkout';
import { formatDataSize, usedFraction } from '@/features/esims';
import { esimsKeys, invalidateEsim, useEsimUsage } from '@/hooks/useEsims';
import { api, ApiError } from '@/lib/api';
import type { OrderStatus } from '@/lib/api-types';
import { lightTap, successNotify } from '@/lib/haptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme';

export default function OrderSuccessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { paymentIntentId, flag, title, planLabel, mode, iccid } = useLocalSearchParams<{
    paymentIntentId?: string;
    flag?: string;
    title?: string;
    planLabel?: string;
    mode?: string;
    iccid?: string;
  }>();
  const isTopup = mode === 'topup';

  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const { data: order } = useQuery({
    queryKey: ['order-by-pi', paymentIntentId],
    enabled: !!paymentIntentId,
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
    staleTime: 0,
    gcTime: 0,
  });

  const phase: PollPhase = pollPhase(
    { status: order?.status ?? null, supportState: order?.support_state },
    now - startedAt
  );
  const terminal = isTerminal(phase);

  useEffect(() => {
    if (terminal) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [terminal]);

  // Single success haptic, and refresh every screen that shows this eSIM / the list.
  const celebrated = useRef(false);
  useEffect(() => {
    if (phase !== 'success' || celebrated.current) return;
    celebrated.current = true;
    successNotify();
    if (isTopup && iccid) {
      void invalidateEsim(queryClient, iccid);
    } else {
      void queryClient.invalidateQueries({ queryKey: esimsKeys.list });
    }
  }, [phase, isTopup, iccid, queryClient]);

  const goToEsims = () => {
    lightTap();
    router.replace('/(tabs)/esims');
  };
  const goToEsim = () => {
    lightTap();
    if (iccid) router.replace({ pathname: '/esim/[iccid]', params: { iccid } });
    else router.replace('/(tabs)/esims');
  };

  return (
    <Screen scroll edges={['top', 'bottom']} contentStyle={{ paddingBottom: theme.spacing.xl }}>
      {phase === 'processing' ? (
        <ProcessingState isTopup={isTopup} />
      ) : phase === 'timeout' ? (
        <TimeoutState isTopup={isTopup} onGoToEsims={isTopup ? goToEsim : goToEsims} />
      ) : phase === 'failed' ? (
        <FailedState isTopup={isTopup} onGoToEsims={goToEsims} />
      ) : isTopup ? (
        <TopupSuccessState
          iccid={iccid || null}
          flag={flag || null}
          title={title || ''}
          planLabel={planLabel || ''}
          onViewEsim={goToEsim}
          onDone={goToEsims}
        />
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

// ─── Plan summary card (shared) ───────────────────────────────────────────────

function PlanSummaryCard({
  flag,
  title,
  planLabel,
}: {
  flag: string | null;
  title: string;
  planLabel: string;
}) {
  const theme = useTheme();
  if (!title) return null;
  return (
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
  );
}

// ─── Processing ───────────────────────────────────────────────────────────────

function ProcessingState({ isTopup }: { isTopup: boolean }) {
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
          {t(isTopup ? 'orderSuccess.topupProcessingTitle' : 'orderSuccess.processingTitle')}
        </Text>
        <Text variant="body" color="textSecondary" center style={{ maxWidth: 300 }}>
          {t(isTopup ? 'orderSuccess.topupProcessingBody' : 'orderSuccess.processingBody')}
        </Text>
      </View>
    </View>
  );
}

// ─── Success (new purchase) ───────────────────────────────────────────────────

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

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View style={{ alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <CheckCircle2 size={56} color={theme.colors.success} />
        <Text variant="display" center accessibilityRole="header">
          {t('orderSuccess.successTitle')}
        </Text>
        <Text variant="body" color="textSecondary" center>
          {t('orderSuccess.successBody')}
        </Text>
      </View>

      <PlanSummaryCard flag={flag} title={title} planLabel={planLabel} />

      <InstallSection qrCode={order.qr_code} iosTapLink={order.ios_tap_link} />

      <Text
        variant="bodySmall"
        color="textSecondary"
        center
        style={{ paddingHorizontal: theme.spacing.md }}
      >
        {t('orderSuccess.activationNote')}
      </Text>

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

// ─── Success (top-up) ─────────────────────────────────────────────────────────

function TopupSuccessState({
  iccid,
  flag,
  title,
  planLabel,
  onViewEsim,
  onDone,
}: {
  iccid: string | null;
  flag: string | null;
  title: string;
  planLabel: string;
  onViewEsim: () => void;
  onDone: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  // Usage was invalidated on success, so this reads the fresh post-top-up balance.
  const { data: usage } = useEsimUsage(iccid, !!iccid);

  const left = formatDataSize(usage?.data_left_mb);
  const total = formatDataSize(usage?.data_total_mb);
  const fraction = usage ? usedFraction(usage) : null;

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View style={{ alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <CheckCircle2 size={56} color={theme.colors.success} />
        <Text variant="display" center accessibilityRole="header">
          {t('orderSuccess.topupSuccessTitle')}
        </Text>
        <Text variant="body" color="textSecondary" center>
          {t('orderSuccess.topupSuccessBody')}
        </Text>
      </View>

      <PlanSummaryCard flag={flag} title={title} planLabel={planLabel} />

      {left && total ? (
        <Card padding="lg" radius="lg" shadow="sm" style={{ gap: theme.spacing.sm }}>
          <Text variant="h3">{t('esimDetail.usageTitle')}</Text>
          <Text variant="bodySmall" color="textSecondary">
            {t('esimDetail.dataUsedOf', { used: left, total })}
          </Text>
          <UsageMeter
            fraction={fraction}
            accessibilityLabel={t('esimDetail.dataUsedOf', { used: left, total })}
          />
        </Card>
      ) : null}

      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        <Button label={t('orderSuccess.viewEsim')} onPress={onViewEsim} />
        <Button label={t('orderSuccess.done')} variant="secondary" onPress={onDone} />
      </View>
    </View>
  );
}

// ─── Timeout ──────────────────────────────────────────────────────────────────

function TimeoutState({ isTopup, onGoToEsims }: { isTopup: boolean; onGoToEsims: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <CenteredNotice
      icon={<Smartphone size={48} color={theme.colors.accent} />}
      title={t(isTopup ? 'orderSuccess.topupTimeoutTitle' : 'orderSuccess.timeoutTitle')}
      body={t(isTopup ? 'orderSuccess.topupTimeoutBody' : 'orderSuccess.timeoutBody')}
    >
      <Button
        label={t(isTopup ? 'orderSuccess.viewEsim' : 'orderSuccess.viewEsims')}
        onPress={onGoToEsims}
      />
    </CenteredNotice>
  );
}

// ─── Failed / refunded ────────────────────────────────────────────────────────

function FailedState({ isTopup, onGoToEsims }: { isTopup: boolean; onGoToEsims: () => void }) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <CenteredNotice
      icon={<LifeBuoy size={48} color={theme.colors.discount} />}
      title={t(isTopup ? 'orderSuccess.topupFailedTitle' : 'orderSuccess.failedTitle')}
      body={t(isTopup ? 'orderSuccess.topupFailedBody' : 'orderSuccess.failedBody')}
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
      style={{
        flex: 1,
        justifyContent: 'center',
        paddingVertical: theme.spacing.huge,
        gap: theme.spacing.lg,
      }}
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
