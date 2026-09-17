import { describe, it, expect } from 'vitest';
import {
  triggerTurfWar,
  triggerMacroEvent,
  processTurfWarsAndMacroEventsDaily,
  getTurfWarMultiplier,
  getMacroEventPriceMultiplier,
  getMacroCustomsMultiplier,
  MACRO_EVENT_TEMPLATES,
} from '../turfWars';
import { createInitialState } from '../game';
import { generateCityMarket } from '../economy';
import { executeCheat } from '../cheats';
import {
  WORLD_TOPOGRAPHY_CONTOURS,
  CARTEL_PATROL_VECTORS,
  STORM_HAZARD_ZONES,
  calculateDayNightTerminatorPath,
  evaluateCityHotspots,
} from '../smugglingMapData';

describe('Phase 4: Cartel Turf Wars & Dynamic Market Shocks', () => {
  it('triggers a syndicate turf war with contested hubs and price surges', () => {
    const war = triggerTurfWar('medellin', 'synthetic_chem', 5);

    expect(war.id).toContain('turf_war_medellin_vs_synthetic_chem');
    expect(war.attackerSyndicateId).toBe('medellin');
    expect(war.defenderSyndicateId).toBe('synthetic_chem');
    expect(war.contestedCityIds.length).toBeGreaterThan(0);
    expect(war.affectedDrugIds.length).toBeGreaterThan(0);
    expect(war.priceSurgeMultiplier).toBeGreaterThanOrEqual(2.2);
    expect(war.priceSurgeMultiplier).toBeLessThanOrEqual(3.5);
    expect(war.travelDangerBonus).toBe(0.35);
    expect(war.daysRemaining).toBe(war.durationDays);
    expect(war.headline).toContain('BLOODY TURF WAR');
  });

  it('triggers all 5 black swan macro events with authentic economic parameters', () => {
    const types = [
      'deep_web_takedown',
      'port_strike',
      'federal_task_force',
      'border_clashes',
      'precursor_embargo',
    ] as const;

    for (const type of types) {
      const event = triggerMacroEvent(type, 10);
      expect(event.type).toBe(type);
      expect(event.title.length).toBeGreaterThan(5);
      expect(event.headline.length).toBeGreaterThan(10);
      expect(event.daysRemaining).toBe(event.durationDays);
      expect(event.icon.length).toBeGreaterThan(0);

      const template = MACRO_EVENT_TEMPLATES[type];
      expect(event.durationDays).toBe(template.durationDays);
    }
  });

  it('calculates turf war price multiplier accurately for contested hubs and specialty drugs', () => {
    const war = triggerTurfWar('medellin', 'balkan', 1);
    const contestedCity = war.contestedCityIds[0];
    const affectedDrug = war.affectedDrugIds[0];

    const hit = getTurfWarMultiplier(contestedCity, affectedDrug, [war]);
    expect(hit.multiplier).toBe(war.priceSurgeMultiplier);
    expect(hit.war).toBe(war);

    // Unaffected city
    const missCity = getTurfWarMultiplier('tokyo', affectedDrug, [war]);
    expect(missCity.multiplier).toBe(1.0);
    expect(missCity.war).toBeNull();

    // Unaffected drug
    const missDrug = getTurfWarMultiplier(contestedCity, 'non_existent_drug', [war]);
    expect(missDrug.multiplier).toBe(1.0);
  });

  it('calculates macro event price multipliers', () => {
    const macroStrike = triggerMacroEvent('port_strike', 1);
    const affectedCity = macroStrike.affectedCityIds?.[0] || 'amsterdam';

    const strikeHit = getMacroEventPriceMultiplier(affectedCity, 'cocaine', [macroStrike]);
    expect(strikeHit.multiplier).toBe(1.85);

    const strikeMiss = getMacroEventPriceMultiplier('tokyo', 'cocaine', [macroStrike]);
    expect(strikeMiss.multiplier).toBe(1.0);
  });

  it('calculates macro customs multiplier for federal airport surge', () => {
    const taskForce = triggerMacroEvent('federal_task_force', 1);

    // New York is affected
    const usRisk = getMacroCustomsMultiplier('new_york', [taskForce]);
    expect(usRisk).toBe(2.0);

    // Tokyo is unaffected
    const intlRisk = getMacroCustomsMultiplier('tokyo', [taskForce]);
    expect(intlRisk).toBe(1.0);
  });

  it('progresses days remaining and logs ceasefire/resolution upon completion', () => {
    const state = createInitialState('classic');
    const war = triggerTurfWar('medellin', 'designer_ring', 1);
    war.daysRemaining = 1;
    state.player.activeTurfWars = [war];

    const macro = triggerMacroEvent('deep_web_takedown', 1);
    macro.daysRemaining = 1;
    state.player.activeMacroEvents = [macro];

    processTurfWarsAndMacroEventsDaily(state);

    expect(state.player.activeTurfWars).toHaveLength(0);
    expect(state.player.activeMacroEvents).toHaveLength(0);

    const warCeasefireLog = state.logs.find((l) => l.message.includes('UNDERWORLD CEASEFIRE'));
    expect(warCeasefireLog).toBeDefined();

    const macroResLog = state.logs.find((l) => l.message.includes('MACRO RESOLUTION'));
    expect(macroResLog).toBeDefined();
  });

  it('integrates turf wars and macro shocks into generateCityMarket spot prices', () => {
    const war = triggerTurfWar('medellin', 'synthetic_chem', 1);
    const contestedCity = war.contestedCityIds[0];
    const affectedDrug = war.affectedDrugIds[0];

    const { market, events } = generateCityMarket(
      contestedCity,
      1,
      undefined,
      [war],
      []
    );

    expect(market[affectedDrug]).toBeDefined();
    expect(market[affectedDrug].surge).toBe('high');
    expect(market[affectedDrug].surgeReason).toContain('TURF WAR');
    expect(events.some((e) => e.includes('TURF WAR'))).toBe(true);
  });

  it('executes turf_war and macro_event cheat commands', () => {
    const state = createInitialState('classic');
    state.player.currentCityId = 'new_york';

    const warRes = executeCheat('turf_war medellin balkan', state);
    expect(warRes.success).toBe(true);
    expect(state.player.activeTurfWars).toHaveLength(1);
    expect(state.player.activeTurfWars![0].attackerSyndicateId).toBe('medellin');

    const macroRes = executeCheat('macro_event federal_task_force', state);
    expect(macroRes.success).toBe(true);
    expect(state.player.activeMacroEvents).toHaveLength(1);
    expect(state.player.activeMacroEvents![0].type).toBe('federal_task_force');
  });

  it('evaluates active turf wars as high-severity danger hotspots on the smuggling map', () => {
    const player = createInitialState('classic').player;
    const war = triggerTurfWar('medellin', 'synthetic_chem', 1);
    player.activeTurfWars = [war];

    const hotspots = evaluateCityHotspots(player, 1);
    const warHotspot = hotspots.find((h) => h.type === 'cartel_turf_war' && war.contestedCityIds.includes(h.cityId));

    expect(warHotspot).toBeDefined();
    expect(warHotspot?.severity).toBe('danger');
    expect(warHotspot?.badgeLabel).toBe('ACTIVE TURF WAR');
  });

  it('provides detailed geographic data for topographic contours, storm hazards, and cartel patrol vectors', () => {
    expect(WORLD_TOPOGRAPHY_CONTOURS.length).toBeGreaterThanOrEqual(5);
    expect(CARTEL_PATROL_VECTORS.length).toBeGreaterThanOrEqual(4);
    expect(STORM_HAZARD_ZONES.length).toBeGreaterThanOrEqual(3);

    for (const topo of WORLD_TOPOGRAPHY_CONTOURS) {
      expect(topo.pathString.startsWith('M')).toBe(true);
    }

    for (const patrol of CARTEL_PATROL_VECTORS) {
      expect(patrol.pathString.startsWith('M')).toBe(true);
      expect(patrol.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }

    for (const storm of STORM_HAZARD_ZONES) {
      expect(storm.spiralPath.startsWith('M')).toBe(true);
      expect(storm.radius).toBeGreaterThan(20);
    }

    // Solar terminator path generator
    const terminator = calculateDayNightTerminatorPath(1, 14);
    expect(terminator.startsWith('M')).toBe(true);
    expect(terminator.endsWith('Z')).toBe(true);
  });
});
