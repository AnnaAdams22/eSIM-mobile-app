import { palette } from '@/theme/colors';
import {
  resolveLaunchStyle,
  launchVisual,
  introAnimation,
  shouldPlayIntro,
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
