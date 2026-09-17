import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInitialState } from '../game';
import {
  evaluateAchievements,
  getGlobalAchievements,
  saveGlobalAchievements,
  ACHIEVEMENTS,
} from '../achievements';
import {
  calculateKingpinScore,
  recordHallOfFameEntry,
  getHallOfFameEntries,
  clearHallOfFame,
  generateShareableDossierText,
} from '../hallOfFame';

describe('Achievements & Hall of Fame Engine', () => {
  const storageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, val: string) => storageMap.set(key, val),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear(),
  };

  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage);
    storageMap.clear();
  });

  it('evaluates and unlocks achievements dynamically', () => {
    expect(ACHIEVEMENTS.length).toBe(20);
    const state = createInitialState();
    const unlocked = new Set<string>();

    // 1. Initial evaluate with first trade
    const res1 = evaluateAchievements(state.player, unlocked, {
      lastAction: 'buy',
      unitsTraded: 20,
    });
    expect(res1.newlyUnlocked.some((a) => a.id === 'first_trade')).toBe(true);
    expect(res1.allUnlocked.has('first_trade')).toBe(true);

    // 2. Paying off debt on Day 3
    state.player.debt = 0;
    state.player.currentDay = 3;
    const res2 = evaluateAchievements(state.player, res1.allUnlocked);
    expect(res2.newlyUnlocked.some((a) => a.id === 'debt_free')).toBe(true);
    expect(res2.newlyUnlocked.some((a) => a.id === 'debt_free_speed')).toBe(true);

    // 3. Wholesale baron with 500 units
    const res3 = evaluateAchievements(state.player, res2.allUnlocked, {
      lastAction: 'buy',
      unitsTraded: 550,
    });
    expect(res3.newlyUnlocked.some((a) => a.id === 'wholesale_baron')).toBe(true);

    // 4. Liquid millionaire
    state.player.cash = 1_500_000;
    const res4 = evaluateAchievements(state.player, res3.allUnlocked);
    expect(res4.newlyUnlocked.some((a) => a.id === 'liquid_millionaire')).toBe(true);

    // 5. Kingpin rank
    state.player.currentRankId = 'kingpin';
    const res5 = evaluateAchievements(state.player, res4.allUnlocked);
    expect(res5.newlyUnlocked.some((a) => a.id === 'cartel_god')).toBe(true);
  });

  it('persists global achievements across runs in localStorage', () => {
    const set1 = new Set(['first_trade', 'debt_free']);
    saveGlobalAchievements(set1);

    const loaded = getGlobalAchievements();
    expect(loaded.has('first_trade')).toBe(true);
    expect(loaded.has('debt_free')).toBe(true);
    expect(loaded.size).toBe(2);
  });

  it('calculates comprehensive Kingpin score and penalties', () => {
    const state = createInitialState();
    state.player.cash = 2_000_000;
    state.player.bank = 1_000_000;
    state.player.debt = 0;
    state.player.ownedProperties = ['shack', 'penthouse'];
    state.player.stats = { combatWins: 4 };
    state.player.unlockedAchievements = ['first_trade', 'debt_free'];
    state.player.currentDay = 15;

    const score = calculateKingpinScore(state.player);
    // Net worth = 3,000,000
    // Properties = 2 * 250,000 = 500,000
    // Combat = 4 * 50,000 = 200,000
    // Debt penalty = 0
    // Achievements = 2 * 100,000 = 200,000
    // Days survived = 15 * 10,000 = 150,000
    // Total = 4,050,000
    expect(score.totalScore).toBe(4_050_000);
    expect(score.scoreTitle).toBe('Underworld Baron');
    expect(score.isKilledPenalty).toBe(false);

    // Test killed in action penalty (50% score reduction)
    state.player.health = 0;
    state.player.gameOverReason = 'Killed in action by DEA agents.';
    const killedScore = calculateKingpinScore(state.player);
    expect(killedScore.isKilledPenalty).toBe(true);
    expect(killedScore.totalScore).toBe(Math.floor(4_050_000 * 0.5));
  });

  it('records, sorts, and clears Hall of Fame entries', () => {
    clearHallOfFame();
    expect(getHallOfFameEntries('all')).toHaveLength(0);

    const state1 = createInitialState('classic');
    state1.player.cash = 500_000;
    recordHallOfFameEntry(state1.player, 'Rookie Smuggler');

    const state2 = createInitialState('classic');
    state2.player.cash = 5_000_000;
    recordHallOfFameEntry(state2.player, 'Kingpin Heisenberg');

    const entries = getHallOfFameEntries('all');
    expect(entries).toHaveLength(2);
    // Highest score first
    expect(entries[0].playerName).toBe('Kingpin Heisenberg');
    expect(entries[1].playerName).toBe('Rookie Smuggler');

    // Generate shareable dossier text
    const dossier = generateShareableDossierText(entries[0]);
    expect(dossier).toContain('Kingpin Heisenberg');
    expect(dossier).toContain('CAREER DOSSIER');

    clearHallOfFame();
    expect(getHallOfFameEntries('all')).toHaveLength(0);
  });
});
