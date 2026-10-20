import { socialProvidersVisible, anySocialVisible } from '../visibility';

describe('socialProvidersVisible', () => {
  describe('Android', () => {
    it('shows Google when configured (no Apple dependency)', () => {
      expect(
        socialProvidersVisible({ platform: 'android', googleConfigured: true, appleEnabled: false })
      ).toEqual({ google: true, apple: false });
    });

    it('still shows Google when Apple happens to be enabled', () => {
      expect(
        socialProvidersVisible({ platform: 'android', googleConfigured: true, appleEnabled: true })
      ).toEqual({ google: true, apple: false }); // Apple never shows on Android
    });

    it('hides Google when not configured', () => {
      expect(
        socialProvidersVisible({ platform: 'android', googleConfigured: false, appleEnabled: true })
      ).toEqual({ google: false, apple: false });
    });
  });

  describe('iOS', () => {
    it('hides Google when Apple is NOT enabled (App Store rule), even if configured', () => {
      expect(
        socialProvidersVisible({ platform: 'ios', googleConfigured: true, appleEnabled: false })
      ).toEqual({ google: false, apple: false });
    });

    it('shows both when Apple is enabled and Google configured', () => {
      expect(
        socialProvidersVisible({ platform: 'ios', googleConfigured: true, appleEnabled: true })
      ).toEqual({ google: true, apple: true });
    });

    it('shows only Apple when enabled but Google not configured', () => {
      expect(
        socialProvidersVisible({ platform: 'ios', googleConfigured: false, appleEnabled: true })
      ).toEqual({ google: false, apple: true });
    });

    it('shows nothing when Apple disabled and Google not configured', () => {
      expect(
        socialProvidersVisible({ platform: 'ios', googleConfigured: false, appleEnabled: false })
      ).toEqual({ google: false, apple: false });
    });
  });

  describe('web', () => {
    it('never shows anything', () => {
      expect(
        socialProvidersVisible({ platform: 'web', googleConfigured: true, appleEnabled: true })
      ).toEqual({ google: false, apple: false });
    });
  });
});

describe('anySocialVisible', () => {
  it('is true when either provider is visible', () => {
    expect(anySocialVisible({ google: true, apple: false })).toBe(true);
    expect(anySocialVisible({ google: false, apple: true })).toBe(true);
  });
  it('is false when neither is visible', () => {
    expect(anySocialVisible({ google: false, apple: false })).toBe(false);
  });
});
