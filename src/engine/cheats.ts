import { memoryMirror } from './memoryBuffer';
import { CITY_MAP, DRUG_MAP } from './constants';
import { PlayerState } from './types';
import { soundEngine, SoundEffect } from '../utils/audio';
import { PRECURSORS } from './production';

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
          '• vault                    : Inspect multi-city safehouse vaults\n' +
          '• shipments                : Inspect in-transit courier shipments\n' +
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
