/**
 * App configuration, sourced from Expo's EXPO_PUBLIC_* convention.
 *
 * These values are embedded in the shipped bundle and are therefore PUBLIC.
 * Only ever reference publishable / anon keys here — never secret keys
 * (no sb_secret_, no sk_ Stripe keys, no webhook secrets). See CLAUDE.md.
 *
 * Values are read from the local `.env` file (see `.env.example`).
 */

import { resolveLaunchStyle, type LaunchStyle } from '@/features/launch/style';

type ConfigKey =
  | 'EXPO_PUBLIC_API_URL'
  | 'EXPO_PUBLIC_SUPABASE_URL'
  | 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  | 'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY';

const raw: Record<ConfigKey, string | undefined> = {
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
};

/** Keys that must be present for the app to function at all. */
const REQUIRED_KEYS: ConfigKey[] = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
];

/** Returns the names of required env vars that are missing or blank. */
export function missingConfigKeys(): ConfigKey[] {
  return REQUIRED_KEYS.filter((k) => {
    const v = raw[k];
    return v === undefined || v.trim() === '';
  });
}

export const isConfigValid = missingConfigKeys().length === 0;

/**
 * When true, the whole app is behind sign-in: signed-out users see the Sign-in
 * screen (with Create account) before anything else, and nothing is reachable
 * until they sign in. When false (the default), guests can browse the public
 * catalog and only the signed-in areas are protected (see the central auth guard
 * in app/(protected)/_layout.tsx and the root AuthGate). See CLAUDE.md § "Auth
 * routing". Overridable via EXPO_PUBLIC_REQUIRE_SIGN_IN=true.
 */
export const REQUIRE_SIGN_IN_TO_BROWSE =
  process.env.EXPO_PUBLIC_REQUIRE_SIGN_IN?.trim() === 'true';

/**
 * Whether to offer Apple Pay in the Stripe PaymentSheet (iOS). Default OFF:
 * Apple Pay only works once Stripe holds an Apple Pay certificate for the
 * merchant id (merchant.net.esimglobal.app), so until then we must not surface
 * an Apple Pay button that would fail. Flip EXPO_PUBLIC_APPLE_PAY_ENABLED=true
 * once Stripe's Apple Pay is fully configured — no code change needed. Google
 * Pay (Android) is unaffected.
 */
export const APPLE_PAY_ENABLED = process.env.EXPO_PUBLIC_APPLE_PAY_ENABLED?.trim() === 'true';

/**
 * Launch-intro visual style — the ONE switch for the animated opening sequence:
 *  - 'ivory' (default): black logo on warm ivory (#F4F1EC).
 *  - 'navy': white logo on deep navy (#1C2430).
 *
 * The JS intro overlay reads this directly. To fully switch styles you must ALSO
 * update the native splash in app.json (the `splash` + `expo-splash-screen`
 * `backgroundColor`, and the `image`: `splash-icon.png` for ivory /
 * `splash-icon-navy.png` for navy) — a native change that needs a new build. See
 * CLAUDE.md § "Launch intro (animated opening)". Change the fallback literal
 * below, or override at build time with EXPO_PUBLIC_LAUNCH_STYLE=navy.
 */
export const LAUNCH_STYLE: LaunchStyle = resolveLaunchStyle(
  process.env.EXPO_PUBLIC_LAUNCH_STYLE ?? 'ivory'
);

/**
 * Typed, validated config. Accessing a value that is missing throws a clear
 * error — call `missingConfigKeys()` first (the app root does) to fail cleanly
 * at startup instead of deep inside a network call.
 */
export const config = {
  apiUrl: require_(raw.EXPO_PUBLIC_API_URL, 'EXPO_PUBLIC_API_URL'),
  supabaseUrl: require_(raw.EXPO_PUBLIC_SUPABASE_URL, 'EXPO_PUBLIC_SUPABASE_URL'),
  supabasePublishableKey: require_(
    raw.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  ),
  stripePublishableKey: require_(
    raw.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ),
};

/**
 * Legal document URLs, shown on the Create-account, Checkout and About screens
 * (opened in an in-app browser). The defaults are the client's real published
 * pages on esim-global.net. Not secrets and not required for startup; overridable
 * via optional EXPO_PUBLIC_* vars.
 *
 * `deleteAccountUrl` is the web account-deletion page (a Google Play requirement,
 * referenced in the store docs). The client will publish it at this path.
 */
export const legal = {
  termsUrl:
    process.env.EXPO_PUBLIC_TERMS_URL?.trim() || 'https://esim-global.net/terms-of-service',
  privacyUrl:
    process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || 'https://esim-global.net/privacy-policy',
  refundUrl:
    process.env.EXPO_PUBLIC_REFUND_URL?.trim() || 'https://esim-global.net/return-policy',
  deleteAccountUrl:
    process.env.EXPO_PUBLIC_DELETE_ACCOUNT_URL?.trim() ||
    'https://esim-global.net/delete-account',
} as const;

/**
 * Lazily-validated getter wrapped in a thunk so that merely importing `config`
 * does not throw; each property is a getter that validates on first read.
 */
function require_(value: string | undefined, name: ConfigKey): string {
  // Evaluated once at module load. If blank we return '' and rely on the
  // startup gate (missingConfigKeys) to show a clear error screen, so that a
  // dev can still reach the design preview in Expo Go without keys set.
  if (value === undefined || value.trim() === '') {
    if (__DEV__) {
      console.warn(
        `[config] Missing ${name}. Set it in .env (see .env.example). ` +
          `Network features depending on it will fail until it is provided.`
      );
    }
    return '';
  }
  return value.trim();
}
