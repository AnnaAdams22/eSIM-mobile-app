/**
 * Pure transforms from the backend plan list into the shapes the shopping screens
 * render: per-country destinations, regional plan groups, and the sorted plan list
 * for a single destination/region.
 *
 * RULES (see CLAUDE.md):
 *  - The app NEVER calculates prices. The "lowest price" is the backend's
 *    `price_display` string of the cheapest plan (cheapest decided by the integer
 *    `price_eur_cents`, which is used for comparison/sorting only).
 *  - The raw vendor `name` is never surfaced (see format.ts).
 *
 * Everything here is a pure function of its inputs, so it is unit-tested directly.
 */

import type { Plan } from '@/lib/api-types';
import { getContinent, type Continent } from './continents';
import { dataAmountGb } from './format';

/** Plans whose `plan_type` is exactly this are single-country plans. */
export const COUNTRY_PLAN_TYPE = 'country';

export interface Destination {
  /** Uppercased ISO2 country code — the grouping key. */
  iso2: string;
  /** Display name (country name from `countries_included`, else the ISO2 code). */
  name: string;
  /** Flag image URL, or null. */
  flag: string | null;
  continent: Continent;
  planCount: number;
  /** Backend `price_display` of the cheapest plan (verbatim). */
  lowestPriceDisplay: string;
  /** Cheapest plan's `price_eur_cents` — for sorting only, never displayed. */
  lowestPriceCents: number;
}

export interface Region {
  /** Grouping key (the `plan_type`). */
  key: string;
  /** Display name derived from the key. */
  name: string;
  /** Distinct country names covered by the group. */
  countries: string[];
  countryCount: number;
  flag: string | null;
  planCount: number;
  lowestPriceDisplay: string;
  lowestPriceCents: number;
}

/** Splits the vendor's `countries_included` string into distinct country names. */
function splitCountries(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,;/]/)
    .map((c) => c.trim())
    .filter(Boolean);
}

/** "country" plans with a usable ISO2 code. */
function countryPlans(plans: Plan[]): Plan[] {
  return plans.filter((p) => p.plan_type === COUNTRY_PLAN_TYPE && !!p.countryIso2);
}

/** Non-"country" plans with a usable plan_type — the regional groups. */
function regionPlans(plans: Plan[]): Plan[] {
  return plans.filter((p) => !!p.plan_type && p.plan_type !== COUNTRY_PLAN_TYPE);
}

/** The plan with the lowest `price_eur_cents` in a non-empty list. */
function cheapest(plans: Plan[]): Plan {
  return plans.reduce((min, p) => (p.price_eur_cents < min.price_eur_cents ? p : min));
}

/** Title-cases a snake/kebab/space plan_type into a display name ("europe" → "Europe"). */
function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * One Destination per country (keyed by ISO2), carrying the plan count and the
 * cheapest plan's display price. Sorted alphabetically by name.
 */
export function buildDestinations(plans: Plan[]): Destination[] {
  const groups = new Map<string, Plan[]>();

  for (const plan of countryPlans(plans)) {
    const iso2 = plan.countryIso2!.toUpperCase();
    const list = groups.get(iso2);
    if (list) list.push(plan);
    else groups.set(iso2, [plan]);
  }

  const destinations: Destination[] = [];
  for (const [iso2, group] of groups) {
    const low = cheapest(group);
    // Prefer the vendor's country name; fall back to the ISO2 code.
    const name = group.find((p) => p.countries_included)?.countries_included?.trim() || iso2;
    const flag = group.find((p) => p.image)?.image ?? null;

    destinations.push({
      iso2,
      name,
      flag,
      continent: getContinent(iso2),
      planCount: group.length,
      lowestPriceDisplay: low.price_display,
      lowestPriceCents: low.price_eur_cents,
    });
  }

  return destinations.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * One Region per non-country `plan_type`, with the number of distinct countries
 * covered and the cheapest plan's display price. Sorted alphabetically by name.
 */
export function buildRegions(plans: Plan[]): Region[] {
  const groups = new Map<string, Plan[]>();

  for (const plan of regionPlans(plans)) {
    const key = plan.plan_type!;
    const list = groups.get(key);
    if (list) list.push(plan);
    else groups.set(key, [plan]);
  }

  const regions: Region[] = [];
  for (const [key, group] of groups) {
    const low = cheapest(group);
    const countrySet = new Set<string>();
    for (const plan of group) {
      for (const country of splitCountries(plan.countries_included)) countrySet.add(country);
    }
    const countries = [...countrySet].sort((a, b) => a.localeCompare(b));
    const flag = group.find((p) => p.image)?.image ?? null;

    regions.push({
      key,
      name: humanizeKey(key),
      countries,
      countryCount: countries.length,
      flag,
      planCount: group.length,
      lowestPriceDisplay: low.price_display,
      lowestPriceCents: low.price_eur_cents,
    });
  }

  return regions.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Sorts plans for display on a detail screen: smallest data first, then shortest
 * duration, then cheapest. Returns a new array (does not mutate the input).
 */
export function sortPlansForDisplay(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => {
    const dataDiff = dataAmountGb(a.data) - dataAmountGb(b.data);
    if (dataDiff !== 0) return dataDiff;

    const daysDiff = (a.days ?? 0) - (b.days ?? 0);
    if (daysDiff !== 0) return daysDiff;

    return a.price_eur_cents - b.price_eur_cents;
  });
}

/** All country plans for an ISO2 code, sorted for display. */
export function plansForDestination(plans: Plan[], iso2: string): Plan[] {
  const target = iso2.toUpperCase();
  const matching = countryPlans(plans).filter((p) => p.countryIso2!.toUpperCase() === target);
  return sortPlansForDisplay(matching);
}

/** All plans for a region plan_type key, sorted for display. */
export function plansForRegion(plans: Plan[], key: string): Plan[] {
  const matching = regionPlans(plans).filter((p) => p.plan_type === key);
  return sortPlansForDisplay(matching);
}

/** Groups destinations by continent, preserving the per-group alphabetical order. */
export function destinationsByContinent(
  destinations: Destination[]
): Record<Continent, Destination[]> {
  const result = {} as Record<Continent, Destination[]>;
  for (const dest of destinations) {
    (result[dest.continent] ??= []).push(dest);
  }
  return result;
}

/** Count of distinct destinations per continent. */
export function continentCounts(destinations: Destination[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const dest of destinations) {
    counts[dest.continent] = (counts[dest.continent] ?? 0) + 1;
  }
  return counts;
}

/**
 * The total number of countries the catalog reaches, rounded DOWN to a "nice"
 * marketing number (e.g. 193 → 190) for the home hero ("Stay connected in {N}+").
 */
export function roundedDestinationCount(destinations: Destination[]): number {
  const n = destinations.length;
  if (n < 10) return n;
  if (n < 100) return Math.floor(n / 10) * 10;
  return Math.floor(n / 10) * 10;
}
