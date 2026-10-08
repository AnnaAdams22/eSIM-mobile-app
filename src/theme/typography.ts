/**
 * Typography tokens. Family: Inter (loaded via @expo-google-fonts/inter).
 *
 * The scale and weights are read off design/reference.png: large friendly
 * greetings ("Hi, Anna"), confident section titles, quiet secondary captions,
 * and a distinctive wide-tracked uppercase wordmark that matches the logo.
 *
 * `fontFamily` values map to the names registered in app/_layout.tsx.
 */

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  // The wordmark's light second word ("GLOBAL").
  light: 'Inter_300Light',
} as const;

export type FontFamily = (typeof fontFamily)[keyof typeof fontFamily];

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'button'
  | 'wordmark';

export interface TypeStyle {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

export const typography: Record<TextVariant, TypeStyle> = {
  // Warm greeting / hero line. Compact and elegant, not a heavy display — the
  // reference's "Hi, Anna" is a confident semibold, not a huge bold headline.
  display: { fontFamily: fontFamily.semibold, fontSize: 27, lineHeight: 34, letterSpacing: -0.4 },
  // Screen titles ("Choose your destination") — centred in the header.
  h1: { fontFamily: fontFamily.semibold, fontSize: 19, lineHeight: 25, letterSpacing: -0.2 },
  // Section titles ("Popular destinations", "Available plans").
  h2: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
  // List row titles ("France"), smaller headings.
  h3: { fontFamily: fontFamily.medium, fontSize: 15.5, lineHeight: 21, letterSpacing: -0.1 },
  // Default body copy.
  body: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  // Secondary copy, subtitles, prices ("From €4.90").
  bodySmall: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  // Labels, chips, pills, tab labels, badge text.
  caption: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 17, letterSpacing: 0.1 },
  // Button labels.
  button: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 20, letterSpacing: 0.1 },
  // Wide-tracked uppercase wordmark ("ESIM GLOBAL"). Bold first word is applied
  // at the component level; this is the base metric.
  wordmark: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 20, letterSpacing: 2.5 },
};

/**
 * Cap on dynamic-type scaling for DENSE UI (chips, pills, tab labels, list rows,
 * prices). Large system font sizes would otherwise overflow these tight layouts.
 * Pass this as `maxFontSizeMultiplier` via the `dense` prop on <Text>. Body and
 * greeting text intentionally keep full, uncapped scaling for readability.
 */
export const DENSE_MAX_FONT_SCALE = 1.3;
