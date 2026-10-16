/**
 * Builds the Stripe PaymentSheet appearance from our theme tokens, so the native
 * sheet reads as part of the app: navy primary, warm surfaces, rounded corners,
 * and Inter where the platform can resolve it.
 *
 * Kept in the checkout feature (not the theme) because it depends on the Stripe
 * SDK's `AppearanceParams` shape, which is a payment-flow concern.
 */

import type { PaymentSheet } from '@stripe/stripe-react-native';

import type { Theme } from '@/theme';

export function buildPaymentSheetAppearance(theme: Theme): PaymentSheet.AppearanceParams {
  return {
    // NOTE: no `font.family`. On Android the Stripe SDK requires the family to be
    // a lowercase-alphanumeric native font resource filename (e.g. `inter_medium`
    // under android/app/src/main/res/font). Passing our JS font name
    // ("Inter_500Medium") makes initPaymentSheet throw. We let the sheet use the
    // system font on both platforms for consistency (colours/shape still brand it).
    //
    // TODO: To use Inter inside the Stripe sheet, bundle the Inter TTF as a native
    // font via the expo-font config plugin with a lowercase filename (e.g.
    // inter_medium), then set font.family per platform. Requires a rebuild.
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.surface,
      componentBackground: theme.colors.surfaceMuted,
      componentBorder: theme.colors.border,
      componentDivider: theme.colors.border,
      primaryText: theme.colors.text,
      secondaryText: theme.colors.textSecondary,
      componentText: theme.colors.text,
      placeholderText: theme.colors.textSecondary,
      icon: theme.colors.textSecondary,
      error: theme.colors.danger,
    },
    shapes: {
      borderRadius: theme.radii.md,
      borderWidth: 1,
    },
    primaryButton: {
      shapes: { borderRadius: theme.radii.pill },
      colors: {
        background: theme.colors.primary,
        text: theme.colors.onPrimary,
        border: theme.colors.primary,
      },
    },
  };
}
