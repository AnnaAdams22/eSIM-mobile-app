/**
 * Root layout: loads fonts, initialises i18n, provides React Query + safe-area
 * context, controls the splash screen, and gates startup on required config.
 */

import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationBar } from 'expo-navigation-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { applyStoredLanguage } from '@/i18n';
import { ConfigError } from '@/components/ConfigError';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/features/auth';
import { queryClient } from '@/lib/queryClient';
import { config, missingConfigKeys } from '@/config';
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

  // Apply the stored language preference once at startup (it can override the
  // device language the i18n instance initialised with).
  useEffect(() => {
    applyStoredLanguage().catch(() => {});
  }, []);

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
      // Stripe needs the publishable key and our URL scheme so redirect-based
      // payment methods (and 3DS) can return to the app via esimglobal://.
      <StripeProvider
        publishableKey={config.stripePublishableKey}
        merchantIdentifier="merchant.net.esimglobal.app"
        urlScheme="esimglobal"
      >
        <AuthProvider>
          <ToastProvider>
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
          </ToastProvider>
        </AuthProvider>
      </StripeProvider>
    );

  return (
    <SafeAreaProvider onLayout={onLayoutReady}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        {/* Android edge-to-edge: the tab bar's light surface shows behind the
            system nav bar, so use dark nav-bar buttons (style="light" = light bar,
            dark content). No-op on iOS. */}
        <NavigationBar style="light" />
        {content}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
