import { describe, it, expect } from 'vitest';
import { generateCityMarket, generateAllCitiesPrices, createInitialGlobalPriceHistory } from '../economy';
import { DRUGS, CITIES, CITY_MAP } from '../constants';
import { getDrugDetails, DRUG_DETAILS_MAP } from '../drugDetails';

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

  it('provides a worldwide network of destinations across all global regions', () => {
    expect(CITIES.length).toBeGreaterThanOrEqual(30);
    expect(CITIES.length).toBe(39);

    const regions = new Set(CITIES.map((c) => c.region));
    expect(regions.has('Americas')).toBe(true);
    expect(regions.has('Europe')).toBe(true);
    expect(regions.has('Asia-Pacific')).toBe(true);
    expect(regions.has('Middle East & Africa')).toBe(true);

    for (const city of CITIES) {
      expect(CITY_MAP.get(city.id)).toBeDefined();
      expect(city.flightCost).toBeGreaterThan(0);
      expect(city.policeRisk).toBeGreaterThanOrEqual(0);
      expect(city.dogRisk).toBeGreaterThanOrEqual(0);

      // Verify market generation succeeds for every global city
      const { market } = generateCityMarket(city.id);
      expect(Object.keys(market).length).toBe(DRUGS.length);
    }
  });

  it('generates all cities spot prices and preserves the active player city market', () => {
    const { market: currentMarket } = generateCityMarket('miami');
    const allPrices = generateAllCitiesPrices('miami', currentMarket, 1);

    // Verify all 20 drugs have entries for all 21 cities
    for (const drug of DRUGS) {
      expect(allPrices[drug.id]).toBeDefined();
      for (const city of CITIES) {
        const price = allPrices[drug.id][city.id];
        expect(price).toBeGreaterThan(0);
      }
      // For Miami, the spot price must match the active player market
      expect(allPrices[drug.id]['miami']).toBe(currentMarket[drug.id].price);
    }
  });

  it('creates initial global price history curves across all drugs and cities', () => {
    const { market: currentMarket } = generateCityMarket('bogota');
    const history = createInitialGlobalPriceHistory('bogota', currentMarket);

    for (const drug of DRUGS) {
      expect(history[drug.id]).toBeDefined();
      for (const city of CITIES) {
        const series = history[drug.id][city.id];
        expect(Array.isArray(series)).toBe(true);
        expect(series.length).toBe(5);
        for (const point of series) {
          expect(point).toBeGreaterThan(0);
        }
        if (city.id === 'bogota') {
          // The last point in history should match the current spot price
          expect(series[series.length - 1]).toBe(currentMarket[drug.id].price);
        }
      }
    }
  });

  it('provides exhaustive underworld drug dossiers for all 20 commodities', () => {
    expect(Object.keys(DRUG_DETAILS_MAP).length).toBe(DRUGS.length);
    for (const drug of DRUGS) {
      const details = getDrugDetails(drug.id);
      expect(details).toBeDefined();
      expect(details.id).toBe(drug.id);
      expect(details.schedule).toBeDefined();
      expect(details.drugClass).toBeDefined();
      expect(Array.isArray(details.streetSlang)).toBe(true);
      expect(details.streetSlang.length).toBeGreaterThan(0);
      expect(['Extreme', 'High', 'Moderate', 'Low']).toContain(details.heatImpact);
      expect(['Severe', 'High', 'Moderate', 'Low']).toContain(details.customsRisk);
      expect(details.administration.length).toBeGreaterThan(0);
      expect(details.topProducerCities.length).toBeGreaterThan(0);
      expect(details.topConsumerCities.length).toBeGreaterThan(0);
      expect(details.clinicalEffects.length).toBeGreaterThan(0);
    }

    // Fallback behavior for unknown drug
    const fallback = getDrugDetails('unknown_synthetic_drug');
    expect(fallback.id).toBe('unknown_synthetic_drug');
    expect(fallback.schedule).toContain('Schedule I');
    expect(fallback.streetSlang).toContain('Contraband');
  });
});

