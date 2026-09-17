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
 */
export function calculateAircraftFlightCost(
  aircraft: Aircraft,
  ownedProperties: string[] = []
): number {
  if (
    ownedProperties.includes('private_hangar') ||
    ownedProperties.includes('sovereign_airstrip_compound')
  ) {
    return 0; // Free fuel from owned hangar storage
  }
  return aircraft.fuelCost;
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
