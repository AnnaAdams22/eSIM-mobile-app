import {
  PASSWORD_MIN_LENGTH,
  isValidEmail,
  isNonEmptyName,
  isValidPassword,
  passwordsMatch,
  passwordStrength,
} from '../validation';

describe('isValidEmail', () => {
  it.each(['a@b.co', 'first.last@example.com', 'x+tag@sub.domain.io', '  trim@me.com  '])(
    'accepts %s',
    (email) => {
      expect(isValidEmail(email)).toBe(true);
    }
  );

  it.each(['', 'nope', 'no@domain', '@example.com', 'a b@example.com', 'two@@at.com', 'missing@dot'])(
    'rejects %s',
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    }
  );
});

describe('isNonEmptyName', () => {
  it('accepts a real name', () => {
    expect(isNonEmptyName('Anna')).toBe(true);
  });
  it('rejects blank / whitespace', () => {
    expect(isNonEmptyName('')).toBe(false);
    expect(isNonEmptyName('   ')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('requires the minimum length', () => {
    expect(isValidPassword('a'.repeat(PASSWORD_MIN_LENGTH))).toBe(true);
    expect(isValidPassword('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe(false);
  });
});

describe('passwordsMatch', () => {
  it('matches identical non-empty strings', () => {
    expect(passwordsMatch('hunter22', 'hunter22')).toBe(true);
  });
  it('rejects mismatches and empties', () => {
    expect(passwordsMatch('hunter22', 'hunter23')).toBe(false);
    expect(passwordsMatch('', '')).toBe(false);
  });
});

describe('passwordStrength', () => {
  it('is weak below the minimum', () => {
    expect(passwordStrength('short')).toBe('weak');
  });
  it('is weak for a long but low-variety password', () => {
    expect(passwordStrength('aaaaaaaa')).toBe('weak');
  });
  it('is fair for moderate variety', () => {
    expect(passwordStrength('password1')).toBe('fair');
  });
  it('is strong for high variety and length', () => {
    expect(passwordStrength('Str0ng!Passw0rd')).toBe('strong');
  });
});
