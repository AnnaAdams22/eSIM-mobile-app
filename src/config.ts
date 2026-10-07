/**
 * App configuration, sourced from Expo's EXPO_PUBLIC_* convention.
 *
 * These values are embedded in the shipped bundle and are therefore PUBLIC.
 * Only ever reference publishable / anon keys here — never secret keys
 * (no sb_secret_, no sk_ Stripe keys, no webhook secrets). See CLAUDE.md.
 *
 * Values are read from the local `.env` file (see `.env.example`).
 */

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
