import { memoryMirror } from './memoryBuffer';
import { CITY_MAP, DRUG_MAP } from './constants';
import { PlayerState } from './types';

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
          '• noscent <count>          : Grant No-Scent spray cans',
      };

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
