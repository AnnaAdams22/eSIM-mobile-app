/**
 * Resolve the flag + human title for a geography from the live catalog.
 *
 * Both checkout and the "My eSIMs" screens need "a flag and a country/region
 * name" for a plan, but neither the eSIM list item nor the order DTO carries a
 * flag image. The catalog groupings (buildDestinations / buildRegions) already
 * compute the flag and display name per country/region, so we resolve against
 * them by ISO2 (country plans) or plan_type (region plans), with a caller-
 * supplied fallback for plans that have since been delisted.
 */

import type { Plan } from '@/lib/api-types';
import {
  buildDestinations,
  buildRegions,
  type CountryNameResolver,
  type RegionNameResolvers,
} from './catalog';

export interface GeoDisplay {
  flag: string | null;
  title: string;
}

export interface GeoInput {
  /** ISO2 country code for a country plan. */
  countryIso2?: string | null;
  /** plan_type for a region plan. */
  planType?: string | null;
  /** Flag to use when the plan isn't in the live catalog. */
  fallbackFlag?: string | null;
  /** Title to use when the plan isn't in the live catalog. */
  fallbackTitle?: string | null;
}

export interface GeoResolvers {
  /** Localises a country name by ISO2 (see `countryNameResolver`). */
  nameResolver?: CountryNameResolver;
  /** Localises a region's display name / members (see `useCatalogL10n`). */
  regionResolvers?: RegionNameResolvers;
}

export function resolveGeoDisplay(
  plans: Plan[],
  input: GeoInput,
  resolvers: GeoResolvers = {}
): GeoDisplay {
  if (input.countryIso2) {
    const iso2 = input.countryIso2.toUpperCase();
    const dest = buildDestinations(plans, resolvers.nameResolver).find((d) => d.iso2 === iso2);
    if (dest) return { flag: dest.flag, title: dest.name };
  }
  if (input.planType) {
    const region = buildRegions(plans, resolvers.regionResolvers).find(
      (r) => r.key === input.planType
    );
    if (region) return { flag: region.flag, title: region.name };
  }
  return {
    flag: input.fallbackFlag ?? null,
    title: input.fallbackTitle?.trim() || '',
  };
}
