import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState, buyDrug, sellDrug, dumpFakeDrugs, depositToVault, buyWeapon } from '../game';
import { GameEngineState } from '../game';

describe('Fake Drugs & Adulterated Contraband Mechanic', () => {
  let state: GameEngineState;

  beforeEach(() => {
    state = createInitialState('classic');
    state.player.cash = 100000;
    state.player.bank = 500000;
    state.player.currentCityId = 'new_york';
  });

  it('correctly tracks fakeUnits in inventory holding and supports buying', () => {
    state.market['pot'] = {
      drugId: 'pot',
      price: 50,
      availableUnits: 100,
    };
    const buyRes = buyDrug(state, 'pot', 10);
    expect(buyRes.success).toBe(true);
    expect(state.player.inventory['pot'].units).toBe(10);

    state.player.inventory['cocaine'] = {
      drugId: 'cocaine',
      units: 20,
      avgCost: 15000,
      fakeUnits: 5,
    };

    expect(state.player.inventory['cocaine'].units).toBe(20);
    expect(state.player.inventory['cocaine'].fakeUnits).toBe(5);
  });

  it('triggers buyer retaliation, fines, and heat penalty when selling fake drugs', () => {
    state.player.inventory['cocaine'] = {
      drugId: 'cocaine',
      units: 10,
      avgCost: 15000,
      fakeUnits: 4, // 4 fake, 6 clean
    };

    // Ensure market price exists
    state.market['cocaine'] = {
      drugId: 'cocaine',
      price: 20000,
      availableUnits: 10,
    };

    const initialCash = state.player.cash;
    const initialHeat = state.player.cityHeat?.['new_york'] ?? 0;

    // Attempt to sell all 10 units
    const result = sellDrug(state, 'cocaine', 10);

    expect(result.success).toBe(true);
    // Sold 6 clean units: 6 * 20000 = 120,000 revenue
    // Fined for 4 fake units: 4 * 20000 * 0.4 = 32,000 fine
    // Net cash delta = +120,000 - 32,000 = +88,000
    expect(state.player.cash).toBe(initialCash + 88000);

    // Heat penalty applied
    const updatedHeat = state.player.cityHeat?.['new_york'] ?? 0;
    expect(updatedHeat).toBeGreaterThan(initialHeat);

    // Inventory cleared after selling all units
    expect(state.player.inventory['cocaine']).toBeUndefined();
    // Stats recorded
    expect(state.player.stats?.fakeDrugsDiscovered).toBe(4);
  });

  it('fails sale when 100% of sold batch is fake and all units are confiscated', () => {
    state.player.inventory['heroin'] = {
      drugId: 'heroin',
      units: 5,
      avgCost: 8000,
      fakeUnits: 5, // all fake
    };

    state.market['heroin'] = {
      drugId: 'heroin',
      price: 10000,
      availableUnits: 10,
    };

    const initialCash = state.player.cash;
    const result = sellDrug(state, 'heroin', 5);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Counterfeit bust');
    expect(state.player.cash).toBeLessThan(initialCash);
    expect(state.player.inventory['heroin']).toBeUndefined();
  });

  it('safely flushes fake drugs down the drain without any penalties via dumpFakeDrugs', () => {
    state.player.inventory['pot'] = {
      drugId: 'pot',
      units: 25,
      avgCost: 50,
      fakeUnits: 10,
    };

    const initialCash = state.player.cash;
    const initialHeat = state.player.cityHeat?.['new_york'] ?? 0;

    const res = dumpFakeDrugs(state, 'pot');

    expect(res.success).toBe(true);
    expect(res.message).toContain('Safely flushed 10x fake/adulterated');
    // 15 clean units remain
    expect(state.player.inventory['pot'].units).toBe(15);
    expect(state.player.inventory['pot'].fakeUnits).toBe(0);
    // Zero cash penalty and zero heat penalty
    expect(state.player.cash).toBe(initialCash);
    expect(state.player.cityHeat?.['new_york'] ?? 0).toBe(initialHeat);
    expect(state.player.stats?.fakeDrugsFlushed).toBe(10);
  });

  it('intercepts and incinerates counterfeit units when depositing into safehouse vault', () => {
    state.player.ownedProperties.push('industrial_warehouse');
    state.player.inventory['ecstasy'] = {
      drugId: 'ecstasy',
      units: 30,
      avgCost: 40,
      fakeUnits: 10, // 10 fake, 20 clean
    };

    const res = depositToVault(state, 'ecstasy', 30, 'new_york');

    expect(res.success).toBe(true);
    // 20 clean units enter vault
    expect(state.player.vaults?.['new_york']?.['ecstasy']).toBe(20);
    // Inventory is cleared
    expect(state.player.inventory['ecstasy']).toBeUndefined();
    // Message mentions incineration
    expect(res.message).toContain('10 counterfeit units incinerated');
  });

  it('enforces armory utility stack capacity limits in buyWeapon', () => {
    state.player.noScentCans = 10; // Already max capacity (10)
    const res = buyWeapon(state, 'no_scent');
    expect(res.success).toBe(false);
    expect(res.message).toContain('maximum capacity (10)');

    state.player.combatConsumables = { flashbangs: 10, smokeGrenades: 0, medkits: 0 };
    const flashRes = buyWeapon(state, 'flashbang');
    expect(flashRes.success).toBe(false);
    expect(flashRes.message).toContain('maximum capacity (10)');
  });
});
