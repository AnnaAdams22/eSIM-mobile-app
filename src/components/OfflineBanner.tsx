/**
 * OfflineBanner — a calm, non-blocking strip shown while the app is offline.
 *
 * Inferred connectivity only (no native module). Pinned above the bottom safe
 * area so it never covers headers or disturbs screen layout; announced politely
 * to screen readers; fades in unless reduced motion is on. When the connection
 * returns, React Query auto-refetches (refetchOnReconnect) and this disappears.
 */

import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react-native';

import { useOnline } from '@/hooks/useOnline';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui';

export function OfflineBanner() {
  const online = useOnline();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      opacity.setValue(online ? 0 : 1);
      return;
    }
    Animated.timing(opacity, {
      toValue: online ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [online, reduced, opacity]);

  // Keep it unmounted (and out of the a11y tree) while online.
  if (online) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        opacity,
        paddingBottom: insets.bottom + theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        paddingHorizontal: theme.layout.screenPadding,
        backgroundColor: theme.colors.primary,
      }}
    >
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
        }}
      >
        <WifiOff size={16} color={theme.colors.onPrimary} accessible={false} />
        <Text variant="bodySmall" color="onPrimary" center>
          {t('offline.banner')}
        </Text>
      </View>
    </Animated.View>
  );
}
