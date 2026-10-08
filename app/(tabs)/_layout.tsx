/**
 * Bottom tab bar: Home · My eSIMs · Explore · Profile.
 *
 * Android runs edge-to-edge (the app draws behind the system navigation bar), so
 * the tab bar must reserve the bottom safe-area inset itself — otherwise its
 * icons/labels sit underneath the 3-button nav bar. Height = a comfortable base
 * plus `insets.bottom`; the white surface fills the whole height (including behind
 * the nav buttons) so the system nav bar reads as part of the app. Works for
 * 3-button nav, gesture nav, the iPhone home indicator, and devices with no inset.
 */

import { Tabs } from 'expo-router';
import { House, Smartphone, Compass, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

/** Height of the interactive tab-bar row, above the bottom safe-area inset. */
const TAB_BAR_BASE_HEIGHT = 60;

/** Tab label rendered via our Text so it uses the theme font and a capped
 *  font-scale (dense) — a huge system font can't break the compact bar. */
function TabLabel({ color, children }: { color: ColorValue; children: string }) {
  return (
    <Text
      variant="caption"
      dense
      numberOfLines={1}
      style={{ fontSize: 11, lineHeight: 14, marginTop: 2, color }}
    >
      {children}
    </Text>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: TAB_BAR_BASE_HEIGHT + insets.bottom,
          paddingTop: theme.spacing.sm,
          paddingBottom: insets.bottom,
          // Soft lift off the ivory content above it.
          ...theme.shadows.sm,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarItemStyle: {
          paddingTop: theme.spacing.xxs,
        },
        tabBarLabelPosition: 'below-icon',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarLabel: ({ color }) => <TabLabel color={color}>{t('tabs.home')}</TabLabel>,
          tabBarIcon: ({ color, focused }) => (
            <House color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="esims"
        options={{
          title: t('tabs.esims'),
          tabBarLabel: ({ color }) => <TabLabel color={color}>{t('tabs.esims')}</TabLabel>,
          tabBarIcon: ({ color, focused }) => (
            <Smartphone color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.explore'),
          tabBarLabel: ({ color }) => <TabLabel color={color}>{t('tabs.explore')}</TabLabel>,
          tabBarIcon: ({ color, focused }) => (
            <Compass color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarLabel: ({ color }) => <TabLabel color={color}>{t('tabs.profile')}</TabLabel>,
          tabBarIcon: ({ color, focused }) => (
            <User color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
