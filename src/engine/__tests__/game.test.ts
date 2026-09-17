import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  buyDrug,
  sellDrug,
  depositBank,
  withdrawBank,
  advanceDay,
  repayLoan,
  getEarlyRepayDetails,
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
});

