import { describe, it, expect } from 'vitest';
import { CITIES, CITY_MAP } from '../constants';
import { AIRPORT_REGISTRY } from '../flightNetwork';
import { ASEAN_WATERWAYS } from '../smugglingMapData';
import { createInitialState } from '../game';
import {
  SWISS_TIERS,
  SWISS_TIER_MAP,
  BEARER_BOND_TEMPLATES,
  CONSULAR_IMMUNITIES,
  buySwissSecurityTier,
  buyBearerBond,
  processDailyBearerBonds,
  claimMaturedBearerBonds,
  buyConsularImmunity,
  getConsularCustomsReduction,
} from '../swissBank';
import {
  SAFEHOUSE_UPGRADES,
  buyPropertyUpgrade,
  getPropertyUpgrades,
  calculateTotalPropertyStorageBonus,
  calculatePropertyRaidDefense,
} from '../safehouseUpgrades';
import {
  getAircraftState,
  applyFlightWear,
  calculateOverhaulCost,
  overhaulAircraft,
  buyAvionicsUpgrade,
  calculateAircraftFlightCost,
  AIRCRAFT_FLEET,
} from '../aviation';
import {
  calculateTerritoryInfluences,
  calculateProtectionRacketRevenue,
  collectProtectionRacket,
  getStrikeContracts,
  executeStrikeContract,
} from '../syndicateWarRoom';

describe('ASEAN Expansion & Smuggling Waterways', () => {
  const aseanCityIds = [
    'kuala_lumpur',
    'penang',
    'chiang_mai',
    'jakarta',
    'surabaya',
    'ho_chi_minh',
    'hanoi',
    'vientiane',
    'phnom_penh',
  ];

  it('registers all 9 ASEAN cities with geographic coordinates and drug modifiers', () => {
    expect(CITIES.length).toBe(39);
    for (const cityId of aseanCityIds) {
      const city = CITY_MAP.get(cityId);
      expect(city).toBeDefined();
      expect(city?.region).toBe('Asia-Pacific');
      expect(city?.flightCost).toBeGreaterThan(0);
      expect(city?.policeRisk).toBeGreaterThan(0);
      expect(Object.keys(city?.drugModifiers || {}).length).toBeGreaterThan(0);

      const airport = AIRPORT_REGISTRY[cityId];
      expect(airport).toBeDefined();
      expect(airport.iata).toHaveLength(3);
      expect(airport.coordinates.lat).not.toBe(0);
      expect(airport.coordinates.lng).not.toBe(0);
      expect(airport.directDestinations.length).toBeGreaterThan(0);
    }
  });

  it('defines strategic ASEAN smuggling waterways', () => {
    expect(ASEAN_WATERWAYS.length).toBe(3);
    const waterwayIds = ASEAN_WATERWAYS.map((w) => w.id);
    expect(waterwayIds).toContain('mekong_barge_route');
    expect(waterwayIds).toContain('malacca_container_channel');
    expect(waterwayIds).toContain('andaman_sea_speedboat_corridor');

    for (const waterway of ASEAN_WATERWAYS) {
      expect(waterway.coordinates.length).toBeGreaterThanOrEqual(3);
      expect(waterway.description.length).toBeGreaterThan(10);
    }
  });
});

describe('Swiss Offshore Private Banking & Bearer Bonds', () => {
  it('defines 5 Swiss security tiers with increasing seizure immunity', () => {
    expect(SWISS_TIERS.length).toBe(5);
    expect(SWISS_TIER_MAP.get('standard')?.seizureImmunityPercent).toBe(0);
    expect(SWISS_TIER_MAP.get('numbered')?.seizureImmunityPercent).toBe(50);
    expect(SWISS_TIER_MAP.get('cipher_vault')?.seizureImmunityPercent).toBe(80);
    expect(SWISS_TIER_MAP.get('diplomatic_escrow')?.seizureImmunityPercent).toBe(95);
    expect(SWISS_TIER_MAP.get('quantum_bastion')?.seizureImmunityPercent).toBe(100);
  });

  it('allows upgrading Swiss security tier without subtracting cash', () => {
    const state = createInitialState();
    state.player.cash = 100000;

    const res = buySwissSecurityTier(state.player, 'numbered');
    expect(res.success).toBe(true);
    expect(state.player.swissAccountTier).toBe('numbered');
    expect(state.player.cash).toBe(100000); // Do not subtract cash
  });

  it('handles bearer bonds purchasing without subtracting cash, daily yield accrual, and maturity payout', () => {
    const state = createInitialState();
    state.player.cash = 50000;
    state.player.currentDay = 5;

    // Buy 1-Day Swiss Canton Note ($10,000, 1.5% daily yield)
    const buyRes = buyBearerBond(state.player, 'short_term_1d');
    expect(buyRes.success).toBe(true);
    expect(state.player.bearerBonds?.length).toBe(1);
    expect(state.player.cash).toBe(50000); // Do not subtract cash

    const bond = state.player.bearerBonds![0];
    expect(bond.matureDay).toBe(6);

    // Cannot claim before maturity
    const prematureRes = claimMaturedBearerBonds(state.player);
    expect(prematureRes.success).toBe(false);

    // Advance to day 6 and accrue yield
    state.player.currentDay = 6;
    const { totalYieldAccrued, updatedBonds } = processDailyBearerBonds(
      state.player.bearerBonds!,
      state.player.currentDay
    );
    state.player.bearerBonds = updatedBonds;
    expect(totalYieldAccrued).toBe(150); // 1.5% of $10,000

    // Claim matured bond
    const claimRes = claimMaturedBearerBonds(state.player);
    expect(claimRes.success).toBe(true);
    expect(claimRes.claimedCash).toBe(10150); // Principal ($10,000) + Yield ($150)
    expect(state.player.cash).toBe(60150); // 50,000 original + 10,150 claimed
  });

  it('supports purchasing consular immunity passports without subtracting cash', () => {
    expect(BEARER_BOND_TEMPLATES.length).toBe(3);
    expect(CONSULAR_IMMUNITIES.length).toBe(4);
    const state = createInitialState();
    state.player.cash = 60000;

    const res = buyConsularImmunity(state.player, 'vanuatu_golden');
    expect(res.success).toBe(true);
    expect(state.player.consularImmunity).toBe('vanuatu_golden');
    expect(state.player.cash).toBe(60000); // Do not subtract cash
    expect(getConsularCustomsReduction(state.player)).toBe(0.25);
  });
});

describe('Safehouse Modular Upgrades Engine', () => {
  it('installs modular upgrades on owned safehouses', () => {
    expect(SAFEHOUSE_UPGRADES.length).toBe(5);
    const state = createInitialState();
    state.player.ownedProperties = ['penthouse'];
    state.player.cash = 100000;

    // Install Steel Doors (+$15,000, +250 Vault Storage)
    const res = buyPropertyUpgrade(state.player, 'penthouse', 'steel_doors');
    expect(res.success).toBe(true);
    expect(getPropertyUpgrades(state.player, 'penthouse')).toContain('steel_doors');
    expect(calculateTotalPropertyStorageBonus(state.player)).toBe(250);
    expect(calculatePropertyRaidDefense(state.player, 'penthouse')).toBe(0.50);

    // Duplicate installation rejected
    const dupRes = buyPropertyUpgrade(state.player, 'penthouse', 'steel_doors');
    expect(dupRes.success).toBe(false);

    // Install Decoy Radio Transmitters
    const radioRes = buyPropertyUpgrade(state.player, 'penthouse', 'decoy_radio');
    expect(radioRes.success).toBe(true);
  });
});

describe('Aviation Fleet Wear & Avionics Upgrades', () => {
  it('tracks airframe maintenance wear and overhauls', () => {
    const state = createInitialState();
    const cessna = AIRCRAFT_FLEET[0];

    const fleetState = getAircraftState(state.player, cessna.id);
    expect(fleetState.wearPercent).toBe(0);

    // Apply flight wear
    applyFlightWear(state.player, cessna.id);
    expect(fleetState.wearPercent).toBeGreaterThanOrEqual(3);

    // Calculate overhaul cost
    const cost = calculateOverhaulCost(fleetState.wearPercent);
    expect(cost).toBeGreaterThan(0);

    state.player.cash = 50000;
    const overhaulRes = overhaulAircraft(state.player, cessna.id);
    expect(overhaulRes.success).toBe(true);
    expect(fleetState.wearPercent).toBe(0);
  });

  it('installs auxiliary drop tanks and transponder spoofers', () => {
    const state = createInitialState();
    const jet = AIRCRAFT_FLEET[2]; // Learjet
    state.player.cash = 200000;

    // Install Aux Drop Tanks
    const auxRes = buyAvionicsUpgrade(state.player, jet.id, 'aux_tanks');
    expect(auxRes.success).toBe(true);
    const jetState = getAircraftState(state.player, jet.id);
    expect(jetState.hasAuxFuelTanks).toBe(true);

    // Fuel cost reduced by 50%
    const discountedCost = calculateAircraftFlightCost(jet, [], jetState);
    expect(discountedCost).toBe(Math.round(jet.fuelCost * 0.5));

    // Install Transponder Spoofer (+3 spoof flights)
    const spooferRes = buyAvionicsUpgrade(state.player, jet.id, 'transponder_spoofer');
    expect(spooferRes.success).toBe(true);
    expect(jetState.transponderSpoofsRemaining).toBe(3);
  });
});

describe('Syndicate War Room Engine', () => {
  it('evaluates global territory influence meters', () => {
    const state = createInitialState();
    state.player.syndicateReputations = {
      medellin: 50,
      golden_triangle: 30,
    };

    const influences = calculateTerritoryInfluences(state.player);
    expect(influences.length).toBe(4);
    const americas = influences.find((i) => i.region.includes('Americas'));
    expect(americas?.playerInfluence).toBeGreaterThan(40);
  });

  it('calculates and collects daily protection racket dividends', () => {
    const state = createInitialState();
    state.player.currentDay = 3;
    state.player.syndicateReputations = {
      medellin: 80, // Allied Don ($12,500)
      designer_ring: 30, // Associate ($5,000)
    };

    const { totalRevenue, breakdown } = calculateProtectionRacketRevenue(state.player);
    expect(totalRevenue).toBe(17500);
    expect(breakdown.length).toBe(2);

    const initialCash = state.player.cash;
    const collectRes = collectProtectionRacket(state.player);
    expect(collectRes.success).toBe(true);
    expect(collectRes.collectedCash).toBe(17500);
    expect(state.player.cash).toBe(initialCash + 17500);

    // Cannot collect again on the same day
    const repeatRes = collectProtectionRacket(state.player);
    expect(repeatRes.success).toBe(false);
  });

  it('executes covert hitman and black-ops strike contracts', () => {
    const state = createInitialState();
    state.player.currentCityId = 'miami';
    state.player.cash = 1000;
    state.player.health = 100;

    const contracts = getStrikeContracts(state.player);
    const miamiContract = contracts.find((c) => c.locationCityId === 'miami');
    expect(miamiContract).toBeDefined();

    const res = executeStrikeContract(state.player, miamiContract!.id);
    expect(res.success).toBe(true);
    expect(state.player.cash).toBe(1000 + miamiContract!.rewardCash);
    expect(miamiContract?.status).toBe('completed');
    expect(state.player.health).toBeLessThan(100);
  });
});
