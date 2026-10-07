/** Shared test fixtures: a small but representative plan catalog. */

import type { Plan } from '@/lib/api-types';
import type { Translate } from '../format';

/** Builds a Plan with sensible defaults; override only what a test cares about. */
export function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: Math.random().toString(36).slice(2),
    name: 'Test Plan 1GB_20250101',
    days: 7,
    data: '1 GB',
    countries_included: 'Testland',
    countryIso2: 'TL',
    image: 'https://cdn.example/flags/TL.png',
    plan_type: 'country',
    price_eur_cents: 499,
    price_display: '€4.99',
    currency: 'eur',
    ...overrides,
  };
}

/**
 * A representative catalog:
 *  - France (FR): three plans at €4.90 / €8.90 / €12.90 — cheapest is €4.90.
 *  - Spain (ES): one plan with an accented country name ("España"), unlimited data.
 *  - United States (US): one plan — exercises the alias search ("USA"/"America").
 *  - Zedland (ZZ): one plan — ISO2 not in the continent map → "Other".
 *  - Europe region (plan_type "europe"): one multi-country regional plan.
 *  - Asia region (plan_type "regional_asia"): one regional plan.
 */
export const SAMPLE_PLANS: Plan[] = [
  makePlan({
    id: 'fr-3',
    name: 'France 3GB_20250318',
    data: '3 GB',
    days: 7,
    countries_included: 'France',
    countryIso2: 'FR',
    image: 'https://cdn.example/flags/FRA.png',
    price_eur_cents: 890,
    price_display: '€8.90',
  }),
  makePlan({
    id: 'fr-1',
    name: 'France 1GB_20250318',
    data: '1 GB',
    days: 7,
    countries_included: 'France',
    countryIso2: 'FR',
    price_eur_cents: 490,
    price_display: '€4.90',
  }),
  makePlan({
    id: 'fr-10',
    name: 'France 10GB_20250318',
    data: '10 GB',
    days: 30,
    countries_included: 'France',
    countryIso2: 'FR',
    price_eur_cents: 1290,
    price_display: '€12.90',
  }),
  makePlan({
    id: 'es-unl',
    name: 'Spain Unlimited_20250318',
    data: 'Unlimited',
    days: 15,
    countries_included: 'España',
    countryIso2: 'ES',
    image: 'https://cdn.example/flags/ESP.png',
    price_eur_cents: 1999,
    price_display: '€19.99',
  }),
  makePlan({
    id: 'us-5',
    name: 'United States 5GB_20250318',
    data: '5 GB',
    days: 30,
    countries_included: 'United States',
    countryIso2: 'US',
    image: 'https://cdn.example/flags/USA.png',
    price_eur_cents: 1499,
    price_display: '€14.99',
  }),
  makePlan({
    id: 'zz-1',
    name: 'Zedland 1GB_20250318',
    data: '1 GB',
    days: 7,
    countries_included: 'Zedland',
    countryIso2: 'ZZ',
    price_eur_cents: 599,
    price_display: '€5.99',
  }),
  makePlan({
    id: 'eu-region',
    name: 'Europe 5GB_20250318',
    data: '5 GB',
    days: 15,
    countries_included: 'France, Germany, Italy, Spain',
    countryIso2: null,
    image: 'https://cdn.example/flags/EU.png',
    plan_type: 'europe',
    price_eur_cents: 2499,
    price_display: '€24.99',
  }),
  makePlan({
    id: 'asia-region',
    name: 'Asia 3GB_20250318',
    data: '3 GB',
    days: 10,
    countries_included: 'Japan; Thailand; Singapore',
    countryIso2: null,
    plan_type: 'regional_asia',
    price_eur_cents: 1899,
    price_display: '€18.99',
  }),
];

/** A fake `t` mirroring i18next's count pluralisation for the catalog keys. */
export const fakeT: Translate = (key, opts) => {
  const count = typeof opts?.count === 'number' ? opts.count : undefined;
  switch (key) {
    case 'catalog.unlimited':
      return 'Unlimited';
    case 'catalog.dataUnknown':
      return 'Data';
    case 'catalog.daysUnknown':
      return 'Flexible';
    case 'catalog.dayWithCount':
      return count === 1 ? '1 day' : `${count} days`;
    default:
      return key;
  }
};
