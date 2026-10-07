/**
 * Static ISO-3166 alpha-2 → continent map, used by the destination chips and the
 * Explore screen.
 *
 * "Middle East" is carved out of geographic Asia to match the reference's region
 * grouping. Any country code not in this map falls back to "Other" — the app must
 * never crash on an unmapped country.
 */

export const CONTINENTS = [
  'Europe',
  'Asia',
  'Americas',
  'Africa',
  'Middle East',
  'Oceania',
  'Other',
] as const;

export type Continent = (typeof CONTINENTS)[number];

/** Continents that are offered as filter chips / Explore cards, in display order. */
export const FILTERABLE_CONTINENTS: Continent[] = [
  'Europe',
  'Asia',
  'Americas',
  'Africa',
  'Middle East',
  'Oceania',
];

/**
 * ISO2 → continent. Not exhaustive of every territory on earth, but covers the
 * countries an eSIM catalog realistically carries; the rest resolve to "Other".
 */
const ISO2_TO_CONTINENT: Record<string, Continent> = {
  // ── Europe ──────────────────────────────────────────────────────────────
  AL: 'Europe', AD: 'Europe', AT: 'Europe', BY: 'Europe', BE: 'Europe',
  BA: 'Europe', BG: 'Europe', HR: 'Europe', CY: 'Europe', CZ: 'Europe',
  DK: 'Europe', EE: 'Europe', FO: 'Europe', FI: 'Europe', FR: 'Europe',
  DE: 'Europe', GI: 'Europe', GR: 'Europe', GG: 'Europe', HU: 'Europe',
  IS: 'Europe', IE: 'Europe', IM: 'Europe', IT: 'Europe', JE: 'Europe',
  XK: 'Europe', LV: 'Europe', LI: 'Europe', LT: 'Europe', LU: 'Europe',
  MT: 'Europe', MD: 'Europe', MC: 'Europe', ME: 'Europe', NL: 'Europe',
  MK: 'Europe', NO: 'Europe', PL: 'Europe', PT: 'Europe', RO: 'Europe',
  RU: 'Europe', SM: 'Europe', RS: 'Europe', SK: 'Europe', SI: 'Europe',
  ES: 'Europe', SE: 'Europe', CH: 'Europe', UA: 'Europe', GB: 'Europe',
  VA: 'Europe',

  // ── Middle East ─────────────────────────────────────────────────────────
  BH: 'Middle East', IR: 'Middle East', IQ: 'Middle East', IL: 'Middle East',
  JO: 'Middle East', KW: 'Middle East', LB: 'Middle East', OM: 'Middle East',
  PS: 'Middle East', QA: 'Middle East', SA: 'Middle East', SY: 'Middle East',
  TR: 'Middle East', AE: 'Middle East', YE: 'Middle East',

  // ── Asia ────────────────────────────────────────────────────────────────
  AF: 'Asia', AM: 'Asia', AZ: 'Asia', BD: 'Asia', BT: 'Asia',
  BN: 'Asia', KH: 'Asia', CN: 'Asia', GE: 'Asia', HK: 'Asia',
  IN: 'Asia', ID: 'Asia', JP: 'Asia', KZ: 'Asia', KG: 'Asia',
  LA: 'Asia', MO: 'Asia', MY: 'Asia', MV: 'Asia', MN: 'Asia',
  MM: 'Asia', NP: 'Asia', KP: 'Asia', PK: 'Asia', PH: 'Asia',
  SG: 'Asia', KR: 'Asia', LK: 'Asia', TW: 'Asia', TJ: 'Asia',
  TH: 'Asia', TM: 'Asia', UZ: 'Asia', VN: 'Asia',

  // ── Africa ──────────────────────────────────────────────────────────────
  DZ: 'Africa', AO: 'Africa', BJ: 'Africa', BW: 'Africa', BF: 'Africa',
  BI: 'Africa', CV: 'Africa', CM: 'Africa', CF: 'Africa', TD: 'Africa',
  KM: 'Africa', CG: 'Africa', CD: 'Africa', CI: 'Africa', DJ: 'Africa',
  EG: 'Africa', GQ: 'Africa', ER: 'Africa', SZ: 'Africa', ET: 'Africa',
  GA: 'Africa', GM: 'Africa', GH: 'Africa', GN: 'Africa', GW: 'Africa',
  KE: 'Africa', LS: 'Africa', LR: 'Africa', LY: 'Africa', MG: 'Africa',
  MW: 'Africa', ML: 'Africa', MR: 'Africa', MU: 'Africa', MA: 'Africa',
  MZ: 'Africa', NA: 'Africa', NE: 'Africa', NG: 'Africa', RW: 'Africa',
  ST: 'Africa', SN: 'Africa', SC: 'Africa', SL: 'Africa', SO: 'Africa',
  ZA: 'Africa', SS: 'Africa', SD: 'Africa', TZ: 'Africa', TG: 'Africa',
  TN: 'Africa', UG: 'Africa', ZM: 'Africa', ZW: 'Africa',

  // ── Americas ────────────────────────────────────────────────────────────
  AG: 'Americas', AR: 'Americas', AW: 'Americas', BS: 'Americas', BB: 'Americas',
  BZ: 'Americas', BO: 'Americas', BR: 'Americas', CA: 'Americas', KY: 'Americas',
  CL: 'Americas', CO: 'Americas', CR: 'Americas', CU: 'Americas', DM: 'Americas',
  DO: 'Americas', EC: 'Americas', SV: 'Americas', GD: 'Americas', GT: 'Americas',
  GY: 'Americas', HT: 'Americas', HN: 'Americas', JM: 'Americas', MX: 'Americas',
  NI: 'Americas', PA: 'Americas', PY: 'Americas', PE: 'Americas', PR: 'Americas',
  KN: 'Americas', LC: 'Americas', VC: 'Americas', SR: 'Americas', TT: 'Americas',
  US: 'Americas', UY: 'Americas', VE: 'Americas',

  // ── Oceania ─────────────────────────────────────────────────────────────
  AS: 'Oceania', AU: 'Oceania', CK: 'Oceania', FJ: 'Oceania', PF: 'Oceania',
  GU: 'Oceania', KI: 'Oceania', MH: 'Oceania', FM: 'Oceania', NR: 'Oceania',
  NC: 'Oceania', NZ: 'Oceania', PW: 'Oceania', PG: 'Oceania', WS: 'Oceania',
  SB: 'Oceania', TO: 'Oceania', TV: 'Oceania', VU: 'Oceania',
};

/** Returns the continent for an ISO2 code, or "Other" when unmapped/missing. */
export function getContinent(iso2: string | null | undefined): Continent {
  if (!iso2) return 'Other';
  return ISO2_TO_CONTINENT[iso2.toUpperCase()] ?? 'Other';
}
