import { buildInstagramUrl, buildMailtoUrl, buildWhatsappUrl } from '../links';

describe('buildWhatsappUrl', () => {
  it('prefers a full WhatsApp URL, opened verbatim', () => {
    expect(buildWhatsappUrl('', 'https://wa.me/message/CE4JZHWV2PSJD1')).toBe(
      'https://wa.me/message/CE4JZHWV2PSJD1'
    );
    // A full URL wins even when a number is also present.
    expect(buildWhatsappUrl('+44 7700 900000', 'https://wa.me/message/ABC')).toBe(
      'https://wa.me/message/ABC'
    );
    expect(buildWhatsappUrl('', '  https://wa.me/message/ABC  ')).toBe('https://wa.me/message/ABC');
  });

  it('falls back to normalising a human-formatted number to digits', () => {
    expect(buildWhatsappUrl('+44 7700 900000')).toBe('https://wa.me/447700900000');
    expect(buildWhatsappUrl('(0044) 7700-900000')).toBe('https://wa.me/00447700900000');
    expect(buildWhatsappUrl('+44 7700 900000', '')).toBe('https://wa.me/447700900000');
    expect(buildWhatsappUrl('+44 7700 900000', '   ')).toBe('https://wa.me/447700900000');
  });

  it('returns null when both url and number are empty/unusable', () => {
    expect(buildWhatsappUrl('')).toBeNull();
    expect(buildWhatsappUrl('   ')).toBeNull();
    expect(buildWhatsappUrl('abc')).toBeNull();
    expect(buildWhatsappUrl('', '')).toBeNull();
  });
});

describe('buildInstagramUrl', () => {
  it('builds a www profile URL and strips a leading @', () => {
    expect(buildInstagramUrl('esim_global01')).toBe('https://www.instagram.com/esim_global01');
    expect(buildInstagramUrl('@esim_global01')).toBe('https://www.instagram.com/esim_global01');
    expect(buildInstagramUrl('  @esim_global01  ')).toBe('https://www.instagram.com/esim_global01');
  });

  it('strips trailing tracking query / path / fragment', () => {
    expect(buildInstagramUrl('esim_global01?igsh=abc123')).toBe(
      'https://www.instagram.com/esim_global01'
    );
    expect(buildInstagramUrl('esim_global01/')).toBe('https://www.instagram.com/esim_global01');
    expect(buildInstagramUrl('esim_global01#foo')).toBe('https://www.instagram.com/esim_global01');
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
