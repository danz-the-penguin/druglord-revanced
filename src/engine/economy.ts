import { DRUGS, CITY_MAP, EVENTS } from './constants';
import { MarketItem } from './types';

export interface MarketGenerationResult {
  market: Record<string, MarketItem>;
  events: string[];
}

/**
 * Generates market prices and supply for a given city on a new day.
 */
export function generateCityMarket(cityId: string): MarketGenerationResult {
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

    // Roll for market shocks (~7% chance)
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
