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
    // Inter PostScript / font-file name. Resolves in the native (dev/prod) build
    // where the font is bundled; silently falls back to the system font if not.
    font: { family: theme.fontFamily.medium },
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
