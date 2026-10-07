/**
 * Destinations list — searchable, continent-filtered list of every country in the
 * catalog, plus a "Regions" filter for regional plans. Uses an optimised FlatList
 * so it scrolls smoothly through ~200 countries.
 *
 * (FlashList is intentionally not used: it is not guaranteed to be bundled in
 * Expo Go, and the task permits an optimised FlatList — see the report.)
 */

import { useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
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
  type Destination,
  type Region,
} from '@/features/catalog';
import { useTheme, type Theme } from '@/theme';

const ALL = 'all';
const REGIONS = 'regions';

export default function DestinationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ focus?: string; continent?: string }>();

  const { data: plans, isLoading, isError, refetch } = usePlans();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>(params.continent ?? ALL);

  const destinations = useMemo(() => buildDestinations(plans ?? []), [plans]);
  const regions = useMemo(() => buildRegions(plans ?? []), [plans]);

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

  const separator = () => (
    <View style={{ height: 1, backgroundColor: theme.colors.border, marginLeft: 52 }} />
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
          renderItem={({ item }: { item: Region }) => (
            <ListRow
              title={item.name}
              subtitle={t('catalog.countriesCount', { count: item.countryCount })}
              value={t('destinations.from', { price: item.lowestPriceDisplay })}
              leading={<Flag uri={item.flag} />}
              onPress={() =>
                router.push({
                  pathname: '/destinations/[id]',
                  params: { id: item.key, type: 'region' },
                })
              }
              accessibilityHint={t('destinations.rowHint')}
            />
          )}
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
        renderItem={({ item }: { item: Destination }) => (
          <ListRow
            title={item.name}
            value={t('destinations.from', { price: item.lowestPriceDisplay })}
            leading={<Flag uri={item.flag} />}
            onPress={() =>
              router.push({ pathname: '/destinations/[id]', params: { id: item.iso2 } })
            }
            accessibilityHint={t('destinations.rowHint')}
          />
        )}
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
      <Header title={t('destinations.title')} />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('destinations.searchPlaceholder')}
        autoFocus={params.focus === '1'}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.md }}
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

      <View style={{ flex: 1 }}>{renderBody()}</View>
    </Screen>
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
          <Skeleton width={36} height={36} radius="pill" />
          <Skeleton width={140} height={16} />
        </View>
      ))}
    </View>
  );
}
