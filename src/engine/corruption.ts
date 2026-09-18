import {
  CorruptOfficialDefinition,
  CorruptOfficialId,
  SovereignSanctuary,
  FederalInformant,
  FederalWiretapTranscript,
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
  {
    id: 'federal_judge',
    name: 'Presiding Federal District Judge',
    roleTitle: 'Federal District Court Senior Magistrate',
    agency: 'United States District Court',
    initialBribeCost: 180000,
    dailyRetainer: 3500,
    monthlyCostEstimate: 105000,
    perkTitle: 'Dismissal Injunction & Wiretap Suppression',
    perkDescription:
      'Quashes federal wiretap warrants on probable cause technicalities and reduces Grand Jury RICO buildup by 75%. If arrested, orders immediate habeas corpus dismissal.',
    icon: '⚖️',
    quote: 'Procedural technicalities are the bedrock of American jurisprudence. File the motion to suppress; consider it granted.',
  },
  {
    id: 'dea_special_agent',
    name: 'Corrupt DEA Special Agent in Charge',
    roleTitle: 'Regional Strike Force & Interdiction Commander',
    agency: 'Drug Enforcement Administration (DEA)',
    initialBribeCost: 125000,
    dailyRetainer: 2800,
    monthlyCostEstimate: 84000,
    perkTitle: 'Federal Interdiction Tip-offs & Raid Leaks',
    perkDescription:
      'Diverts DEA interdictions to rival cartels, reduces hostile encounter danger by 60%, and intercepts seized drug shipments for your stash houses.',
    icon: '🦅',
    quote: 'The war on drugs is a numbers game. Point me to a competing cartel stash to bust, and your supply chains run untouched.',
  },
  {
    id: 'customs_port_director',
    name: 'Maritime Port Customs Director',
    roleTitle: 'Chief Port of Entry Cargo Inspector',
    agency: 'U.S. Customs and Border Protection (CBP)',
    initialBribeCost: 95000,
    dailyRetainer: 2000,
    monthlyCostEstimate: 60000,
    perkTitle: '100% Sea Freight & Container Cargo Clearance',
    perkDescription:
      'Pre-clears commercial shipping containers with diplomatic green seals. Grants 100% customs immunity at ports and expands all safehouse storage by +150 units.',
    icon: '🚢',
    quote: 'Ten thousand containers roll through my terminal every shift. Yours will have pre-cleared diplomatic green seal priority.',
  },
  {
    id: 'prison_warden',
    name: 'Metropolitan Penitentiary Warden',
    roleTitle: 'Federal Detention Complex Superintendent',
    agency: 'Federal Bureau of Prisons (BOP)',
    initialBribeCost: 50000,
    dailyRetainer: 1200,
    monthlyCostEstimate: 36000,
    perkTitle: 'Incarceration Immunity & Syndicate Muscle',
    perkDescription:
      'Guarantees you never remain incarcerated. If captured, coordinates immediate medical evacuation and acquittal. Recruits elite ex-con muscle.',
    icon: '🗝️',
    quote: 'Nobody stays behind bars who can afford the master key. You\'ll be out the hospital loading dock in a fresh tailored suit.',
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
  const hasJudge = hasActiveOfficial(state.player, 'federal_judge');
  const hasOffshoreLegal = state.player.corporateUpgrades?.includes('offshore_legal');
  const inSanctuary = isSovereignSanctuary(currentCityId, state.player.ownedProperties);

  if (hasAuditor) {
    ricoDelta = ricoDelta > 0 ? Math.round(ricoDelta * 0.4) : ricoDelta - 2;
  }
  if (hasJudge) {
    // Federal judge quashes subpoenas and suppresses wiretaps
    ricoDelta = ricoDelta > 0 ? Math.round(ricoDelta * 0.25) : ricoDelta - 4;
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

  // 4. Confidential Informant Snitch Progression
  const informants = getOrInitInformants(state.player);
  for (const inf of informants) {
    if (inf.status === 'active_snitch') {
      inf.daysActive += 1;
      inf.snitchProgress = Math.min(100, inf.snitchProgress + 5);
      if (inf.snitchProgress >= 100) {
        // Snitch hands indictment evidence to federal prosecutor
        newRico = Math.min(100, newRico + 10);
        state.logs.unshift({
          day: state.player.currentDay,
          city: CITY_MAP.get(inf.locationCityId)?.name ?? 'City',
          type: 'corruption',
          message: `⚠️ INFORMANT LEAK: Confidential informant "${inf.codename}" handed grand jury evidence to the ${inf.agencyTarget}! (+10% RICO Indictment Meter, now ${newRico}%).`,
          timestamp: Date.now(),
        });
        inf.snitchProgress = 50; // Reset for next cycle
      }
    } else if (inf.status === 'flipped_double_agent') {
      // Double agent feeds disinformation to the feds, decaying RICO meter
      newRico = Math.max(0, newRico - 2);
    }
  }

  state.player.ricoMeter = newRico;

  // 5. Trigger 100% RICO Indictment Asset Freeze
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

/* ==========================================================================
   CONFIDENTIAL INFORMANTS & FEDERAL WIRETAP SUBSYSTEMS
   ========================================================================== */

export const DEFAULT_INFORMANTS: FederalInformant[] = [
  {
    id: 'inf_weasel',
    codename: 'Weasel',
    name: 'Jimmy "The Snitch" Falco',
    role: 'Stash House Logistics Runner',
    locationCityId: 'new_york',
    agencyTarget: 'FBI',
    threatLevel: 'high',
    snitchProgress: 45,
    status: 'active_snitch',
    dossier:
      'Wearing a hidden wire transmitter during weekly cash collections. Providing stash addresses to FBI Organized Crime Task Force.',
    leakIntelligence: 'Turned over 3 safehouse keys and cash ledger copies.',
    bribeHushCost: 25000,
    flipDoubleAgentCost: 45000,
    contractHitCost: 18000,
    daysActive: 3,
  },
  {
    id: 'inf_canary',
    codename: 'Canary',
    name: 'Elena "The Ledger" Rostova',
    role: 'Shell Corporate Accountant',
    locationCityId: 'miami',
    agencyTarget: 'IRS-CI',
    threatLevel: 'critical',
    snitchProgress: 65,
    status: 'active_snitch',
    dossier:
      'Subpoenaed by IRS Criminal Investigation. Secretly copying double-entry bookkeeping records and bank routing numbers for the grand jury.',
    leakIntelligence: 'Handing over shell entity offshore wire transfers.',
    bribeHushCost: 50000,
    flipDoubleAgentCost: 80000,
    contractHitCost: 35000,
    daysActive: 5,
  },
  {
    id: 'inf_dockhand',
    codename: 'Dockhand',
    name: 'Mateo Cruz',
    role: 'Container Freight Crane Operator',
    locationCityId: 'los_angeles',
    agencyTarget: 'CBP',
    threatLevel: 'moderate',
    snitchProgress: 30,
    status: 'active_snitch',
    dossier:
      'Cooperating with CBP Maritime Interdiction after getting caught with undeclared cash. Logging international container serial numbers.',
    leakIntelligence: 'Flagging container arrivals at Terminal 4.',
    bribeHushCost: 15000,
    flipDoubleAgentCost: 30000,
    contractHitCost: 12000,
    daysActive: 2,
  },
  {
    id: 'inf_shadow',
    codename: 'Shadow',
    name: 'Detective Ray "Two-Tone" Miller',
    role: 'Precinct Narcotics Detective Turned Informant',
    locationCityId: 'chicago',
    agencyTarget: 'DEA',
    threatLevel: 'critical',
    snitchProgress: 75,
    status: 'active_snitch',
    dossier:
      'Compiling surveillance photographs of street corners, courier drop-offs, and luxury vehicle plates for a sealed federal indictment.',
    leakIntelligence: 'Prepared 14-count indictment draft for DEA Special Ops.',
    bribeHushCost: 60000,
    flipDoubleAgentCost: 95000,
    contractHitCost: 40000,
    daysActive: 6,
  },
];

export const DEFAULT_WIRETAPS: FederalWiretapTranscript[] = [
  {
    id: 'wire_dea_miami',
    frequency: '148.225 MHz (DEA Tactical Band Alpha)',
    surveillanceTarget: 'Biscayne Bay Speedboat Channels',
    interceptAgency: 'DEA Special Ops',
    status: 'decrypted',
    recordedDay: 1,
    cityId: 'miami',
    headline: 'Intercepted DEA Strike Frequency: Operation Gulf Falcon',
    transcript:
      '[STATIC SQUELCH] Alpha-6 to Falcon-Lead: Informant tip confirmed. Task force stepping up cutter patrols in South Florida waters. Cocaine supply lines disrupted. Wholesale price spike projected in Miami within 48 hours. [CARRIER TONE]',
    marketIntel: {
      drugId: 'cocaine',
      cityId: 'miami',
      effectDescription: 'Miami Cocaine wholesale price rising +40%',
      actionableTip: 'Stockpile in Bogota or Medellin and offload in Miami for peak margins.',
    },
    scrambleCost: 8000,
    blackMarketValue: 22000,
  },
  {
    id: 'wire_fbi_ny',
    frequency: '460.125 MHz (FBI Organized Crime UHF)',
    surveillanceTarget: 'Queens Warehouse & Safehouse Cellular Traces',
    interceptAgency: 'FBI Wiretap Division',
    status: 'intercepted',
    recordedDay: 1,
    cityId: 'new_york',
    headline: 'FBI Surveillance Wire: Safehouse Tracing Subpoena',
    transcript:
      '[AUDIO DECRYPTING] Agent Miller: We have pen-register coordinates on the Kingpin\'s stash runners. Grand jury subpoenas ready for Bank of Manhattan. Tell the Special Agent in Charge to ready the tactical assault warrants. [BEEP]',
    marketIntel: {
      cityId: 'new_york',
      effectDescription: 'New York City heat elevated; safehouse search warrants drafting',
      actionableTip: 'Deploy EMP scrambler or utilize corrupt Police Dispatcher to delay tactical raid.',
    },
    scrambleCost: 12000,
    blackMarketValue: 30000,
  },
  {
    id: 'wire_fincen_swiss',
    frequency: '853.400 MHz (FinCEN Satellite SIGINT Link)',
    surveillanceTarget: 'International SWIFT & Bearer Bond Telemetry',
    interceptAgency: 'FinCEN SIGINT',
    status: 'decrypted',
    recordedDay: 1,
    cityId: 'zurich',
    headline: 'FinCEN Telemetry: Offshore Asset Seizure Advisory',
    transcript:
      '[ENCRYPTED DATA BURST] Treasury Bulletin #892: Cross-referencing shell entity registrations against Caribbean trust holding accounts. Unregistered shell companies without FinCEN auditor clearance will be subjected to unilateral asset freeze. [DATA CHIRP]',
    marketIntel: {
      effectDescription: 'FinCEN audit sweeps escalating on shell businesses',
      actionableTip: 'Retain FinCEN Senior Regulatory Auditor to guarantee 100% audit immunity.',
    },
    scrambleCost: 15000,
    blackMarketValue: 38000,
  },
  {
    id: 'wire_cbp_pacific',
    frequency: '156.800 MHz (VHF Maritime Guard / CBP Pacific)',
    surveillanceTarget: 'Port of Long Beach & ASEAN Freight Lanes',
    interceptAgency: 'CBP Maritime Radar',
    status: 'decrypted',
    recordedDay: 1,
    cityId: 'los_angeles',
    headline: 'CBP Pacific Interdiction: Operation Pacific Shield',
    transcript:
      '[RADIO CHATTER] Sector LA/LB: X-ray scanner breakdown at Pier G. Three cargo vessels from Southeast Asia cleared without physical inspection due to port congestion. Heroin and synthetic opiates surging through customs bottleneck. [SQUELCH]',
    marketIntel: {
      drugId: 'heroin',
      cityId: 'los_angeles',
      effectDescription: 'Heroin supply glut in Los Angeles, wholesale prices dropping',
      actionableTip: 'Buy low in Los Angeles and smuggle to East Coast for 300% profit margin.',
    },
    scrambleCost: 10000,
    blackMarketValue: 25000,
  },
];

/**
 * Get or lazily initialize the player's federal informants list
 */
export function getOrInitInformants(player: PlayerState): FederalInformant[] {
  if (!player.federalInformants || player.federalInformants.length === 0) {
    player.federalInformants = JSON.parse(JSON.stringify(DEFAULT_INFORMANTS));
  }
  return player.federalInformants!;
}

/**
 * Get or lazily initialize the player's wiretap transcripts
 */
export function getOrInitWiretaps(player: PlayerState): FederalWiretapTranscript[] {
  if (!player.federalWiretaps || player.federalWiretaps.length === 0) {
    player.federalWiretaps = JSON.parse(JSON.stringify(DEFAULT_WIRETAPS));
  }
  return player.federalWiretaps!;
}

/**
 * Pay hush money to silence a confidential informant
 */
export function bribeInformant(state: GameEngineState, informantId: string): ActionResult {
  const informants = getOrInitInformants(state.player);
  const inf = informants.find((i) => i.id === informantId);
  if (!inf) return { success: false, message: 'Informant not found in registry' };

  if (inf.status !== 'active_snitch') {
    return { success: false, message: `Informant ${inf.codename} is already ${inf.status}` };
  }

  const cost = inf.bribeHushCost;
  const availableFunds = state.player.cash + (state.player.isBankFrozen ? 0 : state.player.bank);
  if (availableFunds < cost) {
    return {
      success: false,
      message: `Insufficient funds. You need $${cost.toLocaleString()} hush money to silence ${inf.codename}.`,
    };
  }

  if (state.player.cash >= cost) {
    state.player.cash -= cost;
  } else {
    const cashPortion = state.player.cash;
    state.player.cash = 0;
    state.player.bank -= cost - cashPortion;
  }

  inf.status = 'bribed_silent';
  inf.snitchProgress = 0;

  // Suppress RICO meter by 12%
  const prevRico = state.player.ricoMeter ?? 0;
  state.player.ricoMeter = Math.max(0, prevRico - 12);

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(inf.locationCityId)?.name ?? 'City',
    type: 'corruption',
    message: `🤫 HUSH MONEY DELIVERED: Dispatched $${cost.toLocaleString()} to confidential informant "${inf.codename}". Surveillance tapes destroyed (-12% RICO Meter).`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Successfully silenced informant "${inf.codename}" with $${cost.toLocaleString()} hush money.`,
  };
}

/**
 * Flip an informant into a double agent who feeds fabricated disinformation to feds
 */
export function flipInformant(state: GameEngineState, informantId: string): ActionResult {
  const informants = getOrInitInformants(state.player);
  const inf = informants.find((i) => i.id === informantId);
  if (!inf) return { success: false, message: 'Informant not found in registry' };

  if (inf.status === 'flipped_double_agent') {
    return { success: false, message: `Informant ${inf.codename} is already operating as a double agent.` };
  }

  const cost = inf.flipDoubleAgentCost;
  const availableFunds = state.player.cash + (state.player.isBankFrozen ? 0 : state.player.bank);
  if (availableFunds < cost) {
    return {
      success: false,
      message: `Insufficient funds. You need $${cost.toLocaleString()} to flip ${inf.codename} to a double agent.`,
    };
  }

  if (state.player.cash >= cost) {
    state.player.cash -= cost;
  } else {
    const cashPortion = state.player.cash;
    state.player.cash = 0;
    state.player.bank -= cost - cashPortion;
  }

  inf.status = 'flipped_double_agent';
  inf.snitchProgress = 0;

  // Immediate 18% reduction to RICO meter
  const prevRico = state.player.ricoMeter ?? 0;
  state.player.ricoMeter = Math.max(0, prevRico - 18);

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(inf.locationCityId)?.name ?? 'City',
    type: 'corruption',
    message: `🕵️ DOUBLE AGENT FLIPPED: Turned "${inf.codename}" with leverage and $${cost.toLocaleString()}! They are now feeding bogus flight logs to the ${inf.agencyTarget} (-18% RICO Meter, -2%/day decay).`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Successfully flipped "${inf.codename}" into a double agent! Now feeding disinformation to feds.`,
  };
}

/**
 * Hire an underworld contract hitman to eliminate a snitch permanently
 */
export function neutralizeInformant(state: GameEngineState, informantId: string): ActionResult {
  const informants = getOrInitInformants(state.player);
  const inf = informants.find((i) => i.id === informantId);
  if (!inf) return { success: false, message: 'Informant not found in registry' };

  if (inf.status === 'neutralized') {
    return { success: false, message: `Informant ${inf.codename} has already been eliminated.` };
  }

  const cost = inf.contractHitCost;
  if (state.player.cash < cost) {
    return {
      success: false,
      message: `You need $${cost.toLocaleString()} in clean cash to pay the hitman.`,
    };
  }

  state.player.cash -= cost;
  inf.status = 'neutralized';
  inf.snitchProgress = 0;

  // Elimination wipes the snitch risk but causes brief city heat spike (+10%)
  const cityId = inf.locationCityId;
  state.player.cityHeat = state.player.cityHeat || {};
  state.player.cityHeat[cityId] = Math.min(100, (state.player.cityHeat[cityId] || 0) + 10);

  // Suppress RICO meter by 15%
  const prevRico = state.player.ricoMeter ?? 0;
  state.player.ricoMeter = Math.max(0, prevRico - 15);

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(cityId)?.name ?? 'City',
    type: 'corruption',
    message: `🎯 CONTRACT EXECUTED: Snitch "${inf.codename}" permanently eliminated by syndicate hitmen ($${cost.toLocaleString()}). Federal grand jury investigation severed (-15% RICO).`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Contract hit executed on "${inf.codename}". Grand jury testimony neutralized!`,
  };
}

/**
 * Scramble / burn an active federal wiretap listening frequency
 */
export function scrambleWiretap(state: GameEngineState, wiretapId: string): ActionResult {
  const wiretaps = getOrInitWiretaps(state.player);
  const wire = wiretaps.find((w) => w.id === wiretapId);
  if (!wire) return { success: false, message: 'Wiretap transcript not found' };

  if (wire.scrambled) {
    return { success: false, message: 'This frequency is already scrambled and burned.' };
  }

  const hasEmp = state.player.combatConsumables && (state.player.weapons['emp_scrambler'] ?? 0) > 0;
  const cost = hasEmp ? 0 : wire.scrambleCost;

  if (cost > 0 && state.player.cash < cost) {
    return {
      success: false,
      message: `You need $${cost.toLocaleString()} cash (or an EMP Scrambler) to burn this frequency.`,
    };
  }

  if (cost > 0) {
    state.player.cash -= cost;
  }

  wire.scrambled = true;
  wire.status = 'scrambled';

  // Reduce local city heat by 15%
  const cityId = wire.cityId;
  state.player.cityHeat = state.player.cityHeat || {};
  state.player.cityHeat[cityId] = Math.max(0, (state.player.cityHeat[cityId] || 0) - 15);

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(cityId)?.name ?? 'City',
    type: 'corruption',
    message: `📡 WIRETAP SCRAMBLED: Severed federal SIGINT listening channel ${wire.frequency}! Tactical listening post disabled (-15% city heat).`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Successfully scrambled and burned federal wiretap on ${wire.frequency}!`,
  };
}

/**
 * Sell a decrypted federal wiretap transcript to underworld brokers for black-market cash
 */
export function sellWiretapTranscript(state: GameEngineState, wiretapId: string): ActionResult {
  const wiretaps = getOrInitWiretaps(state.player);
  const wire = wiretaps.find((w) => w.id === wiretapId);
  if (!wire) return { success: false, message: 'Wiretap transcript not found' };

  if (wire.sold) {
    return { success: false, message: 'This wiretap transcript has already been brokered.' };
  }

  const payout = wire.blackMarketValue;
  state.player.cash += payout;
  wire.sold = true;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(wire.cityId)?.name ?? 'City',
    type: 'corruption',
    message: `💰 WIRETAP INTEL BROKERED: Sold intercepted ${wire.interceptAgency} transcript to cartel intelligence brokers for +$${payout.toLocaleString()}!`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Brokered wiretap transcript for +$${payout.toLocaleString()} cash!`,
  };
}

