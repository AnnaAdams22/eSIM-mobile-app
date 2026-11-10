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

/**
 * The HARD upper bound on how long the intro overlay may stay mounted. Whatever
 * happens — auth never resolving, an image that never loads, an animation
 * callback that never fires — the overlay unmounts within this many ms of
 * mounting, so the intro can NEVER trap the user on the opening screen.
 */
export const INTRO_HARD_TIMEOUT_MS = 3000;

/**
 * Master on/off switch for the animated intro, from `LAUNCH_INTRO_ENABLED`
 * (config / `EXPO_PUBLIC_LAUNCH_INTRO_ENABLED`). Enabled by DEFAULT; only an
 * explicit 'false' (case- and whitespace-insensitive) turns it off, so a single
 * config value can disable the intro entirely without touching component code.
 */
export function resolveLaunchIntroEnabled(raw: string | undefined | null): boolean {
  return raw?.trim().toLowerCase() === 'false' ? false : true;
}

/**
 * Whether the intro overlay should render at all this launch: it must be enabled
 * AND a fresh cold start that hasn't already played. Composes the enabled switch
 * with {@link shouldPlayIntro} so the component has a single source of truth.
 */
export function shouldRenderIntro(params: {
  enabled: boolean;
  coldStart: boolean;
  alreadyPlayed: boolean;
}): boolean {
  return (
    params.enabled &&
    shouldPlayIntro({ coldStart: params.coldStart, alreadyPlayed: params.alreadyPlayed })
  );
}

/**
 * Terminal events that end the intro. ANY of them unmounts the overlay and
 * reveals the app — the animation completing normally, an intro image failing to
 * load (`imageError` → skip immediately), or the hard-timeout backstop firing.
 * Modelled as a pure transition so the "always ends" guarantee is unit-testable.
 */
export type IntroEndEvent = 'animationComplete' | 'imageError' | 'timeout';

/** Given any {@link IntroEndEvent}, the intro is done. Once done, stays done. */
export function introDoneAfter(_done: boolean, _event: IntroEndEvent): true {
  return true;
}

/**
 * The animation timings (ms), the single source of truth shared by the component
 * so the intro is guaranteed to be on screen for its full duration even when the
 * app is already ready the moment the overlay mounts. `totalMs` is the wall-clock
 * from the reveal starting to the overlay being gone; it must comfortably clear
 * ~0.9s for the full sequence so the brand logo is actually seen, while staying
 * under {@link INTRO_HARD_TIMEOUT_MS}.
 */
export interface IntroTimings {
  symbolFadeMs: number;
  fullFadeDelayMs: number;
  fullFadeMs: number;
  fullScaleDelayMs: number;
  fullScaleMs: number;
  fadeOutDelayMs: number;
  fadeOutMs: number;
  totalMs: number;
}

export function introTimings(reducedMotion: boolean): IntroTimings {
  if (reducedMotion) {
    // Reduced motion: snap to the full logo, then a quick fade only.
    const fadeOutDelayMs = 120;
    const fadeOutMs = 240;
    return {
      symbolFadeMs: 0,
      fullFadeDelayMs: 0,
      fullFadeMs: 0,
      fullScaleDelayMs: 0,
      fullScaleMs: 0,
      fadeOutDelayMs,
      fadeOutMs,
      totalMs: fadeOutDelayMs + fadeOutMs,
    };
  }
  const symbolFadeMs = 300;
  const fullFadeDelayMs = 120;
  const fullFadeMs = 360;
  const fullScaleDelayMs = 120;
  const fullScaleMs = 420;
  const fadeOutDelayMs = 140;
  const fadeOutMs = 320;
  // The reveal (crossfade + settle) runs as one parallel block; it ends when its
  // longest leg finishes, after which the overlay fades out.
  const revealEndMs = Math.max(
    symbolFadeMs,
    fullFadeDelayMs + fullFadeMs,
    fullScaleDelayMs + fullScaleMs
  );
  return {
    symbolFadeMs,
    fullFadeDelayMs,
    fullFadeMs,
    fullScaleDelayMs,
    fullScaleMs,
    fadeOutDelayMs,
    fadeOutMs,
    totalMs: revealEndMs + fadeOutDelayMs + fadeOutMs,
  };
}
