import { describe, it, expect } from 'vitest';
import {
  SYNDICATES,
  getStandingTier,
  getSyndicateDiscount,
  calculatePeaceTributeCost,
  generateSyndicateContracts,
} from '../syndicates';
import {
  createInitialState,
  acceptSyndicateContract,
  deliverSyndicateContract,
  paySyndicateTributeAction,
  buyDrug,
} from '../game';

describe('Cartel Syndicates & Faction Diplomacy', () => {
  it('defines 5 crime syndicates with unique traits and home bases', () => {
    expect(SYNDICATES.length).toBe(5);
    const ids = SYNDICATES.map((s) => s.id);
    expect(ids).toContain('medellin');
    expect(ids).toContain('golden_triangle');
    expect(ids).toContain('synthetic_chem');
    expect(ids).toContain('designer_ring');
    expect(ids).toContain('balkan');

    for (const syn of SYNDICATES) {
      expect(syn.name.length).toBeGreaterThan(0);
      expect(syn.headquarters.length).toBeGreaterThan(0);
      expect(syn.specialtyDrugs.length).toBeGreaterThan(0);
      expect(syn.description.length).toBeGreaterThan(10);
    }
  });

  it('correctly maps standing tiers across reputation score range [-100 to +100]', () => {
    expect(getStandingTier(-80)).toBe('Nemesis');
    expect(getStandingTier(-60)).toBe('Nemesis');
    expect(getStandingTier(-30)).toBe('Hostile');
    expect(getStandingTier(-20)).toBe('Hostile');
    expect(getStandingTier(0)).toBe('Neutral');
    expect(getStandingTier(15)).toBe('Neutral');
    expect(getStandingTier(40)).toBe('Associate');
    expect(getStandingTier(59)).toBe('Associate');
    expect(getStandingTier(60)).toBe('Allied Don');
    expect(getStandingTier(95)).toBe('Allied Don');
  });

  it('calculates wholesale discounts scaling with reputation standing', () => {
    // Neutral or negative standing: 0% discount
    expect(getSyndicateDiscount('cocaine', { medellin: 0 })).toBe(0);
    expect(getSyndicateDiscount('cocaine', { medellin: -50 })).toBe(0);

    // Associate standing (40): 15% discount
    const associateDiscount = getSyndicateDiscount('cocaine', { medellin: 40 });
    expect(associateDiscount).toBe(0.15);

    // Allied Don (80): 30% discount
    const alliedDiscount = getSyndicateDiscount('cocaine', { medellin: 80 });
    expect(alliedDiscount).toBe(0.30);
  });

  it('applies wholesale discount when buying specialty drug from allied cartel', () => {
    const state = createInitialState();
    state.player.cash = 100000;
    state.player.ownedProperties = ['warehouse']; // provides 1000 carrying capacity
    state.player.syndicateReputations = state.player.syndicateReputations || {};
    state.player.syndicateReputations.medellin = 80;

    // Ensure cocaine is available in current market
    state.market.cocaine = { drugId: 'cocaine', price: 20000, availableUnits: 50 };
    const basePrice = state.market.cocaine.price;
    const initialCash = state.player.cash;

    const units = 5;
    const result = buyDrug(state, 'cocaine', units);
    expect(result.success).toBe(true);

    // Expected unit cost with 30% discount
    const expectedUnitCost = Math.round(basePrice * 0.70);
    const spent = initialCash - state.player.cash;
    expect(spent).toBe(expectedUnitCost * units);
  });

  it('calculates peace tribute costs proportional to negative rep', () => {
    const cost50 = calculatePeaceTributeCost(-50);
    expect(cost50).toBeGreaterThan(50000);

    const cost80 = calculatePeaceTributeCost(-80);
    expect(cost80).toBeGreaterThan(cost50);

    // Positive reputation requires zero tribute
    expect(calculatePeaceTributeCost(20)).toBe(0);
  });

  it('generates dynamic timed contracts with target cities, drugs, deadlines, and rewards', () => {
    const contracts = generateSyndicateContracts(1, 'new_york');
    expect(contracts.length).toBeGreaterThanOrEqual(3);

    for (const contract of contracts) {
      expect(contract.id).toMatch(/^contract_/);
      expect(contract.syndicateId).toBeDefined();
      expect(contract.drugId).toBeDefined();
      expect(contract.destinationCityId).toBeDefined();
      expect(contract.unitsRequired).toBeGreaterThan(0);
      expect(contract.payoutCash).toBeGreaterThan(0);
      expect(contract.repReward).toBeGreaterThan(0);
      expect(contract.daysRemaining).toBeGreaterThan(0);
      expect(contract.status).toBe('available');
    }
  });

  it('handles accepting contracts and delivering them for cash and reputation', () => {
    const state = createInitialState();
    const contracts = generateSyndicateContracts(1, 'new_york');
    state.player.syndicateContracts = contracts;
    state.player.syndicateReputations = state.player.syndicateReputations || {};

    const testContract = contracts[0];
    const contractId = testContract.id;

    // Accept contract
    const acceptRes = acceptSyndicateContract(state, contractId);
    expect(acceptRes.success).toBe(true);

    const accepted = state.player.syndicateContracts.find((c) => c.id === contractId);
    expect(accepted?.status).toBe('active');

    // Deliver: player needs to be in target city and have the required drug units
    state.player.currentCityId = testContract.destinationCityId;
    state.player.inventory[testContract.drugId] = {
      drugId: testContract.drugId,
      units: testContract.unitsRequired + 5,
      avgCost: 500,
    };

    const initialCash = state.player.cash;
    const initialRep = state.player.syndicateReputations[testContract.syndicateId] || 0;

    const deliverRes = deliverSyndicateContract(state, contractId);
    expect(deliverRes.success).toBe(true);

    expect(state.player.cash).toBe(initialCash + testContract.payoutCash);
    expect(state.player.syndicateReputations[testContract.syndicateId]).toBe(
      Math.min(100, initialRep + testContract.repReward)
    );
    expect(state.player.inventory[testContract.drugId]?.units).toBe(5);
  });

  it('allows paying syndicate peace tribute to reset negative standing', () => {
    const state = createInitialState();
    state.player.cash = 500000;
    state.player.syndicateReputations = state.player.syndicateReputations || {};
    state.player.syndicateReputations.balkan = -60;

    const tributeCost = calculatePeaceTributeCost(-60);
    const res = paySyndicateTributeAction(state, 'balkan');
    expect(res.success).toBe(true);

    expect(state.player.syndicateReputations.balkan).toBe(0);
    expect(state.player.cash).toBe(500000 - tributeCost);
  });
});
