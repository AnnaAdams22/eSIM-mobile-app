/**
 * LaunchIntro — the animated opening overlay.
 *
 * As soon as the native splash hides, this renders a full-screen overlay that
 * starts visually IDENTICAL to the native splash (same background, the symbol at
 * the same size and position — it reuses the very same splash image), so there
 * is no jump. Once the app is actually ready (fonts are loaded by the time this
 * mounts; here we wait for auth to resolve AND for the full-logo image to be
 * decoded), it plays a short sequence: the symbol-only splash look CROSSFADES
 * into the FULL brand logo (symbol + the "ESIM GLOBAL" wordmark as ONE image),
 * which settles with a slight scale, then the overlay fades out to reveal the app.
 *
 * Why wait for the full-logo image's `onLoad` before revealing: in a dev-client
 * build the image assets are fetched from Metro on demand, so the full logo may
 * not be decoded by the time the ~1s reveal runs — you'd see the symbol fade out
 * to nothing (no wordmark) and then the app. Gating the crossfade on `onLoad`
 * guarantees the wordmark is actually on screen. (In a production/standalone
 * build the asset is bundled locally and loads instantly.)
 *
 * Why the full logo instead of a separate wordmark image: the standalone
 * wordmark is an extreme-aspect-ratio bitmap (1802×194, ~9.3:1). On iOS,
 * downscaling such a very wide image to a tiny size while animating its opacity
 * with the native driver drops interior content. The full logo is a moderate
 * ~1.5:1 image, so it is reliable. See CLAUDE.md § "Launch intro".
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
 * In __DEV__ it logs each stage ("intro: mounted/ready/animation start/…") so a
 * launch that doesn't look right can be diagnosed from the Metro terminal.
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
  introTimings,
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

// Auth-ready fallback: proceed even if auth is still loading. Image fallback:
// once ready, reveal even if the full-logo `onLoad` hasn't fired. Both are kept
// well under the hard timeout so the ~1s animation finishes before the backstop
// (worst case AUTH + IMAGE + ~1s animation < INTRO_HARD_TIMEOUT_MS).
const AUTH_FALLBACK_MS = 1200;
const IMAGE_FALLBACK_MS = 600;

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

/** Dev-only stage logging so a mis-behaving launch is diagnosable from Metro. */
function devLog(message: string) {
  if (__DEV__) console.warn(message);
}

export function LaunchIntro() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const visual = launchVisual(LAUNCH_STYLE);
  const symbolSource = SYMBOL_SOURCE[LAUNCH_STYLE];
  const fullSource = FULL_SOURCE[LAUNCH_STYLE];

  // Snapshot cold-start at mount (introHasPlayed is only ever flipped on once a
  // run starts), used both for the render decision and the diagnostic log.
  const [coldStart] = useState(() => !introHasPlayed);
  const [done, setDone] = useState(
    () =>
      !shouldRenderIntro({
        enabled: LAUNCH_INTRO_ENABLED,
        coldStart: !introHasPlayed,
        alreadyPlayed: introHasPlayed,
      }),
  );
  // Once the overlay starts fading, stop intercepting touches so the app behind
  // is interactive and a stuck overlay can never swallow input.
  const [fading, setFading] = useState(false);
  // "App ready" = auth resolved OR the bounded fallback fired. Derived (only the
  // fallback needs state) so no setState happens synchronously inside an effect.
  const [authFallbackFired, setAuthFallbackFired] = useState(false);
  const appReady = status !== 'loading' || authFallbackFired;

  const [overlayOpacity] = useState(() => new Animated.Value(1));
  const [symbolOpacity] = useState(() => new Animated.Value(1));
  const [fullOpacity] = useState(() => new Animated.Value(0));
  const [fullScale] = useState(() => new Animated.Value(FULL_SCALE_FROM));

  const started = useRef(false);
  const ended = useRef(false);
  const fullLoaded = useRef(false);

  // Idempotent dismissal — reused by the animation callback, the hard timeout and
  // image onError, so any of them can end the intro safely (and log the reason).
  const finish = useCallback((reason: string) => {
    if (!ended.current) {
      ended.current = true;
      devLog(`intro: unmounted (${reason})`);
    }
    setDone(true);
  }, []);

  // One-time mount log (and, when the overlay won't play at all, why). `done` is
  // already true in that case, so we only log — no state change.
  useEffect(() => {
    devLog('intro: mounted');
    if (done) {
      devLog(`intro: enabled=${LAUNCH_INTRO_ENABLED} reducedMotion=n/a coldStart=${coldStart}`);
      devLog(`intro: unmounted (${LAUNCH_INTRO_ENABLED ? 'already-played' : 'disabled'})`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // HARD BACKSTOP: from the moment the overlay mounts, guarantee it unmounts
  // within INTRO_HARD_TIMEOUT_MS no matter what else happens.
  useEffect(() => {
    if (done) return;
    const hard = setTimeout(() => finish('timeout'), INTRO_HARD_TIMEOUT_MS);
    return () => clearTimeout(hard);
  }, [done, finish]);

  const beginFadeOut = useCallback(
    (duration: number, delay: number) => {
      setFading(true); // pointerEvents → "none" as the fade begins
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => finish('animationComplete'));
    },
    [overlayOpacity, finish],
  );

  const startAnimation = useCallback(
    (reduce: boolean) => {
      devLog(`intro: enabled=${LAUNCH_INTRO_ENABLED} reducedMotion=${reduce} coldStart=${coldStart}`);
      devLog('intro: animation start');
      const timings = introTimings(reduce);
      try {
        if (introAnimation(reduce) === 'fade') {
          // Reduced motion: no movement — snap to the full logo and fade out.
          symbolOpacity.setValue(0);
          fullOpacity.setValue(1);
          fullScale.setValue(1);
          devLog('intro: animation end');
          beginFadeOut(timings.fadeOutMs, timings.fadeOutDelayMs);
          return;
        }

        Animated.parallel([
          Animated.timing(symbolOpacity, {
            toValue: 0,
            duration: timings.symbolFadeMs,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(fullOpacity, {
            toValue: 1,
            duration: timings.fullFadeMs,
            delay: timings.fullFadeDelayMs,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(fullScale, {
            toValue: 1,
            duration: timings.fullScaleMs,
            delay: timings.fullScaleDelayMs,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          devLog('intro: animation end');
          if (finished) beginFadeOut(timings.fadeOutMs, timings.fadeOutDelayMs);
          else finish('animationInterrupted');
        });
      } catch {
        // Never let an animation error trap the user — just reveal the app.
        finish('animationError');
      }
    },
    [coldStart, symbolOpacity, fullOpacity, fullScale, beginFadeOut, finish],
  );

  // Start the reveal only once BOTH conditions hold: the app is ready (auth
  // resolved, or the fallback fired) AND the full-logo image has decoded.
  const maybeStart = useCallback(() => {
    if (started.current) return;
    if (!appReady || !fullLoaded.current) return;
    started.current = true;
    introHasPlayed = true;
    devLog('intro: ready');
    AccessibilityInfo.isReduceMotionEnabled()
      .then(startAnimation)
      .catch(() => startAnimation(false));
  }, [appReady, startAnimation]);

  // While auth is still loading, arm a bounded fallback so a hung session never
  // holds the splash look. (No synchronous setState — only a timer.)
  useEffect(() => {
    if (done || appReady) return;
    const fallback = setTimeout(() => setAuthFallbackFired(true), AUTH_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [done, appReady]);

  // Once ready, start the reveal (if the image is loaded); if the full-logo
  // `onLoad` is slow/flaky, reveal anyway after a short grace so the intro can
  // never be silently skipped. Both kept under the hard-timeout backstop.
  useEffect(() => {
    if (done || !appReady) return;
    maybeStart();
    if (started.current) return;
    const imgFallback = setTimeout(() => {
      if (!started.current && !fullLoaded.current) {
        fullLoaded.current = true;
        devLog('intro: full-logo not ready in time — revealing anyway');
        maybeStart();
      }
    }, IMAGE_FALLBACK_MS);
    return () => clearTimeout(imgFallback);
  }, [appReady, done, maybeStart]);

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
          crossfading in over the symbol and settling with a slight scale. It
          loads (opacity 0) from mount; the reveal waits for its onLoad. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        <Animated.Image
          source={fullSource}
          resizeMode="contain"
          importantForAccessibility="no"
          onLoad={() => {
            if (!fullLoaded.current) {
              fullLoaded.current = true;
              devLog('intro: full-logo loaded');
              maybeStart();
            }
          }}
          onError={() => finish('imageError')}
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
        onError={() => finish('imageError')}
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
