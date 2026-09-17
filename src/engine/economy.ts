import { DRUGS, CITIES, CITY_MAP, EVENTS } from './constants';
import { MarketItem, MarketIntelTip } from './types';

export interface MarketGenerationResult {
  market: Record<string, MarketItem>;
  events: string[];
}

/**
 * Generates market prices and supply for a given city on a new day,
 * applying any scheduled inside informant tips and market shocks.
 */
export function generateCityMarket(
  cityId: string,
  currentDay?: number,
  activeIntel?: MarketIntelTip[]
): MarketGenerationResult {
  const city = CITY_MAP.get(cityId);
  const cityModifierDefault = 1.0;
  const market: Record<string, MarketItem> = {};
  const events: string[] = [];

  for (const drug of DRUGS) {
    const regionalMod = city?.drugModifiers[drug.id] ?? cityModifierDefault;
    const baseTarget = drug.basePrice * regionalMod;

    // Volatility variation: [-volatility, +volatility]
    const randomVariation = (Math.random() * 2 - 1) * drug.volatility;
    let price = Math.round(baseTarget * (1 + randomVariation));

    // Clamp within drug's min and max bounds scaled by regional modifier
    const minP = Math.round(drug.minPrice * regionalMod * 0.7);
    const maxP = Math.round(drug.maxPrice * regionalMod * 1.3);
    price = Math.max(minP, Math.min(maxP, price));

    let surge: 'high' | 'crash' | null = null;
    let surgeReason: string | undefined = undefined;

    // Check if inside wire intel forecast targets this city and drug today
    const matchingIntel = currentDay && activeIntel
      ? activeIntel.find((tip) => tip.cityId === cityId && tip.drugId === drug.id && tip.targetDay === currentDay)
      : undefined;

    if (matchingIntel) {
      if (matchingIntel.eventType === 'surge_spike' || matchingIntel.eventType === 'police_crackdown') {
        price = Math.round(price * matchingIntel.multiplier);
        surge = 'high';
        surgeReason = `[WIRE INTEL CONFIRMED] ${matchingIntel.headline}`;
        events.push(`${surgeReason} ${drug.name} prices skyrocketed!`);
      } else if (matchingIntel.eventType === 'market_glut') {
        price = Math.max(1, Math.round(price * matchingIntel.multiplier));
        surge = 'crash';
        surgeReason = `[WIRE INTEL CONFIRMED] ${matchingIntel.headline}`;
        events.push(`${surgeReason} Street flooded with ${drug.name}!`);
      }
    } else {
      // Roll for random market shocks (~8% chance)
      const shockRoll = Math.random();
      if (shockRoll < 0.04) {
        // Price Surge / Shortage
        const multiplier = 2.0 + Math.random() * 2.0; // 2.0x - 4.0x
        price = Math.round(price * multiplier);
        surge = 'high';

        const reasonTemplate =
          EVENTS.shortageReasons[Math.floor(Math.random() * EVENTS.shortageReasons.length)];
        const surgePhrase =
          EVENTS.priceSurges[Math.floor(Math.random() * EVENTS.priceSurges.length)];
        surgeReason = reasonTemplate.replace('{drug}', drug.name).replace('{city}', city?.name ?? 'the city');
        events.push(`${surgeReason} ${surgePhrase}`);
      } else if (shockRoll < 0.08) {
        // Price Crash / Supply Flood
        const divisor = 0.25 + Math.random() * 0.25; // 25% - 50% of price
        price = Math.max(1, Math.round(price * divisor));
        surge = 'crash';

        const reasonTemplate =
          EVENTS.floodReasons[Math.floor(Math.random() * EVENTS.floodReasons.length)];
        const crashPhrase =
          EVENTS.priceCrashes[Math.floor(Math.random() * EVENTS.priceCrashes.length)];
        surgeReason = reasonTemplate.replace('{drug}', drug.name).replace('{city}', city?.name ?? 'the city');
        events.push(`${surgeReason} ${crashPhrase}`);
      }
    }

    // Determine units available in the market
    // Cheaper drugs have higher supply; high-value drugs have smaller supply
    let availableUnits = 0;
    const availabilityRoll = Math.random();

    // 12% chance drug is completely out of stock today
    if (availabilityRoll > 0.12) {
      if (price > 10000) {
        availableUnits = Math.floor(5 + Math.random() * 25);
      } else if (price > 2000) {
        availableUnits = Math.floor(15 + Math.random() * 60);
      } else if (price > 500) {
        availableUnits = Math.floor(30 + Math.random() * 120);
      } else {
        availableUnits = Math.floor(60 + Math.random() * 250);
      }
    }

    market[drug.id] = {
      drugId: drug.id,
      price,
      availableUnits,
      surge,
      surgeReason,
    };
  }

  return { market, events };
}

/**
 * Generates current spot prices for all drugs across all 21 cities.
 * For the city where the player currently resides, preserves the active market prices.
 */
export function generateAllCitiesPrices(
  currentCityId: string,
  currentMarket: Record<string, MarketItem>,
  currentDay?: number,
  activeIntel?: MarketIntelTip[]
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const drug of DRUGS) {
    result[drug.id] = {};
  }

  for (const city of CITIES) {
    if (city.id === currentCityId && currentMarket && Object.keys(currentMarket).length > 0) {
      for (const drug of DRUGS) {
        result[drug.id][city.id] = currentMarket[drug.id]?.price ?? drug.basePrice;
      }
    } else {
      const cityMarket = generateCityMarket(city.id, currentDay, activeIntel).market;
      for (const drug of DRUGS) {
        result[drug.id][city.id] = cityMarket[drug.id]?.price ?? drug.basePrice;
      }
    }
  }

  return result;
}

/**
 * Pre-seeds initial historical price curves across all cities and drugs.
 */
export function createInitialGlobalPriceHistory(
  currentCityId: string,
  currentMarket: Record<string, MarketItem>
): Record<string, Record<string, number[]>> {
  const history: Record<string, Record<string, number[]>> = {};
  for (const drug of DRUGS) {
    history[drug.id] = {};
    for (const city of CITIES) {
      const regionalMod = city.drugModifiers[drug.id] ?? 1.0;
      const base = Math.round(drug.basePrice * regionalMod);
      const cur = city.id === currentCityId ? (currentMarket[drug.id]?.price ?? base) : base;
      const d1 = Math.max(1, Math.round(cur * 0.94));
      const d2 = Math.max(1, Math.round(cur * 1.04));
      const d3 = Math.max(1, Math.round(cur * 0.97));
      const d4 = Math.max(1, Math.round(cur * 1.02));
      history[drug.id][city.id] = [d1, d2, d3, d4, cur];
    }
  }
  return history;
}
