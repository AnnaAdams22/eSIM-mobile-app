import { palette } from '@/theme/colors';
import {
  resolveLaunchStyle,
  launchVisual,
  introAnimation,
  shouldPlayIntro,
  resolveLaunchIntroEnabled,
  shouldRenderIntro,
  introDoneAfter,
  introTimings,
  INTRO_HARD_TIMEOUT_MS,
} from '../style';

describe('resolveLaunchStyle', () => {
  it('returns navy for the navy value (case/whitespace-insensitive)', () => {
    expect(resolveLaunchStyle('navy')).toBe('navy');
    expect(resolveLaunchStyle('NAVY')).toBe('navy');
    expect(resolveLaunchStyle('  Navy  ')).toBe('navy');
  });

  it('defaults to ivory for ivory, blanks, unknown values and nullish input', () => {
    expect(resolveLaunchStyle('ivory')).toBe('ivory');
    expect(resolveLaunchStyle('')).toBe('ivory');
    expect(resolveLaunchStyle('   ')).toBe('ivory');
    expect(resolveLaunchStyle('teal')).toBe('ivory');
    expect(resolveLaunchStyle(undefined)).toBe('ivory');
    expect(resolveLaunchStyle(null)).toBe('ivory');
  });
});

describe('launchVisual', () => {
  it('ivory: ivory background, dark bars, black ink', () => {
    expect(launchVisual('ivory')).toEqual({
      background: palette.ivory,
      statusBarStyle: 'dark',
      navBarStyle: 'light',
      ink: 'black',
    });
  });

  it('navy: navy background, light status icons, dark nav bar, white ink', () => {
    expect(launchVisual('navy')).toEqual({
      background: palette.navy900,
      statusBarStyle: 'light',
      navBarStyle: 'dark',
      ink: 'white',
    });
  });

  it('background always matches the native splash background colours', () => {
    expect(launchVisual('ivory').background).toBe('#F4F1EC');
    expect(launchVisual('navy').background).toBe('#1C2430');
  });
});

describe('introAnimation', () => {
  it('plays the full move+reveal when reduced motion is off', () => {
    expect(introAnimation(false)).toBe('full');
  });

  it('collapses to a quick fade when reduced motion is on', () => {
    expect(introAnimation(true)).toBe('fade');
  });
});

describe('shouldPlayIntro', () => {
  it('plays only on a cold start that has not already played', () => {
    expect(shouldPlayIntro({ coldStart: true, alreadyPlayed: false })).toBe(true);
  });

  it('does not replay once it has already played (e.g. on a re-render/resume)', () => {
    expect(shouldPlayIntro({ coldStart: true, alreadyPlayed: true })).toBe(false);
  });

  it('does not play when it is not a cold start', () => {
    expect(shouldPlayIntro({ coldStart: false, alreadyPlayed: false })).toBe(false);
    expect(shouldPlayIntro({ coldStart: false, alreadyPlayed: true })).toBe(false);
  });
});

describe('resolveLaunchIntroEnabled (the enabled switch)', () => {
  it('is enabled by default (missing / blank / true)', () => {
    expect(resolveLaunchIntroEnabled(undefined)).toBe(true);
    expect(resolveLaunchIntroEnabled(null)).toBe(true);
    expect(resolveLaunchIntroEnabled('')).toBe(true);
    expect(resolveLaunchIntroEnabled('   ')).toBe(true);
    expect(resolveLaunchIntroEnabled('true')).toBe(true);
  });

  it('is disabled only by an explicit false (case/whitespace-insensitive)', () => {
    expect(resolveLaunchIntroEnabled('false')).toBe(false);
    expect(resolveLaunchIntroEnabled('FALSE')).toBe(false);
    expect(resolveLaunchIntroEnabled('  False  ')).toBe(false);
  });

  it('treats any other value as enabled', () => {
    expect(resolveLaunchIntroEnabled('0')).toBe(true);
    expect(resolveLaunchIntroEnabled('no')).toBe(true);
    expect(resolveLaunchIntroEnabled('off')).toBe(true);
  });
});

describe('shouldRenderIntro', () => {
  it('renders only when enabled AND a fresh cold start', () => {
    expect(shouldRenderIntro({ enabled: true, coldStart: true, alreadyPlayed: false })).toBe(true);
  });

  it('never renders when disabled, whatever the launch state', () => {
    expect(shouldRenderIntro({ enabled: false, coldStart: true, alreadyPlayed: false })).toBe(
      false,
    );
    expect(shouldRenderIntro({ enabled: false, coldStart: false, alreadyPlayed: true })).toBe(
      false,
    );
  });

  it('does not render on resume or once already played', () => {
    expect(shouldRenderIntro({ enabled: true, coldStart: false, alreadyPlayed: false })).toBe(
      false,
    );
    expect(shouldRenderIntro({ enabled: true, coldStart: true, alreadyPlayed: true })).toBe(false);
  });
});

describe('intro hard timeout', () => {
  it('is a bounded backstop of at most 3s', () => {
    expect(INTRO_HARD_TIMEOUT_MS).toBe(3000);
    expect(INTRO_HARD_TIMEOUT_MS).toBeGreaterThan(0);
    expect(INTRO_HARD_TIMEOUT_MS).toBeLessThanOrEqual(3000);
  });
});

describe('introDoneAfter (every terminal event ends the intro)', () => {
  it('ends on the hard timeout, even if nothing else fired', () => {
    expect(introDoneAfter(false, 'timeout')).toBe(true);
  });

  it('skips immediately when an intro image fails to load', () => {
    expect(introDoneAfter(false, 'imageError')).toBe(true);
  });

  it('ends when the animation completes normally', () => {
    expect(introDoneAfter(false, 'animationComplete')).toBe(true);
  });

  it('stays done once done', () => {
    expect(introDoneAfter(true, 'timeout')).toBe(true);
  });
});

describe('introTimings (the intro is visible for its full ~0.9s)', () => {
  it('the full sequence is on screen for at least ~0.9s', () => {
    expect(introTimings(false).totalMs).toBeGreaterThanOrEqual(900);
  });

  it('never outlasts the hard-timeout backstop', () => {
    expect(introTimings(false).totalMs).toBeLessThan(INTRO_HARD_TIMEOUT_MS);
    expect(introTimings(true).totalMs).toBeLessThan(INTRO_HARD_TIMEOUT_MS);
  });

  it('reduced motion is a shorter quick fade', () => {
    expect(introTimings(true).totalMs).toBeLessThan(introTimings(false).totalMs);
    expect(introTimings(true).totalMs).toBeGreaterThan(0);
  });

  it('every leg has a non-negative duration', () => {
    const t = introTimings(false);
    Object.values(t).forEach((ms) => expect(ms).toBeGreaterThanOrEqual(0));
  });
});
