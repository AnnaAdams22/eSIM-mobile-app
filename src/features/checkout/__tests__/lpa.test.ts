import {
  activationStringFromTapLink,
  androidInstallUrlFromLpa,
  androidInstallUrlFromTapLink,
  buildLpaString,
  lpaQrValueFromTapLink,
  parseActivationFromTapLink,
  parseLpa,
} from '../lpa';

const TAP_LINK =
  'https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=' +
  encodeURIComponent('LPA:1$smdp.io$K2-2U0001-1SJIOUX');

describe('activationStringFromTapLink', () => {
  it('decodes the carddata parameter', () => {
    expect(activationStringFromTapLink(TAP_LINK)).toBe('LPA:1$smdp.io$K2-2U0001-1SJIOUX');
  });

  it('finds carddata when it is not the first query parameter', () => {
    const link = 'https://x.apple.com/p?foo=bar&carddata=' + encodeURIComponent('LPA:1$a$b');
    expect(activationStringFromTapLink(link)).toBe('LPA:1$a$b');
  });

  it('returns null for null/empty/absent carddata', () => {
    expect(activationStringFromTapLink(null)).toBeNull();
    expect(activationStringFromTapLink(undefined)).toBeNull();
    expect(activationStringFromTapLink('https://apple.com/p?other=1')).toBeNull();
  });
});

describe('parseLpa', () => {
  it('parses a standard LPA string', () => {
    expect(parseLpa('LPA:1$smdp.io$K2-2U0001-1SJIOUX')).toEqual({
      smdpAddress: 'smdp.io',
      activationCode: 'K2-2U0001-1SJIOUX',
    });
  });

  it('ignores a trailing confirmation-code segment', () => {
    expect(parseLpa('LPA:1$smdp.example.com$CODE123$1')).toEqual({
      smdpAddress: 'smdp.example.com',
      activationCode: 'CODE123',
    });
  });

  it('is case-insensitive on the scheme and trims whitespace', () => {
    expect(parseLpa('  lpa:1$smdp.io$CODE  ')).toEqual({
      smdpAddress: 'smdp.io',
      activationCode: 'CODE',
    });
  });

  it('returns null when the format differs', () => {
    expect(parseLpa(null)).toBeNull();
    expect(parseLpa('')).toBeNull();
    expect(parseLpa('not-an-lpa-string')).toBeNull();
    expect(parseLpa('LPA:1$smdp.io')).toBeNull(); // missing code
    expect(parseLpa('LPA:1$$CODE')).toBeNull(); // missing address
    expect(parseLpa('LPA:1$smdp.io$')).toBeNull(); // empty code
  });
});

describe('parseActivationFromTapLink', () => {
  it('parses activation details straight from a tap link', () => {
    expect(parseActivationFromTapLink(TAP_LINK)).toEqual({
      smdpAddress: 'smdp.io',
      activationCode: 'K2-2U0001-1SJIOUX',
    });
  });

  it('returns null for a tap link without usable carddata', () => {
    expect(parseActivationFromTapLink('https://apple.com/p')).toBeNull();
    expect(parseActivationFromTapLink(null)).toBeNull();
  });
});

describe('buildLpaString', () => {
  it('builds the canonical LPA activation string from its parts', () => {
    expect(
      buildLpaString({ smdpAddress: 'smdp.io', activationCode: 'K2-2U0001-1SJIOUX' })
    ).toBe('LPA:1$smdp.io$K2-2U0001-1SJIOUX');
  });

  it('round-trips through parseLpa', () => {
    const parsed = parseLpa('LPA:1$smdp.example.com$CODE123');
    expect(parsed).not.toBeNull();
    expect(buildLpaString(parsed!)).toBe('LPA:1$smdp.example.com$CODE123');
  });
});

describe('androidInstallUrlFromLpa', () => {
  it('builds the exact Android universal-link URL for a known LPA', () => {
    expect(
      androidInstallUrlFromLpa({ smdpAddress: 'smdp.io', activationCode: 'K2-2U0001-1SJIOUX' })
    ).toBe(
      'https://esimsetup.android.com/esim_qrcode_provisioning?carddata=LPA:1$smdp.io$K2-2U0001-1SJIOUX'
    );
  });

  it('uses a lowercase base URL while preserving activation-code capitals', () => {
    const url = androidInstallUrlFromLpa({
      smdpAddress: 'RSP.TRUPHONE.COM',
      activationCode: 'QR-G1A2B3',
    });
    // Base (scheme + host + path) is lowercase; the carddata value keeps its case.
    expect(url).toBe(
      'https://esimsetup.android.com/esim_qrcode_provisioning?carddata=LPA:1$RSP.TRUPHONE.COM$QR-G1A2B3'
    );
    const [base] = url!.split('?');
    expect(base).toBe(base.toLowerCase());
  });

  it('keeps the LPA $ and : delimiters literal (not percent-encoded)', () => {
    const url = androidInstallUrlFromLpa({ smdpAddress: 'smdp.io', activationCode: 'CODE' })!;
    expect(url).toContain('carddata=LPA:1$smdp.io$CODE');
    expect(url).not.toContain('%24');
    expect(url).not.toContain('%3A');
  });

  it('percent-encodes characters that would otherwise break the query', () => {
    const url = androidInstallUrlFromLpa({ smdpAddress: 'smdp.io', activationCode: 'A B&C' })!;
    // Space and & must not survive raw in a URL query value.
    expect(url).toBe(
      'https://esimsetup.android.com/esim_qrcode_provisioning?carddata=LPA:1$smdp.io$A%20B%26C'
    );
  });

  it('returns null for a null activation', () => {
    expect(androidInstallUrlFromLpa(null)).toBeNull();
  });
});

describe('androidInstallUrlFromTapLink', () => {
  it('derives the install URL from a tap link', () => {
    expect(androidInstallUrlFromTapLink(TAP_LINK)).toBe(
      'https://esimsetup.android.com/esim_qrcode_provisioning?carddata=LPA:1$smdp.io$K2-2U0001-1SJIOUX'
    );
  });

  it('drops the optional confirmation segment', () => {
    const link = 'https://x.apple.com/p?carddata=' + encodeURIComponent('LPA:1$smdp.io$CODE$1');
    expect(androidInstallUrlFromTapLink(link)).toBe(
      'https://esimsetup.android.com/esim_qrcode_provisioning?carddata=LPA:1$smdp.io$CODE'
    );
  });

  it('returns null when the tap link has no parseable LPA', () => {
    expect(androidInstallUrlFromTapLink('https://apple.com/p')).toBeNull();
    expect(androidInstallUrlFromTapLink(null)).toBeNull();
  });
});

describe('lpaQrValueFromTapLink', () => {
  it('derives the exact QR value from a tap link', () => {
    expect(lpaQrValueFromTapLink(TAP_LINK)).toBe('LPA:1$smdp.io$K2-2U0001-1SJIOUX');
  });

  it('drops a trailing confirmation-code segment from the QR value', () => {
    const link =
      'https://x.apple.com/p?carddata=' + encodeURIComponent('LPA:1$smdp.io$CODE$1');
    expect(lpaQrValueFromTapLink(link)).toBe('LPA:1$smdp.io$CODE');
  });

  it('returns null when the tap link has no parseable LPA (caller falls back to the image)', () => {
    expect(lpaQrValueFromTapLink('https://apple.com/p')).toBeNull();
    expect(lpaQrValueFromTapLink(null)).toBeNull();
  });
});
