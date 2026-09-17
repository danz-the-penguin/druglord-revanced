import { describe, it, expect, beforeEach } from 'vitest';
import {
  mulberry32,
  hashSeedString,
  getTodayDailySeed,
  generateRandomSeed,
  generateChallengeProofCode,
  verifyChallengeProofCode,
  applyChallengeModifiersToNewGame,
  saveDailyChallengeRecord,
  getDailyChallengeRecords,
  clearDailyChallengeRecords,
  generateChallengeDossierText,
  BOUNTY_CHALLENGES,
  ORGANIC_DRUG_IDS,
  SYNTHETIC_DRUG_IDS,
  DailyChallengeRecord,
} from '../dailyChallenge';
import { createInitialState, buyDrug, sellDrug, buyWeapon, travelToCity } from '../game';
import { setEconomyRng } from '../economy';

describe('Daily Challenge & Cartel Bounty Board Engine', () => {
  beforeEach(() => {
    clearDailyChallengeRecords();
    setEconomyRng(null);
  });

  describe('Deterministic Mulberry32 PRNG & Seed Hashing', () => {
    it('produces deterministic identical sequences for the same seed', () => {
      const rng1 = mulberry32(12345678);
      const rng2 = mulberry32(12345678);

      const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
      seq1.forEach((val) => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      });
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = mulberry32(11111);
      const rng2 = mulberry32(99999);

      expect(rng1()).not.toEqual(rng2());
    });

    it('consistently hashes arbitrary string seeds to unsigned 32-bit integers', () => {
      const hash1 = hashSeedString('DAILY-2026-09-18');
      const hash2 = hashSeedString('DAILY-2026-09-18');
      const hashOther = hashSeedString('DAILY-2026-09-19');

      expect(hash1).toBe(hash2);
      expect(hash1).toBeGreaterThanOrEqual(0);
      expect(hash1).not.toBe(hashOther);
    });
  });

  describe('Daily UTC Seed & Random Generator', () => {
    it('returns valid UTC date seed and countdown formatting', () => {
      const daily = getTodayDailySeed();
      expect(daily.seed).toMatch(/^DAILY-\d{4}-\d{2}-\d{2}$/);
      expect(daily.dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(daily.timeUntilNextUtcMidnightMs).toBeGreaterThan(0);
      expect(daily.timeUntilNextUtcMidnightFormatted).toMatch(/^\d{2}h \d{2}m \d{2}s$/);
    });

    it('generates thematic random cartel seed strings', () => {
      const seed = generateRandomSeed();
      expect(seed).toMatch(/^[A-Z_]+-\d{4}$/);
    });
  });

  describe('Bounty Challenges Configuration', () => {
    it('contains all 5 core bounty challenges with rich modifiers', () => {
      expect(BOUNTY_CHALLENGES.length).toBe(5);

      const ids = BOUNTY_CHALLENGES.map((c) => c.id);
      expect(ids).toContain('daily_seed');
      expect(ids).toContain('zero_weapons');
      expect(ids).toContain('aviation_kingpin');
      expect(ids).toContain('pure_synthetics');
      expect(ids).toContain('swiss_purist');

      BOUNTY_CHALLENGES.forEach((c) => {
        expect(c.title).toBeTruthy();
        expect(c.tagline).toBeTruthy();
        expect(c.perks.length).toBeGreaterThan(0);
        expect(c.handicaps.length).toBeGreaterThan(0);
        expect(c.targetScore).toBeGreaterThan(0);
        expect(c.targetBountyReward).toBeTruthy();
      });
    });

    it('differentiates organic and synthetic drug classifications', () => {
      expect(ORGANIC_DRUG_IDS.has('pot')).toBe(true);
      expect(ORGANIC_DRUG_IDS.has('mushrooms')).toBe(true);
      expect(ORGANIC_DRUG_IDS.has('cocaine')).toBe(true);

      expect(SYNTHETIC_DRUG_IDS.has('speed')).toBe(true);
      expect(SYNTHETIC_DRUG_IDS.has('ice')).toBe(true);
      expect(SYNTHETIC_DRUG_IDS.has('fentanyl')).toBe(true);
      expect(SYNTHETIC_DRUG_IDS.has('carfentanil')).toBe(true);
    });
  });

  describe('Cryptographic Proof Codes & Dossier Signature', () => {
    it('generates properly formatted proof codes', () => {
      const proof = generateChallengeProofCode('daily_seed', 'DAILY-2026-09-18', 12500000, 30, 'completed');
      expect(proof).toMatch(/^DL2-DLY-[0-9A-F]{2,4}-[0-9A-F]{8}-[0-9A-F]{8}$/);
    });

    it('verifies legitimate proof codes against matching seeds', () => {
      const seed = 'DAILY-2026-09-18';
      const proof = generateChallengeProofCode('zero_weapons', seed, 7500000, 30, 'completed');

      const verification = verifyChallengeProofCode(proof, seed);
      expect(verification.valid).toBe(true);
      expect(verification.challengeId).toBe('zero_weapons');
      expect(verification.score).toBe(7500000);
      expect(verification.days).toBe(30);
    });

    it('rejects tampered proof codes or mismatched seeds', () => {
      const seed = 'DAILY-2026-09-18';
      const proof = generateChallengeProofCode('zero_weapons', seed, 7500000, 30, 'completed');

      // Test with wrong seed
      const failedVerification = verifyChallengeProofCode(proof, 'WRONG-SEED-999');
      expect(failedVerification.valid).toBe(false);
      expect(failedVerification.error).toContain('Checksum mismatch');

      // Test with malformed code
      const malformedVerification = verifyChallengeProofCode('INVALID-CODE-STRING');
      expect(malformedVerification.valid).toBe(false);
    });
  });

  describe('Challenge Modifiers Application & In-Game Mechanics', () => {
    it('sets up Zero Weapons (Pacifist Smuggler) starting assets and bans armory weapons', () => {
      const fresh = createInitialState('classic');
      applyChallengeModifiersToNewGame(fresh, 'zero_weapons', 'PACIFIST-SEED');

      expect(fresh.player.cash).toBe(15000);
      expect(fresh.player.debt).toBe(0);
      expect(fresh.player.challengeModifiers?.weaponsBanned).toBe(true);
      expect(fresh.player.challengeModifiers?.bribeDiscount).toBe(0.25);
      expect(fresh.player.challengeModifiers?.fleeAgilityBonus).toBe(0.3);

      // Attempting to buy weapon should be blocked by challenge rule
      const result = buyWeapon(fresh, 'pistol');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Pacifist Smuggler');
    });

    it('sets up 100% Aviation Kingpin starting fleet and blocks commercial passenger flights', () => {
      const fresh = createInitialState('quarter');
      applyChallengeModifiersToNewGame(fresh, 'aviation_kingpin', 'AVIATION-SEED');

      expect(fresh.player.cash).toBe(50000);
      expect(fresh.player.debt).toBe(25000);
      expect(fresh.player.ownedAircraft).toContain('cessna_caravan');
      expect(fresh.player.selectedAircraftId).toBe('cessna_caravan');
      expect(fresh.player.challengeModifiers?.aviationOnly).toBe(true);

      // Travel without owned aircraft should be blocked or redirected
      const freshWithoutPlane = createInitialState('quarter');
      applyChallengeModifiersToNewGame(freshWithoutPlane, 'aviation_kingpin', 'AVIATION-SEED');
      freshWithoutPlane.player.ownedAircraft = [];
      freshWithoutPlane.player.selectedAircraftId = null;

      const travelResult = travelToCity(freshWithoutPlane, 'miami', 'economy', undefined, false);
      expect(travelResult.success).toBe(false);
      expect(travelResult.message).toContain('Commercial passenger flights prohibited');
    });

    it('sets up Pure Synthetics Mogul starting lab and blocks organic plant contraband', () => {
      const fresh = createInitialState('classic');
      applyChallengeModifiersToNewGame(fresh, 'pure_synthetics', 'SYNTHETICS-SEED');

      expect(fresh.player.ownedProperties).toContain('border_ranch');
      expect(fresh.player.installedLabs?.['border_ranch']).toContain('chemical_reflux');
      expect(fresh.player.challengeModifiers?.syntheticsOnly).toBe(true);
      expect(fresh.player.challengeModifiers?.syntheticMarginBonus).toBe(0.25);

      // Ensure pot exists in market and test organic purchase ban
      fresh.market['pot'] = { drugId: 'pot', price: 100, availableUnits: 50 };
      const buyPotResult = buyDrug(fresh, 'pot', 5);
      expect(buyPotResult.success).toBe(false);
      expect(buyPotResult.message).toContain('Organic botanical contraband is strictly prohibited');

      // Test synthetic selling with margin bonus
      fresh.market['speed'] = { drugId: 'speed', price: 1000, availableUnits: 50 };
      fresh.player.inventory['speed'] = { drugId: 'speed', units: 10, avgCost: 500 };
      const initialCash = fresh.player.cash;
      const sellSpeedResult = sellDrug(fresh, 'speed', 10);
      expect(sellSpeedResult.success).toBe(true);
      // Base revenue: 10,000. With 25% bonus: 12,500
      expect(fresh.player.cash - initialCash).toBe(12500);
    });

    it('sets up Swiss Laundering Purist with pre-owned shell companies and 3x audit heat', () => {
      const fresh = createInitialState('quarter');
      applyChallengeModifiersToNewGame(fresh, 'swiss_purist', 'SWISS-SEED');

      expect(fresh.player.cash).toBe(25000);
      expect(fresh.player.ownedBusinesses).toContain('laundromat');
      expect(fresh.player.ownedBusinesses).toContain('car_wash');
      expect(fresh.player.challengeModifiers?.tripleAuditHeat).toBe(true);
    });
  });

  describe('Challenge Records Persistence & Dossier Text', () => {
    it('saves and retrieves challenge history records', () => {
      const record: DailyChallengeRecord = {
        id: 'test_record_1',
        challengeId: 'daily_seed',
        challengeTitle: 'Global Daily Seed Run',
        seed: 'DAILY-2026-09-18',
        date: '2026-09-18',
        timestamp: Date.now(),
        finalScore: 12400000,
        netWorth: 12400000,
        daysSurvived: 30,
        maxDays: 30,
        finalRank: 'Cartel Kingpin',
        outcome: 'completed',
        proofCode: 'DL2-DLY-1E-00BD3740-12345678',
        verified: true,
      };

      saveDailyChallengeRecord(record);
      const records = getDailyChallengeRecords();
      expect(records.length).toBe(1);
      expect(records[0].id).toBe('test_record_1');
      expect(records[0].finalScore).toBe(12400000);
    });

    it('generates formatted shareable ASCII dossier text with cryptographic signature', () => {
      const record: DailyChallengeRecord = {
        id: 'test_record_2',
        challengeId: 'zero_weapons',
        challengeTitle: 'The Pacifist Smuggler',
        seed: 'PACIFIST-2026',
        date: '2026-09-18',
        timestamp: Date.now(),
        finalScore: 8500000,
        netWorth: 8500000,
        daysSurvived: 30,
        maxDays: 30,
        finalRank: 'Underworld Baron',
        outcome: 'retirement',
        proofCode: 'DL2-PAC-1E-0081B320-AABBCCDD',
        verified: true,
      };

      const dossier = generateChallengeDossierText(record);
      expect(dossier).toContain('DRUG LORD: REVANCED — VERIFIED BOUNTY DOSSIER');
      expect(dossier).toContain('The Pacifist Smuggler');
      expect(dossier).toContain('[PACIFIST-2026]');
      expect(dossier).toContain('$8,500,000');
      expect(dossier).toContain('DL2-PAC-1E-0081B320-AABBCCDD');
      expect(dossier).toContain('VERIFIED CRYPTOGRAPHIC SIGNATURE');
    });
  });
});
