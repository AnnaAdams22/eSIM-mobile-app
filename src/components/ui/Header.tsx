/**
 * Header — a screen header with an optional back button, a centred title, and an
 * optional right-side action. Used by stack screens (matches "Checkout",
 * "Choose your destination", "Support", etc.).
 */

import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { Text } from './Text';

export interface HeaderProps {
  title?: string;
  /** Show the back button. Default true. */
  showBack?: boolean;
  onBack?: () => void;
  /** Right-side action node. */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Header({ title, showBack = true, onBack, right, style }: HeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const handleBack = onBack ?? (() => router.back());
  const SIDE = theme.layout.minTouchTarget;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: SIDE,
          marginBottom: theme.spacing.md,
        },
        style,
      ]}
    >
      <View style={{ width: SIDE, alignItems: 'flex-start' }}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            hitSlop={10}
            style={({ pressed }) => ({
              width: SIDE,
              height: SIDE,
              alignItems: 'flex-start',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <ChevronLeft size={26} color={theme.colors.text} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ flex: 1, alignItems: 'center' }}>
        {title ? (
          <Text variant="h1" numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        ) : null}
      </View>

      <View style={{ width: SIDE, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
