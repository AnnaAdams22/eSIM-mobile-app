/**
 * Pure helpers for the 6-digit verification code input.
 *
 * The CodeInput component is driven by a single string of digits (a hidden,
 * autofill-capable TextInput backs the visible boxes), so all the interesting
 * behaviour — stripping non-digits from typed or pasted text, clamping to the
 * code length, splitting into per-box characters — lives here as pure functions
 * that can be unit-tested without rendering.
 */

/** Default length of the email verification code. */
export const CODE_LENGTH = 6;

/**
 * Keep only digits and clamp to `maxLen`. Handles both single keystrokes and a
 * full pasted string (incl. spaces/dashes, e.g. "123 456" or "123-456").
 */
export function sanitizeDigits(input: string, maxLen: number = CODE_LENGTH): string {
  return input.replace(/\D/g, '').slice(0, maxLen);
}

/** Split a code into exactly `len` cells, padding missing trailing cells with ''. */
export function codeCells(code: string, len: number = CODE_LENGTH): string[] {
  const cells: string[] = [];
  for (let i = 0; i < len; i++) cells.push(code[i] ?? '');
  return cells;
}

/** The index of the box that should appear "focused" (the first empty one). */
export function activeCellIndex(code: string, len: number = CODE_LENGTH): number {
  return Math.min(code.length, len - 1);
}

export function isCodeComplete(code: string, len: number = CODE_LENGTH): boolean {
  return sanitizeDigits(code, len).length === len;
}
