/**
 * Pure helper for the Delete-account confirmation field.
 *
 * The destructive "Delete my account" button stays disabled until the user
 * types the exact confirmation word. We trim surrounding whitespace (a trailing
 * space from autocorrect shouldn't block a correct entry) but the match is
 * case-sensitive — "delete" must not pass for an irreversible action.
 */

/** The word the user must type to confirm. */
export const DELETE_CONFIRM_WORD = 'DELETE';

/** True only when the trimmed input exactly equals the confirmation word. */
export function isDeleteConfirmed(input: string): boolean {
  return input.trim() === DELETE_CONFIRM_WORD;
}
