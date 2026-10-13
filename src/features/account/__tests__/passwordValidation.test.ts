import {
  PASSWORD_CHANGE_ERROR_KEYS,
  validatePasswordChange,
} from '../passwordValidation';

const GOOD = 'newStrongPass1';

describe('validatePasswordChange', () => {
  it('returns null for a valid change', () => {
    expect(
      validatePasswordChange({ current: 'oldPassword1', next: GOOD, confirm: GOOD })
    ).toBeNull();
  });

  it('requires the current password', () => {
    expect(
      validatePasswordChange({ current: '', next: GOOD, confirm: GOOD })
    ).toBe(PASSWORD_CHANGE_ERROR_KEYS.currentRequired);
  });

  it('enforces the minimum length on the new password', () => {
    expect(
      validatePasswordChange({ current: 'oldPassword1', next: 'short', confirm: 'short' })
    ).toBe(PASSWORD_CHANGE_ERROR_KEYS.tooShort);
  });

  it('requires confirm to match', () => {
    expect(
      validatePasswordChange({ current: 'oldPassword1', next: GOOD, confirm: 'different1' })
    ).toBe(PASSWORD_CHANGE_ERROR_KEYS.mismatch);
  });

  it('rejects a new password identical to the current one', () => {
    expect(
      validatePasswordChange({ current: GOOD, next: GOOD, confirm: GOOD })
    ).toBe(PASSWORD_CHANGE_ERROR_KEYS.sameAsCurrent);
  });

  it('checks current-required before length', () => {
    // Both fail, but the empty current is surfaced first.
    expect(
      validatePasswordChange({ current: '', next: 'short', confirm: 'short' })
    ).toBe(PASSWORD_CHANGE_ERROR_KEYS.currentRequired);
  });
});
