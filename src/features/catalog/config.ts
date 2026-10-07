/**
 * Catalog presentation config — the one place to tweak the curated lists shown on
 * the shopping screens. These are editorial choices, not data from the backend.
 */

/**
 * ISO2 codes featured under "Popular destinations" on Home, in display order.
 * Filtered at render time to those that actually exist in the catalog, so an
 * out-of-stock country simply drops off rather than showing a dead row.
 */
export const POPULAR_DESTINATIONS: string[] = [
  'FR', // France
  'IT', // Italy
  'ES', // Spain
  'US', // United States
  'GB', // United Kingdom
  'TR', // Turkey
  'AE', // United Arab Emirates
  'JP', // Japan
  'TH', // Thailand
  'DE', // Germany
];

/** How many popular destinations to show on Home before "See all". */
export const POPULAR_DESTINATIONS_LIMIT = 4;
