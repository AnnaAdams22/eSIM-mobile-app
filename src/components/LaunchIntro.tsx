/**
 * LaunchIntro — the animated opening overlay.
 *
 * As soon as the native splash hides, this renders a full-screen overlay that
 * starts visually IDENTICAL to the native splash (same background, the symbol at
 * the same size and position — it reuses the very same splash image), so there
 * is no jump. Once the app is actually ready (fonts are loaded by the time this
 * mounts; here we wait for auth to resolve), it plays a ~860ms sequence: the
 * symbol scales slightly and rises, the "ESIM GLOBAL" wordmark fades in below,
 * and the overlay fades out to reveal the app.
 *
 * - Reduced motion: skips the movement and does a quick fade only.
 * - Cold start only: a module-level flag means it plays once per JS runtime and
 *   never again, so returning from the background (which does not restart JS)
 *   shows no intro. See `shouldPlayIntro` in src/features/launch/style.ts.
 * - Two styles (ivory / navy) come from LAUNCH_STYLE; the visual config also
 *   tints the status & navigation bars to match the background.
 *
 * Built on React Native's `Animated` (react-native-reanimated is not installed;
 * no new native modules are added). All animated props use the native driver.
 */

import { useEffect, useRef, useState } from 'react';
// Animated values are created with useState's lazy initialiser (not a ref) so
// they can be read in render without tripping the refs-in-render lint rule —
// matching OfflineBanner/Toast in this codebase.
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { useTranslation } from 'react-i18next';

import { LAUNCH_STYLE } from '@/config';
import { useAuth } from '@/features/auth';
import { introAnimation, launchVisual, shouldPlayIntro } from '@/features/launch/style';

// The symbol images are square (1024²) and reuse the native splash assets so the
// overlay starts pixel-identical to it; rendered at the same width as app.json's
// `imageWidth`. The wordmark uses the brand wordmark asset (its own aspect).
const SYMBOL_SIZE = 160; // must match app.json expo-splash-screen `imageWidth`
const WORDMARK_WIDTH = 200;
const WORDMARK_HEIGHT = Math.round(WORDMARK_WIDTH / (1802 / 194)); // ≈ 22

const SYMBOL_RISE = 34; // how far the symbol moves up
const SYMBOL_SCALE_TO = 1.06; // slight scale-up
const WORDMARK_DROP = 44; // the wordmark sits this far below centre

// Static requires (Metro needs literal paths), indexed by style.
const SYMBOL_SOURCE = {
  ivory: require('../../assets/splash-icon.png'),
  navy: require('../../assets/splash-icon-navy.png'),
} as const;
const WORDMARK_SOURCE = {
  ivory: require('../../assets/brand/esim-logo-wordmark.png'),
  navy: require('../../assets/brand/esim-logo-wordmark-white.png'),
} as const;

// Plays once per cold start (fresh JS runtime); survives re-renders/resume.
let introHasPlayed = false;

export function LaunchIntro() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const visual = launchVisual(LAUNCH_STYLE);
  const symbolSource = SYMBOL_SOURCE[LAUNCH_STYLE];
  const wordmarkSource = WORDMARK_SOURCE[LAUNCH_STYLE];

  // Decide at mount whether to show the overlay at all.
  const [done, setDone] = useState(
    () => !shouldPlayIntro({ coldStart: true, alreadyPlayed: introHasPlayed }),
  );

  const [overlayOpacity] = useState(() => new Animated.Value(1));
  const [symbolY] = useState(() => new Animated.Value(0));
  const [symbolScale] = useState(() => new Animated.Value(1));
  const [wordmarkOpacity] = useState(() => new Animated.Value(0));
  const started = useRef(false);

  useEffect(() => {
    if (done || started.current) return;

    const finish = () => setDone(true);

    const startAnimation = (reduce: boolean) => {
      if (introAnimation(reduce) === 'fade') {
        // Reduced motion: no movement — show the wordmark and quickly fade out.
        wordmarkOpacity.setValue(1);
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 240,
          delay: 120,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start(finish);
        return;
      }

      Animated.sequence([
        Animated.parallel([
          Animated.timing(symbolY, {
            toValue: -SYMBOL_RISE,
            duration: 440,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(symbolScale, {
            toValue: SYMBOL_SCALE_TO,
            duration: 440,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(wordmarkOpacity, {
            toValue: 1,
            duration: 320,
            delay: 140,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          delay: 120,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(finish);
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
    // timeout means a hung session never traps the user on the splash.
    if (status === 'loading') {
      const fallback = setTimeout(runIntro, 2000);
      return () => clearTimeout(fallback);
    }
    runIntro();
  }, [status, done, overlayOpacity, symbolY, symbolScale, wordmarkOpacity]);

  if (done) return null;

  return (
    <Animated.View
      pointerEvents="auto"
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

      {/* Wordmark layer — centred, then dropped below the symbol; fades in. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        <Animated.Image
          source={wordmarkSource}
          resizeMode="contain"
          importantForAccessibility="no"
          style={{
            width: WORDMARK_WIDTH,
            height: WORDMARK_HEIGHT,
            opacity: wordmarkOpacity,
            transform: [{ translateY: WORDMARK_DROP }],
          }}
        />
      </View>

      {/* Symbol — centred, rises and scales slightly. */}
      <Animated.Image
        source={symbolSource}
        resizeMode="contain"
        importantForAccessibility="no"
        style={{
          width: SYMBOL_SIZE,
          height: SYMBOL_SIZE,
          transform: [{ translateY: symbolY }, { scale: symbolScale }],
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
