import { describe, it, expect } from 'vitest';
import { generateCityMarket } from '../economy';
import { DRUGS } from '../constants';

describe('Economy Simulation', () => {
  it('generates a full market order book for a city', () => {
    const { market } = generateCityMarket('new_york');
    expect(Object.keys(market).length).toBe(DRUGS.length);

    // Verify all canonical drugs exist in the generated market
    for (const drug of DRUGS) {
      const item = market[drug.id];
      expect(item).toBeDefined();
      expect(item.price).toBeGreaterThan(0);
      expect(item.availableUnits).toBeGreaterThanOrEqual(0);
    }
  });

  it('reflects regional modifiers (e.g. Cocaine is cheaper in Bogota than Sydney)', () => {
    let bogotaTotal = 0;
    let sydneyTotal = 0;
    const runs = 20;

    for (let i = 0; i < runs; i++) {
      const bogota = generateCityMarket('bogota').market['cocaine'];
      const sydney = generateCityMarket('sydney').market['cocaine'];
      bogotaTotal += bogota.price;
      sydneyTotal += sydney.price;
    }

    const bogotaAvg = bogotaTotal / runs;
    const sydneyAvg = sydneyTotal / runs;

    expect(sydneyAvg).toBeGreaterThan(bogotaAvg * 2.5);
  });
});
