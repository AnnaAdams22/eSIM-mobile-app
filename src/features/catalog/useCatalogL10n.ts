/**
 * Binds the catalog's (pure, injected) name resolvers to the CURRENT app
 * language, so screens can localise destination and region names without
 * threading i18n through the pure transforms.
 *
 * - `lang`            — the active i18n language (also used for price/date/data formatting).
 * - `nameResolver`    — for `buildDestinations`: ISO2 → localised country name.
 * - `regionResolvers` — for `buildRegions`: localise the group name (continent-named
 *   regions via the shared `continents.*` keys) and each member country, and map
 *   member names back to ISO2 for cross-language search.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { CountryNameResolver, RegionNameResolvers } from './catalog';
import { CONTINENTS } from './continents';
import {
  countryNameResolver,
  iso2ForEnglishName,
  localizeEnglishCountryName,
} from './countryNames';

export function useCatalogL10n(): {
  lang: string;
  nameResolver: CountryNameResolver;
  regionResolvers: RegionNameResolvers;
} {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  return useMemo(() => {
    const continentNames = new Set<string>(CONTINENTS);
    return {
      lang,
      nameResolver: countryNameResolver(lang),
      regionResolvers: {
        // A region whose humanised name is a continent ("Europe") is translated
        // via the shared continents keys; other region names (e.g. "Regional
        // Asia") fall back to the humanised English until a region taxonomy exists.
        regionName: (_key, humanized) =>
          continentNames.has(humanized) ? t(`continents.${humanized}`) : humanized,
        countryName: (englishName) => localizeEnglishCountryName(englishName, lang),
        toIso2: (englishName) => iso2ForEnglishName(englishName),
      },
    };
  }, [lang, t]);
}
