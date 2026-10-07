/**
 * PlaceholderScreen — a minimal, on-brand stand-in for routes that aren't built
 * yet. Shows a title (and optional subtitle) on the ivory background. Real
 * screens replace these in later tasks.
 */

import { View } from 'react-native';

import { Header, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export interface PlaceholderScreenProps {
  title: string;
  subtitle?: string;
  /** Show a back button + centred header (for stack routes). */
  showHeader?: boolean;
}

export function PlaceholderScreen({ title, subtitle, showHeader = false }: PlaceholderScreenProps) {
  const theme = useTheme();

  return (
    <Screen scroll={false}>
      {showHeader ? <Header title={title} /> : null}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.sm }}>
        {!showHeader ? (
          <Text variant="h1" center accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="body" color="textSecondary" center>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
