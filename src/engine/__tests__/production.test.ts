import { describe, it, expect, beforeEach } from 'vitest';
import {
  isSeaportCity,
  getPrecursorPrice,
  getLabMaxSlots,
  getLabAvailableSlots,
  canBuildLab,
  buildLab,
  buyPrecursor,
  canStartCookBatch,
  startCookBatch,
  collectCookBatch,
  cancelCookBatch,
  PRECURSORS,
  LAB_ROOMS,
  COOK_RECIPES,
} from '../production';
import { createInitialState, advanceDay } from '../game';
import { GameEngineState } from '../game';

describe('Clandestine Production & Precursor Logistics Engine', () => {
  let state: GameEngineState;

  beforeEach(() => {
    state = createInitialState('classic');
    state.player.currentCityId = 'new_york';
    state.player.cash = 2000000; // $2M for testing
    state.player.bank = 5000000;
  });

  describe('Catalog & Configuration Checks', () => {
    it('provides valid recipes and slot capacities', () => {
      expect(COOK_RECIPES.length).toBeGreaterThan(5);
      expect(getLabMaxSlots('industrial_warehouse')).toBe(4);
      expect(getLabMaxSlots('suburban_safehouse')).toBe(1);
    });
  });

  describe('Seaport Precursor Pricing', () => {
    it('recognizes major international maritime seaport cities', () => {
      expect(isSeaportCity('amsterdam')).toBe(true);
      expect(isSeaportCity('singapore')).toBe(true);
      expect(isSeaportCity('hong_kong')).toBe(true);
      expect(isSeaportCity('los_angeles')).toBe(true);
      expect(isSeaportCity('dubai')).toBe(true);
      expect(isSeaportCity('panama_city')).toBe(true);
      expect(isSeaportCity('bogota')).toBe(false);
      expect(isSeaportCity('berlin')).toBe(false);
    });

    it('applies seaport discount to chemical precursors in coastal ports', () => {
      const ephedrine = PRECURSORS.ephedrine;
      const basePrice = getPrecursorPrice('ephedrine', 'bogota');
      const seaportPrice = getPrecursorPrice('ephedrine', 'amsterdam');

      expect(basePrice).toBe(ephedrine.basePrice);
      expect(seaportPrice).toBe(Math.round(ephedrine.basePrice * (1 - ephedrine.seaportDiscount)));
      expect(seaportPrice).toBeLessThan(basePrice);
    });
  });

  describe('Laboratory Room Construction', () => {
    it('enforces property ownership before building', () => {
      const check = canBuildLab(state.player, 'fortified_compound', 'chemical_reflux');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('do not own');
    });

    it('enforces property slot limits and structural suitability', () => {
      // Grant suburban safehouse (max 1 slot, only hydro allowed)
      state.player.ownedProperties.push('suburban_safehouse');

      // Bio reactor cannot be built in suburban safehouse
      const bioCheck = canBuildLab(state.player, 'suburban_safehouse', 'bio_reactor');
      expect(bioCheck.allowed).toBe(false);
      expect(bioCheck.reason).toContain('does not have the infrastructure');

      // Hydro greenhouse is allowed
      const hydroCheck = canBuildLab(state.player, 'suburban_safehouse', 'hydro_greenhouse');
      expect(hydroCheck.allowed).toBe(true);

      // Build hydro greenhouse
      const res = buildLab(state, 'suburban_safehouse', 'hydro_greenhouse');
      expect(res.success).toBe(true);
      expect(state.player.installedLabs?.['suburban_safehouse']).toContain('hydro_greenhouse');

      // Attempting to build another room exceeds slot limit (1 max)
      const secondCheck = canBuildLab(state.player, 'suburban_safehouse', 'hydro_greenhouse');
      expect(secondCheck.allowed).toBe(false);
    });

    it('builds modular labs and deducts liquid cash', () => {
      state.player.ownedProperties.push('industrial_warehouse');
      const cost = LAB_ROOMS.chemical_reflux.cost;
      const initialCash = state.player.cash;

      const res = buildLab(state, 'industrial_warehouse', 'chemical_reflux');
      expect(res.success).toBe(true);
      expect(state.player.cash).toBe(initialCash - cost);
      expect(state.player.installedLabs?.['industrial_warehouse']).toContain('chemical_reflux');
      expect(getLabAvailableSlots(state.player, 'industrial_warehouse')).toBe(3); // 4 max - 1 used
    });
  });

  describe('Precursor Chemical Purchasing', () => {
    it('purchases precursor chemicals with cash and updates inventory', () => {
      state.player.currentCityId = 'amsterdam';
      const initialCash = state.player.cash;
      const unitPrice = getPrecursorPrice('ephedrine', 'amsterdam');

      const res = buyPrecursor(state, 'ephedrine', 10, 'cash');
      expect(res.success).toBe(true);
      expect(state.player.cash).toBe(initialCash - unitPrice * 10);
      expect(state.player.precursorInventory?.['ephedrine']).toBe(10);
    });

    it('purchases precursor chemicals with offshore bank funds', () => {
      const initialBank = state.player.bank;
      const unitPrice = getPrecursorPrice('hydro_nutrients', state.player.currentCityId);

      const res = buyPrecursor(state, 'hydro_nutrients', 25, 'bank');
      expect(res.success).toBe(true);
      expect(state.player.bank).toBe(initialBank - unitPrice * 25);
      expect(state.player.precursorInventory?.['hydro_nutrients']).toBe(25);
    });
  });

  describe('Synthesis Batch Cooking & Collection', () => {
    beforeEach(() => {
      state.player.ownedProperties.push('fortified_compound');
      buildLab(state, 'fortified_compound', 'chemical_reflux');
      buildLab(state, 'fortified_compound', 'hydro_greenhouse');
    });

    it('fails to start batch if precursors are missing', () => {
      const check = canStartCookBatch(state.player, 'fortified_compound', 'recipe_ice', 1);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Missing precursor chemicals');
    });

    it('commences cook batch, consumes precursors, and queues active batch', () => {
      // Stock ingredients for Ice (2x ephedrine + 1x acetic anhydride per batch)
      state.player.precursorInventory = {
        ephedrine: 10,
        acetic_anhydride: 5,
      };

      const res = startCookBatch(state, 'fortified_compound', 'recipe_ice', 2);
      expect(res.success).toBe(true);
      expect(state.player.precursorInventory.ephedrine).toBe(6); // 10 - 4
      expect(state.player.precursorInventory.acetic_anhydride).toBe(3); // 5 - 2

      expect(state.player.activeCookBatches?.length).toBe(1);
      const batch = state.player.activeCookBatches![0];
      expect(batch.recipeId).toBe('recipe_ice');
      expect(batch.outputDrugId).toBe('ice');
      expect(batch.outputUnits).toBe(6); // 3x output * 2 batches
      expect(batch.status).toBe('cooking');
      expect(batch.daysRemaining).toBe(2);
    });

    it('advances cook batch on day change and marks as ready to harvest', () => {
      state.player.precursorInventory = { hydro_nutrients: 5 };
      startCookBatch(state, 'fortified_compound', 'recipe_pot', 1); // 1 day cook

      expect(state.player.activeCookBatches![0].daysRemaining).toBe(1);

      // Advance day
      advanceDay(state);

      expect(state.player.activeCookBatches![0].daysRemaining).toBe(0);
      expect(state.player.activeCookBatches![0].status).toBe('ready');
    });

    it('collects finished batch into personal stash with $0 cost basis', () => {
      state.player.precursorInventory = { hydro_nutrients: 5 };
      startCookBatch(state, 'fortified_compound', 'recipe_pot', 1);
      advanceDay(state);

      const batchId = state.player.activeCookBatches![0].id;
      const res = collectCookBatch(state, batchId, 'pocket');
      expect(res.success).toBe(true);
      expect(state.player.inventory['pot']?.units).toBe(6);
      expect(state.player.inventory['pot']?.avgCost).toBe(0); // Free manufacturing margin!
      expect(state.player.activeCookBatches?.length).toBe(0);
    });

    it('collects finished batch directly into safehouse vault', () => {
      state.player.precursorInventory = { hydro_nutrients: 5 };
      startCookBatch(state, 'fortified_compound', 'recipe_pot', 1);
      advanceDay(state);

      const batchId = state.player.activeCookBatches![0].id;
      const res = collectCookBatch(state, batchId, 'vault');
      expect(res.success).toBe(true);
      expect(state.player.vaults[state.player.currentCityId]?.['pot']).toBe(6);
      expect(state.player.activeCookBatches?.length).toBe(0);
    });

    it('allows cancelling in-progress batch', () => {
      state.player.precursorInventory = { hydro_nutrients: 5 };
      startCookBatch(state, 'fortified_compound', 'recipe_pot', 1);

      const batchId = state.player.activeCookBatches![0].id;
      const res = cancelCookBatch(state, batchId);
      expect(res.success).toBe(true);
      expect(state.player.activeCookBatches?.length).toBe(0);
    });
  });
});
