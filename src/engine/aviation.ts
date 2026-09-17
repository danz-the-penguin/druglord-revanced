import { Aircraft } from './types';

export const AIRCRAFT_FLEET: Aircraft[] = [
  {
    id: 'cessna_smuggler',
    name: 'Cessna 208 Caravan Turbo-Smuggler',
    model: 'Cessna 208B Grand Caravan EX',
    price: 1250000,
    fuelCost: 350,
    cargoBonus: 250,
    customsReduction: 0.40,
    icon: '🛩️',
    image: '/assets/aircraft/cessna_smuggler.png',
    description:
      'High-wing rugged bush turboprop with oversized tundra tires. Capable of landing on unpaved clandestine strips with 250 extra stash units.',
  },
  {
    id: 'king_air_runner',
    name: 'Beechcraft King Air 350 Twin-Turboprop',
    model: 'Super King Air 350ER High-Speed Courier',
    price: 3800000,
    fuelCost: 750,
    cargoBonus: 600,
    customsReduction: 0.55,
    icon: '✈️',
    image: '/assets/aircraft/king_air_runner.png',
    description:
      'Pressurized twin-turboprop capable of flying above weather at 35,000 feet. Cross-border radar stealth with 600 units cargo hold.',
  },
  {
    id: 'learjet_narco',
    name: 'Bombardier Learjet 75 XR Sub-Rosa',
    model: 'Learjet 75 XR High-Altitude Executive',
    price: 9500000,
    fuelCost: 1500,
    cargoBonus: 1500,
    customsReduction: 0.70,
    icon: '🚀',
    image: '/assets/aircraft/learjet_narco.png',
    description:
      'High-mach twin-jet engine. Lands at private VIP FBO hangars, completely bypassing standard customs queues with 1,500 units cargo hold.',
  },
  {
    id: 'gulfstream_g650',
    name: 'Gulfstream G650ER Sovereign Kingpin Flagship',
    model: 'Gulfstream G650ER Ultra-Long-Range Sovereign',
    price: 32000000,
    fuelCost: 2800,
    cargoBonus: 4000,
    customsReduction: 0.85,
    icon: '👑',
    image: '/assets/aircraft/gulfstream_g650.png',
    description:
      'The pinnacle of global narco-aviation. Intercontinental Mach 0.90 non-stop range with diplomatic clearances and 4,000 extra stash capacity.',
  },
];

export const AIRCRAFT_MAP = new Map<string, Aircraft>(
  AIRCRAFT_FLEET.map((a) => [a.id, a])
);

/**
 * Calculates fuel cost to operate an owned aircraft for a flight.
 * If the player owns a private hangar or sovereign airfield, fuel is complimentary ($0).
 * If the aircraft is equipped with auxiliary drop tanks, fuel cost is reduced by 50%.
 */
export function calculateAircraftFlightCost(
  aircraft: Aircraft,
  ownedProperties: string[] = [],
  aircraftState?: import('./types').AircraftState
): number {
  if (
    ownedProperties.includes('private_hangar') ||
    ownedProperties.includes('sovereign_airstrip_compound')
  ) {
    return 0; // Free fuel from owned hangar storage
  }
  let cost = aircraft.fuelCost;
  if (aircraftState?.hasAuxFuelTanks) {
    cost = Math.round(cost * 0.5);
  }
  return cost;
}

/**
 * Returns the highest customs risk reduction granted by the player's active or owned aircraft.
 */
export function getAircraftCustomsReduction(
  aircraftId?: string | null
): number {
  if (!aircraftId) return 0;
  const aircraft = AIRCRAFT_MAP.get(aircraftId);
  return aircraft ? aircraft.customsReduction : 0;
}

export function getAircraftState(
  player: import('./types').PlayerState,
  aircraftId: string
): import('./types').AircraftState {
  if (!player.aircraftFleetState) {
    player.aircraftFleetState = {};
  }
  if (!player.aircraftFleetState[aircraftId]) {
    player.aircraftFleetState[aircraftId] = {
      wearPercent: 0,
      hasAuxFuelTanks: false,
      hasHiddenCompartment: false,
      hasTransponderSpoofer: false,
      transponderSpoofsRemaining: 0,
    };
  }
  return player.aircraftFleetState[aircraftId];
}

export function applyFlightWear(
  player: import('./types').PlayerState,
  aircraftId: string
): { wearAdded: number; newWear: number } {
  const state = getAircraftState(player, aircraftId);
  const wearAdded = Math.floor(Math.random() * 4) + 3; // 3% to 6% wear per flight
  state.wearPercent = Math.min(100, state.wearPercent + wearAdded);
  return { wearAdded, newWear: state.wearPercent };
}

export function calculateOverhaulCost(wearPercent: number): number {
  if (wearPercent <= 0) return 0;
  return Math.round(wearPercent * 350);
}

export function overhaulAircraft(
  player: import('./types').PlayerState,
  aircraftId: string
): { success: boolean; message: string } {
  const state = getAircraftState(player, aircraftId);
  if (state.wearPercent <= 0) {
    return { success: false, message: 'Airframe is already in mint condition (0% wear).' };
  }

  const cost = calculateOverhaulCost(state.wearPercent);
  if (player.cash < cost) {
    return {
      success: false,
      message: `Insufficient cash for maintenance overhaul ($${cost.toLocaleString()} required).`,
    };
  }

  player.cash -= cost;
  state.wearPercent = 0;

  return {
    success: true,
    message: `Aviation hangar performed full FAA/EASA airframe overhaul! Restored to 100% factory condition ($${cost.toLocaleString()}).`,
  };
}

export function buyAvionicsUpgrade(
  player: import('./types').PlayerState,
  aircraftId: string,
  upgradeType: 'aux_tanks' | 'hidden_compartment' | 'transponder_spoofer'
): { success: boolean; message: string } {
  const state = getAircraftState(player, aircraftId);
  const aircraft = AIRCRAFT_MAP.get(aircraftId);
  if (!aircraft) return { success: false, message: 'Aircraft not found.' };

  switch (upgradeType) {
    case 'aux_tanks': {
      const cost = 45000;
      if (state.hasAuxFuelTanks) return { success: false, message: 'Auxiliary drop tanks already installed.' };
      if (player.cash < cost) return { success: false, message: `Insufficient cash ($${cost.toLocaleString()} required).` };
      player.cash -= cost;
      state.hasAuxFuelTanks = true;
      return { success: true, message: 'Installed Auxiliary Drop Tanks (-50% fuel consumption)!' };
    }
    case 'hidden_compartment': {
      const cost = 65000;
      if (state.hasHiddenCompartment) return { success: false, message: 'Hidden contraband bay already installed.' };
      if (player.cash < cost) return { success: false, message: `Insufficient cash ($${cost.toLocaleString()} required).` };
      player.cash -= cost;
      state.hasHiddenCompartment = true;
      return { success: true, message: 'Fabricated Lead-Lined Contraband Smuggle Bay (masks 100 units from drug dogs)!' };
    }
    case 'transponder_spoofer': {
      const cost = 35000;
      if (player.cash < cost) return { success: false, message: `Insufficient cash ($${cost.toLocaleString()} required).` };
      player.cash -= cost;
      state.hasTransponderSpoofer = true;
      state.transponderSpoofsRemaining = (state.transponderSpoofsRemaining || 0) + 3;
      return { success: true, message: 'Calibrated ICAO Transponder Spoofer (+3 ghost radar disguise flights)!' };
    }
  }
}
