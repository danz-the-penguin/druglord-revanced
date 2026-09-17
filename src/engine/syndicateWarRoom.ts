import {
  PlayerState,
  SyndicateId,
  SyndicateStrikeContract,
  TerritoryInfluence,
} from './types';
import { SYNDICATES, getStandingTier } from './syndicates';

export const REGIONS_LIST = [
  'Americas',
  'Europe',
  'Asia-Pacific',
  'Middle East & Africa',
] as const;

export const INITIAL_STRIKE_CONTRACTS: SyndicateStrikeContract[] = [
  {
    id: 'strike_miami_informant',
    syndicateId: 'medellin',
    targetName: 'Agent Miller & Informant Ramirez',
    targetTitle: 'DEA Miami Task Force Wiretap Team',
    locationCityId: 'miami',
    rewardCash: 75000,
    repReward: 25,
    dangerLevel: 'medium',
    intelBrief: 'A high-level federal witness is preparing to sign extradition affidavits. Intercept their convoy on the MacArthur Causeway and burn all recordings.',
    status: 'available',
  },
  {
    id: 'strike_tijuana_lab',
    syndicateId: 'synthetic_chem',
    targetName: 'Rival Cartel Precursor Warehouse',
    targetTitle: 'Clandestine Chemical Staging Facility',
    locationCityId: 'tijuana',
    rewardCash: 120000,
    repReward: 30,
    dangerLevel: 'high',
    intelBrief: 'A rogue rival crew is synthesizing bootleg fentanyl and undercutting Apex prices. Infiltrate the industrial park, plant thermite charges, and blow the distillation reactors.',
    status: 'available',
  },
  {
    id: 'strike_mekong_river',
    syndicateId: 'golden_triangle',
    targetName: 'Rogue River Pirates & Customs Patrol',
    targetTitle: 'Mekong River Interdiction Flotilla',
    locationCityId: 'chiang_mai',
    rewardCash: 95000,
    repReward: 25,
    dangerLevel: 'medium',
    intelBrief: 'Armed river bandits are hijacking raw opium barges between Vientiane and the Thai border. Ambush their speedboat flotilla and restore open navigation.',
    status: 'available',
  },
  {
    id: 'strike_ibiza_monopoly',
    syndicateId: 'designer_ring',
    targetName: 'VIP Club Extortion Crew',
    targetTitle: 'Underworld Club Enforcers',
    locationCityId: 'ibiza',
    rewardCash: 110000,
    repReward: 30,
    dangerLevel: 'high',
    intelBrief: 'Rival European muscle is taxing Euro-Nightlife MDMA deliveries at luxury superclubs. Neutralize their enforcers at the Marina Botafoch docks.',
    status: 'available',
  },
  {
    id: 'strike_istanbul_convoy',
    syndicateId: 'balkan',
    targetName: 'Black Market Ordnance Depot',
    targetTitle: 'Balkan Arms Smuggling Cache',
    locationCityId: 'istanbul',
    rewardCash: 160000,
    repReward: 35,
    dangerLevel: 'extreme',
    intelBrief: 'A rival paramilitary outfit has seized an armory of heavy military ordnance in the Bosporus container terminal. Eliminate their perimeter guards and secure the shipment.',
    status: 'available',
  },
];

/**
 * Calculates territory influence percentages across the major global theaters.
 */
export function calculateTerritoryInfluences(player: PlayerState): TerritoryInfluence[] {
  const reps = player.syndicateReputations || {};
  const ownedProps = player.ownedProperties || [];

  return [
    {
      region: 'Americas (Cartel Heartland)',
      dominatingSyndicateId: 'medellin',
      playerInfluence: Math.min(100, Math.max(5, (reps.medellin || 0) + ownedProps.length * 8)),
      syndicateInfluence: {
        medellin: 65,
        synthetic_chem: 20,
        golden_triangle: 5,
        designer_ring: 5,
        balkan: 5,
      },
    },
    {
      region: 'Europe (Designer Nightlife & Ports)',
      dominatingSyndicateId: 'designer_ring',
      playerInfluence: Math.min(100, Math.max(5, (reps.designer_ring || 0) + ownedProps.length * 8)),
      syndicateInfluence: {
        designer_ring: 60,
        balkan: 25,
        synthetic_chem: 10,
        medellin: 3,
        golden_triangle: 2,
      },
    },
    {
      region: 'Asia-Pacific & ASEAN (Opium & Synthetics)',
      dominatingSyndicateId: 'golden_triangle',
      playerInfluence: Math.min(100, Math.max(5, (reps.golden_triangle || 0) + ownedProps.length * 8)),
      syndicateInfluence: {
        golden_triangle: 70,
        synthetic_chem: 15,
        balkan: 5,
        medellin: 5,
        designer_ring: 5,
      },
    },
    {
      region: 'Middle East & Africa (Balkan Transit)',
      dominatingSyndicateId: 'balkan',
      playerInfluence: Math.min(100, Math.max(5, (reps.balkan || 0) + ownedProps.length * 8)),
      syndicateInfluence: {
        balkan: 65,
        medellin: 15,
        golden_triangle: 10,
        designer_ring: 5,
        synthetic_chem: 5,
      },
    },
  ];
}

/**
 * Calculates total daily protection racket revenue claimable from allied syndicates.
 */
export function calculateProtectionRacketRevenue(player: PlayerState): {
  totalRevenue: number;
  breakdown: { syndicateId: SyndicateId; syndicateName: string; amount: number; tier: string }[];
} {
  const reps = player.syndicateReputations || {};
  let total = 0;
  const breakdown: { syndicateId: SyndicateId; syndicateName: string; amount: number; tier: string }[] = [];

  for (const syndicate of SYNDICATES) {
    const rep = reps[syndicate.id] || 0;
    const tier = getStandingTier(rep);

    let amount = 0;
    if (tier === 'Allied Don') {
      amount = 12500;
    } else if (tier === 'Associate') {
      amount = 5000;
    }

    if (amount > 0) {
      total += amount;
      breakdown.push({
        syndicateId: syndicate.id,
        syndicateName: syndicate.name,
        amount,
        tier,
      });
    }
  }

  return { totalRevenue: total, breakdown };
}

/**
 * Collects daily protection racket dividend.
 */
export function collectProtectionRacket(
  player: PlayerState
): { success: boolean; message: string; collectedCash: number } {
  if (player.lastRacketCollectedDay === player.currentDay) {
    return {
      success: false,
      message: `Protection racket dividends for Day ${player.currentDay} have already been collected. Returns renew at dawn (next day).`,
      collectedCash: 0,
    };
  }

  const { totalRevenue, breakdown } = calculateProtectionRacketRevenue(player);
  if (totalRevenue <= 0) {
    return {
      success: false,
      message: 'No underworld territories currently pay protection tribute. Achieve Associate or Allied Don standing with syndicates to unlock revenue streams.',
      collectedCash: 0,
    };
  }

  player.cash += totalRevenue;
  player.lastRacketCollectedDay = player.currentDay;

  const names = breakdown.map((b) => `${b.syndicateName} ($${b.amount.toLocaleString()})`).join(', ');

  return {
    success: true,
    message: `Collected $${totalRevenue.toLocaleString()} in protection racket kickbacks from: ${names}!`,
    collectedCash: totalRevenue,
  };
}

/**
 * Gets active strike contracts for the player.
 */
export function getStrikeContracts(player: PlayerState): SyndicateStrikeContract[] {
  if (!player.syndicateStrikeContracts || player.syndicateStrikeContracts.length === 0) {
    player.syndicateStrikeContracts = [...INITIAL_STRIKE_CONTRACTS];
  }
  return player.syndicateStrikeContracts;
}

/**
 * Executes a high-risk strike contract.
 */
export function executeStrikeContract(
  player: PlayerState,
  contractId: string
): { success: boolean; message: string; cashReward?: number; repReward?: number } {
  const contracts = getStrikeContracts(player);
  const contract = contracts.find((c) => c.id === contractId);

  if (!contract) {
    return { success: false, message: 'Contract not found.' };
  }

  if (contract.status === 'completed') {
    return { success: false, message: 'Contract has already been eliminated.' };
  }

  // Must be in the city of the strike target
  if (player.currentCityId !== contract.locationCityId) {
    return {
      success: false,
      message: `You must travel to ${contract.locationCityId.replace('_', ' ').toUpperCase()} to execute this operation.`,
    };
  }

  // Check health and combat readiness
  if (player.health < 30) {
    return {
      success: false,
      message: 'Your health is too critical (<30 HP) to execute a tactical assault.',
    };
  }

  // Strike execution: player takes some tactical damage based on danger
  const damage = contract.dangerLevel === 'extreme' ? 30 : contract.dangerLevel === 'high' ? 20 : 12;
  player.health = Math.max(5, player.health - damage);

  // Rewards
  player.cash += contract.rewardCash;
  if (!player.syndicateReputations) {
    player.syndicateReputations = {};
  }
  player.syndicateReputations[contract.syndicateId] =
    (player.syndicateReputations[contract.syndicateId] || 0) + contract.repReward;

  contract.status = 'completed';

  return {
    success: true,
    message: `Target eliminated! Collected $${contract.rewardCash.toLocaleString()} and +${contract.repReward} ${contract.syndicateId} standing (took ${damage} HP combat damage).`,
    cashReward: contract.rewardCash,
    repReward: contract.repReward,
  };
}
