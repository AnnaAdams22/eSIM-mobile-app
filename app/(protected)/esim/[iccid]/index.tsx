/**
 * eSIM detail — live usage, install details, order history, and a sticky Top up.
 *
 * Usage is the backend's live balance (cached 60s). When `activated_at` is null
 * the plan hasn't started — that's normal, shown as guidance (not an error) along
 * with the install details so the traveller can set the eSIM up before they fly.
 * An expired plan is stated calmly. We never render esim_passport (the backend
 * doesn't send it).
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
// (useState used below for the lazily-captured "now" in LastUpdated)
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { RefreshCw, RotateCw } from 'lucide-react-native';

import {
  Badge,
  Button,
  Card,
  ErrorState,
  Header,
  ListRow,
  PressableScale,
  Screen,
  Skeleton,
  Text,
} from '@/components/ui';
import { Flag } from '@/components/Flag';
import { InstallSection, UsageMeter } from '@/components/esim';
import { resolveGeoDisplay, formatPlanLabel, useCatalogL10n } from '@/features/catalog';
import {
  esimDisplayStatus,
  formatDataSize,
  statusTone,
  usedFraction,
} from '@/features/esims';
import { useEsim, useEsimUsage } from '@/hooks/useEsims';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { usePlans } from '@/hooks/usePlans';
import type { EsimOrder, EsimUsage } from '@/lib/api-types';
import { formatShortDate, relativeTimeParts } from '@/lib/date';
import { formatPrice } from '@/lib/price';
import { lightTap } from '@/lib/haptics';
import { useTheme } from '@/theme';

export default function EsimDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { nameResolver, regionResolvers } = useCatalogL10n();
  const { iccid } = useLocalSearchParams<{ iccid: string }>();

  const { data: detail, isLoading, isError, refetch } = useEsim(iccid);
  const {
    data: usage,
    isFetching: usageFetching,
    isError: usageIsError,
    refetch: refetchUsage,
    dataUpdatedAt: usageUpdatedAt,
  } = useEsimUsage(iccid);
  const { data: plans } = usePlans();

  // Keep usage close to real time: refetch on focus / foreground when the cached
  // reading is older than ~30s (pull-to-refresh and the refresh button still work).
  useRefreshOnFocus([
    { dataUpdatedAt: usageUpdatedAt, isFetching: usageFetching, refetch: refetchUsage },
  ]);

  if (isLoading) {
    return (
      <Screen>
        <Header title={t('esimDetail.title')} onBack={() => router.back()} />
        <Skeleton height={56} radius="lg" />
        <Skeleton height={150} radius="lg" style={{ marginTop: theme.spacing.lg }} />
        <Skeleton height={120} radius="lg" style={{ marginTop: theme.spacing.lg }} />
      </Screen>
    );
  }

  if (isError || !detail) {
    return (
      <Screen scroll={false}>
        <Header title={t('esimDetail.title')} onBack={() => router.back()} />
        <ErrorState title={t('esimDetail.errorTitle')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  const plan = plans?.find((p) => p.id === detail.plan_id) ?? null;
  const geo = resolveGeoDisplay(
    plans ?? [],
    {
      countryIso2: plan?.countryIso2,
      planType: plan?.plan_type,
      fallbackTitle: plan?.countries_included?.trim() || plan?.name || '',
    },
    { nameResolver, regionResolvers }
  );
  const planLabel = plan ? formatPlanLabel(plan, t, lang) : '';
  const status = esimDisplayStatus({ orderStatus: detail.status, usage });
  const showInstall = status === 'notActivated' && (detail.qr_code || detail.ios_tap_link);

  return (
    // Top safe-area inset so the Header clears the status bar (the sticky Top-up
    // bar below handles the bottom inset itself). Mirrors how <Screen> insets its top.
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.screenPadding,
          paddingBottom: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Header title={t('esimDetail.title')} onBack={() => router.back()} />

        {/* Identity: flag + destination + plan + status */}
        <Card padding="lg" radius="lg" shadow="sm">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <Flag uri={geo.flag} size={44} />
            <View style={{ flex: 1 }}>
              <Text variant="h3" numberOfLines={1}>
                {geo.title}
              </Text>
              {planLabel ? (
                <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
                  {planLabel}
                </Text>
              ) : null}
            </View>
            <Badge label={t(`esims.status.${status}`)} tone={statusTone(status)} />
          </View>
        </Card>

        {/* Usage */}
        <UsageCard
          status={status}
          usage={usage ?? null}
          error={usageIsError && !usage}
          onRefresh={() => {
            lightTap();
            refetchUsage();
          }}
          refreshing={usageFetching}
        />

        {/* Install (only before activation) */}
        {showInstall ? (
          <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.md }}>
            <Text variant="h2" accessibilityRole="header">
              {t('esimDetail.installTitle')}
            </Text>
            <InstallSection qrCode={detail.qr_code} iosTapLink={detail.ios_tap_link} />
          </View>
        ) : null}

        {/* Order history */}
        {detail.orders.length > 0 ? (
          <View style={{ marginTop: theme.spacing.xl }}>
            <Text
              variant="h2"
              accessibilityRole="header"
              style={{ marginBottom: theme.spacing.sm }}
            >
              {t('esimDetail.orderHistoryTitle')}
            </Text>
            <Card padding="sm" radius="lg" shadow="sm">
              {detail.orders.map((order, i) => (
                <OrderRow key={`${order.created_at}-${i}`} order={order} last={i === detail.orders.length - 1} />
              ))}
            </Card>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Top up */}
      <View
        style={{
          paddingTop: theme.spacing.md,
          paddingHorizontal: theme.layout.screenPadding,
          paddingBottom: insets.bottom + theme.spacing.md,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        }}
      >
        <Button
          label={t('esimDetail.topUp')}
          onPress={() => {
            lightTap();
            if (iccid) router.push({ pathname: '/esim/[iccid]/topup', params: { iccid } });
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function UsageCard({
  status,
  usage,
  error,
  onRefresh,
  refreshing,
}: {
  status: ReturnType<typeof esimDisplayStatus>;
  usage: EsimUsage | null;
  /** The usage request failed and there's no cached usage to show. */
  error: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const left = formatDataSize(usage?.data_left_mb, lang);
  const total = formatDataSize(usage?.data_total_mb, lang);
  const used = formatDataSize(usage?.data_used_mb, lang);
  const fraction = usage ? usedFraction(usage) : null;

  return (
    <Card padding="lg" radius="lg" shadow="sm" style={{ marginTop: theme.spacing.lg, gap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="h2" accessibilityRole="header">
          {t('esimDetail.usageTitle')}
        </Text>
        <PressableScale
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel={t('esimDetail.refresh')}
          style={{
            width: theme.layout.minTouchTarget,
            height: theme.layout.minTouchTarget,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RefreshCw
            size={18}
            color={refreshing ? theme.colors.textSecondary : theme.colors.primary}
          />
        </PressableScale>
      </View>

      {status === 'notActivated' ? (
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="h3">{t('esimDetail.notActivatedTitle')}</Text>
          <Text variant="bodySmall" color="textSecondary">
            {t('esimDetail.notActivatedBody')}
          </Text>
        </View>
      ) : error && !usage ? (
        // Usage failed to load (e.g. 503 usage_unavailable) → calm inline state
        // with a small Retry. The eSIM stays Active; the balance updates on retry.
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md }}>
          <Text variant="bodySmall" color="textSecondary" style={{ flex: 1 }}>
            {t('esimDetail.usageUnavailable')}
          </Text>
          <Button
            label={t('esimDetail.usageRetry')}
            variant="ghost"
            size="md"
            fullWidth={false}
            onPress={onRefresh}
            icon={<RotateCw size={16} color={theme.colors.primary} />}
          />
        </View>
      ) : left && total ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="h3">{t('esimDetail.dataUsedOf', { used: left, total })}</Text>
          <UsageMeter
            fraction={fraction}
            accessibilityLabel={t('esimDetail.dataUsedA11y', {
              used: used ?? left,
              total,
            })}
          />
        </View>
      ) : (
        <Text variant="bodySmall" color="textSecondary">
          {t('esimDetail.dataUnknown')}
        </Text>
      )}

      {/* Dates */}
      <View style={{ gap: theme.spacing.xxs }}>
        {usage?.activated_at ? (
          <Text variant="caption" color="textSecondary">
            {t('esimDetail.activatedOn', { date: formatShortDate(usage.activated_at, lang) })}
          </Text>
        ) : null}
        {usage?.expires_at ? (
          <Text variant="caption" color="textSecondary">
            {t(status === 'expired' ? 'esimDetail.expiredOn' : 'esimDetail.expiresOn', {
              date: formatShortDate(usage.expires_at, lang),
            })}
          </Text>
        ) : null}
        {usage?.fetched_at ? <LastUpdated fetchedAt={usage.fetched_at} /> : null}
      </View>

      {/* The network reports usage with a delay — set the right expectation. */}
      {status !== 'notActivated' ? (
        <Text variant="caption" color="textSecondary">
          {t('esimDetail.usageDelayNote')}
        </Text>
      ) : null}
    </Card>
  );
}

function LastUpdated({ fetchedAt }: { fetchedAt: string }) {
  const { t } = useTranslation();
  // Capture "now" once at mount (lazy init) — a render-time Date.now() is impure.
  const [now] = useState(() => Date.now());
  const parts = relativeTimeParts(fetchedAt, now);
  let time: string;
  switch (parts.unit) {
    case 'minutes':
      time = t('esimDetail.relativeMinutes', { count: parts.value });
      break;
    case 'hours':
      time = t('esimDetail.relativeHours', { count: parts.value });
      break;
    case 'days':
      time = t('esimDetail.relativeDays', { count: parts.value });
      break;
    default:
      time = t('esimDetail.relativeNow');
  }
  return (
    <Text variant="caption" color="textSecondary">
      {t('esimDetail.lastUpdated', { time })}
    </Text>
  );
}

function OrderRow({ order, last }: { order: EsimOrder; last: boolean }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const label = order.order_kind === 'topup' ? t('esimDetail.orderTopup') : t('esimDetail.orderPurchase');
  return (
    <ListRow
      title={label}
      subtitle={formatShortDate(order.created_at, lang) ?? ''}
      value={formatPrice(order.amount_paid_eur_cents, lang, order.amount_paid_display)}
      chevron={false}
      style={last ? undefined : { borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
    />
  );
}
