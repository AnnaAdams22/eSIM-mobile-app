/**
 * Screen — the page container. Safe-area aware, ivory background, optional scroll.
 * Every screen should wrap its content in this so backgrounds and insets are
 * consistent (and never pure white).
 */

import type { ReactNode } from 'react';
import {
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView. Default true. */
  scroll?: boolean;
  /** Apply the standard horizontal screen padding. Default true. */
  padded?: boolean;
  /** Safe-area edges to inset. Default top + bottom (sides handled by padding). */
  edges?: Edge[];
  /** Optional pull-to-refresh. */
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Background colour token override (defaults to the ivory background). */
  background?: 'background' | 'surface';
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['top', 'bottom'],
  refreshing,
  onRefresh,
  style,
  contentStyle,
  background = 'background',
}: ScreenProps) {
  const theme = useTheme();
  const bg = theme.colors[background];

  const innerPadding = padded ? { paddingHorizontal: theme.layout.screenPadding } : undefined;

  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: bg }, style]}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            { paddingVertical: theme.spacing.lg, flexGrow: 1 },
            innerPadding,
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={theme.colors.textSecondary} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingVertical: theme.spacing.lg }, innerPadding, contentStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
