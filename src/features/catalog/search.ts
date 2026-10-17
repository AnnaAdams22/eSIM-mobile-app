/**
 * Case- and accent-insensitive catalog search.
 *
 * Matches a destination on its country name plus a small alias list, so common
 * colloquial names ("USA", "Britain", "Emirates") find the right country. The
 * alias list is intentionally small and hand-curated — it covers the countries
 * users most often search by a name other than the official one.
 */

import type { Destination, Region } from './catalog';
import { allCountryNames } from './countryNames';

/**
 * Lower-cases and strips diacritics so "españa" matches "Espana" and "türkiye"
 * matches "Turkiye". Uses an explicit combining-marks range rather than a
 * \p{Diacritic} unicode-property escape for engine portability (Hermes).
 */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
    .toLowerCase()
    .trim();
}

/** Extra search terms (beyond the official country name) keyed by ISO2. */
export const SEARCH_ALIASES: Record<string, string[]> = {
  US: ['usa', 'united states', 'united states of america', 'america', 'states'],
  GB: ['uk', 'united kingdom', 'britain', 'great britain', 'england', 'scotland', 'wales'],
  AE: ['uae', 'emirates', 'united arab emirates', 'dubai', 'abu dhabi'],
  KR: ['south korea', 'korea', 'republic of korea'],
  KP: ['north korea'],
  CZ: ['czechia', 'czech republic'],
  NL: ['holland', 'netherlands'],
  RU: ['russian federation'],
  CH: ['switzerland', 'swiss'],
  TR: ['turkey', 'turkiye'],
  VN: ['vietnam', 'viet nam'],
  LA: ['laos'],
  SY: ['syria'],
  MM: ['myanmar', 'burma'],
  CI: ['ivory coast', "cote d'ivoire"],
  CD: ['democratic republic of the congo', 'drc', 'congo kinshasa'],
  CG: ['republic of the congo', 'congo brazzaville'],
  MK: ['north macedonia', 'macedonia'],
  SZ: ['eswatini', 'swaziland'],
  CV: ['cape verde', 'cabo verde'],
  TL: ['east timor', 'timor leste'],
};

/**
 * All normalised search terms for a destination: its (localised) display name,
 * its name in EVERY shipped language, plus the hand-curated aliases. Matching in
 * all languages means "Germany", "Deutschland", "Alemania" and "Германия" all
 * find Germany regardless of the current UI language.
 */
function destinationTerms(dest: Pick<Destination, 'iso2' | 'name'>): string[] {
  const iso2 = dest.iso2.toUpperCase();
  const aliases = SEARCH_ALIASES[iso2] ?? [];
  return [dest.name, ...allCountryNames(iso2), ...aliases].map(normalize);
}

/** True when `query` is a prefix/substring of the destination's name or an alias. */
export function destinationMatches(
  dest: Pick<Destination, 'iso2' | 'name'>,
  query: string
): boolean {
  const q = normalize(query);
  if (!q) return true;
  return destinationTerms(dest).some((term) => term.includes(q));
}

/** Filters a destination list by a free-text query (empty query returns all). */
export function filterDestinations<T extends Pick<Destination, 'iso2' | 'name'>>(
  destinations: T[],
  query: string
): T[] {
  const q = normalize(query);
  if (!q) return destinations;
  return destinations.filter((d) => destinationMatches(d, query));
}

/** True when `query` matches a region's name or any member country (in any shipped language). */
export function regionMatches(
  region: Pick<Region, 'name' | 'countries'> & Partial<Pick<Region, 'countryCodes'>>,
  query: string
): boolean {
  const q = normalize(query);
  if (!q) return true;
  if (normalize(region.name).includes(q)) return true;
  if (region.countries.some((c) => normalize(c).includes(q))) return true;
  // Also match member countries by their name in every shipped language.
  const codes = region.countryCodes ?? [];
  return codes.some((code) => allCountryNames(code).some((n) => normalize(n).includes(q)));
}

/** Filters a region list by a free-text query (empty query returns all). */
export function filterRegions<T extends Pick<Region, 'name' | 'countries'>>(
  regions: T[],
  query: string
): T[] {
  const q = normalize(query);
  if (!q) return regions;
  return regions.filter((r) => regionMatches(r, query));
}
