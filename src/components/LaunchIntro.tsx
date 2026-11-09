/**
 * LaunchIntro — the animated opening overlay.
 *
 * As soon as the native splash hides, this renders a full-screen overlay that
 * starts visually IDENTICAL to the native splash (same background, the symbol at
 * the same size and position — it reuses the very same splash image), so there
 * is no jump. Once the app is actually ready (fonts are loaded by the time this
 * mounts; here we wait for auth to resolve), it plays a short sequence: the
 * symbol-only splash look CROSSFADES into the FULL brand logo (symbol + the
 * "ESIM GLOBAL" wordmark as ONE image), which settles with a slight scale, then
 * the overlay fades out to reveal the app.
 *
 * Why the full logo instead of a separate wordmark image: the standalone
 * wordmark is an extreme-aspect-ratio bitmap (1802×194, ~9.3:1). On iOS,
 * downscaling such a very wide image to a tiny size while animating its opacity
 * with the native driver drops interior content — the wordmark renders with only
 * its first/last glyphs, the rest faded/missing. The full logo is a moderate
 * ~1.5:1 image (the same shape family as the square symbol, which renders
 * correctly), so it is reliable. See CLAUDE.md § "Launch intro".
 *
 * Robustness (the intro can NEVER trap the user on the opening screen):
 * - A HARD timeout (INTRO_HARD_TIMEOUT_MS) started at MOUNT always unmounts the
 *   overlay, whatever happens to auth / images / animation callbacks.
 * - If any intro image fails to load (onError), the intro is skipped immediately.
 * - Any error while starting the animation is caught and the overlay is dismissed.
 * - pointerEvents flips to "none" the moment the overlay starts fading out.
 * - LAUNCH_INTRO_ENABLED (config) can turn the whole overlay off in one line.
 *
 * - Reduced motion: skips the movement and does a quick crossfade + fade only.
 * - Cold start only: a module-level flag means it plays once per JS runtime and
 *   never again, so returning from the background shows no intro.
 * - Two styles (ivory / navy) come from LAUNCH_STYLE; the visual config also
 *   tints the status & navigation bars to match the background.
 *
 * Built on React Native's `Animated` (react-native-reanimated is not installed;
 * no new native modules are added). All animated props use the native driver.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
// Animated values are created with useState's lazy initialiser (not a ref) so
// they can be read in render without tripping the refs-in-render lint rule —
// matching OfflineBanner/Toast in this codebase.
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { useTranslation } from 'react-i18next';

import { LAUNCH_INTRO_ENABLED, LAUNCH_STYLE } from '@/config';
import { useAuth } from '@/features/auth';
import {
  INTRO_HARD_TIMEOUT_MS,
  introAnimation,
  launchVisual,
  shouldRenderIntro,
} from '@/features/launch/style';

// The symbol image is square (1024²) and reuses the native splash asset so the
// overlay starts pixel-identical to it; rendered at the same width as app.json's
// `imageWidth`. The reveal crossfades to the FULL logo (symbol + wordmark in one
// moderate-aspect image), which renders reliably where the thin wordmark did not.
const SYMBOL_SIZE = 160; // must match app.json expo-splash-screen `imageWidth`
const FULL_WIDTH = 200;
const FULL_HEIGHT = Math.round(FULL_WIDTH / (1802 / 1187)); // ≈ 132

const FULL_SCALE_FROM = 0.9; // the full logo fades in scaling up slightly

// Auth-ready fallback: start the reveal even if auth is still loading. Kept well
// under the hard timeout so the ~1s animation finishes before the backstop.
const AUTH_FALLBACK_MS = 1500;

// Static requires (Metro needs literal paths), indexed by style.
const SYMBOL_SOURCE = {
  ivory: require('../../assets/splash-icon.png'),
  navy: require('../../assets/splash-icon-navy.png'),
} as const;
const FULL_SOURCE = {
  ivory: require('../../assets/brand/esim-logo-full.png'),
  navy: require('../../assets/brand/esim-logo-full-white.png'),
} as const;

// Plays once per cold start (fresh JS runtime); survives re-renders/resume.
let introHasPlayed = false;

export function LaunchIntro() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const visual = launchVisual(LAUNCH_STYLE);
  const symbolSource = SYMBOL_SOURCE[LAUNCH_STYLE];
  const fullSource = FULL_SOURCE[LAUNCH_STYLE];

  // Decide at mount whether to show the overlay at all.
  const [done, setDone] = useState(
    () =>
      !shouldRenderIntro({
        enabled: LAUNCH_INTRO_ENABLED,
        coldStart: true,
        alreadyPlayed: introHasPlayed,
      }),
  );
  // Once the overlay starts fading, stop intercepting touches so the app behind
  // is interactive and a stuck overlay can never swallow input.
  const [fading, setFading] = useState(false);

  const [overlayOpacity] = useState(() => new Animated.Value(1));
  const [symbolOpacity] = useState(() => new Animated.Value(1));
  const [fullOpacity] = useState(() => new Animated.Value(0));
  const [fullScale] = useState(() => new Animated.Value(FULL_SCALE_FROM));
  const started = useRef(false);

  // Idempotent dismissal — reused by the animation callback, the hard timeout
  // and image onError, so any of them can end the intro safely.
  const finish = useCallback(() => setDone(true), []);

  // HARD BACKSTOP: from the moment the overlay mounts, guarantee it unmounts
  // within INTRO_HARD_TIMEOUT_MS no matter what else happens.
  useEffect(() => {
    if (done) return;
    const hard = setTimeout(finish, INTRO_HARD_TIMEOUT_MS);
    return () => clearTimeout(hard);
  }, [done, finish]);

  useEffect(() => {
    if (done || started.current) return;

    const beginFadeOut = (duration: number, delay: number) => {
      setFading(true); // pointerEvents → "none" as the fade begins
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(finish);
    };

    const startAnimation = (reduce: boolean) => {
      try {
        if (introAnimation(reduce) === 'fade') {
          // Reduced motion: no movement — snap to the full logo and fade out.
          symbolOpacity.setValue(0);
          fullOpacity.setValue(1);
          fullScale.setValue(1);
          beginFadeOut(240, 120);
          return;
        }

        Animated.sequence([
          Animated.parallel([
            Animated.timing(symbolOpacity, {
              toValue: 0,
              duration: 300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(fullOpacity, {
              toValue: 1,
              duration: 360,
              delay: 120,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(fullScale, {
              toValue: 1,
              duration: 420,
              delay: 120,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]).start(({ finished }) => {
          if (finished) beginFadeOut(320, 140);
          else finish();
        });
      } catch {
        // Never let an animation error trap the user — just reveal the app.
        finish();
      }
    };

    const runIntro = () => {
      if (started.current) return;
      started.current = true;
      introHasPlayed = true;
      // Resolve reduced motion freshly at start time (rather than via a hook,
      // whose async state could still be its initial value if auth resolves
      // first), so a reduced-motion user always gets the quick fade.
      AccessibilityInfo.isReduceMotionEnabled()
        .then(startAnimation)
        .catch(() => startAnimation(false));
    };

    // Keep the splash look until the app is ready (auth resolved). A safety
    // timeout means a hung session never traps the user on the splash; the hard
    // backstop above is the ultimate guarantee.
    if (status === 'loading') {
      const fallback = setTimeout(runIntro, AUTH_FALLBACK_MS);
      return () => clearTimeout(fallback);
    }
    runIntro();
  }, [status, done, finish, overlayOpacity, symbolOpacity, fullOpacity, fullScale]);

  if (done) return null;

  return (
    <Animated.View
      pointerEvents={fading ? 'none' : 'auto'}
      accessibilityRole="image"
      accessibilityLabel={t('common.appName')}
      style={[
        StyleSheet.absoluteFill,
        styles.center,
        { backgroundColor: visual.background, opacity: overlayOpacity, zIndex: 9999, elevation: 9999 },
      ]}
    >
      <StatusBar style={visual.statusBarStyle} />
      {Platform.OS === 'android' ? <NavigationBar style={visual.navBarStyle} /> : null}

      {/* Final state — the full brand logo (symbol + wordmark in one image),
          crossfading in over the symbol and settling with a slight scale. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        <Animated.Image
          source={fullSource}
          resizeMode="contain"
          importantForAccessibility="no"
          onError={finish}
          style={{
            width: FULL_WIDTH,
            height: FULL_HEIGHT,
            opacity: fullOpacity,
            transform: [{ scale: fullScale }],
          }}
        />
      </View>

      {/* Opening state — the symbol only, identical to the native splash; it
          crossfades out as the full logo fades in. */}
      <Animated.Image
        source={symbolSource}
        resizeMode="contain"
        importantForAccessibility="no"
        onError={finish}
        style={{
          width: SYMBOL_SIZE,
          height: SYMBOL_SIZE,
          opacity: symbolOpacity,
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
