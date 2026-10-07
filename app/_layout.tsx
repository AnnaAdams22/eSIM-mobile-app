/**
 * Root layout: loads fonts, initialises i18n, provides React Query + safe-area
 * context, controls the splash screen, and gates startup on required config.
 */

import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import '@/i18n';
import { ConfigError } from '@/components/ConfigError';
import { queryClient } from '@/lib/queryClient';
import { missingConfigKeys } from '@/config';
import { lightTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [bypassConfig, setBypassConfig] = useState(false);
  const missing = missingConfigKeys();

  const onLayoutReady = useCallback(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null; // keep the native splash visible
  }

  const content =
    missing.length > 0 && !bypassConfig ? (
      <ConfigError missing={missing} onBypass={() => setBypassConfig(true)} />
    ) : (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: lightTheme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="checkout" options={{ presentation: 'modal' }} />
        <Stack.Screen name="order-success" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
      </Stack>
    );

  return (
    <SafeAreaProvider onLayout={onLayoutReady}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        {content}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
