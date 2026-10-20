import { decidePostSignIn, appleDisplayName } from '../flow';

describe('decidePostSignIn', () => {
  it('proceeds with a non-empty id token', () => {
    expect(decidePostSignIn('eyJhbGciOi...')).toEqual({ proceed: true });
  });
  it('does not proceed with a missing/blank token', () => {
    expect(decidePostSignIn(null)).toEqual({ proceed: false });
    expect(decidePostSignIn(undefined)).toEqual({ proceed: false });
    expect(decidePostSignIn('')).toEqual({ proceed: false });
    expect(decidePostSignIn('   ')).toEqual({ proceed: false });
  });
});

describe('appleDisplayName', () => {
  it('joins given and family name', () => {
    expect(appleDisplayName({ givenName: 'Ada', familyName: 'Lovelace' })).toBe('Ada Lovelace');
  });
  it('uses whichever part is present', () => {
    expect(appleDisplayName({ givenName: 'Ada', familyName: null })).toBe('Ada');
    expect(appleDisplayName({ givenName: '', familyName: 'Lovelace' })).toBe('Lovelace');
  });
  it('trims whitespace', () => {
    expect(appleDisplayName({ givenName: '  Ada  ', familyName: ' Lovelace ' })).toBe('Ada Lovelace');
  });
  it('returns null when nothing usable is present (later sign-ins)', () => {
    expect(appleDisplayName(null)).toBeNull();
    expect(appleDisplayName(undefined)).toBeNull();
    expect(appleDisplayName({})).toBeNull();
    expect(appleDisplayName({ givenName: '', familyName: '   ' })).toBeNull();
  });
});
