import {
  CorruptOfficialDefinition,
  CorruptOfficialId,
  SovereignSanctuary,
} from './corruptionTypes';
import { ActionResult, GameEngineState } from './game';
import { PlayerState } from './types';
import { CITY_MAP } from './constants';

export type { CorruptOfficialId };

export const CORRUPT_OFFICIALS: CorruptOfficialDefinition[] = [
  {
    id: 'airport_baggage_handler',
    name: 'Corrupt Airport Baggage Handler',
    roleTitle: 'Tarmac Ramp Specialist & Luggage Shuttler',
    agency: 'International Airport Aviation Ground Crew',
    initialBribeCost: 15000,
    dailyRetainer: 350,
    monthlyCostEstimate: 10500,
    perkTitle: '100% Commercial Customs Bypass',
    perkDescription:
      'Guarantees zero airport customs inspections or sniffer dog checks on commercial flights. Shuttles your luggage through tarmac service tunnels directly to baggage claim.',
    icon: '🧳',
    quote: 'Luggage tags get swapped on the tarmac. Customs dogs won\'t even look your way.',
  },
  {
    id: 'police_dispatcher',
    name: 'Metropolitan 911 Police Dispatcher',
    roleTitle: 'Communications Watch Commander',
    agency: 'Municipal Police & Tactical Task Force CAD Network',
    initialBribeCost: 35000,
    dailyRetainer: 750,
    monthlyCostEstimate: 22500,
    perkTitle: '24-Hour Precinct Raid Early Warning',
    perkDescription:
      'Monitors encrypted tactical frequencies. Transmits advance wire alerts 1 day before precinct SWAT or DEA strike teams raid your location, and suppresses ambush probability.',
    icon: '🚨',
    quote: 'If a search warrant gets stamped with your safehouse address, you\'ll know 24 hours before the battering ram arrives.',
  },
  {
    id: 'fincen_auditor',
    name: 'FinCEN Senior Regulatory Auditor',
    roleTitle: 'Treasury Bank Secrecy Act Enforcement Officer',
    agency: 'Financial Crimes Enforcement Network (FinCEN)',
    initialBribeCost: 75000,
    dailyRetainer: 1500,
    monthlyCostEstimate: 45000,
    perkTitle: '100% Shell Business Audit Immunity',
    perkDescription:
      'Provides complete audit immunity for shell corporations. Shreds Suspicious Activity Reports (SARs), suppresses RICO indictment progress by 60%, and grants passive decay.',
    icon: '🏛️',
    quote: 'Consider your cash flows invisible. The Treasury only investigates what I flag for them.',
  },
];

export const CORRUPT_MAP = new Map<CorruptOfficialId, CorruptOfficialDefinition>(
  CORRUPT_OFFICIALS.map((o) => [o.id, o])
);

export const SOVEREIGN_SANCTUARIES: SovereignSanctuary[] = [
  {
    cityId: 'dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    extraditionShield: 'Universal Non-Extradition & Golden Investor Asylum',
    icon: '🏙️',
    description:
      'Global capital of private wealth secrecy. Refuses all Western bilateral extradition treaties for high-net-worth foreign principals.',
  },
  {
    cityId: 'panama_city',
    name: 'Panama City',
    country: 'Panama',
    extraditionShield: 'Constitutional Asset Secrecy & Corporate Sanctuary',
    icon: '🌴',
    description:
      'Offshore banking haven. Constitutional statutes strictly prohibit extraditing officers of registered sovereign trusts and private holding foundations.',
  },
  {
    cityId: 'zurich',
    name: 'Zurich',
    country: 'Switzerland',
    extraditionShield: 'Canton Financial Neutrality & Sovereign Clearance',
    icon: '🏔️',
    description:
      'Centuries of Swiss banking neutrality and canton sovereign legal protections shield foreign depositors from unilateral foreign warrants.',
  },
  {
    cityId: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    extraditionShield: 'Sovereign Port Neutrality & Financial Privacy',
    icon: '🦁',
    description:
      'Strictest sovereign non-interference laws in Asia. Protects private family offices and merchant shipping conglomerates from foreign freeze injunctions.',
  },
  {
    cityId: 'istanbul',
    name: 'Istanbul',
    country: 'Turkey',
    extraditionShield: 'Bosphorus Sovereign Jurisdiction & Real Estate Asylum',
    icon: '🕌',
    description:
      'Transcontinental crossroad beyond NATO civil treaty jurisdiction. Grants absolute legal haven to international investors.',
  },
];

export const SANCTUARY_MAP = new Map<string, SovereignSanctuary>(
  SOVEREIGN_SANCTUARIES.map((s) => [s.cityId, s])
);

/**
 * Check if a city is a recognized Sovereign Non-Extradition Sanctuary
 * (Either an official sanctuary city or a city where player owns a sovereign property)
 */
export function isSovereignSanctuary(cityId: string, ownedProperties: string[] = []): boolean {
  if (SANCTUARY_MAP.has(cityId)) return true;
  // Tier 7+ sovereign properties grant localized diplomatic sanctuary
  const sovereignProps = ['sovereign_airstrip_compound', 'island_paradise'];
  return ownedProperties.some((p) => sovereignProps.includes(p));
}

/**
 * Check if the player currently has an active corrupt official on payroll
 */
export function hasActiveOfficial(player: PlayerState, officialId: CorruptOfficialId): boolean {
  return !!player.corruptOfficials?.[officialId]?.active;
}

/**
 * Calculate the visual threat stage of the Federal Grand Jury RICO Indictment Meter
 */
export function getRicoThreatLevel(ricoMeter: number = 0): {
  label: string;
  color: string;
  badgeBg: string;
  danger: 'low' | 'moderate' | 'high' | 'critical';
} {
  if (ricoMeter >= 100) {
    return {
      label: 'INDICTED — ASSETS FROZEN',
      color: 'text-rose-500',
      badgeBg: 'bg-rose-950/90 text-rose-300 border-rose-600',
      danger: 'critical',
    };
  }
  if (ricoMeter >= 75) {
    return {
      label: 'CRITICAL — SUBPOENAS ISSUED',
      color: 'text-orange-500',
      badgeBg: 'bg-orange-950/80 text-orange-300 border-orange-600',
      danger: 'high',
    };
  }
  if (ricoMeter >= 45) {
    return {
      label: 'ELEVATED — GRAND JURY INQUIRY',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-950/70 text-amber-300 border-amber-600',
      danger: 'moderate',
    };
  }
  return {
    label: 'ROUTINE SURVEILLANCE',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/70',
    danger: 'low',
  };
}

/**
 * Hire a corrupt official onto the player's underworld payroll
 */
export function hireOfficial(
  state: GameEngineState,
  officialId: CorruptOfficialId,
  assignedBusinessId?: string
): ActionResult {
  const official = CORRUPT_MAP.get(officialId);
  if (!official) return { success: false, message: 'Invalid official identifier' };

  if (!state.player.corruptOfficials) state.player.corruptOfficials = {};
  const current = state.player.corruptOfficials[officialId];

  if (current && current.active) {
    return { success: false, message: `${official.name} is already on your payroll` };
  }

  // Cost check: Can pay from cash or bank (if bank unfrozen)
  const availableFunds = state.player.cash + (state.player.isBankFrozen ? 0 : state.player.bank);
  if (availableFunds < official.initialBribeCost) {
    return {
      success: false,
      message: `You need $${official.initialBribeCost.toLocaleString()} to place ${official.name} on retainer.`,
    };
  }

  // Deduct placement bribe
  if (state.player.cash >= official.initialBribeCost) {
    state.player.cash -= official.initialBribeCost;
  } else {
    const cashPortion = state.player.cash;
    state.player.cash = 0;
    state.player.bank -= official.initialBribeCost - cashPortion;
  }

  state.player.corruptOfficials[officialId] = {
    id: officialId,
    hiredDay: state.player.currentDay,
    active: true,
    assignedBusinessId,
    totalBribesPaid: (current?.totalBribesPaid || 0) + official.initialBribeCost,
  };

  state.player.stats = state.player.stats || {};
  state.player.stats.corruptOfficialsBribed = (state.player.stats.corruptOfficialsBribed || 0) + 1;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'corruption',
    message: `🤝 CORRUPTION RETAINER: Placed ${official.name} on payroll for $${official.initialBribeCost.toLocaleString()} initial bribe ($${official.dailyRetainer}/day upkeep). Perk active: ${official.perkTitle}.`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Successfully contracted ${official.name} on retainer ($${official.dailyRetainer}/day upkeep).`,
  };
}

/**
 * Terminate a corrupt official's retainer
 */
export function fireOfficial(
  state: GameEngineState,
  officialId: CorruptOfficialId
): ActionResult {
  const official = CORRUPT_MAP.get(officialId);
  if (!official) return { success: false, message: 'Invalid official identifier' };

  if (!state.player.corruptOfficials?.[officialId]?.active) {
    return { success: false, message: `${official.name} is not currently on your active payroll` };
  }

  state.player.corruptOfficials[officialId].active = false;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'corruption',
    message: `💼 PAYROLL TERMINATED: Dismissed ${official.name} from underworld retainer. Daily upkeep paused.`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Dismissed ${official.name} from underworld payroll.`,
  };
}

/**
 * Bribe the Grand Jury prosecutor / special investigator to suppress the RICO Indictment Meter
 */
export function bribeGrandJury(state: GameEngineState, amount = 50000): ActionResult {
  const currentMeter = state.player.ricoMeter ?? 0;
  if (currentMeter <= 0) {
    return { success: false, message: 'The Grand Jury has no active investigation against you' };
  }

  const cost = Math.max(10000, amount);
  if (state.player.cash < cost && (state.player.isBankFrozen || state.player.bank < cost)) {
    return {
      success: false,
      message: `You need $${cost.toLocaleString()} to finance backchannel motions and payoffs.`,
    };
  }

  // Deduct payment
  if (state.player.cash >= cost) {
    state.player.cash -= cost;
  } else {
    const cashPortion = state.player.cash;
    state.player.cash = 0;
    state.player.bank -= cost - cashPortion;
  }

  // Knock off 20% to 25% from the indictment meter
  const reduction = Math.round(20 * (cost / 50000));
  const newMeter = Math.max(0, currentMeter - reduction);
  state.player.ricoMeter = newMeter;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'corruption',
    message: `⚖️ GRAND JURY SUPPRESSION: Dispatched $${cost.toLocaleString()} through offshore defense intermediaries. Grand Jury subpoena quashed (-${reduction}% Indictment Meter, now ${newMeter}%).`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Suppressed Grand Jury investigation by -${reduction}% (Current Indictment: ${newMeter}%).`,
  };
}

/**
 * Emergency Sovereign Extradition Escape Flight:
 * When indicted (100% RICO) or under extreme federal heat, take an emergency sovereign flight
 * to a recognized Non-Extradition Sanctuary to dissolve the federal warrant and unfreeze bank assets.
 */
export function emergencyExtraditionEscape(
  state: GameEngineState,
  destinationCityId: string
): ActionResult {
  const isSanctuary = isSovereignSanctuary(destinationCityId, state.player.ownedProperties);
  if (!isSanctuary) {
    return {
      success: false,
      message: 'Destination must be a recognized Sovereign Non-Extradition Sanctuary (Dubai, Panama City, Zurich, Singapore, Istanbul) or owned sovereign estate.',
    };
  }

  if (state.player.currentCityId === destinationCityId) {
    return {
      success: false,
      message: 'You are already in this sovereign sanctuary city.',
    };
  }

  const sanctuary = SANCTUARY_MAP.get(destinationCityId);
  const targetName = sanctuary?.name ?? CITY_MAP.get(destinationCityId)?.name ?? destinationCityId;

  // Emergency flight charter cost: $12,000 cash or private fuel
  const hasAircraft = state.player.ownedAircraft && state.player.ownedAircraft.length > 0;
  const charterCost = hasAircraft ? 3000 : 12000;

  if (state.player.cash < charterCost) {
    // If cash is low, loan shark or underground extraction syndicate handles it for a debt spike
    state.player.debt += charterCost * 1.5;
  } else {
    state.player.cash -= charterCost;
  }

  // Travel to sanctuary
  state.player.currentCityId = destinationCityId;

  // If bank was frozen, foreign asylum unfreezes assets with a 15% forfeiture penalty settlement
  let settlementMessage = '';
  if (state.player.isBankFrozen) {
    const forfeiture = Math.round(state.player.bank * 0.15);
    state.player.bank = Math.max(0, state.player.bank - forfeiture);
    state.player.isBankFrozen = false;
    settlementMessage = ` DOJ receivership levied a 15% forfeiture penalty ($${forfeiture.toLocaleString()}), and remaining bank assets ($${state.player.bank.toLocaleString()}) are fully repatriated and unfrozen.`;
  }

  // Reset RICO Indictment Meter down to safe baseline (10%)
  const prevMeter = state.player.ricoMeter ?? 0;
  state.player.ricoMeter = 10;
  state.player.stats = state.player.stats || {};
  state.player.stats.ricoIndictmentsEvaded = (state.player.stats.ricoIndictmentsEvaded || 0) + 1;

  state.logs.unshift({
    day: state.player.currentDay,
    city: targetName,
    type: 'corruption',
    message: `🛡️ SOVEREIGN SANCTUARY REACHED: Touched down in ${targetName}! Foreign jurisdiction grants complete asylum from US Federal warrants.${settlementMessage} Grand Jury indictment quashed (-${prevMeter - 10}%).`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Successfully touched down in sovereign sanctuary ${targetName}! Federal warrant quashed and assets restored.`,
  };
}

/**
 * Process daily corruption payroll upkeeps and update the Federal Grand Jury RICO Indictment Meter
 */
export function processCorruptionAndRicoDaily(state: GameEngineState, _isTravel = false): void {
  if (!state.player.corruptOfficials) state.player.corruptOfficials = {};
  if (typeof state.player.ricoMeter !== 'number') state.player.ricoMeter = 0;

  // 1. Process Retainer Payroll Upkeep
  for (const officialDef of CORRUPT_OFFICIALS) {
    const current = state.player.corruptOfficials[officialDef.id];
    if (current && current.active) {
      const upkeep = officialDef.dailyRetainer;
      const canPayBank = !state.player.isBankFrozen && state.player.bank >= upkeep;
      const canPayCash = state.player.cash >= upkeep;

      if (canPayBank) {
        state.player.bank -= upkeep;
        current.totalBribesPaid += upkeep;
      } else if (canPayCash) {
        state.player.cash -= upkeep;
        current.totalBribesPaid += upkeep;
      } else {
        // Insufficient funds: de-activate official
        current.active = false;
        state.logs.unshift({
          day: state.player.currentDay,
          city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
          type: 'corruption',
          message: `⚠️ PAYROLL LAPSE: Unable to pay daily retainer for ${officialDef.name} ($${upkeep.toLocaleString()}). Asset dropped off payroll!`,
          timestamp: Date.now(),
        });
      }
    }
  }

  // 2. Police Dispatcher Early Warning Intercepts
  const currentCityId = state.player.currentCityId;
  const currentHeat = state.player.cityHeat?.[currentCityId] ?? 0;
  const hasDispatcher = hasActiveOfficial(state.player, 'police_dispatcher');

  if (hasDispatcher) {
    if (currentHeat >= 65) {
      state.player.pendingRaidWarning = {
        cityId: currentCityId,
        day: state.player.currentDay + 1,
        message: `Precinct tactical units and DEA strike team drafting raid warrant for ${CITY_MAP.get(currentCityId)?.name}!`,
        severity: currentHeat >= 80 ? 'imminent' : 'warning',
      };

      state.logs.unshift({
        day: state.player.currentDay,
        city: CITY_MAP.get(currentCityId)?.name ?? 'City',
        type: 'corruption',
        message: `🚨 DISPATCH LEAK: Police Dispatcher intercepted an active warrant draft! SWAT & DEA raid planned for your location within 24 hours. Relocate or vault your contraband!`,
        timestamp: Date.now(),
      });
    } else {
      state.player.pendingRaidWarning = null;
    }
  } else {
    // Without dispatcher, player does not receive early warning
    state.player.pendingRaidWarning = null;
  }

  // 3. Federal Grand Jury RICO Indictment Meter Update
  let ricoDelta = 0;

  // Factor A: Local City Police / DEA Heat
  if (currentHeat >= 85) {
    ricoDelta += 6; // Severe heat
  } else if (currentHeat >= 70) {
    ricoDelta += 4; // High heat
  } else if (currentHeat < 30) {
    ricoDelta -= 2; // Cold heat allows lying low
  }

  // Factor B: Suspicious Unlaundered Millions in Banking System
  const ownedShells = state.player.ownedBusinesses?.length ?? 0;
  if (state.player.bank >= 1000000 && ownedShells === 0) {
    ricoDelta += 3; // FinCEN SAR threshold
  }

  // Factor C: Defense Buffs & Active Retainers
  const hasAuditor = hasActiveOfficial(state.player, 'fincen_auditor');
  const hasOffshoreLegal = state.player.corporateUpgrades?.includes('offshore_legal');
  const inSanctuary = isSovereignSanctuary(currentCityId, state.player.ownedProperties);

  if (hasAuditor) {
    ricoDelta = ricoDelta > 0 ? Math.round(ricoDelta * 0.4) : ricoDelta - 2;
  }
  if (hasOffshoreLegal) {
    ricoDelta = ricoDelta > 0 ? Math.round(ricoDelta * 0.6) : ricoDelta;
  }
  if (inSanctuary) {
    ricoDelta = ricoDelta > 0 ? Math.round(ricoDelta * 0.5) : ricoDelta - 2;
  }

  // Triple audit heat handicap for Swiss Purist challenge
  if (state.player.challengeModifiers?.tripleAuditHeat && ricoDelta > 0) {
    ricoDelta = Math.round(ricoDelta * 3);
  }

  // Apply delta
  const prevRico = state.player.ricoMeter ?? 0;
  let newRico = Math.max(0, Math.min(100, prevRico + ricoDelta));

  // Cap at 85% if staying inside a sovereign sanctuary
  if (inSanctuary && newRico > 85) {
    newRico = 85;
  }

  state.player.ricoMeter = newRico;

  // 4. Trigger 100% RICO Indictment Asset Freeze
  if (newRico >= 100 && !state.player.isBankFrozen) {
    state.player.isBankFrozen = true;
    state.logs.unshift({
      day: state.player.currentDay,
      city: CITY_MAP.get(currentCityId)?.name ?? 'City',
      type: 'corruption',
      message: `🚨 FEDERAL RICO INDICTMENT UNSEALED! The United States Grand Jury has issued a sealed indictment and frozen all offshore bank assets! Flee immediately to a Sovereign Non-Extradition Sanctuary (Dubai, Panama City, Zurich, Singapore, Istanbul) to establish asylum!`,
      timestamp: Date.now(),
    });
  }
}
