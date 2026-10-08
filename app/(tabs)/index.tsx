/**
 * Home tab — brand header, greeting, a search entry that opens the destinations
 * list, a photo hero sized from the live catalog, a "Popular destinations" card
 * with photo thumbnails, an "Explore regions" carousel, and a "How it works"
 * strip. Public catalog only (no auth).
 */

import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronRight, Globe, Smartphone, Wifi } from 'lucide-react-native';

import {
  Card,
  ErrorState,
  Logo,
  PressableScale,
  Screen,
  SearchBar,
  Skeleton,
  Text,
} from '@/components/ui';
import { DestinationThumb } from '@/components/DestinationThumb';
import { HeroImage } from '@/components/HeroImage';
import { usePlans } from '@/hooks/usePlans';
import {
  buildDestinations,
  continentCounts,
  roundedDestinationCount,
  FILTERABLE_CONTINENTS,
  POPULAR_DESTINATIONS,
  POPULAR_DESTINATIONS_LIMIT,
  type Destination,
} from '@/features/catalog';
import { useTheme, type Theme } from '@/theme';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: plans, isLoading, isError, refetch } = usePlans();

  const destinations = useMemo(() => buildDestinations(plans ?? []), [plans]);

  const popular = useMemo(() => {
    const byIso = new Map(destinations.map((d) => [d.iso2, d]));
    return POPULAR_DESTINATIONS.map((iso2) => byIso.get(iso2))
      .filter((d): d is Destination => !!d)
      .slice(0, POPULAR_DESTINATIONS_LIMIT);
  }, [destinations]);

  const regions = useMemo(() => {
    const counts = continentCounts(destinations);
    return FILTERABLE_CONTINENTS.filter((c) => (counts[c] ?? 0) > 0).map((c) => ({
      continent: c,
      count: Math.floor((counts[c] ?? 0) / 10) * 10 || counts[c],
    }));
  }, [destinations]);

  const heroCount = roundedDestinationCount(destinations);

  const openDestinations = (params?: Record<string, string>) =>
    router.push({ pathname: '/destinations', params });

  return (
    <Screen edges={['top']}>
      {/* Brand header */}
      <View style={{ minHeight: 44, justifyContent: 'center', marginBottom: theme.spacing.xs }}>
        <Logo variant="full" size={40} />
      </View>

      {/* Greeting */}
      <View style={{ gap: theme.spacing.xxs }}>
        <Text variant="display">{t('home.greetingGuest')}</Text>
        <Text variant="body" color="textSecondary">
          {t('home.subtitle')}
        </Text>
      </View>

      {/* Search entry — tapping navigates to the list with search focused. */}
      <Pressable
        onPress={() => openDestinations({ focus: '1' })}
        accessibilityRole="search"
        accessibilityLabel={t('home.searchPlaceholder')}
        accessibilityHint={t('home.searchHint')}
        style={{ marginTop: theme.spacing.lg }}
      >
        <View pointerEvents="none">
          <SearchBar value="" onChangeText={() => {}} placeholder={t('home.searchPlaceholder')} />
        </View>
      </Pressable>

      {/* Hero card */}
      {isLoading ? (
        <Skeleton height={160} radius="lg" style={{ marginTop: theme.spacing.xl }} />
      ) : !isError ? (
        <PressableScale
          onPress={() => openDestinations()}
          haptic
          accessibilityRole="button"
          accessibilityLabel={t('home.heroTitle', { count: heroCount })}
          accessibilityHint={t('home.heroHint')}
          style={{ marginTop: theme.spacing.xl }}
        >
          <HeroImage slot="home" seed="home" height={168}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: theme.spacing.md,
              }}
            >
              <Text variant="h2" color="onPrimary" style={{ flex: 1, fontSize: 22, lineHeight: 28 }}>
                {t('home.heroTitle', { count: heroCount })}
              </Text>
              <View accessible={false} style={roundButton(theme)}>
                <ArrowRight size={20} color={theme.colors.primary} />
              </View>
            </View>
          </HeroImage>
        </PressableScale>
      ) : null}

      {/* Popular destinations */}
      <SectionHeader
        title={t('home.popularTitle')}
        action={t('home.seeAll')}
        onAction={() => openDestinations()}
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Card padding="xs">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.md,
                padding: theme.spacing.sm,
              }}
            >
              <Skeleton width={52} height={52} radius="md" />
              <View style={{ gap: theme.spacing.xs }}>
                <Skeleton width={120} height={15} />
                <Skeleton width={72} height={12} />
              </View>
            </View>
          ))}
        </Card>
      ) : popular.length > 0 ? (
        <Card padding="xs">
          {popular.map((dest, i) => (
            <View key={dest.iso2}>
              {i > 0 ? (
                <View style={{ height: 1, backgroundColor: theme.colors.border, marginLeft: 64 }} />
              ) : null}
              <PopularRow
                dest={dest}
                onPress={() =>
                  router.push({ pathname: '/destinations/[id]', params: { id: dest.iso2 } })
                }
              />
            </View>
          ))}
        </Card>
      ) : null}

      {/* Explore regions carousel */}
      {!isError && (isLoading || regions.length > 0) ? (
        <>
          <SectionHeader title={t('home.exploreRegionsTitle')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -theme.layout.screenPadding }}
            contentContainerStyle={{
              gap: theme.spacing.md,
              paddingHorizontal: theme.layout.screenPadding,
            }}
          >
            {isLoading
              ? [0, 1, 2].map((i) => <Skeleton key={i} width={150} height={100} radius="md" />)
              : regions.map((r) => (
                  <PressableScale
                    key={r.continent}
                    onPress={() =>
                      router.push({ pathname: '/destinations', params: { continent: r.continent } })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${t(`continents.${r.continent}`)}, ${t('explore.destinationCount', { count: r.count })}`}
                    accessibilityHint={t('explore.cardHint')}
                  >
                    <HeroImage
                      slot={`continent:${r.continent}`}
                      seed={r.continent}
                      width={150}
                      height={100}
                      radius="md"
                      contentPadding="md"
                    >
                      <Text variant="h3" color="onPrimary" dense numberOfLines={1}>
                        {t(`continents.${r.continent}`)}
                      </Text>
                      <Text variant="caption" color="onPrimary" dense>
                        {t('explore.destinationCount', { count: r.count })}
                      </Text>
                    </HeroImage>
                  </PressableScale>
                ))}
          </ScrollView>
        </>
      ) : null}

      {/* How it works */}
      <SectionHeader title={t('home.howItWorks.title')} />
      <Card>
        {HOW_IT_WORKS.map((step, i) => (
          <View key={step.key}>
            {i > 0 ? (
              <View
                style={{
                  height: 1,
                  backgroundColor: theme.colors.border,
                  marginVertical: theme.spacing.md,
                  marginLeft: 52,
                }}
              />
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
              <View style={stepIcon(theme)}>
                <step.Icon size={20} color={theme.colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="h3">{t(step.title)}</Text>
                <Text variant="bodySmall" color="textSecondary">
                  {t(step.body)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const HOW_IT_WORKS = [
  { key: 'choose', Icon: Globe, title: 'home.howItWorks.step1Title', body: 'home.howItWorks.step1Body' },
  { key: 'install', Icon: Smartphone, title: 'home.howItWorks.step2Title', body: 'home.howItWorks.step2Body' },
  { key: 'connect', Icon: Wifi, title: 'home.howItWorks.step3Title', body: 'home.howItWorks.step3Body' },
] as const;

function roundButton(theme: Theme) {
  return {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...theme.shadows.sm,
  };
}

function stepIcon(theme: Theme) {
  return {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text variant="h2" accessibilityRole="header">
        {title}
      </Text>
      {action && onAction ? (
        <Text
          variant="bodySmall"
          color="accent"
          onPress={onAction}
          accessibilityRole="link"
          accessibilityLabel={action}
        >
          {action}
        </Text>
      ) : null}
    </View>
  );
}

function PopularRow({ dest, onPress }: { dest: Destination; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${dest.name}, ${t('destinations.from', { price: dest.lowestPriceDisplay })}`}
      accessibilityHint={t('destinations.rowHint')}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
      }}
    >
      <DestinationThumb iso2={dest.iso2} flag={dest.flag} size={52} />
      <View style={{ flex: 1 }}>
        <Text variant="h3" numberOfLines={1}>
          {dest.name}
        </Text>
        <Text variant="bodySmall" color="textSecondary" dense>
          {t('destinations.from', { price: dest.lowestPriceDisplay })}
        </Text>
      </View>
      <ChevronRight size={20} color={theme.colors.textSecondary} />
    </PressableScale>
  );
}
