import { rawNonceFromBytes, isRawNonce, RAW_NONCE_BYTES } from '../nonce';

describe('rawNonceFromBytes', () => {
  it('encodes bytes as zero-padded lowercase hex', () => {
    expect(rawNonceFromBytes([0, 1, 15, 16, 255])).toBe('00010f10ff');
  });

  it('masks values to a single byte', () => {
    expect(rawNonceFromBytes([256 + 0xab])).toBe('ab');
  });

  it('works with a Uint8Array', () => {
    expect(rawNonceFromBytes(Uint8Array.from([0xde, 0xad, 0xbe, 0xef]))).toBe('deadbeef');
  });

  it('produces 2 hex chars per byte for a full-length nonce', () => {
    const bytes = new Uint8Array(RAW_NONCE_BYTES).fill(7);
    const nonce = rawNonceFromBytes(bytes);
    expect(nonce).toHaveLength(RAW_NONCE_BYTES * 2);
    expect(nonce).toBe('07'.repeat(RAW_NONCE_BYTES));
  });

  it('returns an empty string for no bytes', () => {
    expect(rawNonceFromBytes([])).toBe('');
  });
});

describe('isRawNonce', () => {
  it('accepts a long lowercase hex string', () => {
    expect(isRawNonce('00010f10ffabcdef00010f10ffabcdef')).toBe(true);
  });
  it('rejects too-short, uppercase, non-hex, or non-string values', () => {
    expect(isRawNonce('abc')).toBe(false); // too short
    expect(isRawNonce('ABCDEF0123456789')).toBe(false); // uppercase
    expect(isRawNonce('xyz!0123456789abcd')).toBe(false); // non-hex
    expect(isRawNonce(123)).toBe(false);
    expect(isRawNonce(null)).toBe(false);
    expect(isRawNonce(undefined)).toBe(false);
  });
});
