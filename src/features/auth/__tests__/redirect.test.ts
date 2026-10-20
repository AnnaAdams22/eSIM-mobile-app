import { pathWithParams, safeRedirect } from '../redirect';

describe('safeRedirect', () => {
  it('accepts internal absolute paths', () => {
    expect(safeRedirect('/checkout')).toBe('/checkout');
    expect(safeRedirect('/checkout?planId=abc123')).toBe('/checkout?planId=abc123');
    expect(safeRedirect('/destinations/FR')).toBe('/destinations/FR');
  });

  it('trims surrounding whitespace', () => {
    expect(safeRedirect('  /checkout  ')).toBe('/checkout');
  });

  it('rejects non-strings and empties', () => {
    expect(safeRedirect(undefined)).toBeNull();
    expect(safeRedirect(null)).toBeNull();
    expect(safeRedirect(42)).toBeNull();
    expect(safeRedirect('')).toBeNull();
    expect(safeRedirect('   ')).toBeNull();
  });

  it('rejects relative paths', () => {
    expect(safeRedirect('checkout')).toBeNull();
    expect(safeRedirect('../secret')).toBeNull();
  });

  it('rejects external and protocol-relative URLs', () => {
    expect(safeRedirect('//evil.com')).toBeNull();
    expect(safeRedirect('https://evil.com')).toBeNull();
    expect(safeRedirect('http://evil.com/path')).toBeNull();
  });

  it('rejects dangerous schemes', () => {
    expect(safeRedirect('javascript:alert(1)')).toBeNull();
    expect(safeRedirect('mailto:a@b.com')).toBeNull();
    expect(safeRedirect('esimglobal://deep/link')).toBeNull();
  });

  it('rejects backslashes and control characters', () => {
    expect(safeRedirect('/\\evil.com')).toBeNull();
    expect(safeRedirect('/path\nwith-newline')).toBeNull();
  });

  it('refuses to redirect back into the auth stack', () => {
    expect(safeRedirect('/(auth)')).toBeNull();
    expect(safeRedirect('/(auth)/sign-in')).toBeNull();
  });
});

describe('pathWithParams', () => {
  it('returns the bare path when there are no params', () => {
    expect(pathWithParams('/checkout', {})).toBe('/checkout');
  });

  it('carries string params through as a query (so checkout keeps its plan)', () => {
    expect(pathWithParams('/checkout', { planId: 'abc123' })).toBe('/checkout?planId=abc123');
    // Result is safe to pass straight to safeRedirect.
    expect(safeRedirect(pathWithParams('/checkout', { planId: 'abc123' }))).toBe(
      '/checkout?planId=abc123'
    );
  });

  it('drops the redirect param (never nests) and non-string/empty values', () => {
    expect(
      pathWithParams('/checkout', {
        planId: 'abc',
        redirect: '/somewhere',
        empty: '',
        arr: ['x', 'y'],
        n: 2,
      } as Record<string, unknown>)
    ).toBe('/checkout?planId=abc');
  });

  it('sorts and encodes pairs for a stable result', () => {
    expect(pathWithParams('/esim/[iccid]/topup', { iccid: '89 01', planId: 'p1' })).toBe(
      '/esim/[iccid]/topup?iccid=89%2001&planId=p1'
    );
  });
});
