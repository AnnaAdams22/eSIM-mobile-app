import type { EsimUsage } from '@/lib/api-types';
import {
  esimDisplayStatus,
  esimBucket,
  classifyEsim,
  statusTone,
} from '../classify';

/** A minimal usage stub; only the fields classify() reads matter. */
function usage(over: Partial<EsimUsage> = {}): Pick<EsimUsage, 'is_expired' | 'activated_at'> {
  return { is_expired: false, activated_at: '2026-01-01T00:00:00Z', ...over };
}

describe('esimDisplayStatus', () => {
  it('is processing while the order has no eSIM yet', () => {
    expect(esimDisplayStatus({ orderStatus: 'pending' })).toBe('processing');
    expect(esimDisplayStatus({ orderStatus: 'paid' })).toBe('processing');
    expect(esimDisplayStatus({ orderStatus: 'provisioning' })).toBe('processing');
  });

  it('reports refunded and failed straight from the order status', () => {
    expect(esimDisplayStatus({ orderStatus: 'refunded', usage: usage() })).toBe('refunded');
    expect(esimDisplayStatus({ orderStatus: 'failed', usage: usage() })).toBe('failed');
  });

  it('is active for a ready eSIM that is activated and not expired', () => {
    expect(esimDisplayStatus({ orderStatus: 'provisioned', usage: usage() })).toBe('active');
    expect(esimDisplayStatus({ orderStatus: 'DELIVERED', usage: usage() })).toBe('active');
  });

  it('is notActivated for a ready eSIM with a null activation date', () => {
    expect(
      esimDisplayStatus({ orderStatus: 'provisioned', usage: usage({ activated_at: null }) })
    ).toBe('notActivated');
  });

  it('is expired when live usage says so, regardless of activation', () => {
    expect(
      esimDisplayStatus({ orderStatus: 'delivered', usage: usage({ is_expired: true }) })
    ).toBe('expired');
  });

  it('stays optimistically active while usage is still loading (null)', () => {
    expect(esimDisplayStatus({ orderStatus: 'provisioned', usage: null })).toBe('active');
    expect(esimDisplayStatus({ orderStatus: 'provisioned' })).toBe('active');
  });
});

describe('esimBucket / classifyEsim', () => {
  it('buckets expired, refunded and failed as Past', () => {
    expect(esimBucket('expired')).toBe('past');
    expect(esimBucket('refunded')).toBe('past');
    expect(esimBucket('failed')).toBe('past');
  });

  it('buckets active, notActivated and processing as Active', () => {
    expect(esimBucket('active')).toBe('active');
    expect(esimBucket('notActivated')).toBe('active');
    expect(esimBucket('processing')).toBe('active');
  });

  it('classifies end-to-end: a refunded order is Past even with live data', () => {
    expect(classifyEsim({ orderStatus: 'refunded', usage: usage() })).toBe('past');
  });

  it('classifies a loading ready eSIM as Active', () => {
    expect(classifyEsim({ orderStatus: 'provisioned', usage: null })).toBe('active');
  });
});

describe('statusTone', () => {
  it('maps active to success, refunded/failed to discount, else neutral', () => {
    expect(statusTone('active')).toBe('success');
    expect(statusTone('refunded')).toBe('discount');
    expect(statusTone('failed')).toBe('discount');
    expect(statusTone('expired')).toBe('neutral');
    expect(statusTone('notActivated')).toBe('neutral');
    expect(statusTone('processing')).toBe('neutral');
  });
});
