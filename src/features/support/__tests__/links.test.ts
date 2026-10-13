import { buildInstagramUrl, buildMailtoUrl, buildWhatsappUrl } from '../links';

describe('buildWhatsappUrl', () => {
  it('normalises a human-formatted number to digits', () => {
    expect(buildWhatsappUrl('+44 7700 900000')).toBe('https://wa.me/447700900000');
    expect(buildWhatsappUrl('(0044) 7700-900000')).toBe('https://wa.me/00447700900000');
  });

  it('returns null for empty or digit-free input', () => {
    expect(buildWhatsappUrl('')).toBeNull();
    expect(buildWhatsappUrl('   ')).toBeNull();
    expect(buildWhatsappUrl('abc')).toBeNull();
  });
});

describe('buildInstagramUrl', () => {
  it('builds a profile URL and strips a leading @', () => {
    expect(buildInstagramUrl('esimglobal')).toBe('https://instagram.com/esimglobal');
    expect(buildInstagramUrl('@esimglobal')).toBe('https://instagram.com/esimglobal');
    expect(buildInstagramUrl('  @esimglobal  ')).toBe('https://instagram.com/esimglobal');
  });

  it('returns null for empty input', () => {
    expect(buildInstagramUrl('')).toBeNull();
    expect(buildInstagramUrl('   ')).toBeNull();
    expect(buildInstagramUrl('@')).toBeNull();
  });
});

describe('buildMailtoUrl', () => {
  it('builds a mailto with an encoded subject', () => {
    expect(buildMailtoUrl('info@esim-global.net', 'ESIM Global · v1.2.3')).toBe(
      'mailto:info@esim-global.net?subject=ESIM%20Global%20%C2%B7%20v1.2.3'
    );
  });

  it('omits the query when there is no subject', () => {
    expect(buildMailtoUrl('info@esim-global.net', '')).toBe('mailto:info@esim-global.net');
  });

  it('returns null for empty address', () => {
    expect(buildMailtoUrl('', 'subject')).toBeNull();
    expect(buildMailtoUrl('   ', 'subject')).toBeNull();
  });
});
