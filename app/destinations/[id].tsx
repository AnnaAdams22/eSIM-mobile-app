/**
 * Destination detail — a full-bleed hero photo (extending under the status bar)
 * with a translucent back button, a white sheet overlapping the photo that carries
 * the flag, name and lowest price, three feature pills on one line, a card of
 * selectable plans (soft-grey fill on the chosen row), and a sticky "Buy now · €X"
 * bar above the bottom safe area. Regional plans reuse this screen and additionally
 * list their included countries.
 *
 * "Buy now" navigates to the checkout placeholder with the selected plan id;
 * checkout itself is a later task. No prices are computed here — all display prices
 * come straight from the backend.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Globe, Smartphone, Zap } from 'lucide-react-native';

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
  destinationImage,
  formatPlanLabel,
  plansForDestination,
  plansForRegion,
  useCatalogL10n,
} from '@/features/catalog';
import { useAuth } from '@/features/auth';
import { lightTap, selectionTap } from '@/lib/haptics';
import type { Plan } from '@/lib/api-types';
import { formatPrice } from '@/lib/price';
import { useTheme, type Theme } from '@/theme';

const HERO_HEIGHT = 300;
const SHEET_OVERLAP = 24;

export default function DestinationDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const isRegion = type === 'region';

  const { data: plans, isLoading, isError, refetch } = usePlans();
  const { status } = useAuth();

  const detailPlans = useMemo(
    () => (isRegion ? plansForRegion(plans ?? [], id) : plansForDestination(plans ?? [], id)),
    [plans, id, isRegion]
  );

  const { lang, nameResolver, regionResolvers } = useCatalogL10n();

  const meta = useMemo(() => {
    if (isRegion) {
      const region = buildRegions(plans ?? [], regionResolvers).find((r) => r.key === id);
      return region
        ? {
            name: region.name,
            flag: region.flag,
            priceCents: region.lowestPriceCents,
            priceDisplay: region.lowestPriceDisplay,
            seed: region.name,
            countries: region.countries,
          }
        : null;
    }
    const dest = buildDestinations(plans ?? [], nameResolver).find((d) => d.iso2 === id.toUpperCase());
    return dest
      ? {
          name: dest.name,
          flag: dest.flag,
          priceCents: dest.lowestPriceCents,
          priceDisplay: dest.lowestPriceDisplay,
          seed: dest.continent,
          countries: [] as string[],
        }
      : null;
  }, [plans, id, isRegion, nameResolver, regionResolvers]);

  // Track the user's explicit choice; default (derived, no effect) is the first
  // plan — the cheapest/smallest after sorting.
  const [chosenId, setChosenId] = useState<string | null>(null);
  const selectedId =
    chosenId && detailPlans.some((p) => p.id === chosenId)
      ? chosenId
      : (detailPlans[0]?.id ?? null);
  const selectedPlan = detailPlans.find((p) => p.id === selectedId) ?? null;

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
    { icon: <Zap size={15} color={theme.colors.text} />, label: t('productDetail.fastInternet') },
    { icon: <Globe size={15} color={theme.colors.text} />, label: t('productDetail.noRoaming') },
    { icon: <Smartphone size={15} color={theme.colors.text} />, label: t('productDetail.easySetup') },
  ];

  const buyNow = () => {
    lightTap();
    if (!selectedId) return;
    // Buying requires an account. If signed out, send them through sign-in and
    // bring them back to this exact plan's checkout afterwards.
    if (status !== 'signedIn') {
      const redirect = `/checkout?planId=${encodeURIComponent(selectedId)}`;
      router.push({ pathname: '/(auth)/sign-in', params: { redirect } });
      return;
    }
    router.push({ pathname: '/checkout', params: { planId: selectedId } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Full-bleed hero, extending under the status bar. */}
        <HeroImage
          source={destinationImage(isRegion ? undefined : id)}
          slot="destinationDefault"
          seed={meta.seed}
          height={HERO_HEIGHT}
          radius={0}
          scrim={0.4}
          accessibilityLabel={meta.name}
        />

        {/* White sheet overlapping the photo. */}
        <View
          style={{
            marginTop: -SHEET_OVERLAP,
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radii.lg,
            borderTopRightRadius: theme.radii.lg,
            paddingHorizontal: theme.layout.screenPadding,
            paddingTop: theme.spacing.xl,
          }}
        >
          {/* Name + flag + lowest price */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <Flag uri={meta.flag} size={44} />
            <View style={{ flex: 1 }}>
              <Text variant="h1" numberOfLines={2} accessibilityRole="header" style={{ fontSize: 22, lineHeight: 28 }}>
                {meta.name}
              </Text>
              <Text variant="bodySmall" color="textSecondary" style={{ fontFamily: theme.fontFamily.medium }}>
                {t('productDetail.from', {
                  price: formatPrice(meta.priceCents, lang, meta.priceDisplay),
                })}
              </Text>
            </View>
          </View>

          {/* Feature pills — one line */}
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            {features.map((f) => (
              <View
                key={f.label}
                accessible
                accessibilityLabel={f.label}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: theme.spacing.xs,
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radii.pill,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.sm,
                }}
              >
                <View accessible={false}>{f.icon}</View>
                <Text variant="caption" dense numberOfLines={1} style={{ flexShrink: 1 }}>
                  {f.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Included countries (regions only) */}
          {isRegion && meta.countries.length > 0 ? (
            <View style={{ marginTop: theme.spacing.xl }}>
              <Text variant="h2" accessibilityRole="header" style={{ marginBottom: theme.spacing.sm }}>
                {t('productDetail.includedCountries')}
              </Text>
              <Text variant="bodySmall" color="textSecondary">
                {meta.countries.join(' · ')}
              </Text>
            </View>
          ) : null}

          {/* Available plans */}
          <Text
            variant="h2"
            accessibilityRole="header"
            style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.md }}
          >
            {t('productDetail.availablePlans')}
          </Text>

          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              padding: theme.spacing.xs,
              gap: theme.spacing.xs,
            }}
          >
            {detailPlans.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                selected={plan.id === selectedId}
                onSelect={() => {
                  selectionTap();
                  setChosenId(plan.id);
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Translucent back button over the hero (fixed, always reachable). */}
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        hitSlop={8}
        style={({ pressed }) => [
          roundGlassButton(theme),
          { position: 'absolute', left: theme.layout.screenPadding, top: insets.top + theme.spacing.sm, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <ChevronLeft size={24} color={theme.colors.text} />
      </Pressable>

      {/* Sticky Buy now bar above the bottom safe area. */}
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
          label={
            selectedPlan
              ? t('productDetail.buyNowPrice', {
                  price: formatPrice(selectedPlan.price_eur_cents, lang, selectedPlan.price_display),
                })
              : t('productDetail.buyNow')
          }
          onPress={buyNow}
          accessibilityHint={t('productDetail.buyNowHint')}
        />
      </View>
    </View>
  );
}

function roundGlassButton(theme: Theme) {
  return {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...theme.shadows.sm,
  };
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
  const { t, i18n } = useTranslation();
  const label = formatPlanLabel(plan, t, i18n.language);
  const price = formatPrice(plan.price_eur_cents, i18n.language, plan.price_display);

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${price}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: theme.layout.minTouchTarget + 8,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radii.md,
        backgroundColor: selected ? theme.colors.surfaceMuted : 'transparent',
        opacity: pressed ? 0.85 : 1,
        gap: theme.spacing.md,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, flex: 1 }}>
        {/* Radio */}
        <View
          accessible={false}
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: selected ? theme.colors.primary : theme.colors.border,
          }}
        >
          {selected ? (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: theme.colors.primary,
              }}
            />
          ) : null}
        </View>
        <Text variant="h3" dense>
          {label}
        </Text>
      </View>
      <Text variant="h3" dense style={{ fontFamily: theme.fontFamily.semibold }}>
        {price}
      </Text>
    </Pressable>
  );
}
