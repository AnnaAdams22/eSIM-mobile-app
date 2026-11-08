/**
 * Launch-intro style — the pure, testable half of the animated opening sequence.
 *
 * Two visual styles, switchable with ONE config value (`LAUNCH_STYLE` in
 * src/config.ts) plus the matching native-splash `backgroundColor`/image in
 * app.json (a native change → needs a rebuild; see CLAUDE.md § "Launch intro"):
 *  - 'ivory': warm ivory background, black logo (the default brand look).
 *  - 'navy':  deep navy background, white logo.
 *
 * Everything here is free of React Native imports so it can be unit-tested.
 */

import { palette } from '@/theme/colors';

export type LaunchStyle = 'ivory' | 'navy';

/**
 * Resolve the launch style from a raw config/env string. Anything that isn't an
 * explicit 'navy' (case- and whitespace-insensitive) falls back to 'ivory'.
 */
export function resolveLaunchStyle(raw: string | undefined | null): LaunchStyle {
  return raw?.trim().toLowerCase() === 'navy' ? 'navy' : 'ivory';
}

/** Content/button style for the status & navigation bars (light vs dark). */
export type BarStyle = 'light' | 'dark';

export interface LaunchVisual {
  /** Full-screen background — must match the native splash `backgroundColor`. */
  background: string;
  /** expo-status-bar content style (status-bar icon colour). */
  statusBarStyle: BarStyle;
  /**
   * expo-navigation-bar button style. Under edge-to-edge the bar is transparent
   * (the background shows through), so this only tints the buttons: 'dark' = a
   * dark bar with light buttons, 'light' = a light bar with dark buttons.
   */
  navBarStyle: BarStyle;
  /** Which recoloured logo set the intro overlay renders. */
  ink: 'black' | 'white';
}

/** The colours + bar styling for a launch style. Background matches app.json. */
export function launchVisual(style: LaunchStyle): LaunchVisual {
  if (style === 'navy') {
    return {
      background: palette.navy900, // #1C2430
      statusBarStyle: 'light', // light icons on the dark background
      navBarStyle: 'dark', // dark bar → light buttons
      ink: 'white',
    };
  }
  return {
    background: palette.ivory, // #F4F1EC
    statusBarStyle: 'dark', // dark icons on the light background
    navBarStyle: 'light', // light bar → dark buttons
    ink: 'black',
  };
}

export type IntroAnimation = 'full' | 'fade';

/**
 * Reduced motion collapses the sequence to a quick fade (no movement/scale);
 * otherwise we play the full move-up + wordmark reveal.
 */
export function introAnimation(reducedMotion: boolean): IntroAnimation {
  return reducedMotion ? 'fade' : 'full';
}

/**
 * The intro plays once per cold start (a fresh JS runtime) and never again —
 * notably not when the app returns from the background, which does not restart
 * JS and so leaves `alreadyPlayed` true.
 */
export function shouldPlayIntro(params: { coldStart: boolean; alreadyPlayed: boolean }): boolean {
  return params.coldStart && !params.alreadyPlayed;
}
