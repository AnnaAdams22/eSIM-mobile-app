/**
 * Destinations list — searchable, continent-filtered list of every country in the
 * catalog, plus a "Regions" filter for regional plans. Uses an optimised FlatList
 * so it scrolls smoothly through ~200 countries.
 *
 * The search + filter chips stay pinned above the list (a soft divider/shadow
 * appears once the list is scrolled). The chip row is horizontally scrollable with
 * a soft fade at its trailing edge.
 *
 * (FlashList is intentionally not used: it is not guaranteed to be bundled in
 * Expo Go, and the task permits an optimised FlatList — see the report.)
 */

import { memo, useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  Chip,
  EmptyState,
  ErrorState,
  Header,
  ListRow,
  Screen,
  SearchBar,
  Skeleton,
} from '@/components/ui';
import { Flag } from '@/components/Flag';
import { usePlans } from '@/hooks/usePlans';
import {
  buildDestinations,
  buildRegions,
  filterDestinations,
  filterRegions,
  FILTERABLE_CONTINENTS,
  useCatalogL10n,
  type Destination,
  type Region,
} from '@/features/catalog';
import { formatPrice } from '@/lib/price';
import { useTheme, type Theme } from '@/theme';

const ALL = 'all';
const REGIONS = 'regions';
const FLAG_SIZE = 34;
/** Left inset for row separators so they align under the row text, not the flag. */
const SEPARATOR_INSET = FLAG_SIZE + 12;

/**
 * Memoised list rows. With stable `onPress`/`value`/`hint` props they skip
 * re-rendering when the screen re-renders for unrelated reasons (scroll shadow,
 * filter chips), keeping the ~200-row list smooth.
 */
const DestinationRow = memo(function DestinationRow({
  item,
  value,
  hint,
  onPress,
}: {
  item: Destination;
  value: string;
  hint: string;
  onPress: (iso2: string) => void;
}) {
  const handle = useCallback(() => onPress(item.iso2), [onPress, item.iso2]);
  return (
    <ListRow
      title={item.name}
      value={value}
      leading={<Flag uri={item.flag} size={FLAG_SIZE} />}
      onPress={handle}
      accessibilityHint={hint}
    />
  );
});

const RegionRow = memo(function RegionRow({
  item,
  subtitle,
  value,
  hint,
  onPress,
}: {
  item: Region;
  subtitle: string;
  value: string;
  hint: string;
  onPress: (key: string) => void;
}) {
  const handle = useCallback(() => onPress(item.key), [onPress, item.key]);
  return (
    <ListRow
      title={item.name}
      subtitle={subtitle}
      value={value}
      leading={<Flag uri={item.flag} size={FLAG_SIZE} />}
      onPress={handle}
      accessibilityHint={hint}
    />
  );
});

export default function DestinationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ focus?: string; continent?: string }>();

  const { data: plans, isLoading, isError, refetch } = usePlans();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>(params.continent ?? ALL);
  const [scrolled, setScrolled] = useState(false);

  const { lang, nameResolver, regionResolvers } = useCatalogL10n();
  const destinations = useMemo(
    () => buildDestinations(plans ?? [], nameResolver),
    [plans, nameResolver]
  );
  const regions = useMemo(
    () => buildRegions(plans ?? [], regionResolvers),
    [plans, regionResolvers]
  );

  const filterOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: ALL, label: t('destinations.filters.all') },
      ...FILTERABLE_CONTINENTS.map((c) => ({ value: c, label: t(`continents.${c}`) })),
    ];
    if (regions.length > 0) {
      opts.push({ value: REGIONS, label: t('destinations.filters.regions') });
    }
    return opts;
  }, [regions.length, t]);

  const showingRegions = filter === REGIONS;

  const visibleDestinations = useMemo(() => {
    if (showingRegions) return [];
    const scoped =
      filter === ALL ? destinations : destinations.filter((d) => d.continent === filter);
    return filterDestinations(scoped, query);
  }, [destinations, filter, query, showingRegions]);

  const visibleRegions = useMemo(
    () => (showingRegions ? filterRegions(regions, query) : []),
    [regions, query, showingRegions]
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = e.nativeEvent.contentOffset.y > 4;
    if (next !== scrolled) setScrolled(next);
  };

  // Stable handlers + renderItem callbacks so the memoised rows don't re-render
  // when the screen re-renders (scroll shadow, filter chips).
  const pressDestination = useCallback(
    (iso2: string) => router.push({ pathname: '/destinations/[id]', params: { id: iso2 } }),
    [router]
  );
  const pressRegion = useCallback(
    (key: string) =>
      router.push({ pathname: '/destinations/[id]', params: { id: key, type: 'region' } }),
    [router]
  );

  const rowHint = t('destinations.rowHint');

  const renderDestination = useCallback(
    ({ item }: { item: Destination }) => (
      <DestinationRow
        item={item}
        value={t('destinations.from', {
          price: formatPrice(item.lowestPriceCents, lang, item.lowestPriceDisplay),
        })}
        hint={rowHint}
        onPress={pressDestination}
      />
    ),
    [t, lang, rowHint, pressDestination]
  );

  const renderRegion = useCallback(
    ({ item }: { item: Region }) => (
      <RegionRow
        item={item}
        subtitle={t('catalog.countriesCount', { count: item.countryCount })}
        value={t('destinations.from', {
          price: formatPrice(item.lowestPriceCents, lang, item.lowestPriceDisplay),
        })}
        hint={rowHint}
        onPress={pressRegion}
      />
    ),
    [t, lang, rowHint, pressRegion]
  );

  const separator = () => (
    <View style={{ height: 1, backgroundColor: theme.colors.border, marginLeft: SEPARATOR_INSET }} />
  );

  const searchEmpty = (
    <EmptyState title={t('destinations.emptyTitle')} body={t('destinations.emptyBody', { query })} />
  );

  const renderBody = () => {
    if (isError) return <ErrorState onRetry={() => refetch()} />;
    if (isLoading) return <SkeletonList theme={theme} />;

    if (showingRegions) {
      return (
        <FlatList
          data={visibleRegions}
          keyExtractor={(r) => r.key}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={renderRegion}
          ItemSeparatorComponent={separator}
          ListEmptyComponent={searchEmpty}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.spacing.xl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      );
    }

    return (
      <FlatList
        data={visibleDestinations}
        keyExtractor={(d) => d.iso2}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={renderDestination}
        ItemSeparatorComponent={separator}
        ListEmptyComponent={
          destinations.length === 0 ? (
            <EmptyState title={t('destinations.noneTitle')} body={t('destinations.noneBody')} />
          ) : (
            searchEmpty
          )
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.spacing.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={14}
        windowSize={11}
        removeClippedSubviews
      />
    );
  };

  return (
    <Screen scroll={false}>
      {/* Pinned search + filters; a soft divider/shadow appears once scrolled. */}
      <View
        style={{
          paddingBottom: theme.spacing.sm,
          borderBottomWidth: scrolled ? 1 : 0,
          borderBottomColor: theme.colors.border,
          ...(scrolled ? theme.shadows.sm : null),
        }}
      >
        <Header title={t('destinations.title')} />

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('destinations.searchPlaceholder')}
          autoFocus={params.focus === '1'}
        />

        <View style={{ position: 'relative' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: theme.spacing.sm,
              paddingTop: theme.spacing.md,
              paddingRight: theme.spacing.xl,
            }}
            style={{ flexGrow: 0 }}
          >
            {filterOptions.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={filter === opt.value}
                onPress={() => setFilter(opt.value)}
              />
            ))}
          </ScrollView>
          <EdgeFade color={theme.colors.background} />
        </View>
      </View>

      <View style={{ flex: 1 }}>{renderBody()}</View>
    </Screen>
  );
}

/** A soft fade at the trailing edge of the chip row, hinting more content. */
function EdgeFade({ color }: { color: string }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 28 }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="chip-fade" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0" />
            <Stop offset="1" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#chip-fade)" />
      </Svg>
    </View>
  );
}

function SkeletonList({ theme }: { theme: Theme }) {
  return (
    <View>
      {Array.from({ length: 9 }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
            paddingVertical: theme.spacing.md,
          }}
        >
          <Skeleton width={FLAG_SIZE} height={FLAG_SIZE} radius="pill" />
          <Skeleton width={140} height={15} />
        </View>
      ))}
    </View>
  );
}
