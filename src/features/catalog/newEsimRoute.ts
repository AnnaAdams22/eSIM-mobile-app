/**
 * Where to send a traveller who wants a DIFFERENT plan for an existing eSIM.
 *
 * The client's rule (18 Oct 2026): a top-up may only add data to the same plan.
 * To get a different plan the customer buys a NEW eSIM through the normal
 * purchase flow — their current eSIM stays untouched. This pure helper maps the
 * current eSIM's plan to the destination/region detail screen for the same
 * country or region, so the new purchase lands on the right place. If the plan
 * can't be resolved (e.g. it was delisted) it falls back to the Destinations list.
 */

import { COUNTRY_PLAN_TYPE } from './catalog';

/** The minimal plan shape needed to resolve a destination route. */
export interface NewEsimPlan {
  plan_type: string | null;
  countryIso2: string | null;
}

export type NewEsimRoute =
  | { pathname: '/destinations/[id]'; params: { id: string; type?: 'region' } }
  | { pathname: '/destinations' };

export function newEsimRouteForPlan(plan: NewEsimPlan | null | undefined): NewEsimRoute {
  if (plan?.plan_type === COUNTRY_PLAN_TYPE && plan.countryIso2) {
    return { pathname: '/destinations/[id]', params: { id: plan.countryIso2.toUpperCase() } };
  }
  if (plan?.plan_type && plan.plan_type !== COUNTRY_PLAN_TYPE) {
    return { pathname: '/destinations/[id]', params: { id: plan.plan_type, type: 'region' } };
  }
  return { pathname: '/destinations' };
}
