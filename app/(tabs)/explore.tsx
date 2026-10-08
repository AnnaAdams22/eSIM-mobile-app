/**
 * Explore tab — large region cards sized from the live catalog. Each card shows a
 * region and its destination count and opens the destinations list filtered to
 * that continent. Only continents present in the catalog are shown.
 */

import { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react-native';

import { ErrorState, PressableScale, Screen, Skeleton, Text } from '@/components/ui';
import { HeroImage } from '@/components/HeroImage';
import { usePlans } from '@/hooks/usePlans';
import {
  buildDestinations,
  continentCounts,
  FILTERABLE_CONTINENTS,
} from '@/features/catalog';
import { useTheme } from '@/theme';

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: plans, isLoading, isError, refetch } = usePlans();

  const counts = useMemo(() => continentCounts(buildDestinations(plans ?? [])), [plans]);
  const regions = useMemo(
    () => FILTERABLE_CONTINENTS.filter((c) => (counts[c] ?? 0) > 0),
    [counts]
  );

  return (
    <Screen edges={['top']}>
      <Text variant="h1" accessibilityRole="header" style={{ fontSize: 22, lineHeight: 28 }}>
        {t('explore.title')}
      </Text>
      <Text
        variant="bodySmall"
        color="textSecondary"
        style={{ marginTop: theme.spacing.xxs }}
      >
        {t('explore.subtitle')}
      </Text>

      <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.md }}>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} height={132} radius="lg" />)
        ) : (
          regions.map((continent) => {
            const count = Math.floor((counts[continent] ?? 0) / 10) * 10 || counts[continent];
            const countLabel = t('explore.destinationCount', { count });
            const name = t(`continents.${continent}`);
            return (
              <PressableScale
                key={continent}
                onPress={() => router.push({ pathname: '/destinations', params: { continent } })}
                scaleTo={0.98}
                accessibilityRole="button"
                accessibilityLabel={`${name}, ${countLabel}`}
                accessibilityHint={t('explore.cardHint')}
              >
                <HeroImage slot={`continent:${continent}`} seed={continent} height={132} scrim={0.5}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      gap: theme.spacing.md,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="h1" color="onPrimary" style={{ fontSize: 22, lineHeight: 28 }}>
                        {name}
                      </Text>
                      <Text variant="bodySmall" color="onPrimary" dense>
                        {countLabel}
                      </Text>
                    </View>
                    <View
                      accessible={false}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...theme.shadows.sm,
                      }}
                    >
                      <ArrowRight size={20} color={theme.colors.primary} />
                    </View>
                  </View>
                </HeroImage>
              </PressableScale>
            );
          })
        )}
      </View>
    </Screen>
  );
}
