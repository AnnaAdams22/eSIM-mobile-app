/**
 * Root layout: loads fonts, initialises i18n, provides React Query + safe-area
 * context, controls the splash screen, and gates startup on required config.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
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
import { AuthProvider, guardDecision, useAuth } from '@/features/auth';
import { SocialSignOutRegistrar } from '@/features/auth/social/SocialSignOutRegistrar';
import { NotificationsProvider } from '@/features/notifications/NotificationsProvider';
import { queryClient } from '@/lib/queryClient';
import { config, missingConfigKeys, REQUIRE_SIGN_IN_TO_BROWSE } from '@/config';
import { lightTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * The central, app-wide half of the auth guard (the protected route group guards
 * its own screens). Two jobs:
 *  1. Enforce REQUIRE_SIGN_IN_TO_BROWSE for PUBLIC routes — when on, a signed-out
 *     user on any non-auth route is redirected to sign-in.
 *  2. On sign-out, reset the stack to Home so "back" can't return to a signed-in
 *     screen and no protected screen stays mounted behind the tabs.
 * Renders no UI (returns a <Redirect> or null); it's a sibling of the Stack.
 */
function AuthGate() {
  const { status } = useAuth();
  const router = useRouter();
  const segments = useSegments() as string[];

  const isAuthRoute = segments[0] === '(auth)';
  const isProtected = segments.includes('(protected)');
  const prevStatus = useRef(status);

  useEffect(() => {
    // Reset to Home the moment we go signed-in → signed-out, so "back" can't
    // return to a signed-in screen and nothing stays mounted behind the tabs.
    if (prevStatus.current === 'signedIn' && status === 'signedOut') {
      router.dismissAll?.();
    }
    prevStatus.current = status;

    // Protected routes redirect themselves (with a return path) in their layout;
    // here we only enforce the global "require sign-in to browse" flag, which
    // also gates the PUBLIC routes.
    const decision = guardDecision({
      status,
      isProtected,
      isAuthRoute,
      requireSignIn: REQUIRE_SIGN_IN_TO_BROWSE,
    });
    if (!isProtected && decision === 'redirect') {
      router.replace('/(auth)/sign-in');
    }
  }, [status, isProtected, isAuthRoute, router]);

  return null;
}

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
          <SocialSignOutRegistrar />
          <NotificationsProvider>
          <ToastProvider>
            {/* Central guard: enforces REQUIRE_SIGN_IN_TO_BROWSE for public
                routes and resets the stack to Home on sign-out. Protected routes
                are guarded by app/(protected)/_layout.tsx. */}
            <AuthGate />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: lightTheme.colors.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(protected)" />
              <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
            </Stack>
          </ToastProvider>
          </NotificationsProvider>
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
