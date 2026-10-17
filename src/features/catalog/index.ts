/** Barrel export for the catalog feature (pure data layer + presentation config). */

export {
  COUNTRY_PLAN_TYPE,
  buildDestinations,
  buildRegions,
  sortPlansForDisplay,
  plansForDestination,
  plansForRegion,
  destinationsByContinent,
  continentCounts,
  roundedDestinationCount,
} from './catalog';
export type {
  Destination,
  Region,
  CountryNameResolver,
  RegionNameResolvers,
} from './catalog';

export {
  COUNTRY_NAME_LOCALES,
  localizedCountryName,
  countryNameResolver,
  iso2ForEnglishName,
  localizeEnglishCountryName,
  allCountryNames,
} from './countryNames';

export { useCatalogL10n } from './useCatalogL10n';

export {
  CONTINENTS,
  FILTERABLE_CONTINENTS,
  getContinent,
} from './continents';
export type { Continent } from './continents';

export {
  formatData,
  formatDays,
  formatPlanLabel,
  dataAmountGb,
} from './format';
export type { Translate } from './format';

export {
  normalize,
  SEARCH_ALIASES,
  destinationMatches,
  filterDestinations,
  regionMatches,
  filterRegions,
} from './search';

export { POPULAR_DESTINATIONS, POPULAR_DESTINATIONS_LIMIT } from './config';

export { heroImage, destinationImage, countryPhoto } from './images';
export type { HeroSlot } from './images';

export { resolveGeoDisplay } from './geo';
export type { GeoDisplay, GeoInput, GeoResolvers } from './geo';

export { newEsimRouteForPlan } from './newEsimRoute';
export type { NewEsimPlan, NewEsimRoute } from './newEsimRoute';
