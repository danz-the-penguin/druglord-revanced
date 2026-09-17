import { describe, it, expect, vi } from 'vitest';
import {
  createInitialState,
  buyDrug,
  sellDrug,
  depositBank,
  withdrawBank,
  advanceDay,
  repayLoan,
  getEarlyRepayDetails,
  retireEmpire,
  purchaseCleanIdentity,
  getPreviousRank,
  getCarryingCapacity,
  getInventoryTotalUnits,
  getCityHeat,
  modifyCityHeat,
  getPlayerHeatReduction,
  bribePolice,
  travelToCity,
  depositToVault,
  withdrawFromVault,
  getCityVaultUnits,
  getCityVaultCapacity,
  getTotalVaultUnitsAllCities,
  getShipmentCost,
  dispatchCourier,
  generateIntelTips,
  purchaseIntelTip,
} from '../game';

describe('Game Engine State Machine', () => {
  it('initializes Day 1 with correct starting conditions', () => {
    const state = createInitialState();
    expect(state.player.currentDay).toBe(1);
    expect(state.player.cash).toBe(1000);
    expect(state.player.debt).toBe(1000);
    expect(state.player.health).toBe(100);
    expect(state.player.currentRankId).toBe('wannabe');
    expect(state.player.currentCityId).toBe('new_york');
    expect(state.player.maxDays).toBe(30);
  });

  it('handles buying within capacity and cash limits, calculating average cost basis', () => {
    const state = createInitialState();
    // Give enough cash to buy weed/pot
    state.player.cash = 1000;
    state.market['pot'] = { drugId: 'pot', price: 50, availableUnits: 50 };

    const result = buyDrug(state, 'pot', 5);
    expect(result.success).toBe(true);
    expect(state.player.cash).toBe(750);
    expect(state.player.inventory['pot'].units).toBe(5);
    expect(state.player.inventory['pot'].avgCost).toBe(50);

    // Buy 5 more at different price to verify weighted average cost
    state.market['pot'].price = 100;
    const result2 = buyDrug(state, 'pot', 5);
    expect(result2.success).toBe(true);
    expect(state.player.cash).toBe(250);
    expect(state.player.inventory['pot'].units).toBe(10);
    // (5 * 50 + 5 * 100) / 10 = 75
    expect(state.player.inventory['pot'].avgCost).toBe(75);

    // Try to exceed Wannabe capacity (10 units)
    const result3 = buyDrug(state, 'pot', 1);
    expect(result3.success).toBe(false);
    expect(result3.message).toContain('capacity');
  });

  it('handles selling and calculates profit correctly', () => {
    const state = createInitialState();
    state.player.cash = 1000;
    state.market['pot'] = { drugId: 'pot', price: 50, availableUnits: 50 };
    buyDrug(state, 'pot', 10);

    // Sell at double price
    state.market['pot'].price = 100;
    const sellRes = sellDrug(state, 'pot', 10);
    expect(sellRes.success).toBe(true);
    expect(state.player.cash).toBe(500 + 1000);
    expect(state.player.inventory['pot']).toBeUndefined();
  });

  it('compounds debt daily based on loan shark interest rate', () => {
    const state = createInitialState();
    expect(state.player.debt).toBe(1000);

    advanceDay(state);
    // 10% on 1000 = 1100
    expect(state.player.debt).toBe(1100);

    advanceDay(state);
    // 10% on 1100 = 1210
    expect(state.player.debt).toBe(1210);
  });

  it('promotes player to higher rank when cash is held for 3 consecutive days', () => {
    const state = createInitialState();
    // Give player enough cash for Small-time Operator ($5,000)
    state.player.cash = 10000;
    state.player.debt = 0; // pay off debt so wealth is $10k

    expect(state.player.currentRankId).toBe('wannabe');

    advanceDay(state); // Day 1 hold
    expect(state.player.daysHoldingRankCash).toBe(1);
    expect(state.player.currentRankId).toBe('wannabe');

    advanceDay(state); // Day 2 hold
    expect(state.player.daysHoldingRankCash).toBe(2);
    expect(state.player.currentRankId).toBe('wannabe');

    advanceDay(state); // Day 3 hold -> PROMOTION!
    expect(state.player.currentRankId).toBe('small_time_operator');
    expect(state.player.maxDays).toBe(35); // +5 bonus days
  });

  it('allows safe banking deposits and withdrawals', () => {
    const state = createInitialState();
    state.player.cash = 5000;

    depositBank(state, 3000);
    expect(state.player.cash).toBe(2000);
    expect(state.player.bank).toBe(3000);

    withdrawBank(state, 1000);
    expect(state.player.cash).toBe(3000);
    expect(state.player.bank).toBe(2000);
  });

  describe('Loan Shark & Early Payment Charges', () => {
    it('calculates early payoff details accurately', () => {
      const state = createInitialState();
      // Buddles has 10% fee and 14 days
      expect(state.player.loanDaysLeft).toBe(14);
      expect(state.player.debt).toBe(1000);

      const details = getEarlyRepayDetails(state.player, 500);
      expect(details.actualPayment).toBe(500);
      expect(details.isEarly).toBe(true);
      expect(details.feeRate).toBe(0.10);
      expect(details.earlyFee).toBe(50);
      expect(details.totalCashRequired).toBe(550);
    });

    it('rejects repayment if player lacks cash to cover debt + early payment charge', () => {
      const state = createInitialState();
      // On Day 1, player has $1000 cash and $1000 debt with Buddles (10% early fee = $100)
      // Total required to clear all $1000 debt is $1100
      expect(state.player.cash).toBe(1000);
      expect(state.player.debt).toBe(1000);

      const res = repayLoan(state, 1000);
      expect(res.success).toBe(false);
      expect(res.message).toContain('early payment charge');
      expect(state.player.cash).toBe(1000);
      expect(state.player.debt).toBe(1000);
    });

    it('successfully repays debt early and deducts early payment charge when player has sufficient cash', () => {
      const state = createInitialState();
      state.player.cash = 2000;
      state.player.debt = 1000;
      state.player.loanSharkId = 'buddles';
      state.player.loanDaysLeft = 10;

      // Repaying $1000 debt early with Buddles: 10% of 1000 = $100 fee.
      // Total cash deducted = $1100.
      const res = repayLoan(state, 1000);
      expect(res.success).toBe(true);
      expect(res.message).toContain('early payment charge');
      expect(state.player.debt).toBe(0);
      expect(state.player.cash).toBe(900); // 2000 - 1100
      expect(state.player.loanSharkId).toBeNull();
      expect(state.player.loanDaysLeft).toBe(0);
      expect(state.logs[0].message).toContain('early payment charge');
    });

    it('does NOT charge early payment fee if loan has reached its term (loanDaysLeft <= 0)', () => {
      const state = createInitialState();
      state.player.cash = 1000;
      state.player.debt = 1000;
      state.player.loanSharkId = 'buddles';
      state.player.loanDaysLeft = 0; // Term expired

      const res = repayLoan(state, 1000);
      expect(res.success).toBe(true);
      expect(res.message).toBe('Paid $1,000 toward debt.');
      expect(state.player.debt).toBe(0);
      expect(state.player.cash).toBe(0); // Exactly $1000 deducted, $0 fee
    });
  });

  describe('Phase 2: Lifespan Freedom & Duration Modes', () => {
    it('initializes game in different duration modes correctly', () => {
      const classic = createInitialState('classic');
      expect(classic.player.maxDays).toBe(30);
      expect(classic.player.isEndless).toBe(false);
      expect(classic.player.gameDurationMode).toBe('classic');

      const quarter = createInitialState('quarter');
      expect(quarter.player.maxDays).toBe(90);
      expect(quarter.player.isEndless).toBe(false);
      expect(quarter.player.gameDurationMode).toBe('quarter');

      const year = createInitialState('year');
      expect(year.player.maxDays).toBe(365);
      expect(year.player.isEndless).toBe(false);
      expect(year.player.gameDurationMode).toBe('year');

      const endless = createInitialState('endless');
      expect(endless.player.maxDays).toBe(999999);
      expect(endless.player.isEndless).toBe(true);
      expect(endless.player.gameDurationMode).toBe('endless');
    });

    it('allows player to survive past day 30 in Endless Mode without calendar game over', () => {
      const state = createInitialState('endless');
      state.player.currentDay = 30;
      state.player.debt = 0; // eliminate loan shark attack for test

      advanceDay(state);
      expect(state.player.currentDay).toBe(31);
      expect(state.player.isGameOver).toBe(false);

      state.player.currentDay = 365;
      advanceDay(state);
      expect(state.player.currentDay).toBe(366);
      expect(state.player.isGameOver).toBe(false);
    });

    it('enforces calendar game over at maxDays in timed modes', () => {
      const state = createInitialState('classic');
      state.player.currentDay = 30;
      state.player.maxDays = 30;
      state.player.debt = 0;

      advanceDay(state);
      expect(state.player.currentDay).toBe(31);
      expect(state.player.isGameOver).toBe(true);
      expect(state.player.gameOverReason).toContain('Time limit reached');
    });

    it('allows voluntary retirement at any time and sets victory dossier', () => {
      const state = createInitialState('classic');
      state.player.cash = 250000;
      state.player.bank = 500000;
      state.player.debt = 0;
      state.player.currentDay = 18;

      const res = retireEmpire(state);
      expect(res.success).toBe(true);
      expect(state.player.isGameOver).toBe(true);
      expect(state.player.gameOverReason).toContain('Voluntary Retirement');
      expect(state.player.gameOverReason).toContain('750,000');
      expect(state.logs.some((l) => l.message.includes('VOLUNTARY RETIREMENT'))).toBe(true);
    });

    it('extends lifespan by +30 days when purchasing clean identity in timed modes', () => {
      const state = createInitialState('classic');
      state.player.maxDays = 30;
      state.player.cash = 60000;
      state.player.cleanIdentityRenewals = 0;

      const res = purchaseCleanIdentity(state);
      expect(res.success).toBe(true);
      expect(state.player.maxDays).toBe(60);
      expect(state.player.cleanIdentityRenewals).toBe(1);
      expect(state.player.cash).toBe(10000); // 60000 - 50000

      // Second purchase costs 50,000 + 1 * 25,000 = 75,000
      state.player.cash = 100000;
      const res2 = purchaseCleanIdentity(state);
      expect(res2.success).toBe(true);
      expect(state.player.maxDays).toBe(90);
      expect(state.player.cleanIdentityRenewals).toBe(2);
      expect(state.player.cash).toBe(25000); // 100000 - 75000
    });

    it('blocks clean identity purchase when in endless mode', () => {
      const state = createInitialState('endless');
      state.player.cash = 500000;
      const res = purchaseCleanIdentity(state);
      expect(res.success).toBe(false);
      expect(res.message).toContain('Endless mode');
    });
  });

  describe('Phase 2: Dynamic Rank Downward Mobility & Insolvency System', () => {
    it('returns null previous rank for wannabe', () => {
      const state = createInitialState();
      expect(state.player.currentRankId).toBe('wannabe');
      expect(getPreviousRank(state.player)).toBeNull();
    });

    it('returns correct previous rank for higher ranks', () => {
      const state = createInitialState();
      state.player.currentRankId = 'small_time_operator';
      expect(getPreviousRank(state.player)?.id).toBe('wannabe');

      state.player.currentRankId = 'dealer';
      expect(getPreviousRank(state.player)?.id).toBe('small_time_operator');

      state.player.currentRankId = 'drug_lord';
      expect(getPreviousRank(state.player)?.id).toBe('distributor');
    });

    it('tracks 3-day insolvency countdown and issues warnings before demoting', () => {
      const state = createInitialState();
      // Set to Dealer (requires $40,000 net worth)
      state.player.currentRankId = 'dealer';
      state.player.cash = 1000; // Net worth dropped to $1,000!
      state.player.debt = 0;
      state.player.daysInsolvent = 0;

      // Day 1 of insolvency
      advanceDay(state);
      expect(state.player.daysInsolvent).toBe(1);
      expect(state.player.currentRankId).toBe('dealer');
      expect(state.logs.some((l) => l.message.includes('INSOLVENCY WARNING - Day 1/3'))).toBe(true);

      // Day 2 of insolvency
      advanceDay(state);
      expect(state.player.daysInsolvent).toBe(2);
      expect(state.player.currentRankId).toBe('dealer');
      expect(state.logs.some((l) => l.message.includes('FINAL DEMOTION NOTICE - Day 2/3'))).toBe(true);

      // Day 3 of insolvency -> DEMOTION TRIGGERED!
      advanceDay(state);
      expect(state.player.currentRankId).toBe('small_time_operator');
      expect(state.player.daysInsolvent).toBe(0);
      expect(state.logs.some((l) => l.message.includes('DEMOTED to Small-time Operator'))).toBe(true);
    });

    it('resets daysInsolvent if net worth recovers above rank requirement before Day 3', () => {
      const state = createInitialState();
      state.player.currentRankId = 'dealer';
      state.player.cash = 5000;
      state.player.debt = 0;

      advanceDay(state); // Day 1 insolvent
      expect(state.player.daysInsolvent).toBe(1);

      advanceDay(state); // Day 2 insolvent
      expect(state.player.daysInsolvent).toBe(2);

      // Player strikes big deal, net worth exceeds $40k
      state.player.cash = 50000;
      advanceDay(state);
      expect(state.player.daysInsolvent).toBe(0);
      expect(state.player.currentRankId).toBe('dealer'); // Kept their rank!
    });

    it('downsizes container on demotion and scavengers loot excess cargo if no safehouse', () => {
      const state = createInitialState();
      // Small-time Operator has 25 units capacity
      state.player.currentRankId = 'small_time_operator';
      state.player.cash = 100;
      state.player.debt = 0;
      state.player.daysInsolvent = 2; // on brink of demotion to wannabe (capacity 10)

      // Player is currently holding 20 units of pot (fits in 25, but exceeds wannabe's 10)
      state.player.inventory['pot'] = { drugId: 'pot', units: 20, avgCost: 50 };
      expect(getInventoryTotalUnits(state.player)).toBe(20);

      // Advance to Day 3 -> demoted to wannabe
      advanceDay(state);
      expect(state.player.currentRankId).toBe('wannabe');
      expect(getCarryingCapacity(state.player)).toBe(10);
      // Excess 10 units looted by scavengers
      expect(getInventoryTotalUnits(state.player)).toBe(10);
      expect(state.player.inventory['pot'].units).toBe(10);
      expect(
        state.logs.some((l) => l.message.includes('Street scavengers and rival dealers looted 10 units'))
      ).toBe(true);
    });

    it('protects overflow cargo in safehouse vault on rank demotion', () => {
      const state = createInitialState();
      state.player.currentRankId = 'small_time_operator';
      state.player.cash = 100;
      state.player.debt = 0;
      state.player.daysInsolvent = 2;

      // Player owns safehouse (suburban_safehouse adds +250 vault stash)
      state.player.ownedProperties = ['suburban_safehouse'];

      // Player is holding 20 units of pot
      state.player.inventory['pot'] = { drugId: 'pot', units: 20, avgCost: 50 };

      // Advance to Day 3 -> demoted to wannabe (capacity: 10 + 25 = 35)
      advanceDay(state);
      expect(state.player.currentRankId).toBe('wannabe');
      expect(state.player.inventory['pot'].units).toBe(20); // Not looted!
      expect(state.logs[0].message).not.toContain('looted');
    });
  });

  describe('Phase 3: Police Heat & Customs Threat Engine', () => {
    it('initializes city heat at 0 and bounds heat between 0 and 100', () => {
      const state = createInitialState();
      expect(getCityHeat(state.player, 'new_york')).toBe(0);

      modifyCityHeat(state, 'new_york', 50);
      expect(getCityHeat(state.player, 'new_york')).toBe(50);

      modifyCityHeat(state, 'new_york', 100);
      expect(getCityHeat(state.player, 'new_york')).toBe(100); // capped at 100

      modifyCityHeat(state, 'new_york', -200);
      expect(getCityHeat(state.player, 'new_york')).toBe(0); // clamped at 0
    });

    it('applies property heat shield mitigation to incoming heat increments', () => {
      const state = createInitialState();
      // Penthouse suite has 30% heat reduction
      state.player.ownedProperties = ['penthouse_suite'];
      expect(getPlayerHeatReduction(state.player)).toBe(0.30);

      modifyCityHeat(state, 'new_york', 50);
      // 50 * (1 - 0.30) = 35
      expect(getCityHeat(state.player, 'new_york')).toBe(35);
    });

    it('generates local city heat when buying contraband', () => {
      const state = createInitialState();
      state.player.cash = 50000;
      state.player.currentRankId = 'dealer'; // 100 units capacity
      state.market['cocaine'] = { drugId: 'cocaine', price: 1000, availableUnits: 50 };

      // Buy 20 units of cocaine
      buyDrug(state, 'cocaine', 20);
      const heat = getCityHeat(state.player, 'new_york');
      expect(heat).toBeGreaterThan(0);
    });

    it('cools down heat across all cities on advanceDay', () => {
      const state = createInitialState();
      modifyCityHeat(state, 'new_york', 40);
      modifyCityHeat(state, 'miami', 30);
      expect(getCityHeat(state.player, 'new_york')).toBe(40);
      expect(getCityHeat(state.player, 'miami')).toBe(30);

      advanceDay(state);
      expect(getCityHeat(state.player, 'new_york')).toBeLessThan(40);
      expect(getCityHeat(state.player, 'miami')).toBe(28); // 30 - 2
    });

    it('allows player to bribe police to scrub investigation dossiers', () => {
      const state = createInitialState();
      state.player.cash = 20000;
      modifyCityHeat(state, 'new_york', 60);
      expect(getCityHeat(state.player, 'new_york')).toBe(60);

      const res = bribePolice(state);
      expect(res.success).toBe(true);
      expect(getCityHeat(state.player, 'new_york')).toBe(10); // 60 - 50 = 10
      expect(state.player.cash).toBeLessThan(20000);
      expect(state.logs.some((l) => l.message.includes('POLICE BRIBE'))).toBe(true);
    });

    it('rejects police bribe when city heat is already 0%', () => {
      const state = createInitialState();
      expect(getCityHeat(state.player, 'new_york')).toBe(0);

      const res = bribePolice(state);
      expect(res.success).toBe(false);
      expect(res.message).toContain('0%');
    });

    it('triggers DEA Federal Strike Force raid when advancing day at critical heat with contraband', () => {
      const state = createInitialState();
      state.player.currentRankId = 'dealer';
      state.player.inventory['pot'] = { drugId: 'pot', units: 15, avgCost: 50 };
      // Set heat to 100% (extreme critical)
      modifyCityHeat(state, 'new_york', 100);
      state.player.debt = 0; // prevent loan shark overdue encounter

      advanceDay(state);
      // At 100% heat, raid chance is (100 - 65) / 100 = 35%. Let's test until encounter or verify logic
      expect(getCityHeat(state.player, 'new_york')).toBeGreaterThanOrEqual(70);
    });

    it('handles flight travel and accounts for departure city heat on customs interdiction', () => {
      const state = createInitialState();
      state.player.cash = 10000;
      state.player.inventory['pot'] = { drugId: 'pot', units: 10, avgCost: 50 };
      modifyCityHeat(state, 'new_york', 80); // High departure heat

      const res = travelToCity(state, 'miami');
      expect(res.success).toBe(true);
      expect(state.player.currentCityId).toBe('miami');
    });
  });

  describe('Phase 4: Multi-City Stash Vaults, Couriers & Informant Terminal', () => {
    it('deposits contraband into local safehouse vault and tracks capacity', () => {
      const state = createInitialState();
      state.player.inventory['cocaine'] = { drugId: 'cocaine', units: 10, avgCost: 20000 };

      // Base vault capacity is 25 units
      expect(getCityVaultCapacity(state.player, 'new_york')).toBe(25);
      expect(getCityVaultUnits(state.player, 'new_york')).toBe(0);

      // Deposit 4 units
      const res = depositToVault(state, 'cocaine', 4);
      expect(res.success).toBe(true);
      expect(state.player.inventory['cocaine'].units).toBe(6);
      expect(state.player.vaults['new_york']['cocaine']).toBe(4);
      expect(getCityVaultUnits(state.player, 'new_york')).toBe(4);
      expect(getTotalVaultUnitsAllCities(state.player)).toBe(4);

      // Try depositing more than available in pocket
      const res2 = depositToVault(state, 'cocaine', 10);
      expect(res2.success).toBe(false);
      expect(res2.message).toContain('do not have');

      // Try depositing beyond vault capacity (need 25 - 4 = 21 space left)
      state.player.inventory['pot'] = { drugId: 'pot', units: 50, avgCost: 100 };
      const res3 = depositToVault(state, 'pot', 30);
      expect(res3.success).toBe(false);
      expect(res3.message).toContain('Vault capacity exceeded');
    });

    it('withdraws contraband from safehouse vault into pocket inventory respecting capacity', () => {
      const state = createInitialState();
      state.player.currentRankId = 'wannabe'; // 10 capacity
      state.player.vaults = {
        new_york: {
          cocaine: 5,
        },
      };

      // Withdraw 3 units into pocket
      const res = withdrawFromVault(state, 'cocaine', 3);
      expect(res.success).toBe(true);
      expect(state.player.inventory['cocaine'].units).toBe(3);
      expect(state.player.vaults['new_york']['cocaine']).toBe(2);

      // Fill pocket to capacity
      state.player.inventory['pot'] = { drugId: 'pot', units: 7, avgCost: 100 }; // 3 + 7 = 10 capacity full
      const res2 = withdrawFromVault(state, 'cocaine', 1);
      expect(res2.success).toBe(false);
      expect(res2.message).toContain('Pocket inventory full');

      // Withdraw remaining 2 units after freeing space
      delete state.player.inventory['pot'];
      const res3 = withdrawFromVault(state, 'cocaine', 2);
      expect(res3.success).toBe(true);
      expect(state.player.vaults['new_york']['cocaine']).toBeUndefined();
    });

    it('contracts and dispatches logistics courier with fee deduction and transit days', () => {
      const state = createInitialState();
      state.player.cash = 50000;
      state.player.inventory['cocaine'] = { drugId: 'cocaine', units: 10, avgCost: 20000 };

      const fee = getShipmentCost('courier_stan', 'cocaine', 5);
      expect(fee).toBeGreaterThan(0);

      // Dispatch 5 units from New York to London
      const res = dispatchCourier(state, {
        shipperId: 'courier_stan',
        targetCityId: 'london',
        drugId: 'cocaine',
        units: 5,
        source: 'inventory',
      });

      expect(res.success).toBe(true);
      expect(state.player.inventory['cocaine'].units).toBe(5);
      expect(state.player.cash).toBe(50000 - fee);
      expect(state.player.shipments.length).toBe(1);

      const shipment = state.player.shipments[0];
      expect(shipment.status).toBe('in_transit');
      expect(shipment.originCityId).toBe('new_york');
      expect(shipment.targetCityId).toBe('london');
      expect(shipment.drugId).toBe('cocaine');
      expect(shipment.units).toBe(5);
      expect(shipment.daysRemaining).toBe(2);
    });

    it('processes courier shipments on advanceDay and delivers cargo into destination safehouse vault', () => {
      const state = createInitialState();
      state.player.cash = 10000;
      state.player.debt = 0; // prevent debt alerts

      // Set up high reliability diplomatic pouch shipment
      state.player.shipments = [
        {
          id: 'ship_test_1',
          shipperId: 'international_couriers', // 99% reliability
          originCityId: 'new_york',
          targetCityId: 'bogota',
          drugId: 'cocaine',
          units: 8,
          costPaid: 5000,
          daysRemaining: 1,
          status: 'in_transit',
        },
      ];

      // Advance 1 day to trigger delivery with deterministic RNG (no seizure)
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
      advanceDay(state);
      randomSpy.mockRestore();

      const shipment = state.player.shipments[0];
      expect(shipment.daysRemaining).toBe(0);
      // International couriers has 99% reliability, so delivery should succeed
      expect(shipment.status).toBe('delivered');
      expect(state.player.vaults['bogota']?.['cocaine']).toBe(8);
      expect(state.logs.some((l) => l.message.includes('COURIER ARRIVAL'))).toBe(true);
    });

    it('generates and allows purchasing inside informant wire intelligence', () => {
      const state = createInitialState();
      state.player.cash = 25000;

      expect(state.player.activeIntel).toBeDefined();
      expect(state.player.activeIntel!.length).toBeGreaterThanOrEqual(2);
      expect(generateIntelTips(1).length).toBeGreaterThanOrEqual(2);

      const tip = state.player.activeIntel![0];
      expect(tip.purchased).toBe(false);

      const cost = tip.cost;
      const res = purchaseIntelTip(state, tip.id);
      expect(res.success).toBe(true);
      expect(tip.purchased).toBe(true);
      expect(state.player.cash).toBe(25000 - cost);
      expect(state.logs.some((l) => l.message.includes('DECRYPTED INTEL WIRE'))).toBe(true);

      // Cannot buy twice
      const res2 = purchaseIntelTip(state, tip.id);
      expect(res2.success).toBe(false);
      expect(res2.message).toContain('already purchased');
    });

    it('forecasted inside intel materializes with 100% certainty on the target day', () => {
      const state = createInitialState();
      state.player.debt = 0;
      state.player.currentDay = 5;

      // Manually set an intel tip targeting Day 6 in Bogota for cocaine spike
      state.player.activeIntel = [
        {
          id: 'test_wire_spike',
          cityId: 'bogota',
          cityName: 'Bogota',
          drugId: 'cocaine',
          drugName: 'Cocaine',
          eventType: 'surge_spike',
          targetDay: 6,
          multiplier: 3.0,
          cost: 2000,
          purchased: true,
          headline: 'DEA port interdiction choked all supply',
          source: 'Wiretap #99',
        },
      ];

      state.player.currentCityId = 'bogota';

      // Advance to Day 6
      advanceDay(state);
      expect(state.player.currentDay).toBe(6);

      // Cocaine market in Bogota should be surged with 'high'
      const cocaineMarket = state.market['cocaine'];
      expect(cocaineMarket.surge).toBe('high');
      expect(cocaineMarket.surgeReason).toContain('DEA port interdiction');
      expect(state.logs.some((l) => l.message.includes('INSIDER INTEL CONFIRMED'))).toBe(true);
    });
  });
});

