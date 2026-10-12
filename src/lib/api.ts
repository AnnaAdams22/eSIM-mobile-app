/**
 * Typed fetch client for the ESIM Global backend.
 *
 * Responsibilities:
 *  - Prefix requests with EXPO_PUBLIC_API_URL.
 *  - Attach the Supabase access token (Authorization: Bearer …) automatically.
 *  - On 401, refresh the Supabase session ONCE and retry; if that fails, sign out.
 *  - Parse the backend's JSON error shape `{ error, code? }` into a typed ApiError.
 *  - Enforce a request timeout (AbortController).
 *
 * The app never computes prices — all money comes from these responses.
 */

import { config } from '@/config';
import { supabase } from './supabase';
import type {
  ApiErrorBody,
  EsimDetail,
  EsimsResponse,
  EsimUsage,
  Me,
  OrderStatus,
  PaymentSheetRequest,
  PaymentSheetResponse,
  PlansResponse,
  PromoValidation,
  RegisterDeviceRequest,
  TopupOptionsResponse,
  TopupPaymentSheetRequest,
} from './api-types';

const DEFAULT_TIMEOUT_MS = 15000;

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

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** JSON body; serialised automatically. */
  body?: unknown;
  /** Skip attaching the auth token (for public endpoints like the catalog). */
  auth?: boolean;
  /** Per-request timeout override. */
  timeoutMs?: number;
  signal?: AbortSignal;
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function rawFetch(
  path: string,
  token: string | null,
  opts: RequestOptions
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  // Chain an externally-provided signal to our timeout controller.
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await fetch(`${config.apiUrl}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) throw new TimeoutError();
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function parseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, undefined, `Malformed response from server.`);
  }
}

async function errorFromResponse(res: Response): Promise<ApiError> {
  let body: ApiErrorBody | undefined;
  try {
    const text = await res.text();
    if (text) body = JSON.parse(text) as ApiErrorBody;
  } catch {
    // non-JSON error body; leave undefined
  }
  return new ApiError(res.status, body);
}

/**
 * Core request method. Attaches the token, handles a single 401→refresh→retry,
 * and signs out if the refreshed request still 401s.
 */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const useAuth = opts.auth !== false; // default: authenticated
  let token = useAuth ? await getAccessToken() : null;

  let res = await rawFetch(path, token, opts);

  if (res.status === 401 && useAuth) {
    // Refresh the session once, then retry.
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session) {
      token = data.session.access_token;
      res = await rawFetch(path, token, opts);
    }
    // Still unauthorised after a refresh attempt → the session is dead.
    if (res.status === 401) {
      await supabase.auth.signOut();
      throw await errorFromResponse(res);
    }
  }

  if (!res.ok) throw await errorFromResponse(res);
  return parseBody<T>(res);
}

/** Typed endpoint wrappers. Keep these aligned with ../esim-backend routes. */
export const api = {
  // Public catalog — no auth.
  getPlans: () => request<PlansResponse>('/api/plans', { auth: false }),

  // Account.
  getMe: () => request<Me>('/api/me'),
  deleteAccount: () =>
    request<void>('/api/me', { method: 'DELETE', body: { confirm: 'DELETE' } }),

  // Purchase.
  validatePromo: (planId: string, code: string) =>
    request<PromoValidation>('/api/me/promo/validate', {
      method: 'POST',
      body: { plan_id: planId, code },
    }),
  createPaymentSheet: (payload: PaymentSheetRequest) =>
    request<PaymentSheetResponse>('/api/me/payment-sheet', { method: 'POST', body: payload }),
  /** Poll for the order a PaymentIntent produced. 404 until the order exists. */
  getOrderByPaymentIntent: (paymentIntentId: string) =>
    request<OrderStatus>(
      `/api/me/orders/by-payment-intent/${encodeURIComponent(paymentIntentId)}`
    ),

  // My eSIMs.
  getEsims: () => request<EsimsResponse>('/api/me/esims'),
  getEsim: (iccid: string) => request<EsimDetail>(`/api/me/esims/${iccid}`),
  getEsimUsage: (iccid: string) => request<EsimUsage>(`/api/me/esims/${iccid}/usage`),

  // Top-ups.
  getTopupOptions: (iccid: string) =>
    request<TopupOptionsResponse>(`/api/me/esims/${iccid}/topup-options`),
  createTopupPaymentSheet: (iccid: string, payload: TopupPaymentSheetRequest) =>
    request<PaymentSheetResponse>(`/api/me/esims/${iccid}/topup-payment-sheet`, {
      method: 'POST',
      body: payload,
    }),

  // Push notifications.
  registerDevice: (payload: RegisterDeviceRequest) =>
    request<void>('/api/me/devices', { method: 'POST', body: payload }),
  deregisterDevice: (expoPushToken: string) =>
    request<void>('/api/me/devices', {
      method: 'DELETE',
      body: { expo_push_token: expoPushToken },
    }),
};
