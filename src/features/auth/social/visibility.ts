/**
 * Which social sign-in providers to show — a pure decision so it can be unit
 * tested across every platform / configuration combination.
 *
 * Rules (see CLAUDE.md § "Social sign-in"):
 *  - Google shows on Android whenever it's configured (a web client id exists).
 *  - Apple shows only on iOS and only when explicitly enabled by config (the
 *    Apple Developer account isn't active yet).
 *  - App Store rule: if an iOS app offers a third-party sign-in (Google) it MUST
 *    also offer Sign in with Apple. So on iOS, Google is shown ONLY when Apple
 *    sign-in is also enabled. On Android there is no such requirement.
 *  - Nothing shows on web (not a target; keeps the rule total).
 */

export type SocialPlatform = 'ios' | 'android' | 'web';

export interface SocialVisibilityInput {
  platform: SocialPlatform;
  /** True when a Google web client id is configured (required for the idToken). */
  googleConfigured: boolean;
  /** True when Apple sign-in is switched on by config. */
  appleEnabled: boolean;
}

export interface SocialVisibility {
  google: boolean;
  apple: boolean;
}

export function socialProvidersVisible(input: SocialVisibilityInput): SocialVisibility {
  const { platform, googleConfigured, appleEnabled } = input;

  // Apple: iOS only, and only when enabled by config.
  const apple = platform === 'ios' && appleEnabled;

  // Google: configured, and allowed on this platform.
  let google = false;
  if (googleConfigured) {
    if (platform === 'android') {
      google = true;
    } else if (platform === 'ios') {
      // App Store rule: Google on iOS requires Apple to be offered too.
      google = appleEnabled;
    }
    // web → stays false
  }

  return { google, apple };
}

/** True when at least one provider should be shown (so the "or" divider renders). */
export function anySocialVisible(v: SocialVisibility): boolean {
  return v.google || v.apple;
}
