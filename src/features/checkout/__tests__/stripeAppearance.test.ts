import { buildPaymentSheetAppearance } from '../stripeAppearance';
import { lightTheme } from '@/theme';

describe('buildPaymentSheetAppearance', () => {
  const appearance = buildPaymentSheetAppearance(lightTheme);

  it('never sets a font.family that violates Android\'s rule', () => {
    // Android requires appearance.font.family to be a native font resource
    // filename: lowercase alphanumerics and underscores only. A value like
    // "Inter_500Medium" (our JS font name) makes initPaymentSheet throw. The
    // safest guard is to ship no font.family at all — but if one is ever added,
    // it must satisfy the Android pattern.
    const family = appearance.font?.family;
    expect(family).toBeUndefined();
    if (family !== undefined) {
      expect(family).toMatch(/^[a-z0-9_]+$/);
    }
  });

  it('still brands the sheet via colours and corner radius', () => {
    expect(appearance.colors?.primary).toBe(lightTheme.colors.primary);
    expect(appearance.shapes?.borderRadius).toBe(lightTheme.radii.md);
    expect(appearance.primaryButton?.shapes?.borderRadius).toBe(lightTheme.radii.pill);
  });
});
