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
  // Big, warm greeting / hero line.
  display: { fontFamily: fontFamily.bold, fontSize: 30, lineHeight: 38, letterSpacing: -0.4 },
  // Screen titles.
  h1: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  // Card / section headings.
  h2: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  // Row titles ("France"), smaller headings.
  h3: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 23, letterSpacing: -0.1 },
  // Default body copy.
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  // Secondary copy, subtitles ("From $4.90").
  bodySmall: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  // Labels, metadata, badge text.
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  // Button labels.
  button: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 20, letterSpacing: 0.1 },
  // Wide-tracked uppercase wordmark ("ESIM GLOBAL"). Bold first word is applied
  // at the component level; this is the base metric.
  wordmark: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 20, letterSpacing: 2.5 },
};
