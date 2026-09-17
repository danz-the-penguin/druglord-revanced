import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialState,
  hireOfficial,
  fireOfficial,
  bribeGrandJury,
  emergencyExtraditionEscape,
  processCorruptionAndRicoDaily,
  hasActiveOfficial,
  isSovereignSanctuary,
  getRicoThreatLevel,
  travelToCity,
  depositBank,
  withdrawBank,
  executeBusinessLaundering,
  GameEngineState,
} from '../game';

describe('Phase 2: Corruption, Informants & Federal Wiretaps Engine', () => {
  let state: GameEngineState;

  beforeEach(() => {
    state = createInitialState('classic');
    state.player.cash = 200000;
    state.player.bank = 500000;
    state.player.currentCityId = 'new_york';
  });

  describe('Corrupt Officials on Retainer (Hire & Fire)', () => {
    it('successfully hires Airport Baggage Handler and deducts initial placement bribe', () => {
      const initialCash = state.player.cash;
      const res = hireOfficial(state, 'airport_baggage_handler');

      expect(res.success).toBe(true);
      expect(state.player.cash).toBe(initialCash - 15000);
      expect(hasActiveOfficial(state.player, 'airport_baggage_handler')).toBe(true);
      expect(state.player.corruptOfficials?.['airport_baggage_handler']?.active).toBe(true);
      expect(state.player.stats?.corruptOfficialsBribed).toBe(1);
    });

    it('rejects hiring an official if player already has them active on payroll', () => {
      hireOfficial(state, 'police_dispatcher');
      const secondHire = hireOfficial(state, 'police_dispatcher');

      expect(secondHire.success).toBe(false);
      expect(secondHire.message).toContain('already on your payroll');
    });

    it('rejects hiring if player has insufficient funds', () => {
      state.player.cash = 1000;
      state.player.bank = 0;
      const res = hireOfficial(state, 'fincen_auditor'); // Costs $75,000

      expect(res.success).toBe(false);
      expect(res.message).toContain('You need $75,000');
    });

    it('successfully dismisses/terminates an active official from payroll', () => {
      hireOfficial(state, 'police_dispatcher');
      expect(hasActiveOfficial(state.player, 'police_dispatcher')).toBe(true);

      const fireRes = fireOfficial(state, 'police_dispatcher');
      expect(fireRes.success).toBe(true);
      expect(hasActiveOfficial(state.player, 'police_dispatcher')).toBe(false);
      expect(state.player.corruptOfficials?.['police_dispatcher']?.active).toBe(false);
    });
  });

  describe('Airport Baggage Handler: 100% Customs Bypass', () => {
    it('bypasses customs and sniffer dogs completely on commercial flights with heavy unmasked cargo', () => {
      // Hire baggage handler
      hireOfficial(state, 'airport_baggage_handler');

      // Load up 100 unmasked cocaine units
      state.player.inventory['cocaine'] = {
        drugId: 'cocaine',
        units: 100,
        avgCost: 15000,
      };
      state.player.noScentCans = 0; // No spray protection
      state.player.cityHeat = { new_york: 90 }; // Extreme departure heat

      // Fly commercial to Miami
      const travelRes = travelToCity(state, 'miami', 'economy');
      expect(travelRes.success).toBe(true);
      expect(state.player.currentCityId).toBe('miami');

      // Customs inspection bypassed 100%
      expect(state.player.activeEncounter).toBeNull();
      const bypassLog = state.logs.find((l) => l.message.includes('BAGGAGE HANDLER BYPASS'));
      expect(bypassLog).toBeDefined();
      expect(bypassLog?.type).toBe('corruption');
    });
  });

  describe('Police Dispatcher: Advance Raid Warning & Tactical Defense', () => {
    it('generates advance raid warning and intelligence leak when local heat is critical (>=65%)', () => {
      hireOfficial(state, 'police_dispatcher');
      state.player.cityHeat = { new_york: 75 };

      processCorruptionAndRicoDaily(state, false);

      expect(state.player.pendingRaidWarning).not.toBeNull();
      expect(state.player.pendingRaidWarning?.cityId).toBe('new_york');
      expect(state.player.pendingRaidWarning?.message).toContain('warrant');
      expect(state.logs[0].message).toContain('DISPATCH LEAK');
    });

    it('clears pending raid warning if heat drops below danger threshold', () => {
      hireOfficial(state, 'police_dispatcher');
      state.player.cityHeat = { new_york: 40 };

      processCorruptionAndRicoDaily(state, false);

      expect(state.player.pendingRaidWarning).toBeNull();
    });
  });

  describe('FinCEN Regulatory Auditor: 100% Shell Business Audit Shield', () => {
    it('provides complete immunity against IRS and FinCEN audit disgorgement penalties', () => {
      hireOfficial(state, 'fincen_auditor');
      state.player.ownedBusinesses = ['laundromat'];
      state.player.cash = 100000;
      state.player.bank = 50000;

      // Laundromat has audit risk; run wash cycles
      for (let i = 0; i < 5; i++) {
        state.player.cash = 50000;
        state.player.launderedToday = 0;
        executeBusinessLaundering(state, 'laundromat', 10000);
      }

      // No IRS audit log should exist; instead, auditor shield logs should be present
      const auditLog = state.logs.find((l) => l.message.includes('IRS AUDIT NOTICE'));
      expect(auditLog).toBeUndefined();

      const shieldLog = state.logs.find((l) => l.message.includes('FINCEN AUDITOR SHIELD'));
      expect(shieldLog).toBeDefined();
    });
  });

  describe('Payroll Upkeep & Lapse on Insufficient Funds', () => {
    it('deducts daily retainers from bank during daily calendar processing', () => {
      hireOfficial(state, 'airport_baggage_handler'); // $350/day
      hireOfficial(state, 'police_dispatcher'); // $750/day
      const initialBank = state.player.bank;

      processCorruptionAndRicoDaily(state, false);

      expect(state.player.bank).toBe(initialBank - 1100);
    });

    it('deactivates official and logs payroll lapse warning when funds run out', () => {
      hireOfficial(state, 'fincen_auditor'); // $1,500/day
      state.player.cash = 50;
      state.player.bank = 50; // Cannot afford $1,500

      processCorruptionAndRicoDaily(state, false);

      expect(hasActiveOfficial(state.player, 'fincen_auditor')).toBe(false);
      expect(state.logs[0].message).toContain('PAYROLL LAPSE');
    });
  });

  describe('Federal Grand Jury RICO Indictment Meter', () => {
    it('increases RICO meter when local city heat remains high (>=70%)', () => {
      state.player.cityHeat = { new_york: 80 };
      state.player.ricoMeter = 10;

      processCorruptionAndRicoDaily(state, false);

      expect(state.player.ricoMeter).toBeGreaterThan(10);
    });

    it('allows natural decay of RICO meter when lying low in cold heat (<30%)', () => {
      state.player.cityHeat = { new_york: 15 };
      state.player.ricoMeter = 25;

      processCorruptionAndRicoDaily(state, false);

      expect(state.player.ricoMeter).toBe(23); // -2% decay
    });

    it('suppresses RICO growth significantly when FinCEN Auditor is on payroll', () => {
      hireOfficial(state, 'fincen_auditor');
      state.player.cityHeat = { new_york: 75 };
      state.player.ricoMeter = 20;

      processCorruptionAndRicoDaily(state, false);

      // Raw gain would be +4, with auditor (*0.4) it is suppressed to +2
      expect(state.player.ricoMeter).toBeLessThanOrEqual(22);
    });

    it('allows bribing the Grand Jury prosecutor to quash subpoenas and reduce meter', () => {
      state.player.ricoMeter = 60;
      state.player.cash = 100000;

      const bribeRes = bribeGrandJury(state, 50000);

      expect(bribeRes.success).toBe(true);
      expect(state.player.ricoMeter).toBe(40); // -20% reduction
      expect(state.player.cash).toBe(50000);
    });
  });

  describe('100% RICO Indictment Asset Freeze & Emergency Sovereign Escape', () => {
    it('freezes bank assets when RICO meter reaches 100%', () => {
      state.player.ricoMeter = 98;
      state.player.cityHeat = { new_york: 90 }; // +6% jump

      processCorruptionAndRicoDaily(state, false);

      expect(state.player.ricoMeter).toBe(100);
      expect(state.player.isBankFrozen).toBe(true);
      expect(state.logs[0].message).toContain('FEDERAL RICO INDICTMENT UNSEALED');
    });

    it('blocks bank deposits and withdrawals when bank accounts are frozen', () => {
      state.player.isBankFrozen = true;

      const depRes = depositBank(state, 5000);
      expect(depRes.success).toBe(false);
      expect(depRes.message).toContain('BANK ASSETS FROZEN');

      const withRes = withdrawBank(state, 5000);
      expect(withRes.success).toBe(false);
      expect(withRes.message).toContain('BANK ASSETS FROZEN');
    });

    it('rejects emergency escape flight to a non-sanctuary city', () => {
      state.player.isBankFrozen = true;
      const res = emergencyExtraditionEscape(state, 'detroit');

      expect(res.success).toBe(false);
      expect(res.message).toContain('must be a recognized Sovereign Non-Extradition Sanctuary');
    });

    it('successfully executes emergency escape flight to Dubai sanctuary, unfreezing bank and quashing indictment', () => {
      state.player.ricoMeter = 100;
      state.player.isBankFrozen = true;
      state.player.bank = 200000;
      state.player.cash = 25000;

      const escapeRes = emergencyExtraditionEscape(state, 'dubai');

      expect(escapeRes.success).toBe(true);
      expect(state.player.currentCityId).toBe('dubai');
      // Bank unfrozen
      expect(state.player.isBankFrozen).toBe(false);
      // 15% forfeiture penalty deducted from bank: $200,000 * 0.85 = $170,000
      expect(state.player.bank).toBe(170000);
      // RICO meter reset to safe baseline (10%)
      expect(state.player.ricoMeter).toBe(10);
      expect(state.player.stats?.ricoIndictmentsEvaded).toBe(1);
      expect(state.logs[0].message).toContain('SOVEREIGN SANCTUARY REACHED');
    });

    it('recognizes sovereign properties as sanctuaries', () => {
      state.player.ownedProperties.push('sovereign_airstrip_compound');
      expect(isSovereignSanctuary('tokyo', state.player.ownedProperties)).toBe(true);
    });

    it('returns correct threat badges from getRicoThreatLevel', () => {
      expect(getRicoThreatLevel(20).danger).toBe('low');
      expect(getRicoThreatLevel(50).danger).toBe('moderate');
      expect(getRicoThreatLevel(80).danger).toBe('high');
      expect(getRicoThreatLevel(100).danger).toBe('critical');
    });
  });
});
