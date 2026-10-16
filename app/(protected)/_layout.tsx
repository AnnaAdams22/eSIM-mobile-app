/**
 * Protected route group — the central auth guard for every signed-in screen
 * (checkout, order success, eSIM detail, top-up, and the account screens:
 * edit profile, change password, language, notifications, delete account).
 *
 * Being inside this group is what makes a route protected; the decision itself
 * is the pure `guardDecision` (unit-tested). A signed-out user is redirected to
 * sign-in with a validated return path, and while auth is still resolving we
 * show a neutral loading state so protected content never flashes and we never
 * redirect prematurely. When signed out, the protected screen is never rendered,
 * so nothing stays mounted with stale user data.
 *
 * Public routes (Home, destinations, Explore, Support, Install guide, About, the
 * auth screens) live OUTSIDE this group — see CLAUDE.md § "Auth routing".
 */

import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack, usePathname } from 'expo-router';

import { guardDecision, safeRedirect, useAuth } from '@/features/auth';
import { REQUIRE_SIGN_IN_TO_BROWSE } from '@/config';
import { lightTheme } from '@/theme';

export default function ProtectedLayout() {
  const { status } = useAuth();
  const pathname = usePathname();

  const decision = guardDecision({
    status,
    isProtected: true,
    isAuthRoute: false,
    requireSignIn: REQUIRE_SIGN_IN_TO_BROWSE,
  });

  if (decision === 'wait') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: lightTheme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={lightTheme.colors.textSecondary} />
      </View>
    );
  }

  if (decision === 'redirect') {
    // Return the user to the screen they were headed for after they sign in.
    const redirect = safeRedirect(pathname) ?? undefined;
    return (
      <Redirect
        href={{
          pathname: '/(auth)/sign-in',
          params: redirect ? { redirect } : {},
        }}
      />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: lightTheme.colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="checkout" options={{ presentation: 'modal' }} />
      <Stack.Screen name="order-success" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
