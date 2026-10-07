import {
  buildDestinations,
  buildRegions,
  sortPlansForDisplay,
  plansForDestination,
  plansForRegion,
  continentCounts,
  roundedDestinationCount,
} from '../catalog';
import { makePlan, SAMPLE_PLANS } from './fixtures';

describe('buildDestinations', () => {
  const destinations = buildDestinations(SAMPLE_PLANS);

  it('creates one destination per country (country plans only)', () => {
    expect(destinations.map((d) => d.iso2).sort()).toEqual(['ES', 'FR', 'US', 'ZZ']);
  });

  it('counts the plans per country', () => {
    expect(destinations.find((d) => d.iso2 === 'FR')?.planCount).toBe(3);
    expect(destinations.find((d) => d.iso2 === 'ES')?.planCount).toBe(1);
  });

  it('uses the cheapest plan\'s backend price_display verbatim (never computed)', () => {
    const fr = destinations.find((d) => d.iso2 === 'FR');
    expect(fr?.lowestPriceDisplay).toBe('€4.90');
    expect(fr?.lowestPriceCents).toBe(490);
  });

  it('takes the country name from countries_included and the flag from image', () => {
    const fr = destinations.find((d) => d.iso2 === 'FR');
    expect(fr?.name).toBe('France');
    expect(fr?.flag).toBe('https://cdn.example/flags/FRA.png');
  });

  it('assigns continents, falling back to "Other" for unmapped ISO2', () => {
    expect(destinations.find((d) => d.iso2 === 'FR')?.continent).toBe('Europe');
    expect(destinations.find((d) => d.iso2 === 'US')?.continent).toBe('Americas');
    expect(destinations.find((d) => d.iso2 === 'ZZ')?.continent).toBe('Other');
  });

  it('is sorted alphabetically by name', () => {
    const names = destinations.map((d) => d.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('falls back to the ISO2 code when no country name is present', () => {
    const [dest] = buildDestinations([
      makePlan({ countryIso2: 'pt', countries_included: null }),
    ]);
    expect(dest.name).toBe('PT');
    expect(dest.iso2).toBe('PT');
  });

  it('returns an empty array for an empty catalog', () => {
    expect(buildDestinations([])).toEqual([]);
  });
});

describe('buildRegions', () => {
  const regions = buildRegions(SAMPLE_PLANS);

  it('creates one region per non-country plan_type', () => {
    expect(regions.map((r) => r.key).sort()).toEqual(['europe', 'regional_asia']);
  });

  it('humanises the key into a display name', () => {
    expect(regions.find((r) => r.key === 'europe')?.name).toBe('Europe');
    expect(regions.find((r) => r.key === 'regional_asia')?.name).toBe('Regional Asia');
  });

  it('counts distinct countries from countries_included (comma or semicolon)', () => {
    expect(regions.find((r) => r.key === 'europe')?.countryCount).toBe(4);
    expect(regions.find((r) => r.key === 'regional_asia')?.countries).toEqual([
      'Japan',
      'Singapore',
      'Thailand',
    ]);
  });

  it('uses the cheapest plan display price', () => {
    expect(regions.find((r) => r.key === 'europe')?.lowestPriceDisplay).toBe('€24.99');
  });
});

describe('sortPlansForDisplay', () => {
  it('sorts by data amount, then days, then price', () => {
    const fr = plansForDestination(SAMPLE_PLANS, 'FR');
    expect(fr.map((p) => p.id)).toEqual(['fr-1', 'fr-3', 'fr-10']);
  });

  it('places Unlimited last (highest data amount)', () => {
    const plans = sortPlansForDisplay([
      makePlan({ id: 'unl', data: 'Unlimited', days: 30, price_eur_cents: 2000 }),
      makePlan({ id: 'small', data: '1 GB', days: 7, price_eur_cents: 500 }),
    ]);
    expect(plans.map((p) => p.id)).toEqual(['small', 'unl']);
  });

  it('breaks data ties by days, then price', () => {
    const plans = sortPlansForDisplay([
      makePlan({ id: 'b', data: '5 GB', days: 30, price_eur_cents: 1500 }),
      makePlan({ id: 'a', data: '5 GB', days: 15, price_eur_cents: 1200 }),
      makePlan({ id: 'c', data: '5 GB', days: 30, price_eur_cents: 1000 }),
    ]);
    expect(plans.map((p) => p.id)).toEqual(['a', 'c', 'b']);
  });

  it('does not mutate the input array', () => {
    const input = [makePlan({ id: 'x', data: '10 GB' }), makePlan({ id: 'y', data: '1 GB' })];
    const snapshot = input.map((p) => p.id);
    sortPlansForDisplay(input);
    expect(input.map((p) => p.id)).toEqual(snapshot);
  });
});

describe('plansForDestination / plansForRegion', () => {
  it('matches ISO2 case-insensitively and only country plans', () => {
    expect(plansForDestination(SAMPLE_PLANS, 'fr')).toHaveLength(3);
    expect(plansForDestination(SAMPLE_PLANS, 'FR')).toHaveLength(3);
  });

  it('returns region plans by plan_type key', () => {
    expect(plansForRegion(SAMPLE_PLANS, 'europe')).toHaveLength(1);
    expect(plansForRegion(SAMPLE_PLANS, 'nope')).toHaveLength(0);
  });
});

describe('continentCounts & roundedDestinationCount', () => {
  it('counts destinations per continent', () => {
    const counts = continentCounts(buildDestinations(SAMPLE_PLANS));
    expect(counts.Europe).toBe(2); // FR + ES
    expect(counts.Americas).toBe(1); // US
    expect(counts.Other).toBe(1); // ZZ
  });

  it('rounds the destination total down to a nice number', () => {
    expect(roundedDestinationCount(new Array(193).fill(null).map(() => ({} as never)))).toBe(190);
    expect(roundedDestinationCount(new Array(45).fill(null).map(() => ({} as never)))).toBe(40);
    expect(roundedDestinationCount(new Array(7).fill(null).map(() => ({} as never)))).toBe(7);
  });
});
