/**
 * Home tab — brand header, greeting, a search entry that opens the destinations
 * list, a hero card sized from the live catalog, and a short "Popular
 * destinations" list. Public catalog only (no auth).
 */

import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react-native';

import {
  Card,
  ErrorState,
  ListRow,
  Logo,
  Screen,
  SearchBar,
  Skeleton,
  Text,
} from '@/components/ui';
import { Flag } from '@/components/Flag';
import { HeroImage } from '@/components/HeroImage';
import { usePlans } from '@/hooks/usePlans';
import {
  buildDestinations,
  roundedDestinationCount,
  POPULAR_DESTINATIONS,
  POPULAR_DESTINATIONS_LIMIT,
  type Destination,
} from '@/features/catalog';
import { useTheme } from '@/theme';

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

  const heroCount = roundedDestinationCount(destinations);

  const openDestinations = (params?: Record<string, string>) =>
    router.push({ pathname: '/destinations', params });

  return (
    <Screen>
      {/* Brand header (bell omitted for now, per task). */}
      <View style={{ minHeight: 44, justifyContent: 'center' }}>
        <Logo variant="full" size={28} />
      </View>

      {/* Greeting */}
      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.xxs }}>
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
        <Skeleton height={150} radius="lg" style={{ marginTop: theme.spacing.xl }} />
      ) : !isError ? (
        <Pressable
          onPress={() => openDestinations()}
          accessibilityRole="button"
          accessibilityLabel={t('home.heroTitle', { count: heroCount })}
          accessibilityHint={t('home.heroHint')}
          style={{ marginTop: theme.spacing.xl }}
        >
          <HeroImage slot="home" seed="home" height={150}>
            <View style={{ gap: theme.spacing.md }}>
              <Text variant="h2" color="onPrimary" style={{ maxWidth: '80%' }}>
                {t('home.heroTitle', { count: heroCount })}
              </Text>
              <View
                accessible={false}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowRight size={20} color={theme.colors.primary} />
              </View>
            </View>
          </HeroImage>
        </Pressable>
      ) : null}

      {/* Popular destinations */}
      <View
        style={{
          marginTop: theme.spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.sm,
        }}
      >
        <Text variant="h3" accessibilityRole="header">
          {t('home.popularTitle')}
        </Text>
        <Text
          variant="bodySmall"
          color="accent"
          onPress={() => openDestinations()}
          accessibilityRole="link"
          accessibilityLabel={t('home.seeAll')}
        >
          {t('home.seeAll')}
        </Text>
      </View>

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
              <Skeleton width={36} height={36} radius="pill" />
              <Skeleton width={120} height={16} />
            </View>
          ))}
        </Card>
      ) : popular.length > 0 ? (
        <Card padding="xs">
          {popular.map((dest, i) => (
            <View key={dest.iso2}>
              {i > 0 ? (
                <View style={{ height: 1, backgroundColor: theme.colors.border, marginLeft: 52 }} />
              ) : null}
              <ListRow
                title={dest.name}
                value={t('destinations.from', { price: dest.lowestPriceDisplay })}
                leading={<Flag uri={dest.flag} />}
                onPress={() =>
                  router.push({ pathname: '/destinations/[id]', params: { id: dest.iso2 } })
                }
                accessibilityHint={t('destinations.rowHint')}
                style={{ paddingHorizontal: theme.spacing.sm }}
              />
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
