/**
 * Top-up options for one eSIM.
 *
 * The app only ever ADDS data to the current plan (the backend marks these
 * `accumulates: true`): there is no "replace your plan" path any more. We list the
 * same-plan "Add data to your current plan" options; a traveller who wants a
 * DIFFERENT plan is pointed at buying a NEW eSIM through the normal purchase flow,
 * so their current eSIM stays on the phone alongside it. If the plan can't be
 * topped up at all (e.g. it was delisted), only the buy-a-new-eSIM action shows.
 */

import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Card,
  ErrorState,
  Header,
  PressableScale,
  Screen,
  Skeleton,
  Text,
} from '@/components/ui';
import { formatPlanLabel, newEsimRouteForPlan } from '@/features/catalog';
import { formatDataSize } from '@/features/esims';
import { formatPrice } from '@/lib/price';
import { useTopupOptions } from '@/hooks/useEsims';
import { usePlans } from '@/hooks/usePlans';
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
  const { data: plans } = usePlans();

  // Only same-plan "add data" options — never a plan replacement.
  const addOptions = (data?.options ?? []).filter((o) => o.accumulates);

  const goCheckout = (option: TopupOption) => {
    lightTap();
    router.push({ pathname: '/checkout', params: { planId: option.id, iccid } });
  };

  const goBuyNew = () => {
    lightTap();
    const currentPlan = plans?.find((p) => p.id === data?.current.plan_id) ?? null;
    router.push(newEsimRouteForPlan(currentPlan));
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

      {addOptions.length > 0 ? (
        <>
          <Text
            variant="h2"
            accessibilityRole="header"
            style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.md }}
          >
            {t('topup.addDataTitle')}
          </Text>
          <View style={{ gap: theme.spacing.md }}>
            {addOptions.map((option) => (
              <OptionCard key={option.id} option={option} onSelect={() => goCheckout(option)} />
            ))}
          </View>
          <DifferentPlanCard onBuyNew={goBuyNew} />
        </>
      ) : (
        <NoAddData onBuyNew={goBuyNew} />
      )}
    </Screen>
  );
}

function CurrentPlanCard({ current }: { current: TopupCurrent }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const left = formatDataSize(current.data_left_mb, lang);
  const expiry = current.is_expired
    ? t('topup.expired')
    : current.expires_at
      ? t('topup.expires', { date: formatShortDate(current.expires_at, lang) })
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
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const label = formatPlanLabel(option, t, lang);

  return (
    <PressableScale
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={t('topup.selectOption', { plan: label })}
    >
      <Card padding="lg" radius="lg" shadow="sm" style={{ gap: theme.spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text variant="h3" numberOfLines={1}>
              {label}
            </Text>
          </View>
          <Text variant="h3" style={{ fontFamily: theme.fontFamily.semibold }}>
            {formatPrice(option.price_eur_cents, lang, option.price_display)}
          </Text>
        </View>
        <Text variant="caption" color="textSecondary">
          {t('topup.addDataCardHint')}
        </Text>
      </Card>
    </PressableScale>
  );
}

/** Secondary action shown under the add-data options: buy a different plan as a new eSIM. */
function DifferentPlanCard({ onBuyNew }: { onBuyNew: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Card
      padding="lg"
      radius="lg"
      style={{ marginTop: theme.spacing.xl, gap: theme.spacing.sm, backgroundColor: theme.colors.surfaceMuted }}
    >
      <Text variant="h3">{t('topup.differentPlanTitle')}</Text>
      <Text variant="bodySmall" color="textSecondary">
        {t('topup.differentPlanBody')}
      </Text>
      <Button
        label={t('topup.buyNewEsim')}
        variant="secondary"
        onPress={onBuyNew}
        style={{ marginTop: theme.spacing.xs }}
      />
    </Card>
  );
}

/** Shown when the current plan has no same-plan top-up available. */
function NoAddData({ onBuyNew }: { onBuyNew: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Card padding="lg" radius="lg" shadow="sm" style={{ marginTop: theme.spacing.xl, gap: theme.spacing.sm }}>
      <Text variant="h3" accessibilityRole="header">
        {t('topup.noAddDataTitle')}
      </Text>
      <Text variant="bodySmall" color="textSecondary">
        {t('topup.noAddDataBody')}
      </Text>
      <Button
        label={t('topup.buyNewEsim')}
        onPress={onBuyNew}
        style={{ marginTop: theme.spacing.xs }}
      />
    </Card>
  );
}
