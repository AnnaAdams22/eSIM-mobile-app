import { newEsimRouteForPlan } from '../newEsimRoute';

describe('newEsimRouteForPlan', () => {
  it('routes a single-country plan to its destination detail (uppercased ISO2)', () => {
    expect(newEsimRouteForPlan({ plan_type: 'country', countryIso2: 'de' })).toEqual({
      pathname: '/destinations/[id]',
      params: { id: 'DE' },
    });
  });

  it('routes a regional plan to its region detail with type=region', () => {
    expect(newEsimRouteForPlan({ plan_type: 'europe', countryIso2: null })).toEqual({
      pathname: '/destinations/[id]',
      params: { id: 'europe', type: 'region' },
    });
  });

  it('falls back to the Destinations list for a null plan (e.g. delisted)', () => {
    expect(newEsimRouteForPlan(null)).toEqual({ pathname: '/destinations' });
  });

  it('falls back to the Destinations list when a country plan has no ISO2', () => {
    expect(newEsimRouteForPlan({ plan_type: 'country', countryIso2: null })).toEqual({
      pathname: '/destinations',
    });
  });

  it('falls back to the Destinations list when the plan has no type', () => {
    expect(newEsimRouteForPlan({ plan_type: null, countryIso2: null })).toEqual({
      pathname: '/destinations',
    });
  });
});
