import { describe, it, expect } from 'vitest';
import {
  SHELL_BUSINESSES,
  CORPORATE_UPGRADES,
  calculateEffectiveFeeRate,
  calculateEffectiveDailyCapacity,
  calculateTotalPassiveIncome,
  calculateTotalHeatShield,
  calculateCustomsBonusFromBusinesses,
} from '../laundering';
import {
  createInitialState,
  buyShellBusiness,
  buyCorporateUpgrade,
  executeBusinessLaundering,
  advanceDay,
} from '../game';

describe('Shell Businesses & Corporate Laundering Network', () => {
  it('defines 8 commercial shell enterprises across tiers with unique perks', () => {
    expect(SHELL_BUSINESSES.length).toBe(8);
    const ids = SHELL_BUSINESSES.map((b) => b.id);
    expect(ids).toContain('laundromat');
    expect(ids).toContain('car_wash');
    expect(ids).toContain('nightclub');
    expect(ids).toContain('art_gallery');
    expect(ids).toContain('import_export');
    expect(ids).toContain('panama_trust');
    expect(ids).toContain('crypto_farm');
    expect(ids).toContain('swiss_bank_stake');

    for (const b of SHELL_BUSINESSES) {
      expect(b.purchaseCost).toBeGreaterThan(0);
      expect(b.dailyCleanCapacity).toBeGreaterThan(0);
      expect(b.feeRate).toBeGreaterThan(0);
      expect(b.feeRate).toBeLessThan(0.30);
      expect(b.passiveDailyProfit).toBeGreaterThan(0);
    }
  });

  it('defines 3 forensic retainers and corporate infrastructure upgrades', () => {
    expect(CORPORATE_UPGRADES.length).toBe(3);
    const ids = CORPORATE_UPGRADES.map((u) => u.id);
    expect(ids).toContain('cpa_firm');
    expect(ids).toContain('offshore_legal');
    expect(ids).toContain('automated_smurfing');

    for (const u of CORPORATE_UPGRADES) {
      expect(u.cost).toBeGreaterThan(0);
      expect(u.description.length).toBeGreaterThan(5);
    }
  });

  it('calculates effective fee rates and capacities with corporate upgrades', () => {
    const laundromat = SHELL_BUSINESSES.find((b) => b.id === 'laundromat')!;

    // Base fee without CPA
    const baseFee = calculateEffectiveFeeRate(laundromat, []);
    expect(baseFee).toBe(laundromat.feeRate);

    // With CPA firm: fee reduced by 0.015
    const cpaFee = calculateEffectiveFeeRate(laundromat, ['cpa_firm']);
    expect(cpaFee).toBeCloseTo(Math.max(0.005, laundromat.feeRate - 0.015), 4);

    // Base capacity without micro smurfing
    const baseCap = calculateEffectiveDailyCapacity(laundromat, []);
    expect(baseCap).toBe(laundromat.dailyCleanCapacity);

    // With automated smurfing: capacity boosted by 50%
    const smurfedCap = calculateEffectiveDailyCapacity(laundromat, ['automated_smurfing']);
    expect(smurfedCap).toBe(Math.round(laundromat.dailyCleanCapacity * 1.5));
  });

  it('calculates aggregate passive income, heat shields, and customs perks', () => {
    const owned = ['laundromat', 'nightclub', 'import_export'];

    const passive = calculateTotalPassiveIncome(owned);
    expect(passive).toBe(450 + 3500 + 22000);

    const heatShield = calculateTotalHeatShield(owned);
    expect(heatShield).toBe(1 + 3 + 5);

    // Import/Export provides 30% customs risk reduction
    const customsBonus = calculateCustomsBonusFromBusinesses(owned);
    expect(customsBonus).toBe(0.30);
  });

  it('allows buying shell businesses and corporate upgrades with cash', () => {
    const state = createInitialState();
    state.player.cash = 100000;

    const buyRes = buyShellBusiness(state, 'laundromat');
    expect(buyRes.success).toBe(true);

    expect(state.player.ownedBusinesses).toContain('laundromat');
    expect(state.player.cash).toBe(100000 - 35000);

    // Buying corporate upgrade
    const upRes = buyCorporateUpgrade(state, 'cpa_firm');
    expect(upRes.success).toBe(true);

    expect(state.player.corporateUpgrades).toContain('cpa_firm');
    expect(state.player.cash).toBe(100000 - 35000 - 45000);
  });

  it('executes clean business laundering wire transfer depositing to offshore bank', () => {
    const state = createInitialState();
    state.player.cash = 50000;
    state.player.bank = 0;
    state.player.ownedBusinesses = ['laundromat'];

    const laundromat = SHELL_BUSINESSES.find((b) => b.id === 'laundromat')!;
    const amount = 10000;
    const feeRate = laundromat.feeRate; // 0.08
    const fee = Math.round(amount * feeRate);
    const cleanAmount = amount - fee;

    const res = executeBusinessLaundering(state, 'laundromat', amount);
    expect(res.success).toBe(true);

    expect(state.player.cash).toBe(50000 - amount);
    expect(state.player.bank).toBe(cleanAmount);
    expect(state.player.launderedToday).toBe(amount);
  });

  it('credits passive clean income and cools heat during day advance', () => {
    const state = createInitialState();
    state.player.bank = 10000;
    state.player.ownedBusinesses = ['car_wash'];
    state.player.cityHeat = { new_york: 30 };
    state.player.launderedToday = 5000;

    const initialBank = state.player.bank;
    advanceDay(state);

    // Car wash gives +$1,200 passive daily bank income (+ standard 0.1% bank interest)
    const expectedBank = initialBank + 1200 + Math.floor(initialBank * 0.001);
    expect(state.player.bank).toBe(expectedBank);
    // Laundering quota reset
    expect(state.player.launderedToday).toBe(0);
    // Heat cooled by base + business shield (2)
    expect(state.player.cityHeat.new_york).toBeLessThan(30);
  });
});
