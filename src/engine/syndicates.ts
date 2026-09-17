import { Syndicate, SyndicateContract, SyndicateStandingTier, SyndicateId } from './types';
import { DRUGS, CITIES } from './constants';

export const SYNDICATES: Syndicate[] = [
  {
    id: 'medellin',
    name: 'Medellín Cartel',
    moniker: 'Los Extraditables',
    leader: 'Don Gustavo',
    headquarters: 'Medellín & Bogotá',
    primaryCommodity: 'Cocaine & Crack Cocaine',
    specialtyDrugs: ['cocaine', 'crack'],
    bannerColor: 'from-emerald-600 to-amber-700',
    emblem: '🦅',
    description: 'Ruthless South American cartel commanding dense mountain cocaine labs and armed paramilitary convoys.',
  },
  {
    id: 'golden_triangle',
    name: 'Golden Triangle Triads',
    moniker: 'The Black Lotus Triad',
    leader: 'Elder Zhang',
    headquarters: 'Bangkok & Hong Kong',
    primaryCommodity: 'Raw Opium & Refined Heroin',
    specialtyDrugs: ['heroin', 'opium'],
    bannerColor: 'from-rose-600 to-slate-900',
    emblem: '🐉',
    description: 'Centuries-old underworld fraternity controlling deep Mekong poppy harvests and maritime container smuggling lines.',
  },
  {
    id: 'synthetic_chem',
    name: 'Synthetic Chem Guild',
    moniker: 'Apex Synthetics Syndicate',
    leader: 'Dr. Heinrich Vance',
    headquarters: 'Tijuana, Los Angeles & Berlin',
    primaryCommodity: 'Ice, Fentanyl, Tranq & Special K',
    specialtyDrugs: ['ice', 'fentanyl', 'tranq', 'special_k'],
    bannerColor: 'from-cyan-600 to-indigo-900',
    emblem: '⚗️',
    description: 'Industrial pharmaceutical rogue network synthesizing ultra-potent synthetic compounds in clandestine super-labs.',
  },
  {
    id: 'designer_ring',
    name: 'European Designer Ring',
    moniker: 'Euro-Nightlife Consortium',
    leader: 'Madame Monique',
    headquarters: 'Amsterdam, London, Ibiza & Zurich',
    primaryCommodity: 'Pure Ecstasy, Liquid LSD & MDA',
    specialtyDrugs: ['ecstasy', 'lsd', 'mda', 'shrooms'],
    bannerColor: 'from-fuchsia-600 to-violet-900',
    emblem: '💎',
    description: 'Sophisticated continental high-society ring laundering millions through electronic dance festivals and VIP lounges.',
  },
  {
    id: 'balkan',
    name: 'Balkan Smugglers Consortium',
    moniker: 'The Iron Adriatic Network',
    leader: 'Commander Dragan',
    headquarters: 'Istanbul, Frankfurt & Lagos',
    primaryCommodity: 'Speed, Kat, Hashish & Weapons Logistics',
    specialtyDrugs: ['speed', 'kat', 'hashish', 'weed'],
    bannerColor: 'from-amber-600 to-slate-900',
    emblem: '⚔️',
    description: 'Ex-military logistics syndicate specialized in heavy ordnance, cross-border overland convoys, and speed distribution.',
  },
];

export const SYNDICATE_MAP = new Map<SyndicateId, Syndicate>(
  SYNDICATES.map((s) => [s.id, s])
);

export function getStandingTier(reputation: number): SyndicateStandingTier {
  if (reputation <= -60) return 'Nemesis';
  if (reputation <= -20) return 'Hostile';
  if (reputation < 20) return 'Neutral';
  if (reputation < 60) return 'Associate';
  return 'Allied Don';
}

export function getSyndicateDiscount(
  drugId: string,
  syndicateReputations: Record<string, number> = {}
): number {
  let highestDiscount = 0;
  for (const syndicate of SYNDICATES) {
    if (syndicate.specialtyDrugs.includes(drugId)) {
      const rep = syndicateReputations[syndicate.id] ?? 0;
      const tier = getStandingTier(rep);
      if (tier === 'Allied Don') {
        highestDiscount = Math.max(highestDiscount, 0.30); // 30% discount
      } else if (tier === 'Associate') {
        highestDiscount = Math.max(highestDiscount, 0.15); // 15% discount
      }
    }
  }
  return highestDiscount;
}

/**
 * Calculates peace tribute cost to reset a negative reputation back to 0.
 */
export function calculatePeaceTributeCost(reputation: number): number {
  if (reputation >= 0) return 0;
  const absRep = Math.abs(reputation);
  return Math.round(absRep * 2500 + 15000);
}

/**
 * Generates a fresh set of underworld syndicate contracts for the player to accept.
 */
export function generateSyndicateContracts(
  playerDay: number,
  currentCityId: string,
  existingContracts: SyndicateContract[] = []
): SyndicateContract[] {
  const activeCount = existingContracts.filter((c) => c.status === 'active').length;
  if (activeCount >= 4) return existingContracts;

  const currentAvailable = existingContracts.filter((c) => c.status === 'available');
  if (currentAvailable.length >= 3) return existingContracts;

  const newContracts: SyndicateContract[] = [...existingContracts.filter((c) => c.status === 'active')];

  for (let i = 0; i < 3 - currentAvailable.length; i++) {
    const syndicate = SYNDICATES[(playerDay + i * 2) % SYNDICATES.length];
    const drugId = syndicate.specialtyDrugs[i % syndicate.specialtyDrugs.length];
    const drug = DRUGS.find((d) => d.id === drugId) || DRUGS[0];

    // Pick an interesting destination different from current city
    const availableDestinations = CITIES.filter((c) => c.id !== currentCityId);
    const dest = availableDestinations[(playerDay * 5 + i * 7) % availableDestinations.length];

    const unitsRequired = 25 + ((playerDay * 11 + i * 15) % 65);
    const estimatedValue = drug.basePrice * unitsRequired;
    const payoutCash = Math.round(estimatedValue * 1.55 + 5000);
    const daysAllowed = 3 + (i % 3);

    newContracts.push({
      id: `contract_${syndicate.id}_${playerDay}_${i}_${Date.now()}`,
      syndicateId: syndicate.id,
      title: `${syndicate.name}: ${drug.name} Smuggling Run`,
      drugId,
      unitsRequired,
      originCityId: currentCityId,
      destinationCityId: dest.id,
      payoutCash,
      repReward: 20 + i * 5,
      repPenalty: 15,
      daysRemaining: daysAllowed,
      status: 'available',
    });
  }

  return newContracts;
}
