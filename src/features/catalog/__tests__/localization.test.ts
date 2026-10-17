import {
  allCountryNames,
  countryNameResolver,
  iso2ForEnglishName,
  localizedCountryName,
  localizeEnglishCountryName,
} from '../countryNames';
import { destinationMatches, filterDestinations, regionMatches } from '../search';

describe('localizedCountryName', () => {
  it('returns the name in the requested language', () => {
    expect(localizedCountryName('DE', 'en')).toBe('Germany');
    expect(localizedCountryName('DE', 'de')).toBe('Deutschland');
    expect(localizedCountryName('DE', 'es')).toBe('Alemania');
    expect(localizedCountryName('DE', 'ru')).toBe('Германия');
  });

  it('maps a regional variant to its base language', () => {
    expect(localizedCountryName('DE', 'es-MX')).toBe('Alemania');
  });

  it('is undefined for an unknown code, and the resolver falls back', () => {
    expect(localizedCountryName('ZZ', 'de')).toBeUndefined();
    expect(countryNameResolver('de')('ZZ', 'Backend Name')).toBe('Backend Name');
    expect(countryNameResolver('de')('DE', 'Germany')).toBe('Deutschland');
  });
});

describe('iso2ForEnglishName / localizeEnglishCountryName', () => {
  it('reverse-maps an English name to ISO2', () => {
    expect(iso2ForEnglishName('Germany')).toBe('DE');
    expect(iso2ForEnglishName('Nowhereland')).toBeUndefined();
  });

  it('localises an English member-country name, keeping unknowns as-is', () => {
    expect(localizeEnglishCountryName('Germany', 'de')).toBe('Deutschland');
    expect(localizeEnglishCountryName('Atlantis', 'de')).toBe('Atlantis');
  });
});

describe('allCountryNames', () => {
  it('collects the name across every shipped language', () => {
    const names = allCountryNames('DE');
    expect(names).toEqual(expect.arrayContaining(['Germany', 'Deutschland', 'Alemania', 'Германия']));
  });
});

describe('cross-language search', () => {
  const germany = { iso2: 'DE', name: 'Deutschland' }; // display name is German

  it('finds a country by its name in any shipped language', () => {
    for (const q of ['Germany', 'Deutschland', 'Alemania', 'Германия']) {
      expect(destinationMatches(germany, q)).toBe(true);
    }
  });

  it('stays accent- and case-insensitive', () => {
    expect(destinationMatches({ iso2: 'ES', name: 'España' }, 'espana')).toBe(true);
    expect(destinationMatches({ iso2: 'ES', name: 'España' }, 'ESPAÑA')).toBe(true);
  });

  it('filters a destination list across languages', () => {
    const list = [
      { iso2: 'DE', name: 'Deutschland' },
      { iso2: 'FR', name: 'Frankreich' },
    ];
    expect(filterDestinations(list, 'Alemania').map((d) => d.iso2)).toEqual(['DE']);
    expect(filterDestinations(list, 'France').map((d) => d.iso2)).toEqual(['FR']);
  });

  it('matches a region by a member country in any language (via codes)', () => {
    const region = { name: 'Europa', countries: ['Deutschland'], countryCodes: ['DE', 'FR'] };
    expect(regionMatches(region, 'Germany')).toBe(true);
    expect(regionMatches(region, 'Francia')).toBe(true);
    expect(regionMatches(region, 'Japan')).toBe(false);
  });
});
