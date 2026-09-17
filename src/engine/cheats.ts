import { memoryMirror } from './memoryBuffer';
import { CITY_MAP, DRUG_MAP } from './constants';
import { PlayerState } from './types';
import { soundEngine, SoundEffect } from '../utils/audio';
import { PRECURSORS } from './production';
import { CORRUPT_MAP, CorruptOfficialId, emergencyExtraditionEscape } from './corruption';
import { evaluateCityHotspots } from './smugglingMapData';
import { triggerTurfWar, triggerMacroEvent } from './turfWars';
import { MacroEventType } from './turfWarTypes';
import { SyndicateId } from './types';
import { SYNDICATE_MAP } from './syndicates';

export interface CheatExecutionResult {
  success: boolean;
  message: string;
}

export function executeCheat(
  command: string,
  state: {
    player: PlayerState;
    market: Record<string, { price: number; availableUnits?: number }>;
    cheats?: {
      godMode: boolean;
      extraCapacity: number;
    };
  }
): CheatExecutionResult {
  const parts = command.trim().split(/\s+/);
  if (!parts[0]) return { success: false, message: 'Empty command' };

  const action = parts[0].toLowerCase();
  const arg1 = parts[1];
  const arg2 = parts[2];
  const arg3 = parts[3];

  // Harmonize cheats reference on state or player
  if (!state.cheats && state.player.cheats) {
    state.cheats = state.player.cheats;
  } else if (!state.player.cheats && state.cheats) {
    state.player.cheats = state.cheats;
  }
  const cheats = state.player.cheats;

  switch (action) {
    case 'help':
      return {
        success: true,
        message:
          'Commands:\n' +
          '• cash <val> | cash +<val> : Modify liquid cash\n' +
          '• bank <val> | bank +<val> : Modify offshore bank deposits\n' +
          '• debt <val> | clear_debt  : Clear or set loan shark debt\n' +
          '• days <val> | days +<val> : Add or set max calendar days\n' +
          '• health <val> | heal      : Restore health to 100% HP\n' +
          '• god                      : Toggle Cartel God Mode\n' +
          '• capacity <val>           : Set extra stash carrying capacity\n' +
          '• teleport <city>          : Travel immediately without cost or customs\n' +
          '• rig <drug> <price>       : Rig street market commodity price\n' +
          '• noscent <count>          : Grant No-Scent spray cans\n' +
          '• wire                     : Inspect active informant market tips\n' +
          '• rico <0-100>             : Set Federal Grand Jury RICO Indictment Meter\n' +
          '• corrupt <official_id>    : Instantly recruit corrupt official onto payroll\n' +
          '• escape <sanctuary_id>   : Execute emergency sovereign extradition escape\n' +
          '• hotspots                 : Inspect active geopolitical smuggling hotspots\n' +
          '• blockade <city_id>       : Trigger tactical DEA / SWAT blockade & raid alert\n' +
          '• vault                    : Inspect multi-city safehouse vaults\n' +
          '• shipments                : Inspect in-transit courier shipments\n' +
          '• turf_war <a> <d>         : Trigger syndicate turf war\n' +
          '• macro_event <type>       : Trigger black swan global macro shock\n' +
          '• vault_give <city> <d> <n>: Stash contraband directly in vault\n' +
          '• sfx <effect>             : Synthesize Web Audio sound effect',
      };

    case 'sfx': {
      if (!arg1) {
        return {
          success: true,
          message:
            'Sound Synthesizer Palette:\n' +
            'Usage: sfx <name>\n' +
            'Available: buy, sell, travel, police, gunshot, flee, pager, bribe, heal, bank, vault, courier, victory, defeat, demotion, click',
        };
      }
      soundEngine.play(arg1 as SoundEffect);
      return { success: true, message: `🎵 Synthesized Web Audio SFX: "${arg1}"` };
    }

    case 'cash': {
      if (!arg1) return { success: false, message: 'Usage: cash <amount> or cash +<amount>' };
      if (arg1.startsWith('+')) {
        const add = parseInt(arg1.slice(1), 10);
        if (isNaN(add)) return { success: false, message: 'Invalid number' };
        state.player.cash += add;
        return { success: true, message: `Injected +$${add.toLocaleString()} cash.` };
      } else {
        const val = parseInt(arg1, 10);
        if (isNaN(val)) return { success: false, message: 'Invalid number' };
        state.player.cash = Math.max(0, val);
        return { success: true, message: `Cash balance set to $${val.toLocaleString()}.` };
      }
    }

    case 'bank': {
      if (!arg1) return { success: false, message: 'Usage: bank <amount> or bank +<amount>' };
      if (arg1.startsWith('+')) {
        const add = parseInt(arg1.slice(1), 10);
        if (isNaN(add)) return { success: false, message: 'Invalid number' };
        state.player.bank += add;
        return { success: true, message: `Wired +$${add.toLocaleString()} into offshore bank.` };
      } else {
        const val = parseInt(arg1, 10);
        if (isNaN(val)) return { success: false, message: 'Invalid number' };
        state.player.bank = Math.max(0, val);
        return { success: true, message: `Offshore bank balance set to $${val.toLocaleString()}.` };
      }
    }

    case 'clear_debt':
    case 'cleardebt': {
      state.player.debt = 0;
      state.player.loanSharkId = null;
      state.player.loanDaysLeft = 0;
      return { success: true, message: 'All debts wiped with loan sharks!' };
    }

    case 'debt': {
      if (!arg1) return { success: false, message: 'Usage: debt <amount>' };
      const val = parseInt(arg1, 10);
      if (isNaN(val)) return { success: false, message: 'Invalid number' };
      state.player.debt = Math.max(0, val);
      if (state.player.debt === 0) {
        state.player.loanSharkId = null;
        state.player.loanDaysLeft = 0;
      }
      return { success: true, message: `Debt set to $${val.toLocaleString()}.` };
    }

    case 'days': {
      if (!arg1) return { success: false, message: 'Usage: days <amount> or days +<amount>' };
      if (arg1.startsWith('+')) {
        const add = parseInt(arg1.slice(1), 10);
        if (isNaN(add)) return { success: false, message: 'Invalid number' };
        state.player.maxDays += add;
        return { success: true, message: `Added +${add} extra days to campaign.` };
      } else {
        const val = parseInt(arg1, 10);
        if (isNaN(val)) return { success: false, message: 'Invalid number' };
        state.player.maxDays = Math.max(state.player.currentDay, val);
        return { success: true, message: `Max days set to ${val}.` };
      }
    }

    case 'heal': {
      state.player.health = 100;
      return { success: true, message: 'Health restored to 100% HP.' };
    }

    case 'health': {
      if (!arg1) return { success: false, message: 'Usage: health <amount>' };
      const val = parseInt(arg1, 10);
      if (isNaN(val)) return { success: false, message: 'Invalid number' };
      state.player.health = Math.min(100, Math.max(1, val));
      return { success: true, message: `Health set to ${state.player.health}% HP.` };
    }

    case 'god': {
      cheats.godMode = !cheats.godMode;
      if (cheats.godMode) {
        state.player.health = 100;
      }
      return {
        success: true,
        message: `Cartel God Mode: ${cheats.godMode ? 'ENABLED (Invulnerable)' : 'DISABLED'}.`,
      };
    }

    case 'capacity': {
      if (!arg1) return { success: false, message: 'Usage: capacity <amount>' };
      const val = parseInt(arg1, 10);
      if (isNaN(val)) return { success: false, message: 'Invalid number' };
      cheats.extraCapacity = Math.max(0, val);
      return { success: true, message: `Extra stash capacity set to +${val} units.` };
    }

    case 'teleport': {
      if (!arg1) return { success: false, message: 'Usage: teleport <city_id> (e.g. bogota, london, miami)' };
      const city = CITY_MAP.get(arg1.toLowerCase());
      if (!city) return { success: false, message: `Unknown city ID: "${arg1}". Try: new_york, miami, london, bogota, sydney, paris.` };
      state.player.currentCityId = city.id;
      return { success: true, message: `Teleported to ${city.name} without customs checks or fuel costs.` };
    }

    case 'rig': {
      if (!arg1 || !arg2) return { success: false, message: 'Usage: rig <drug_id> <price> (e.g. rig cocaine 50000)' };
      const drug = DRUG_MAP.get(arg1.toLowerCase());
      if (!drug) return { success: false, message: `Unknown drug ID: "${arg1}".` };
      const price = parseInt(arg2, 10);
      if (isNaN(price) || price <= 0) return { success: false, message: 'Invalid price' };
      if (state.market[drug.id]) {
        state.market[drug.id].price = price;
      }
      return { success: true, message: `Market price for ${drug.name} rigged to $${price.toLocaleString()}/unit.` };
    }

    case 'noscent': {
      const count = parseInt(arg1 ?? '10', 10);
      state.player.noScentCans = Math.min(10, Math.max(1, isNaN(count) ? 10 : count));
      return { success: true, message: `Granted ${state.player.noScentCans} cans of No-Scent spray.` };
    }

    case 'wire':
    case 'intel': {
      const tips = state.player.activeIntel || [];
      if (tips.length === 0) return { success: true, message: 'No active wiretaps or informant tips.' };
      const lines = tips.map(
        (t) => `• [${t.purchased ? 'DECRYPTED' : 'LOCKED'}] Day ${t.targetDay} | ${t.cityName} - ${t.drugName}: ${t.purchased ? t.headline : `Classified ($${t.cost})`}`
      );
      return { success: true, message: `Active Informant Wire:\n${lines.join('\n')}` };
    }

    case 'vault': {
      const vaults = state.player.vaults || {};
      const citiesWithVaults = Object.keys(vaults).filter((c) => Object.keys(vaults[c] || {}).length > 0);
      if (citiesWithVaults.length === 0) return { success: true, message: 'All safehouse vaults are currently empty.' };
      const summary = citiesWithVaults.map((c) => {
        const cName = CITY_MAP.get(c)?.name ?? c;
        const items = Object.entries(vaults[c])
          .filter(([, u]) => u > 0)
          .map(([d, u]) => `${u}x ${DRUG_MAP.get(d)?.name ?? d}`)
          .join(', ');
        return `• ${cName}: ${items || 'Empty'}`;
      });
      return { success: true, message: `Safehouse Vaults:\n${summary.join('\n')}` };
    }

    case 'shipments': {
      const shipments = state.player.shipments || [];
      const inTransit = shipments.filter((s) => s.status === 'in_transit');
      if (inTransit.length === 0) return { success: true, message: 'No active courier shipments in transit.' };
      const list = inTransit.map((s) => {
        const o = CITY_MAP.get(s.originCityId)?.name ?? s.originCityId;
        const t = CITY_MAP.get(s.targetCityId)?.name ?? s.targetCityId;
        const d = DRUG_MAP.get(s.drugId)?.name ?? s.drugId;
        return `• ${s.units}x ${d} [${o} -> ${t}] ETA: ${s.daysRemaining}d`;
      });
      return { success: true, message: `Active Courier Shipments:\n${list.join('\n')}` };
    }

    case 'vault_give': {
      if (!arg1 || !arg2 || !arg3) return { success: false, message: 'Usage: vault_give <city_id> <drug_id> <units>' };
      const city = CITY_MAP.get(arg1.toLowerCase());
      if (!city) return { success: false, message: `Unknown city: "${arg1}"` };
      const drug = DRUG_MAP.get(arg2.toLowerCase());
      if (!drug) return { success: false, message: `Unknown drug: "${arg2}"` };
      const units = parseInt(arg3, 10);
      if (isNaN(units) || units <= 0) return { success: false, message: 'Invalid quantity' };

      if (!state.player.vaults) state.player.vaults = {};
      if (!state.player.vaults[city.id]) state.player.vaults[city.id] = {};
      state.player.vaults[city.id][drug.id] = (state.player.vaults[city.id][drug.id] || 0) + units;

      return { success: true, message: `Injected ${units} units of ${drug.name} into ${city.name} safehouse vault.` };
    }

    case 'precursor': {
      if (!arg1) return { success: false, message: 'Usage: precursor <id|all> <quantity>' };
      const qty = parseInt(arg2 ?? '50', 10);
      if (isNaN(qty) || qty <= 0) return { success: false, message: 'Invalid quantity' };
      if (!state.player.precursorInventory) state.player.precursorInventory = {};

      if (arg1.toLowerCase() === 'all') {
        for (const pId of Object.keys(PRECURSORS)) {
          state.player.precursorInventory[pId] = (state.player.precursorInventory[pId] || 0) + qty;
        }
        return { success: true, message: `Granted +${qty} units of ALL chemical precursors.` };
      }

      const prec = PRECURSORS[arg1.toLowerCase()];
      if (!prec) return { success: false, message: `Unknown precursor: "${arg1}". Try: ephedrine, acetic_anhydride, pill_binder, ergot_solvents, bio_precursor_z, hydro_nutrients, or "all".` };

      state.player.precursorInventory[prec.id] = (state.player.precursorInventory[prec.id] || 0) + qty;
      return { success: true, message: `Granted +${qty} units of ${prec.name}.` };
    }

    case 'finish_cook':
    case 'finishcook': {
      const batches = state.player.activeCookBatches || [];
      if (batches.length === 0) return { success: true, message: 'No active cook batches running.' };
      for (const b of batches) {
        b.daysRemaining = 0;
        b.status = 'ready';
      }
      return { success: true, message: `Fast-forwarded ${batches.length} cooking batches to READY status.` };
    }

    case 'fake':
    case 'fake_drug': {
      if (!arg1) return { success: false, message: 'Usage: fake <drug_id> <quantity>' };
      const drug = DRUG_MAP.get(arg1.toLowerCase());
      if (!drug) return { success: false, message: `Unknown drug: "${arg1}"` };
      const units = parseInt(arg2 ?? '10', 10);
      if (isNaN(units) || units <= 0) return { success: false, message: 'Invalid quantity' };

      const existing = state.player.inventory[drug.id];
      if (existing) {
        existing.units += units;
        existing.fakeUnits = (existing.fakeUnits || 0) + units;
      } else {
        state.player.inventory[drug.id] = {
          drugId: drug.id,
          units,
          avgCost: drug.basePrice,
          fakeUnits: units,
        };
      }
      return { success: true, message: `Injected ${units} counterfeit/adulterated units of ${drug.name} into your stash.` };
    }

    case 'rico': {
      if (!arg1) return { success: false, message: 'Usage: rico <0-100> (e.g. "rico 100" to trigger asset freeze or "rico 0" to clear)' };
      const val = parseInt(arg1, 10);
      if (isNaN(val) || val < 0 || val > 100) return { success: false, message: 'RICO meter value must be an integer between 0 and 100' };
      state.player.ricoMeter = val;
      state.player.isBankFrozen = val >= 100;
      return {
        success: true,
        message: `Set Federal Grand Jury RICO Indictment Meter to ${val}%. ${val >= 100 ? '🚨 Bank assets FROZEN by federal injunction!' : 'Bank assets unfrozen.'}`,
      };
    }

    case 'corrupt': {
      if (!arg1) {
        return {
          success: false,
          message:
            'Usage: corrupt <official_id>\n' +
            'Available IDs: airport_baggage_handler, police_dispatcher, fincen_auditor',
        };
      }
      const official = CORRUPT_MAP.get(arg1 as CorruptOfficialId);
      if (!official) {
        return {
          success: false,
          message: `Unknown corrupt official ID "${arg1}". Valid IDs: airport_baggage_handler, police_dispatcher, fincen_auditor`,
        };
      }
      if (!state.player.corruptOfficials) state.player.corruptOfficials = {};
      state.player.corruptOfficials[official.id] = {
        id: official.id,
        hiredDay: state.player.currentDay,
        active: true,
        totalBribesPaid: 0,
      };
      return {
        success: true,
        message: `Recruited ${official.name} onto underworld payroll (Active: ${official.perkTitle}).`,
      };
    }

    case 'escape': {
      const destination = arg1 || 'dubai';
      // Emergency escape needs GameEngineState
      const engineState = {
        player: state.player,
        market: state.market as any,
        logs: [] as any[],
      };
      const res = emergencyExtraditionEscape(engineState, destination);
      return {
        success: res.success,
        message: res.message,
      };
    }

    case 'hotspots': {
      const spots = evaluateCityHotspots(state.player, state.player.currentDay);
      if (spots.length === 0) return { success: true, message: 'No active geopolitical hotspots detected.' };
      const lines = spots.map(
        (s) => `• [${s.badgeLabel}] ${s.cityName}: ${s.title} (${s.severity.toUpperCase()})`
      );
      return {
        success: true,
        message: `Active Geopolitical Smuggling Hotspots:\n${lines.join('\n')}`,
      };
    }

    case 'blockade': {
      const cityId = (arg1 || state.player.currentCityId).toLowerCase();
      const city = CITY_MAP.get(cityId);
      if (!city) return { success: false, message: `Unknown city "${arg1}"` };
      if (!state.player.cityHeat) state.player.cityHeat = {};
      state.player.cityHeat[city.id] = 85;
      state.player.pendingRaidWarning = {
        cityId: city.id,
        day: state.player.currentDay + 1,
        message: `DISPATCH WIRE: SWAT task force raid planned for ${city.name}!`,
        severity: 'imminent',
      };
      return {
        success: true,
        message: `Enforced tactical DEA / SWAT blockade cordon on ${city.name} (Heat set to 85%, raid alert triggered).`,
      };
    }

    case 'turf_war': {
      const attackerId = (arg1 || 'medellin').toLowerCase() as SyndicateId;
      const defenderId = (arg2 || 'synthetic_chem').toLowerCase() as SyndicateId;
      if (!SYNDICATE_MAP.has(attackerId)) {
        return { success: false, message: `Unknown syndicate "${arg1}". Valid: medellin, golden_triangle, synthetic_chem, designer_ring, balkan` };
      }
      if (!SYNDICATE_MAP.has(defenderId)) {
        return { success: false, message: `Unknown syndicate "${arg2}". Valid: medellin, golden_triangle, synthetic_chem, designer_ring, balkan` };
      }
      const war = triggerTurfWar(attackerId, defenderId, state.player.currentDay);
      if (!state.player.activeTurfWars) state.player.activeTurfWars = [];
      state.player.activeTurfWars.push(war);
      return {
        success: true,
        message: `Ignited Turf War! ${war.headline} Contested: ${war.contestedCityIds.join(', ')} (${war.durationDays} days).`,
      };
    }

    case 'macro_event': {
      const type = (arg1 || 'deep_web_takedown').toLowerCase() as MacroEventType;
      const validTypes: MacroEventType[] = [
        'deep_web_takedown',
        'port_strike',
        'federal_task_force',
        'border_clashes',
        'precursor_embargo',
      ];
      if (!validTypes.includes(type)) {
        return { success: false, message: `Unknown macro shock "${arg1}". Valid: ${validTypes.join(', ')}` };
      }
      const ev = triggerMacroEvent(type, state.player.currentDay);
      if (!state.player.activeMacroEvents) state.player.activeMacroEvents = [];
      state.player.activeMacroEvents.push(ev);
      return {
        success: true,
        message: `Triggered Black Swan Macro Shock: ${ev.title} (${ev.durationDays} days)! ${ev.headline}`,
      };
    }

    default:
      return { success: false, message: `Unknown command: "${action}". Type "help" for a list of cheats.` };
  }
}

/**
 * Initializes global browser dev console hooks (window.drugLordCheat)
 */
export function registerWindowCheatApi(storeApi: {
  executeCheat: (cmd: string) => CheatExecutionResult;
}) {
  if (typeof window === 'undefined') return;

  const cheatApi = {
    addCash: (n: number) => storeApi.executeCheat(`cash +${n}`),
    setCash: (n: number) => storeApi.executeCheat(`cash ${n}`),
    addBank: (n: number) => storeApi.executeCheat(`bank +${n}`),
    addDays: (n: number) => storeApi.executeCheat(`days +${n}`),
    clearDebt: () => storeApi.executeCheat('clear_debt'),
    godMode: () => storeApi.executeCheat('god'),
    heal: () => storeApi.executeCheat('heal'),
    setCapacity: (n: number) => storeApi.executeCheat(`capacity ${n}`),
    teleport: (cityId: string) => storeApi.executeCheat(`teleport ${cityId}`),
    rigMarket: (drugId: string, price: number) => storeApi.executeCheat(`rig ${drugId} ${price}`),
    help: () => storeApi.executeCheat('help'),
    memoryView: () => memoryMirror.readMemory(),
  };

  (window as unknown as { drugLordCheat: typeof cheatApi }).drugLordCheat = cheatApi;
}
