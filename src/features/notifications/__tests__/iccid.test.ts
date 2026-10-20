import { extractNotificationIccid, isValidIccid } from '../iccid';

describe('isValidIccid', () => {
  it('accepts a standard 19-digit ICCID', () => {
    expect(isValidIccid('8991000000000000001')).toBe(true);
  });

  it('accepts a 20-digit ICCID', () => {
    expect(isValidIccid('89910000000000000019')).toBe(true);
  });

  it('rejects values that are too short or too long', () => {
    expect(isValidIccid('8991')).toBe(false);
    expect(isValidIccid('8991000000000000000000000')).toBe(false);
  });

  it('rejects non-digit characters', () => {
    expect(isValidIccid('8991-0000-0000-0000001')).toBe(false);
    expect(isValidIccid('LPA:1$smdp$code')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isValidIccid(null)).toBe(false);
    expect(isValidIccid(undefined)).toBe(false);
    expect(isValidIccid(8991000000000000001)).toBe(false);
    expect(isValidIccid({})).toBe(false);
  });
});

describe('extractNotificationIccid', () => {
  it('returns the iccid from a well-formed notification payload', () => {
    expect(extractNotificationIccid({ type: 'low_data', iccid: '8991000000000000001' })).toBe(
      '8991000000000000001'
    );
  });

  it('trims surrounding whitespace before validating', () => {
    expect(extractNotificationIccid({ iccid: ' 8991000000000000001 ' })).toBe(
      '8991000000000000001'
    );
  });

  it('returns null when the iccid is missing or malformed', () => {
    expect(extractNotificationIccid({ type: 'low_data' })).toBeNull();
    expect(extractNotificationIccid({ iccid: 'not-an-iccid' })).toBeNull();
    expect(extractNotificationIccid({ iccid: 123 })).toBeNull();
  });

  it('returns null for non-object payloads', () => {
    expect(extractNotificationIccid(null)).toBeNull();
    expect(extractNotificationIccid(undefined)).toBeNull();
    expect(extractNotificationIccid('8991000000000000001')).toBeNull();
  });
});
