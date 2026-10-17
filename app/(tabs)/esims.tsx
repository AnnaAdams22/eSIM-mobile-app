/**
 * My eSIMs tab.
 *
 *   signed out → an invitation to sign in (unchanged).
 *   loading    → skeletons while the session resolves.
 *   signed in  → the eSIM list: an Active / Past segmented control, one card per
 *                eSIM, quick actions, and empty / error states.
 *
 * Active vs Past is decided from LIVE usage (see src/features/esims/classify):
 * failed/refunded and expired eSIMs are Past; everything else (including eSIMs
 * whose usage is still loading) is Active, so the list never blocks on usage.
 */

import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Headphones, Plus, Smartphone, Zap } from 'lucide-react-native';

import {
  Card,
  EmptyState,
  ErrorState,
  Header,
  PressableScale,
  Screen,
  SegmentedControl,
  Skeleton,
  Text,
} from '@/components/ui';
import { EsimCard } from '@/components/esim';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { useAuth } from '@/features/auth';
import { resolveGeoDisplay, useCatalogL10n } from '@/features/catalog';
import { classifyEsim } from '@/features/esims';
import { useEsims, useEsimUsages } from '@/hooks/useEsims';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { usePlans } from '@/hooks/usePlans';
import type { EsimListItem } from '@/lib/api-types';
import { lightTap } from '@/lib/haptics';
import { useTheme } from '@/theme';

export default function EsimsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { status } = useAuth();

  if (status === 'signedOut') {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon={<Smartphone size={44} color={theme.colors.textSecondary} />}
          title={t('auth.signedOut.esimsTitle')}
          body={t('auth.signedOut.esimsBody')}
          actionLabel={t('auth.signIn')}
          onAction={() => router.push({ pathname: '/(auth)/sign-in' })}
        />
      </Screen>
    );
  }

  if (status === 'loading') {
    return <PlaceholderScreen title={t('esims.title')} />;
  }

  return <MyEsimsList />;
}

function MyEsimsList() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const { data: items, isLoading, isError, refetch } = useEsims();
  const { data: plans } = usePlans();
  const { nameResolver, regionResolvers } = useCatalogL10n();
  const list = items ?? [];

  // One usage query per row (index-aligned with `list`); null ICCIDs are skipped.
  const usageQueries = useEsimUsages(list.map((e) => e.iccid));

  // Refresh usage on focus / foreground when a reading is older than ~30s, so the
  // list's balances stay close to real time without hammering the backend.
  useRefreshOnFocus(
    usageQueries.map((q) => ({
      dataUpdatedAt: q?.dataUpdatedAt ?? 0,
      isFetching: q?.isFetching ?? false,
      refetch: () => q?.refetch?.(),
    }))
  );

  const [segment, setSegment] = useState<'active' | 'past'>('active');
  const [refreshing, setRefreshing] = useState(false);

  // A simple signature that changes whenever any usage result updates — data
  // arriving, an error landing, or a fetch starting/stopping — so the view-model
  // recomputes (exhaustive-deps wants a plain expression, not a .map() in deps).
  const usageSig = usageQueries
    .map((q) => `${q?.dataUpdatedAt ?? 0}:${q?.errorUpdatedAt ?? 0}:${q?.fetchStatus ?? ''}`)
    .join(',');

  // Build a view-model per eSIM: resolved flag/title, live usage, and bucket.
  const rows = useMemo(
    () =>
      list.map((item, i) => {
        const q = usageQueries[i];
        const usage = q?.data ?? null;
        const hasIccid = Boolean(item.iccid);
        const geo = resolveGeoDisplay(
          plans ?? [],
          {
            countryIso2: item.plan?.countryIso2,
            planType: item.plan?.plan_type,
            fallbackTitle: item.plan?.country?.trim() || item.plan?.name || '',
          },
          { nameResolver, regionResolvers }
        );
        return {
          key: rowKey(item, i),
          item,
          usage,
          // In flight = first load or a retry; error = failed with no cached usage.
          usageLoading: hasIccid && (q?.isFetching ?? false) && !usage,
          usageError: hasIccid && (q?.isError ?? false) && !usage,
          onRetryUsage: () => void q?.refetch?.(),
          flag: geo.flag,
          title: geo.title,
          bucket: classifyEsim({ orderStatus: item.status, usage }),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list, plans, usageSig, nameResolver, regionResolvers]
  );

  const active = rows.filter((r) => r.bucket === 'active');
  const past = rows.filter((r) => r.bucket === 'past');
  const shown = segment === 'active' ? active : past;

  const firstActiveIccid = active.find((r) => r.item.iccid)?.item.iccid ?? null;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), ...usageQueries.map((q) => q?.refetch?.())]);
    } finally {
      setRefreshing(false);
    }
  };

  const goTopUp = (iccid: string) => {
    lightTap();
    router.push({ pathname: '/esim/[iccid]/topup', params: { iccid } });
  };
  const goDetails = (iccid: string) => {
    lightTap();
    router.push({ pathname: '/esim/[iccid]', params: { iccid } });
  };

  // ─── Loading / error / empty ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <Screen>
        <Header title={t('esims.title')} showBack={false} />
        <Skeleton height={44} radius="pill" />
        <Skeleton height={168} radius="lg" style={{ marginTop: theme.spacing.lg }} />
        <Skeleton height={168} radius="lg" style={{ marginTop: theme.spacing.lg }} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen scroll={false}>
        <Header title={t('esims.title')} showBack={false} />
        <ErrorState
          title={t('esims.errorTitle')}
          body={t('esims.errorBody')}
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  if (list.length === 0) {
    return (
      <Screen scroll={false}>
        <Header title={t('esims.title')} showBack={false} />
        <EmptyState
          icon={<Smartphone size={44} color={theme.colors.textSecondary} />}
          title={t('esims.emptyTitle')}
          body={t('esims.emptyBody')}
          actionLabel={t('esims.emptyAction')}
          onAction={() => {
            lightTap();
            router.push('/destinations');
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Header title={t('esims.title')} showBack={false} />

      <SegmentedControl
        value={segment}
        onChange={(v) => {
          lightTap();
          setSegment(v as 'active' | 'past');
        }}
        options={[
          { value: 'active', label: t('esims.segments.active') },
          { value: 'past', label: t('esims.segments.past') },
        ]}
      />

      <View style={{ gap: theme.spacing.lg, marginTop: theme.spacing.lg }}>
        {shown.length === 0 ? (
          <EmptyState
            icon={<Smartphone size={40} color={theme.colors.textSecondary} />}
            title={t(segment === 'active' ? 'esims.emptyTitle' : 'esims.emptyPastTitle')}
            body={t(segment === 'active' ? 'esims.emptyBody' : 'esims.emptyPastBody')}
            actionLabel={segment === 'active' ? t('esims.emptyAction') : undefined}
            onAction={
              segment === 'active'
                ? () => {
                    lightTap();
                    router.push('/destinations');
                  }
                : undefined
            }
          />
        ) : (
          shown.map((r) => (
            <EsimCard
              key={r.key}
              item={r.item}
              usage={r.usage}
              usageLoading={r.usageLoading}
              usageError={r.usageError}
              onRetryUsage={r.onRetryUsage}
              flag={r.flag}
              title={r.title}
              onViewDetails={() => r.item.iccid && goDetails(r.item.iccid)}
              onTopUp={() => r.item.iccid && goTopUp(r.item.iccid)}
            />
          ))
        )}
      </View>

      {/* Quick actions */}
      <Text
        variant="h2"
        accessibilityRole="header"
        style={{ marginTop: theme.spacing.xxl, marginBottom: theme.spacing.md }}
      >
        {t('esims.quickActions')}
      </Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <QuickAction
          icon={<Plus size={22} color={theme.colors.primary} />}
          label={t('esims.addEsim')}
          onPress={() => {
            lightTap();
            router.push('/destinations');
          }}
        />
        <QuickAction
          icon={<Zap size={22} color={theme.colors.primary} />}
          label={t('esims.topUp')}
          onPress={() => {
            lightTap();
            if (firstActiveIccid) {
              router.push({ pathname: '/esim/[iccid]/topup', params: { iccid: firstActiveIccid } });
            } else {
              router.push('/destinations');
            }
          }}
        />
        <QuickAction
          icon={<Headphones size={22} color={theme.colors.primary} />}
          label={t('esims.support')}
          onPress={() => {
            lightTap();
            router.push('/support');
          }}
        />
      </View>
    </Screen>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ flex: 1 }}
    >
      <Card padding="md" radius="lg" shadow="sm" style={{ alignItems: 'center', gap: theme.spacing.sm }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surfaceMuted,
          }}
        >
          {icon}
        </View>
        <Text variant="caption" center dense numberOfLines={1}>
          {label}
        </Text>
      </Card>
    </PressableScale>
  );
}

/** A stable key: ICCID for real eSIMs, else the (unique) in-progress order time. */
function rowKey(item: EsimListItem, index: number): string {
  return item.iccid ?? `pending-${item.created_at}-${index}`;
}
