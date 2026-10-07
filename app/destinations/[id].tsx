/**
 * Destination detail — hero, country/region name + flag, lowest price, the three
 * feature pills, a selectable list of available plans, and a sticky "Buy now"
 * button. Regional plans reuse this screen and additionally list their included
 * countries.
 *
 * "Buy now" navigates to the checkout placeholder with the selected plan id;
 * checkout itself is a later task. No prices are computed here — all display
 * prices come straight from the backend.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check, Globe, Smartphone, Zap } from 'lucide-react-native';

import {
  Button,
  EmptyState,
  ErrorState,
  Header,
  Screen,
  Skeleton,
  Text,
} from '@/components/ui';
import { Flag } from '@/components/Flag';
import { HeroImage } from '@/components/HeroImage';
import { usePlans } from '@/hooks/usePlans';
import {
  buildDestinations,
  buildRegions,
  formatPlanLabel,
  plansForDestination,
  plansForRegion,
} from '@/features/catalog';
import type { Plan } from '@/lib/api-types';
import { useTheme } from '@/theme';

export default function DestinationDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const isRegion = type === 'region';

  const { data: plans, isLoading, isError, refetch } = usePlans();

  const detailPlans = useMemo(
    () => (isRegion ? plansForRegion(plans ?? [], id) : plansForDestination(plans ?? [], id)),
    [plans, id, isRegion]
  );

  const meta = useMemo(() => {
    if (isRegion) {
      const region = buildRegions(plans ?? []).find((r) => r.key === id);
      return region
        ? { name: region.name, flag: region.flag, price: region.lowestPriceDisplay, seed: region.name, countries: region.countries }
        : null;
    }
    const dest = buildDestinations(plans ?? []).find((d) => d.iso2 === id.toUpperCase());
    return dest
      ? { name: dest.name, flag: dest.flag, price: dest.lowestPriceDisplay, seed: dest.continent, countries: [] as string[] }
      : null;
  }, [plans, id, isRegion]);

  // Track the user's explicit choice; default (derived, no effect) is the first
  // plan — the cheapest/smallest after sorting.
  const [chosenId, setChosenId] = useState<string | null>(null);
  const selectedId =
    chosenId && detailPlans.some((p) => p.id === chosenId)
      ? chosenId
      : (detailPlans[0]?.id ?? null);

  if (isError) {
    return (
      <Screen scroll={false}>
        <Header />
        <ErrorState onRetry={() => refetch()} />
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen>
        <Header />
        <Skeleton height={160} radius="lg" />
        <Skeleton width={160} height={24} style={{ marginTop: theme.spacing.lg }} />
        <Skeleton width={100} height={16} style={{ marginTop: theme.spacing.sm }} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={60} radius="md" style={{ marginTop: theme.spacing.md }} />
        ))}
      </Screen>
    );
  }

  if (!meta || detailPlans.length === 0) {
    return (
      <Screen scroll={false}>
        <Header />
        <EmptyState
          title={meta ? t('productDetail.noPlansTitle') : t('productDetail.notFoundTitle')}
          body={meta ? t('productDetail.noPlansBody') : t('productDetail.notFoundBody')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const features = [
    { icon: <Zap size={16} color={theme.colors.text} />, label: t('productDetail.fastInternet') },
    { icon: <Globe size={16} color={theme.colors.text} />, label: t('productDetail.noRoaming') },
    { icon: <Smartphone size={16} color={theme.colors.text} />, label: t('productDetail.easySetup') },
  ];

  const buyNow = () => {
    if (selectedId) router.push({ pathname: '/checkout', params: { planId: selectedId } });
  };

  return (
    <Screen scroll={false} contentStyle={{ paddingBottom: 0 }}>
      <Header />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <HeroImage
          slot="destinationDefault"
          seed={meta.seed}
          height={160}
          accessibilityLabel={meta.name}
        />

        {/* Name + flag + lowest price */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
            marginTop: theme.spacing.lg,
          }}
        >
          <Flag uri={meta.flag} size={40} />
          <View style={{ flex: 1 }}>
            <Text variant="h1" numberOfLines={2} accessibilityRole="header">
              {meta.name}
            </Text>
            <Text variant="bodySmall" color="textSecondary">
              {t('productDetail.from', { price: meta.price })}
            </Text>
          </View>
        </View>

        {/* Feature pills */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing.sm,
            marginTop: theme.spacing.lg,
          }}
        >
          {features.map((f) => (
            <View
              key={f.label}
              accessible
              accessibilityLabel={f.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.xs,
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radii.pill,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
              }}
            >
              <View accessible={false}>{f.icon}</View>
              <Text variant="caption">{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Included countries (regions only) */}
        {isRegion && meta.countries.length > 0 ? (
          <View style={{ marginTop: theme.spacing.xl }}>
            <Text variant="h3" accessibilityRole="header" style={{ marginBottom: theme.spacing.sm }}>
              {t('productDetail.includedCountries')}
            </Text>
            <Text variant="body" color="textSecondary">
              {meta.countries.join(' · ')}
            </Text>
          </View>
        ) : null}

        {/* Available plans */}
        <Text
          variant="h3"
          accessibilityRole="header"
          style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.md }}
        >
          {t('productDetail.availablePlans')}
        </Text>

        <View style={{ gap: theme.spacing.sm }}>
          {detailPlans.map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              selected={plan.id === selectedId}
              onSelect={() => setChosenId(plan.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Sticky Buy now */}
      <View
        style={{
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.md,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        }}
      >
        <Button
          label={t('productDetail.buyNow')}
          onPress={buyNow}
          accessibilityHint={t('productDetail.buyNowHint')}
        />
      </View>
    </Screen>
  );
}

function PlanRow({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const label = formatPlanLabel(plan, t);

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${plan.price_display}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: theme.layout.minTouchTarget + 10,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radii.md,
        borderWidth: 1.5,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? theme.colors.surface : theme.colors.background,
        gap: theme.spacing.md,
        ...(selected ? theme.shadows.sm : null),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 }}>
        <View
          accessible={false}
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: selected ? 0 : 1.5,
            borderColor: theme.colors.border,
            backgroundColor: selected ? theme.colors.primary : 'transparent',
          }}
        >
          {selected ? <Check size={13} color={theme.colors.onPrimary} /> : null}
        </View>
        <Text variant="h3">{label}</Text>
      </View>
      <Text variant="h3">{plan.price_display}</Text>
    </Pressable>
  );
}
