/**
 * TypeScript types for the backend API responses.
 *
 * Derived from ../esim-backend/src/routes/{shop,payments,me,esims,devices}.js
 * (read-only). Field names are snake_case to match the JSON exactly. All money
 * is in EUR cents (integer); `*_display` fields are server-formatted strings.
 *
 * IMPORTANT: prices always come from the backend. The app never computes prices.
 */

export type Currency = 'eur';

/** Standard backend error body. The backend currently emits `{ error }`; some
 *  endpoints add context fields. `code` is accepted if the backend adds it later. */
export interface ApiErrorBody {
  error: string;
  code?: string;
  // Context carried by some 409s (e.g. top-up replace guard):
  data_left_mb?: number | null;
  expires_at?: string | null;
}

// ─── Catalog / plans (GET /api/plans) ──────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  days: number | null;
  data: string | null;
  countries_included: string | null;
  countryIso2: string | null;
  image: string | null;
  plan_type: string | null;
  price_eur_cents: number;
  price_display: string;
  currency: Currency;
}

export interface PlansResponse {
  plans: Plan[];
}

// ─── Payment sheet (POST /api/me/payment-sheet, …/topup-payment-sheet) ──────

export interface PaymentSheetRequest {
  plan_id: string;
  client_request_id: string; // UUID
  promo_code?: string | null;
}

export interface TopupPaymentSheetRequest extends PaymentSheetRequest {
  accept_replace?: boolean;
}

export interface PaymentSheetResponse {
  payment_intent_client_secret: string;
  payment_intent_id: string;
  customer_id: string;
  customer_session_client_secret: string;
  publishable_key: string;
  list_price_cents: number;
  discount_cents: number;
  amount_cents: number;
  currency: Currency;
}

/** 409 body when a replacing top-up would discard remaining data. */
export interface ReplaceConfirmationRequired {
  error: 'replace_confirmation_required';
  data_left_mb: number | null;
  expires_at: string | null;
}

// ─── Promo validation (POST /api/me/promo/validate) ─────────────────────────

export type PromoValidation =
  | {
      valid: true;
      list_price_cents: number;
      discount_cents: number;
      amount_cents: number;
      currency: Currency;
    }
  | {
      valid: false;
      error: string;
      list_price_cents: number;
      currency: Currency;
    };

// ─── Account (GET /api/me) ──────────────────────────────────────────────────

export interface Me {
  id: string;
  email: string | null;
  created_at: string; // ISO 8601
}

// ─── eSIMs list (GET /api/me/esims) ─────────────────────────────────────────

export interface EsimPlanSummary {
  name: string;
  data: string | null;
  days: number | null;
  country: string | null;
  countryIso2: string | null;
  plan_type: string | null;
}

export interface EsimListItem {
  status: string;
  iccid: string | null;
  created_at: string;
  amount_paid_eur_cents: number;
  amount_paid_display: string;
  currency: Currency;
  has_qr: boolean;
  plan: EsimPlanSummary | null;
}

export interface EsimsResponse {
  esims: EsimListItem[];
}

// ─── eSIM detail (GET /api/me/esims/:iccid) ─────────────────────────────────

export type SupportState = 'refunded' | 'refund_pending' | 'under_review' | null;
export type OrderKind = 'esim' | 'topup';

export interface EsimOrder {
  plan_id: string;
  order_kind: OrderKind;
  status: string;
  created_at: string;
  amount_paid_eur_cents: number;
  amount_paid_display: string;
  currency: Currency;
}

export interface EsimDetail {
  session_id: string;
  status: string;
  plan_id: string;
  price_eur_cents: number;
  price_display: string;
  amount_paid_eur_cents: number;
  amount_paid_display: string;
  discount_eur_cents: number;
  discount_display: string;
  currency: Currency;
  iccid: string | null;
  qr_code: string | null; // base64
  ios_tap_link: string | null;
  failure_reason: string | null;
  support_state: SupportState;
  created_at: string;
  orders: EsimOrder[];
}

// ─── eSIM usage (GET /api/me/esims/:iccid/usage) ────────────────────────────

export interface EsimUsage {
  iccid: string;
  data_left_mb: number | null;
  data_used_mb: number | null;
  data_total_mb: number | null;
  activated_at: string | null;
  expires_at: string | null;
  is_expired: boolean;
  status: string | null;
  fetched_at: string;
}

// ─── Top-up options (GET /api/me/esims/:iccid/topup-options) ─────────────────

export interface TopupCurrent {
  plan_id: string;
  plan_name: string | null;
  data_left_mb: number | null;
  data_total_mb: number | null;
  activated_at: string | null;
  expires_at: string | null;
  is_expired: boolean;
}

export interface TopupOption {
  id: string;
  name: string;
  data: string | null;
  days: number | null;
  price_eur_cents: number;
  price_display: string;
  currency: Currency;
  accumulates: boolean;
  replaces_current: boolean;
}

export interface TopupOptionsResponse {
  iccid: string;
  current: TopupCurrent;
  options: TopupOption[];
}

// ─── Devices (POST/DELETE /api/me/devices) ──────────────────────────────────

export interface RegisterDeviceRequest {
  expo_push_token: string;
  platform: 'ios' | 'android';
  locale?: string;
}
