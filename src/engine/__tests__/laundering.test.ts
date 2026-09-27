import { describe, it, expect } from 'vitest';
import {
  SHELL_BUSINESSES,
  CORPORATE_UPGRADES,
  calculateEffectiveFeeRate,
  calculateEffectiveDailyCapacity,
  calculateTotalPassiveIncome,
  calculateTotalHeatShield,
  calculateCustomsBonusFromBusinesses,
  calculateTotalShareDividends,
  calculateCorporateDiversification,
  getBusinessSharePrice,
} from '../laundering';
import {
  createInitialState,
  buyShellBusiness,
  buyBusinessShares,
  sellBusinessShares,
  buyCorporateUpgrade,
  executeBusinessLaundering,
  advanceDay,
  placeShellLimitOrder,
  cancelShellLimitOrder,
  tenderHostileShares,
  defendHostileTakeover,
  toggleBusinessDrip,
  setAllBusinessDrip,
} from '../game';

describe('Shell Businesses & Corporate Laundering Network', () => {
  it('defines commercial shell enterprises across tiers with unique perks', () => {
    expect(SHELL_BUSINESSES.length).toBe(19);
    const ids = SHELL_BUSINESSES.map((b) => b.id);
    expect(ids).toContain('laundromat');
    expect(ids).toContain('car_wash');
    expect(ids).toContain('underground_sportsbook');
    expect(ids).toContain('luxury_watch_boutique');
    expect(ids).toContain('nightclub');
    expect(ids).toContain('scrap_metal_foundry');
    expect(ids).toContain('construction_contracting');
    expect(ids).toContain('private_jet_charter');
    expect(ids).toContain('art_gallery');
    expect(ids).toContain('pharmaceutical_logistics');
    expect(ids).toContain('import_export');
    expect(ids).toContain('superyacht_brokerage');
    expect(ids).toContain('telecom_holding');
    expect(ids).toContain('panama_trust');
    expect(ids).toContain('macau_junket');
    expect(ids).toContain('crypto_farm');
    expect(ids).toContain('sovereign_wealth_front');
    expect(ids).toContain('swiss_bank_stake');
    expect(ids).toContain('sovereign_gold_depository');

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

  it('tracks moving average cost basis on incremental share purchases', () => {
    const state = createInitialState();
    state.player.cash = 100000;

    // Buy 10 shares of laundromat
    const res1 = buyBusinessShares(state, 'laundromat', 10);
    expect(res1.success).toBe(true);
    expect(state.player.businessShares?.laundromat).toBe(10);
    const price1 = getBusinessSharePrice(SHELL_BUSINESSES.find((b) => b.id === 'laundromat')!, state.player.currentDay);
    expect(state.player.businessCostBasis?.laundromat).toBe(price1);

    // Buy 10 more shares
    const res2 = buyBusinessShares(state, 'laundromat', 10);
    expect(res2.success).toBe(true);
    expect(state.player.businessShares?.laundromat).toBe(20);
    expect(state.player.businessCostBasis?.laundromat).toBe(price1);
  });

  it('calculates realized P&L on share sales and clears cost basis on full liquidation', () => {
    const state = createInitialState();
    state.player.cash = 100000;
    state.player.businessShares = { laundromat: 20 };
    state.player.businessCostBasis = { laundromat: 35 };

    // Partial sale of 10 shares
    const sell1 = sellBusinessShares(state, 'laundromat', 10);
    expect(sell1.success).toBe(true);
    expect(state.player.businessShares.laundromat).toBe(10);
    expect(state.player.businessCostBasis.laundromat).toBe(35);

    // Full liquidation of remaining 10 shares
    const sell2 = sellBusinessShares(state, 'laundromat', 10);
    expect(sell2.success).toBe(true);
    expect(state.player.businessShares.laundromat).toBe(0);
    expect(state.player.businessCostBasis.laundromat).toBeUndefined();
  });

  it('accurately calculates share dividends proportionally to total float', () => {
    const state = createInitialState();
    const laundromat = SHELL_BUSINESSES.find((b) => b.id === 'laundromat')!;
    // 5,000 shares out of 10,000 = 50% of 450 = 225
    state.player.businessShares = { laundromat: 5000 };
    const div = calculateTotalShareDividends(state.player);
    expect(div).toBe(Math.round(0.5 * laundromat.passiveDailyProfit));
  });

  it('calculates corporate diversification index across sectors with capacity and heat bonuses', () => {
    const state = createInitialState();
    // Initially 0 sectors -> D rating
    const emptyRating = calculateCorporateDiversification(state.player);
    expect(emptyRating.rating).toBe('D');
    expect(emptyRating.sectorCount).toBe(0);
    expect(emptyRating.capacityMultiplier).toBe(1.0);
    expect(emptyRating.heatReductionBonus).toBe(0);

    // Holding shares in multiple sectors
    state.player.businessShares = {
      laundromat: 500, // Consumer Services
      car_wash: 200, // Automotive Services
      art_gallery: 100, // Fine Arts & Antiquities
      telecom_holding: 300, // Telecommunications
      crypto_farm: 150, // Digital Assets & FinTech
      import_export: 250, // Maritime Logistics
      panama_trust: 100, // Offshore Wealth
    };

    const rating = calculateCorporateDiversification(state.player);
    expect(rating.sectorCount).toBe(7);
    expect(rating.rating).toBe('AAA');
    expect(rating.capacityMultiplier).toBe(1.25);
    expect(rating.heatReductionBonus).toBe(3);
  });

  it('automatically reinvests dividends via DRIP without commission and updates cost basis', () => {
    const state = createInitialState();
    state.player.currentDay = 1;
    state.player.bank = 0;
    // Set 5000 shares of macau_junket (passiveDailyProfit is high)
    const casino = SHELL_BUSINESSES.find((b) => b.id === 'macau_junket')!;
    state.player.businessShares = { [casino.id]: 5000 };
    state.player.businessCostBasis = { [casino.id]: 1000 };
    // Turn on DRIP for casino
    toggleBusinessDrip(state, casino.id);
    // Test setAllBusinessDrip
    setAllBusinessDrip(state, false);
    expect(state.player.businessDrip?.[casino.id]).toBe(false);
    setAllBusinessDrip(state, true);
    expect(state.player.businessDrip?.[casino.id]).toBe(true);

    const initialShares = state.player.businessShares[casino.id];
    advanceDay(state);

    // In advanceDay, DRIP should have purchased shares using dividend
    const newShares = state.player.businessShares[casino.id];
    expect(newShares).toBeGreaterThan(initialShares);
    // Cost basis should be updated
    expect(state.player.businessCostBasis?.[casino.id]).toBeDefined();
  });

  it('executes automated buy limit orders when spot price meets or falls below target price and allows cancellation', () => {
    const state = createInitialState();
    state.player.currentDay = 1;
    state.player.cash = 50000;
    state.player.businessShares = {};

    const b = SHELL_BUSINESSES[0];
    const spot = getBusinessSharePrice(b, 2);

    // Place a buy limit order targeting a price above or equal to spot
    const targetPrice = spot + 500;
    const res = placeShellLimitOrder(state, b.id, 'buy_limit', targetPrice, 5);
    expect(res.success).toBe(true);
    expect(state.player.shellLimitOrders?.length).toBe(1);

    // Cancel order test
    const orderId = state.player.shellLimitOrders![0].id;
    cancelShellLimitOrder(state, orderId);
    expect(state.player.shellLimitOrders![0].active).toBe(false);

    // Re-place order to test execution
    placeShellLimitOrder(state, b.id, 'buy_limit', targetPrice, 5);
    advanceDay(state);

    // Order should have triggered and executed
    const remainingOrders = state.player.shellLimitOrders?.filter((o) => o.active) ?? [];
    expect(remainingOrders.length).toBe(0);
    expect(state.player.businessShares[b.id]).toBe(5);
  });

  it('resolves hostile corporate takeovers via tender buyout or poison pill defense', () => {
    const state = createInitialState();
    state.player.cash = 20000;
    state.player.businessShares = { laundromat: 1000 };

    state.player.activeHostileTakeover = {
      id: 'test_raid_1',
      businessId: 'laundromat',
      syndicateId: 'cali',
      syndicateName: 'Cali Cartel',
      sharesAtRisk: 1000,
      offerPricePerShare: 15,
      defenseCost: 5000,
      daysLeft: 2,
      status: 'active',
    };

    // Test Defend Front
    const defendRes = defendHostileTakeover(state);
    expect(defendRes.success).toBe(true);
    expect(state.player.cash).toBe(20000 - 5000);
    expect(state.player.businessShares.laundromat).toBe(1000);
    expect(state.player.activeHostileTakeover).toBeNull();

    // Test Tender Offer
    state.player.activeHostileTakeover = {
      id: 'test_raid_2',
      businessId: 'laundromat',
      syndicateId: 'sinaloa',
      syndicateName: 'Sinaloa Syndicate',
      sharesAtRisk: 1000,
      offerPricePerShare: 20,
      defenseCost: 6000,
      daysLeft: 2,
      status: 'active',
    };

    const tenderRes = tenderHostileShares(state);
    expect(tenderRes.success).toBe(true);
    // Sold 1,000 shares at 20 = +20,000 cash
    expect(state.player.cash).toBe(15000 + 20000);
    expect(state.player.businessShares.laundromat).toBe(0);
    expect(state.player.activeHostileTakeover).toBeNull();
  });
});
