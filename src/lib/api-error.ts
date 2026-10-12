/**
 * Typed API errors, split out from `api.ts` so pure logic (and its unit tests)
 * can reference `ApiError` without pulling in the Supabase client that `api.ts`
 * imports at module load. `api.ts` re-exports these, so existing importers are
 * unaffected.
 */

import type { ApiErrorBody } from './api-types';

/** A structured error carrying the backend's `{ error, code }` plus HTTP status. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly body?: ApiErrorBody;

  constructor(status: number, body?: ApiErrorBody, message?: string) {
    super(message ?? body?.error ?? `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.code ?? body?.error;
    this.body = body;
  }
}

export class TimeoutError extends Error {
  constructor() {
    super('The request timed out.');
    this.name = 'TimeoutError';
  }
}
