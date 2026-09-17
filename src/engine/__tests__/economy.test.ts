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

  it('includes modern commodities (fentanyl, krokodil, tranq) with complete chemical dossiers', () => {
    const targetIds = ['fentanyl', 'krokodil', 'tranq'];
    const { market } = generateCityMarket('new_york');

    for (const id of targetIds) {
      const drug = DRUGS.find((d) => d.id === id);
      expect(drug).toBeDefined();
      expect(drug?.image).toBe(`/assets/drugs/${id}.png`);
      expect(drug?.chemicalFormula).toBeDefined();
      expect(drug?.molecularWeight).toContain('g/mol');
      expect(drug?.scientificName).toBeDefined();

      const marketItem = market[id];
      expect(marketItem).toBeDefined();
      expect(marketItem.price).toBeGreaterThan(0);
    }
  });
});
