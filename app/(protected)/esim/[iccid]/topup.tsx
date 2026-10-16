/**
 * Top-up options for one eSIM.
 *
 * Lists the backend's options with the same-plan "adds to your current plan"
 * option first, then same-geography plans that "replace your current plan".
 * Choosing a replacing option while the current plan is still live with data
 * prompts a confirmation (the remaining data would be lost) before handing off to
 * the shared Checkout screen in top-up mode. Checkout still re-checks with the
 * backend, so a last-moment state change is handled there too.
 */

import { Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Header,
  PressableScale,
  Screen,
  Skeleton,
  Text,
} from '@/components/ui';
import { formatPlanLabel } from '@/features/catalog';
import { formatDataSize, needsReplaceConfirm } from '@/features/esims';
import { useTopupOptions } from '@/hooks/useEsims';
import type { TopupCurrent, TopupOption } from '@/lib/api-types';
import { formatShortDate } from '@/lib/date';
import { lightTap } from '@/lib/haptics';
import { useTheme } from '@/theme';

export default function TopupOptionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { iccid } = useLocalSearchParams<{ iccid: string }>();

  const { data, isLoading, isError, refetch } = useTopupOptions(iccid);

  const goCheckout = (option: TopupOption) => {
    router.push({
      pathname: '/checkout',
      params: {
        planId: option.id,
        iccid,
        // A replace is pre-accepted here; an accumulate doesn't need the flag.
        ...(option.replaces_current ? { acceptReplace: 'true' } : {}),
      },
    });
  };

  const onSelect = (option: TopupOption) => {
    lightTap();
    const current = data?.current;
    const mustConfirm =
      option.replaces_current &&
      needsReplaceConfirm({
        replacesCurrent: true,
        dataLeftMb: current?.data_left_mb,
        isExpired: current?.is_expired,
      });

    if (!mustConfirm) {
      goCheckout(option);
      return;
    }

    const amount = formatDataSize(current?.data_left_mb);
    const date = formatShortDate(current?.expires_at);
    const body =
      amount && date
        ? t('topup.confirmBody', { amount, date })
        : t('topup.confirmBodyNoDate');
    Alert.alert(t('topup.confirmTitle'), body, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('topup.confirmReplace'), style: 'destructive', onPress: () => goCheckout(option) },
    ]);
  };

  if (isLoading) {
    return (
      <Screen>
        <Header title={t('topup.title')} onBack={() => router.back()} />
        <Skeleton height={96} radius="lg" />
        <Skeleton height={72} radius="lg" style={{ marginTop: theme.spacing.lg }} />
        <Skeleton height={72} radius="lg" style={{ marginTop: theme.spacing.md }} />
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen scroll={false}>
        <Header title={t('topup.title')} onBack={() => router.back()} />
        <ErrorState title={t('topup.errorTitle')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={t('topup.title')} onBack={() => router.back()} />

      <CurrentPlanCard current={data.current} />

      <Text
        variant="h2"
        accessibilityRole="header"
        style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.md }}
      >
        {t('topup.chooseTitle')}
      </Text>

      {data.options.length === 0 ? (
        <EmptyState title={t('topup.emptyTitle')} body={t('topup.emptyBody')} />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {data.options.map((option) => (
            <OptionCard key={option.id} option={option} onSelect={() => onSelect(option)} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function CurrentPlanCard({ current }: { current: TopupCurrent }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const left = formatDataSize(current.data_left_mb);
  const expiry = current.is_expired
    ? t('topup.expired')
    : current.expires_at
      ? t('topup.expires', { date: formatShortDate(current.expires_at) })
      : null;

  return (
    <Card padding="lg" radius="lg" shadow="sm" style={{ gap: theme.spacing.xs }}>
      <Text variant="caption" color="textSecondary" dense>
        {t('topup.currentPlanTitle')}
      </Text>
      {current.plan_name ? (
        <Text variant="h3" numberOfLines={1}>
          {current.plan_name}
        </Text>
      ) : null}
      <Text variant="bodySmall" color="textSecondary">
        {left ? t('topup.dataLeft', { amount: left }) : t('topup.dataLeftUnknown')}
        {expiry ? ` · ${expiry}` : ''}
      </Text>
    </Card>
  );
}

function OptionCard({ option, onSelect }: { option: TopupOption; onSelect: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const label = formatPlanLabel(option, t);

  return (
    <PressableScale
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={t('topup.selectOption', { plan: label })}
    >
      <Card padding="lg" radius="lg" shadow="sm" style={{ gap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text variant="h3" numberOfLines={1}>
              {label}
            </Text>
          </View>
          <Text variant="h3" style={{ fontFamily: theme.fontFamily.semibold }}>
            {option.price_display}
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Badge
            label={option.accumulates ? t('topup.addsToPlan') : t('topup.replacesPlan')}
            tone={option.accumulates ? 'success' : 'neutral'}
          />
        </View>
      </Card>
    </PressableScale>
  );
}
