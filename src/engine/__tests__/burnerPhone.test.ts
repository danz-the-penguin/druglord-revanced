import { describe, it, expect } from 'vitest';
import { createInitialState } from '../game';
import { generateDailyBurnerMessages, INITIAL_BURNER_MESSAGES } from '../burnerPhone';

describe('Burner Phone Engine', () => {
  it('initializes game with initial burner messages', () => {
    const state = createInitialState('classic');
    expect(state.player.burnerMessages).toBeDefined();
    expect(state.player.burnerMessages?.length).toBe(INITIAL_BURNER_MESSAGES.length);
    expect(state.player.burnerMessages?.[0].id).toBe('msg_welcome');
  });

  it('generates loan shark overdue alerts when loan days expire', () => {
    const state = createInitialState('classic');
    state.player.debt = 5000;
    state.player.loanDaysLeft = 0;
    state.player.currentDay = 15;

    const messages = generateDailyBurnerMessages(state.player);
    const sharkMsg = messages.find((m) => m.role === 'shark');
    expect(sharkMsg).toBeDefined();
    expect(sharkMsg?.actionType).toBe('pay_shark');
    expect(sharkMsg?.text).toContain('PAY UP TODAY');
  });

  it('generates warning message when loan deadline is approaching', () => {
    const state = createInitialState('classic');
    state.player.debt = 3000;
    state.player.loanDaysLeft = 2;
    state.player.currentDay = 12;

    const messages = generateDailyBurnerMessages(state.player);
    const sharkMsg = messages.find((m) => m.role === 'shark');
    expect(sharkMsg).toBeDefined();
    expect(sharkMsg?.text).toContain('Only 2 days left');
  });

  it('generates high heat police pursuit alert when city heat >= 65%', () => {
    const state = createInitialState('classic');
    state.player.cityHeat = { [state.player.currentCityId]: 75 };
    state.player.currentDay = 5;

    const messages = generateDailyBurnerMessages(state.player);
    const policeMsg = messages.find((m) => m.role === 'police');
    expect(policeMsg).toBeDefined();
    expect(policeMsg?.text).toContain('Police Heat reached 75%');
  });

  it('generates hostile takeover alert when corporate raid is active', () => {
    const state = createInitialState('classic');
    state.player.activeHostileTakeover = {
      id: 'takeover_1',
      businessId: 'time_square_arcade',
      syndicateId: 'medellin',
      syndicateName: 'Medellín Cartel',
      sharesAtRisk: 50,
      offerPricePerShare: 4500,
      defenseCost: 20000,
      daysLeft: 3,
      status: 'active',
    };
    state.player.currentDay = 8;

    const messages = generateDailyBurnerMessages(state.player);
    const raidMsg = messages.find((m) => m.role === 'front');
    expect(raidMsg).toBeDefined();
    expect(raidMsg?.text).toContain('HOSTILE RAID');
  });

  it('generates Swiss banker alert when bearer bonds mature', () => {
    const state = createInitialState('classic');
    state.player.bearerBonds = [
      {
        id: 'bond_1',
        name: 'Geneva 7-Day Gold Note',
        bondType: 'sovereign_gold_7d',
        principal: 50000,
        dailyYieldPercent: 1.2,
        purchasedDay: 1,
        termDays: 7,
        matureDay: 7,
        accruedYield: 4200,
        isClaimed: false,
      },
    ];
    state.player.currentDay = 8;

    const messages = generateDailyBurnerMessages(state.player);
    const bankerMsg = messages.find((m) => m.role === 'banker');
    expect(bankerMsg).toBeDefined();
    expect(bankerMsg?.text).toContain('matured bearer bond tranche');
  });
});
