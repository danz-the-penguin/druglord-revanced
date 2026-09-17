import { describe, it, expect } from 'vitest';
import {
  AIRCRAFT_FLEET,
  AIRCRAFT_MAP,
  calculateAircraftFlightCost,
  getAircraftCustomsReduction,
} from '../aviation';
import {
  createInitialState,
  buyAircraft,
  selectActiveAircraft,
  getCarryingCapacity,
  travelToCity,
} from '../game';

describe('Private Aviation Fleet & Airport Compatibility', () => {
  it('defines 4 distinct tier aircraft with valid parameters', () => {
    expect(AIRCRAFT_FLEET.length).toBe(4);
    for (const craft of AIRCRAFT_FLEET) {
      expect(craft.price).toBeGreaterThan(0);
      expect(craft.cargoBonus).toBeGreaterThan(0);
      expect(craft.customsReduction).toBeGreaterThan(0);
      expect(craft.customsReduction).toBeLessThan(1);
      expect(AIRCRAFT_MAP.get(craft.id)).toBe(craft);
    }
  });

  it('calculates flight costs and grants free fuel when hangar is owned', () => {
    const cessna = AIRCRAFT_MAP.get('cessna_smuggler')!;
    const gulfstream = AIRCRAFT_MAP.get('gulfstream_g650')!;

    // Without hangar: standard fuel cost
    expect(calculateAircraftFlightCost(cessna, [])).toBe(350);
    expect(calculateAircraftFlightCost(gulfstream, [])).toBe(2800);

    // With private hangar: $0 fuel cost
    expect(calculateAircraftFlightCost(cessna, ['private_hangar'])).toBe(0);
    expect(calculateAircraftFlightCost(gulfstream, ['sovereign_airstrip_compound'])).toBe(0);
  });

  it('buys aircraft, sets active flagship, and updates carrying capacity', () => {
    const state = createInitialState();
    state.player.cash = 50000000;

    const baseCap = getCarryingCapacity(state.player);
    expect(baseCap).toBe(10); // Starting Wannabe rank capacity (Pockets)

    // Buy Cessna (cost $1,250,000, cargo bonus 250)
    const buyRes = buyAircraft(state, 'cessna_smuggler');
    expect(buyRes.success).toBe(true);
    expect(state.player.ownedAircraft).toContain('cessna_smuggler');
    expect(state.player.selectedAircraftId).toBe('cessna_smuggler');

    // Carrying capacity increases by 250
    expect(getCarryingCapacity(state.player)).toBe(baseCap + 250);

    // Buy Learjet (cost $9,500,000, cargo bonus 1500)
    buyAircraft(state, 'learjet_narco');
    expect(state.player.ownedAircraft).toHaveLength(2);

    // Switch active flagship to Learjet
    selectActiveAircraft(state, 'learjet_narco');
    expect(state.player.selectedAircraftId).toBe('learjet_narco');
    expect(getCarryingCapacity(state.player)).toBe(baseCap + 1500);

    // Deselect flagship
    selectActiveAircraft(state, null);
    expect(state.player.selectedAircraftId).toBeNull();
    expect(getCarryingCapacity(state.player)).toBe(baseCap);
  });

  it('guarantees players can use both private aircraft and commercial airport flights', () => {
    const state = createInitialState();
    state.player.cash = 10000000;
    state.player.currentCityId = 'new_york';

    // Buy and activate King Air
    buyAircraft(state, 'king_air_runner');
    const cashAfterBuy = state.player.cash;

    // 1. Travel via Private Aircraft (useOwnedAircraft = true)
    // Fuel cost is $750 without hangar
    const privateTravel = travelToCity(state, 'miami', 'economy', undefined, true);
    expect(privateTravel.success).toBe(true);
    expect(state.player.currentCityId).toBe('miami');
    expect(state.player.cash).toBe(cashAfterBuy - 750);

    const cashAfterPrivate = state.player.cash;

    // 2. Travel via Commercial Airport Flight (useOwnedAircraft = false)
    // Destination London commercial fare from CITIES
    const commercialTravel = travelToCity(state, 'london', 'economy', undefined, false);
    expect(commercialTravel.success).toBe(true);
    expect(state.player.currentCityId).toBe('london');
    // Commercial flight fare deducted, aircraft remains owned and active
    expect(state.player.cash).toBeLessThan(cashAfterPrivate);
    expect(state.player.selectedAircraftId).toBe('king_air_runner');
  });

  it('evaluates customs reduction correctly', () => {
    expect(getAircraftCustomsReduction(null)).toBe(0);
    expect(getAircraftCustomsReduction('cessna_smuggler')).toBe(0.40);
    expect(getAircraftCustomsReduction('gulfstream_g650')).toBe(0.85);
  });
});
