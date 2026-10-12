/**
 * eSIM status + Active/Past classification (pure).
 *
 * The "My eSIMs" list and the detail screen both need to turn an order's status
 * and its live usage into (a) a human badge and (b) whether the eSIM belongs in
 * the Active or Past segment. Kept pure so it can be unit-tested with no network.
 *
 * THE RULE (see the report):
 *   • an order that FAILED or was REFUNDED is Past regardless of usage;
 *   • a still-provisioning order (pending/paid/provisioning, or no ICCID yet) is
 *     "processing" and stays under Active;
 *   • a ready eSIM (provisioned/delivered) looks at live usage:
 *       - usage.is_expired  → "expired"  (Past),
 *       - activated_at null → "notActivated" (Active),
 *       - otherwise         → "active"   (Active).
 *   • until usage loads (null), a ready eSIM is optimistically "active" so it
 *     shows under Active with a date skeleton, never flickering to Past.
 */

import type { EsimUsage } from '@/lib/api-types';

export type EsimDisplayStatus =
  | 'processing'
  | 'active'
  | 'notActivated'
  | 'expired'
  | 'refunded'
  | 'failed';

export type EsimBucket = 'active' | 'past';

/** Order statuses that mean the eSIM exists and is ready to use. */
export const READY_STATUSES = ['provisioned', 'delivered'] as const;

/** Display statuses that place an eSIM in the Past segment. */
export const PAST_STATUSES: readonly EsimDisplayStatus[] = ['expired', 'refunded', 'failed'];

export interface ClassifyInput {
  /** The eSIM's current order status (the list item / detail `status`). */
  orderStatus: string | null | undefined;
  /** Live usage, or null while it is still loading / unavailable. */
  usage?: Pick<EsimUsage, 'is_expired' | 'activated_at'> | null;
}

/** Resolve the semantic display status from the order status and live usage. */
export function esimDisplayStatus({ orderStatus, usage }: ClassifyInput): EsimDisplayStatus {
  const status = orderStatus?.toLowerCase().trim() ?? null;

  if (status === 'refunded') return 'refunded';
  if (status === 'failed') return 'failed';

  const isReady = status !== null && (READY_STATUSES as readonly string[]).includes(status);
  if (!isReady) return 'processing';

  // Ready eSIM — the live usage decides. Null usage stays optimistically active.
  if (usage?.is_expired) return 'expired';
  if (usage && usage.activated_at == null) return 'notActivated';
  return 'active';
}

/** Which segment a display status belongs to. */
export function esimBucket(status: EsimDisplayStatus): EsimBucket {
  return PAST_STATUSES.includes(status) ? 'past' : 'active';
}

/** Convenience: classify straight from order status + usage to a segment. */
export function classifyEsim(input: ClassifyInput): EsimBucket {
  return esimBucket(esimDisplayStatus(input));
}

/** The Badge tone for a display status (matches the UI kit's BadgeTone). */
export function statusTone(status: EsimDisplayStatus): 'success' | 'discount' | 'neutral' {
  switch (status) {
    case 'active':
      return 'success';
    case 'refunded':
    case 'failed':
      return 'discount';
    default:
      return 'neutral';
  }
}
