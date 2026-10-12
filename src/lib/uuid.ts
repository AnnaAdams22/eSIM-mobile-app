/**
 * uuidv4 — a RFC-4122 version-4 UUID generator.
 *
 * Used for the checkout `client_request_id` the backend keys idempotency on, so
 * what matters is uniqueness per attempt, not cryptographic strength. Expo Go /
 * dev builds don't guarantee a global `crypto.getRandomValues`, so this relies
 * only on `Math.random`, which is sufficient for an idempotency token.
 */

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
