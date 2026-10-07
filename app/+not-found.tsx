import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function NotFoundScreen() {
  const theme = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.md }}>
          <Text variant="h1" center>
            This screen doesn&apos;t exist
          </Text>
          <Link href="/" accessibilityRole="link">
            <Text variant="body" color="accent">
              Go to home
            </Text>
          </Link>
        </View>
      </Screen>
    </>
  );
}
