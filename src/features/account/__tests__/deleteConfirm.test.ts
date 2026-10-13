import { DELETE_CONFIRM_WORD, isDeleteConfirmed } from '../deleteConfirm';

describe('isDeleteConfirmed', () => {
  it('enables only for the exact confirmation word', () => {
    expect(isDeleteConfirmed(DELETE_CONFIRM_WORD)).toBe(true);
    expect(isDeleteConfirmed('DELETE')).toBe(true);
  });

  it('trims surrounding whitespace', () => {
    expect(isDeleteConfirmed('  DELETE  ')).toBe(true);
    expect(isDeleteConfirmed('\tDELETE\n')).toBe(true);
  });

  it('is case-sensitive — lowercase/mixed does not pass', () => {
    expect(isDeleteConfirmed('delete')).toBe(false);
    expect(isDeleteConfirmed('Delete')).toBe(false);
    expect(isDeleteConfirmed('DELETED')).toBe(false);
  });

  it('rejects empty and partial input', () => {
    expect(isDeleteConfirmed('')).toBe(false);
    expect(isDeleteConfirmed('   ')).toBe(false);
    expect(isDeleteConfirmed('DEL')).toBe(false);
    expect(isDeleteConfirmed('DELETE me')).toBe(false);
  });
});
