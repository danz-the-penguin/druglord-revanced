import { ActiveTurfWar, ActiveMacroEvent, MacroEventType } from './turfWarTypes';
import { SyndicateId } from './types';
import { SYNDICATE_MAP, SYNDICATES } from './syndicates';
import { CITY_MAP } from './constants';
import { GameEngineState } from './game';

export const MACRO_EVENT_TEMPLATES: Record<
  MacroEventType,
  {
    title: string;
    headline: string;
    description: string;
    durationDays: number;
    affectedCityIds?: string[];
    affectedDrugIds?: string[];
    priceMultiplier?: number;
    customsRiskMultiplier?: number;
    courierDelayDays?: number;
    icon: string;
    severity: 'info' | 'warning' | 'danger';
  }
> = {
  deep_web_takedown: {
    title: 'Darknet Bazaar Takedown ("Operation Dark Shroud")',
    headline: 'FBI & Interpol seize major darknet narcotics marketplaces worldwide.',
    description: 'Street demand for party synthetics surges as online anonymous supply lines are dismantled. Prices skyrocket +150%!',
    durationDays: 4,
    affectedDrugIds: ['ecstasy', 'lsd', 'speed', 'special_k', 'mda', 'dmt', 'mushrooms'],
    priceMultiplier: 2.5,
    icon: '🌐',
    severity: 'warning',
  },
  port_strike: {
    title: 'Rotterdam & Antwerp Maritime Longshoremen Strike',
    headline: 'European commercial container terminals shut down amidst dockworker strike.',
    description: 'Cargo ships anchored offshore. Industrial chemical precursors and transshipped contraband suffer catastrophic supply shortages.',
    durationDays: 5,
    affectedCityIds: ['amsterdam', 'paris', 'london', 'berlin', 'frankfurt', 'zurich'],
    priceMultiplier: 1.85,
    courierDelayDays: 2,
    icon: '⚓',
    severity: 'warning',
  },
  federal_task_force: {
    title: 'Operation Iron Talon: Federal Interagency Airport Surge',
    headline: 'DEA & Homeland Security deploy mobile canine teams & X-ray scanners to all US hubs.',
    description: 'Customs inspections doubled at all US commercial passenger airports. Contraband smuggling risk at historic highs!',
    durationDays: 5,
    affectedCityIds: ['new_york', 'miami', 'los_angeles', 'detroit'],
    customsRiskMultiplier: 2.0,
    icon: '🚨',
    severity: 'danger',
  },
  border_clashes: {
    title: 'Cross-Border Cartel War & Militarized Checkpoints',
    headline: 'Paramilitary firefights erupt along border transshipment crossings.',
    description: 'Heavily armed blockades on northern supply routes. Cocaine and synthetic methamphetamine prices spike by +200%!',
    durationDays: 4,
    affectedCityIds: ['tijuana', 'mexico_city', 'los_angeles', 'bogota', 'panama_city'],
    affectedDrugIds: ['cocaine', 'crack', 'ice', 'fentanyl'],
    priceMultiplier: 3.0,
    icon: '⚔️',
    severity: 'danger',
  },
  precursor_embargo: {
    title: 'Global INCB Precursor Chemical Sanctions',
    headline: 'UN International Narcotics Control Board places embargo on chemical solvents.',
    description: 'Strict supply quotas on Ephedrine, Acetic Anhydride, and Reagents. Global lab production costs double.',
    durationDays: 5,
    priceMultiplier: 1.75,
    icon: '⚗️',
    severity: 'warning',
  },
};

/**
 * Creates and initiates a Cartel Turf War between two syndicates.
 */
export function triggerTurfWar(
  attackerId: SyndicateId,
  defenderId: SyndicateId,
  startDay: number
): ActiveTurfWar {
  const attacker = SYNDICATE_MAP.get(attackerId) || SYNDICATES[0];
  const defender = SYNDICATE_MAP.get(defenderId) || SYNDICATES[1];

  // Contested cities include overlapping territories and hub metropolises
  const potentialCities: Record<string, string[]> = {
    medellin: ['medellin', 'bogota', 'miami', 'panama_city', 'new_york'],
    golden_triangle: ['bangkok', 'hong_kong', 'singapore', 'tokyo', 'vancouver'],
    synthetic_chem: ['tijuana', 'los_angeles', 'mexico_city', 'berlin', 'detroit'],
    designer_ring: ['amsterdam', 'london', 'ibiza', 'zurich', 'paris'],
    balkan: ['istanbul', 'frankfurt', 'madrid', 'lagos', 'dubai'],
  };

  const citiesA = potentialCities[attackerId] || ['miami'];
  const citiesB = potentialCities[defenderId] || ['bogota'];
  const contested = Array.from(new Set([...citiesA.slice(0, 2), ...citiesB.slice(0, 2)]));

  const affectedDrugs = Array.from(
    new Set([...attacker.specialtyDrugs, ...defender.specialtyDrugs])
  );

  const durationDays = Math.floor(4 + Math.random() * 4); // 4 - 7 days
  const priceSurgeMultiplier = Math.round((2.2 + Math.random() * 1.3) * 10) / 10; // 2.2x to 3.5x (+120% to +250%)

  const cityNames = contested.map((id) => CITY_MAP.get(id)?.name ?? id).join(', ');

  return {
    id: `turf_war_${attackerId}_vs_${defenderId}_day_${startDay}`,
    attackerSyndicateId: attackerId,
    defenderSyndicateId: defenderId,
    attackerName: attacker.name,
    defenderName: defender.name,
    contestedCityIds: contested,
    startDay,
    durationDays,
    daysRemaining: durationDays,
    priceSurgeMultiplier,
    travelDangerBonus: 0.35,
    headline: `BLOODY TURF WAR: ${attacker.name} vs. ${defender.name}!`,
    description: `Armed clashes for dominance over ${cityNames}. Contraband prices surged by +${Math.round((priceSurgeMultiplier - 1) * 100)}% across contested cities!`,
    affectedDrugIds: affectedDrugs,
  };
}

/**
 * Creates and initiates a Black Swan Macro Event.
 */
export function triggerMacroEvent(
  type: MacroEventType,
  startDay: number
): ActiveMacroEvent {
  const template = MACRO_EVENT_TEMPLATES[type];
  return {
    id: `macro_${type}_day_${startDay}`,
    type,
    title: template.title,
    headline: template.headline,
    description: template.description,
    startDay,
    durationDays: template.durationDays,
    daysRemaining: template.durationDays,
    affectedCityIds: template.affectedCityIds,
    affectedDrugIds: template.affectedDrugIds,
    priceMultiplier: template.priceMultiplier,
    customsRiskMultiplier: template.customsRiskMultiplier,
    courierDelayDays: template.courierDelayDays,
    icon: template.icon,
    severity: template.severity,
  };
}

/**
 * Daily progression of active turf wars and macro shocks.
 */
export function processTurfWarsAndMacroEventsDaily(state: GameEngineState): void {
  const player = state.player;
  const currentDay = player.currentDay;
  const currentCityName = CITY_MAP.get(player.currentCityId)?.name ?? player.currentCityId;

  // 1. Progress active turf wars
  if (player.activeTurfWars && player.activeTurfWars.length > 0) {
    const updatedWars: ActiveTurfWar[] = [];
    for (const war of player.activeTurfWars) {
      war.daysRemaining -= 1;
      if (war.daysRemaining > 0) {
        updatedWars.push(war);
      } else {
        // War ends / Ceasefire signed
        state.logs.unshift({
          day: currentDay,
          city: currentCityName,
          type: 'event',
          message: `🕊️ UNDERWORLD CEASEFIRE: The armed turf war between ${war.attackerName} and ${war.defenderName} has ended. Street prices normalizing.`,
          timestamp: Date.now(),
        });
      }
    }
    player.activeTurfWars = updatedWars;
  }

  // 2. Progress active macro events
  if (player.activeMacroEvents && player.activeMacroEvents.length > 0) {
    const updatedEvents: ActiveMacroEvent[] = [];
    for (const ev of player.activeMacroEvents) {
      ev.daysRemaining -= 1;
      if (ev.daysRemaining > 0) {
        updatedEvents.push(ev);
      } else {
        state.logs.unshift({
          day: currentDay,
          city: currentCityName,
          type: 'event',
          message: `📰 MACRO RESOLUTION: ${ev.title} has concluded. Market conditions stabilizing.`,
          timestamp: Date.now(),
        });
      }
    }
    player.activeMacroEvents = updatedEvents;
  }

  // 3. Spontaneous Turf War Roll (~10% daily chance if no active war)
  if (!player.activeTurfWars || player.activeTurfWars.length === 0) {
    if (Math.random() < 0.10 && currentDay >= 4) {
      // Pick two random distinct syndicates
      const idx1 = Math.floor(Math.random() * SYNDICATES.length);
      let idx2 = Math.floor(Math.random() * SYNDICATES.length);
      if (idx2 === idx1) idx2 = (idx1 + 1) % SYNDICATES.length;

      const newWar = triggerTurfWar(SYNDICATES[idx1].id, SYNDICATES[idx2].id, currentDay);
      if (!player.activeTurfWars) player.activeTurfWars = [];
      player.activeTurfWars.push(newWar);

      state.logs.unshift({
        day: currentDay,
        city: currentCityName,
        type: 'combat',
        message: `⚔️ ${newWar.headline} ${newWar.description}`,
        timestamp: Date.now(),
      });
    }
  }

  // 4. Spontaneous Black Swan Macro Shock Roll (~8% daily chance if fewer than 2 active)
  const activeMacroCount = player.activeMacroEvents?.length ?? 0;
  if (activeMacroCount < 2 && currentDay >= 5) {
    if (Math.random() < 0.08) {
      const types: MacroEventType[] = [
        'deep_web_takedown',
        'port_strike',
        'federal_task_force',
        'border_clashes',
        'precursor_embargo',
      ];
      // Pick a type not currently active
      const availableTypes = types.filter(
        (t) => !player.activeMacroEvents?.some((ev) => ev.type === t)
      );
      if (availableTypes.length > 0) {
        const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const newMacro = triggerMacroEvent(selectedType, currentDay);
        if (!player.activeMacroEvents) player.activeMacroEvents = [];
        player.activeMacroEvents.push(newMacro);

        state.logs.unshift({
          day: currentDay,
          city: currentCityName,
          type: 'event',
          message: `${newMacro.icon} [BREAKING MACRO SHOCK]: ${newMacro.title} — ${newMacro.headline} ${newMacro.description}`,
          timestamp: Date.now(),
        });
      }
    }
  }
}

/**
 * Checks if a city and drug are affected by an active turf war, returning the price multiplier.
 */
export function getTurfWarMultiplier(
  cityId: string,
  drugId: string,
  activeTurfWars: ActiveTurfWar[] = []
): { multiplier: number; war: ActiveTurfWar | null } {
  for (const war of activeTurfWars) {
    if (war.contestedCityIds.includes(cityId) && war.affectedDrugIds.includes(drugId)) {
      return { multiplier: war.priceSurgeMultiplier, war };
    }
  }
  return { multiplier: 1.0, war: null };
}

/**
 * Checks if a city and drug are affected by an active macro event, returning the price multiplier.
 */
export function getMacroEventPriceMultiplier(
  cityId: string,
  drugId: string,
  activeMacroEvents: ActiveMacroEvent[] = []
): { multiplier: number; event: ActiveMacroEvent | null } {
  for (const ev of activeMacroEvents) {
    if (!ev.priceMultiplier) continue;
    const cityMatches = !ev.affectedCityIds || ev.affectedCityIds.includes(cityId);
    const drugMatches = !ev.affectedDrugIds || ev.affectedDrugIds.includes(drugId);
    if (cityMatches && drugMatches) {
      return { multiplier: ev.priceMultiplier, event: ev };
    }
  }
  return { multiplier: 1.0, event: null };
}

/**
 * Calculates customs risk multiplier from active macro shocks (e.g. Federal Task Force).
 */
export function getMacroCustomsMultiplier(
  cityId: string,
  activeMacroEvents: ActiveMacroEvent[] = []
): number {
  let multiplier = 1.0;
  for (const ev of activeMacroEvents) {
    if (ev.customsRiskMultiplier) {
      const cityMatches = !ev.affectedCityIds || ev.affectedCityIds.includes(cityId);
      if (cityMatches) {
        multiplier *= ev.customsRiskMultiplier;
      }
    }
  }
  return multiplier;
}
