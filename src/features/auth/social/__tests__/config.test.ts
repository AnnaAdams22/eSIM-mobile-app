import { readOptionalClientId } from '../config';

describe('readOptionalClientId', () => {
  it('returns an empty string for undefined/blank', () => {
    expect(readOptionalClientId(undefined)).toBe('');
    expect(readOptionalClientId('')).toBe('');
    expect(readOptionalClientId('   ')).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(readOptionalClientId('  abc.apps.googleusercontent.com  ')).toBe(
      'abc.apps.googleusercontent.com'
    );
  });

  it('parses the iOS client id value verbatim', () => {
    const iosId = '53531612788-apqeg7vmudiganha106k8ts907jdacds.apps.googleusercontent.com';
    expect(readOptionalClientId(iosId)).toBe(iosId);
  });
});
