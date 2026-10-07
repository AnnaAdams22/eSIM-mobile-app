import { Stack } from 'expo-router';

import { lightTheme } from '@/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: lightTheme.colors.background },
      }}
    />
  );
}
