import {
  normalize,
  destinationMatches,
  filterDestinations,
  filterRegions,
} from '../search';
import { buildDestinations, buildRegions } from '../catalog';
import { SAMPLE_PLANS } from './fixtures';

const destinations = buildDestinations(SAMPLE_PLANS);
const regions = buildRegions(SAMPLE_PLANS);

describe('normalize', () => {
  it('lower-cases and strips diacritics', () => {
    expect(normalize('España')).toBe('espana');
    expect(normalize('Türkiye')).toBe('turkiye');
    expect(normalize('  FRANCE ')).toBe('france');
  });
});

describe('destinationMatches', () => {
  it('matches by name, case- and accent-insensitively', () => {
    expect(destinationMatches({ iso2: 'ES', name: 'España' }, 'espana')).toBe(true);
    expect(destinationMatches({ iso2: 'ES', name: 'España' }, 'ESPAÑA')).toBe(true);
    expect(destinationMatches({ iso2: 'FR', name: 'France' }, 'fra')).toBe(true);
  });

  it('matches by alias', () => {
    expect(destinationMatches({ iso2: 'US', name: 'United States' }, 'USA')).toBe(true);
    expect(destinationMatches({ iso2: 'US', name: 'United States' }, 'america')).toBe(true);
    expect(destinationMatches({ iso2: 'GB', name: 'United Kingdom' }, 'britain')).toBe(true);
    expect(destinationMatches({ iso2: 'AE', name: 'United Arab Emirates' }, 'emirates')).toBe(true);
  });

  it('does not match unrelated queries', () => {
    expect(destinationMatches({ iso2: 'FR', name: 'France' }, 'japan')).toBe(false);
  });

  it('matches everything on an empty query', () => {
    expect(destinationMatches({ iso2: 'FR', name: 'France' }, '')).toBe(true);
  });
});

describe('filterDestinations', () => {
  it('finds the United States by the "USA" alias', () => {
    const results = filterDestinations(destinations, 'usa');
    expect(results.map((d) => d.iso2)).toEqual(['US']);
  });

  it('returns all destinations for an empty query', () => {
    expect(filterDestinations(destinations, '')).toHaveLength(destinations.length);
  });

  it('returns nothing for a no-match query', () => {
    expect(filterDestinations(destinations, 'zzzxyz')).toEqual([]);
  });
});

describe('filterRegions', () => {
  it('matches a region by a member country name', () => {
    const results = filterRegions(regions, 'japan');
    expect(results.map((r) => r.key)).toEqual(['regional_asia']);
  });

  it('matches a region by its own name', () => {
    expect(filterRegions(regions, 'europe').map((r) => r.key)).toEqual(['europe']);
  });
});
