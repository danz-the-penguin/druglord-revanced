import { create } from 'zustand';
import {
  createInitialState,
  GameEngineState,
  buyDrug,
  sellDrug,
  dumpDrug,
  depositBank,
  withdrawBank,
  repayLoan,
  borrowLoan,
  advanceDay,
  travelToCity,
  healAtHospital,
  syncStateToMemory,
  syncStateFromMemory,
  buyProperty,
  buyWeapon,
} from '../engine/game';
import { CITY_MAP, DRUGS } from '../engine/constants';
import { executeCheat, registerWindowCheatApi } from '../engine/cheats';

export interface GameStore extends GameEngineState {
  // Modal / View Controls
  activeTab: 'market' | 'places' | 'travel';
  placesSubTab: 'bank' | 'loans' | 'hospital' | 'armory' | 'laundering' | 'properties';
  isTerminalOpen: boolean;
  fontScale: 'normal' | 'large' | 'xl';
  tradeModal: {
    isOpen: boolean;
    drugId: string | null;
    mode: 'buy' | 'sell' | 'dump';
  };

  // 14-Day Price History for Sparklines
  priceHistory: Record<string, number[]>;

  // Actions
  setActiveTab: (tab: 'market' | 'places' | 'travel') => void;
  setPlacesSubTab: (subTab: 'bank' | 'loans' | 'hospital' | 'armory' | 'laundering' | 'properties') => void;
  setFontScale: (scale: 'normal' | 'large' | 'xl') => void;
  toggleTerminal: () => void;
  openTradeModal: (drugId: string, mode: 'buy' | 'sell' | 'dump') => void;
  closeTradeModal: () => void;

  buy: (drugId: string, units: number) => { success: boolean; message: string };
  sell: (drugId: string, units: number) => { success: boolean; message: string };
  dump: (drugId: string, units: number) => { success: boolean; message: string };
  buyPropertyAction: (propId: string) => { success: boolean; message: string };
  buyWeaponAction: (weaponId: string) => { success: boolean; message: string };
  deposit: (amount: number) => { success: boolean; message: string };
  withdraw: (amount: number) => { success: boolean; message: string };
  repay: (amount: number) => { success: boolean; message: string };
  borrow: (sharkId: string, amount: number) => { success: boolean; message: string };
  heal: (targetHp: number) => { success: boolean; message: string };
  travel: (targetCityId: string) => { success: boolean; message: string };
  nextDay: () => void;
  resolveEncounterAction: (action: 'fight' | 'flee' | 'bribe' | 'surrender') => void;
  runCheat: (cmd: string) => { success: boolean; message: string };
  applyKonamiCode: () => void;
  checkMemoryUpdates: () => void;
  restartGame: () => void;
}

// Generate initial price history
function createInitialPriceHistory(initialMarket: Record<string, { price: number }>) {
  const history: Record<string, number[]> = {};
  for (const drug of DRUGS) {
    const current = initialMarket[drug.id]?.price ?? drug.basePrice;
    // synthesize past 10 days of prices around baseline
    const points: number[] = [];
    for (let i = 0; i < 10; i++) {
      const variance = (Math.random() * 0.4 - 0.2) * drug.basePrice;
      points.push(Math.round(Math.max(drug.minPrice, current + variance)));
    }
    points.push(current);
    history[drug.id] = points;
  }
  return history;
}

const initial = createInitialState();

export const useGameStore = create<GameStore>((set, get) => {
  const storeApi = {
    ...initial,
    activeTab: 'market' as const,
    placesSubTab: 'bank' as const,
    isTerminalOpen: false,
    fontScale: 'normal' as const,
    tradeModal: {
      isOpen: false,
      drugId: null,
      mode: 'buy' as const,
    },
    priceHistory: createInitialPriceHistory(initial.market),

    setActiveTab: (tab: 'market' | 'places' | 'travel') => set({ activeTab: tab }),
    setPlacesSubTab: (subTab: 'bank' | 'loans' | 'hospital' | 'armory' | 'laundering' | 'properties') =>
      set({ placesSubTab: subTab }),
    setFontScale: (scale: 'normal' | 'large' | 'xl') => set({ fontScale: scale }),
    toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),

    openTradeModal: (drugId: string, mode: 'buy' | 'sell' | 'dump') =>
      set({
        tradeModal: {
          isOpen: true,
          drugId,
          mode,
        },
      }),

    closeTradeModal: () =>
      set({
        tradeModal: {
          isOpen: false,
          drugId: null,
          mode: 'buy',
        },
      }),

    buy: (drugId: string, units: number) => {
      const state = {
        player: { ...get().player, inventory: { ...get().player.inventory } },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = buyDrug(state, drugId, units);
      if (result.success) {
        syncStateToMemory(state);
        set({
          player: state.player,
          market: state.market,
          logs: state.logs,
        });
      }
      return result;
    },

    sell: (drugId: string, units: number) => {
      const state = {
        player: { ...get().player, inventory: { ...get().player.inventory } },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = sellDrug(state, drugId, units);
      if (result.success) {
        syncStateToMemory(state);
        set({
          player: state.player,
          market: state.market,
          logs: state.logs,
        });
      }
      return result;
    },

    dump: (drugId: string, units: number) => {
      const state = {
        player: { ...get().player, inventory: { ...get().player.inventory } },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = dumpDrug(state, drugId, units);
      if (result.success) {
        syncStateToMemory(state);
        set({
          player: state.player,
          logs: state.logs,
        });
      }
      return result;
    },

    buyPropertyAction: (propId: string) => {
      const state = {
        player: { ...get().player, ownedProperties: [...get().player.ownedProperties] },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = buyProperty(state, propId);
      if (result.success) {
        syncStateToMemory(state);
        set({
          player: state.player,
          logs: state.logs,
        });
      }
      return result;
    },

    buyWeaponAction: (weaponId: string) => {
      const state = {
        player: {
          ...get().player,
          weapons: { ...get().player.weapons },
          ammo: { ...get().player.ammo },
          armor: get().player.armor ? { ...get().player.armor! } : null,
        },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = buyWeapon(state, weaponId);
      if (result.success) {
        syncStateToMemory(state);
        set({
          player: state.player,
          logs: state.logs,
        });
      }
      return result;
    },

    deposit: (amount: number) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = depositBank(state, amount);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
      }
      return result;
    },

    withdraw: (amount: number) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = withdrawBank(state, amount);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
      }
      return result;
    },

    repay: (amount: number) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = repayLoan(state, amount);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
      }
      return result;
    },

    borrow: (sharkId: string, amount: number) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = borrowLoan(state, sharkId, amount);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
      }
      return result;
    },

    heal: (targetHp: number) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = healAtHospital(state, targetHp);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
      }
      return result;
    },

    travel: (targetCityId: string) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = travelToCity(state, targetCityId);
      if (result.success) {
        // Record price history
        const updatedHistory = { ...get().priceHistory };
        for (const drug of DRUGS) {
          const p = state.market[drug.id]?.price ?? drug.basePrice;
          const hist = updatedHistory[drug.id] ? [...updatedHistory[drug.id]] : [];
          hist.push(p);
          if (hist.length > 14) hist.shift();
          updatedHistory[drug.id] = hist;
        }

        syncStateToMemory(state);
        set({
          player: state.player,
          market: state.market,
          logs: state.logs,
          priceHistory: updatedHistory,
          activeTab: 'market',
        });
      }
      return result;
    },

    nextDay: () => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      advanceDay(state);

      // Record price history
      const updatedHistory = { ...get().priceHistory };
      for (const drug of DRUGS) {
        const p = state.market[drug.id]?.price ?? drug.basePrice;
        const hist = updatedHistory[drug.id] ? [...updatedHistory[drug.id]] : [];
        hist.push(p);
        if (hist.length > 14) hist.shift();
        updatedHistory[drug.id] = hist;
      }

      syncStateToMemory(state);
      set({
        player: state.player,
        market: state.market,
        logs: state.logs,
        priceHistory: updatedHistory,
      });
    },

    resolveEncounterAction: (action: 'fight' | 'flee' | 'bribe' | 'surrender') => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const encounter = state.player.activeEncounter;
      if (!encounter) return;

      const city = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';
      const isGod = state.player.cheats?.godMode;

      if (action === 'flee') {
        const fleeSuccess = isGod || Math.random() > 0.35;
        if (fleeSuccess) {
          state.logs.unshift({
            day: state.player.currentDay,
            city,
            type: 'combat',
            message: `Escaped cleanly from ${encounter.enemyName}!`,
            timestamp: Date.now(),
          });
          state.player.activeEncounter = null;
        } else {
          const damage = Math.floor(15 + Math.random() * 25);
          state.player.health = Math.max(0, state.player.health - damage);
          state.logs.unshift({
            day: state.player.currentDay,
            city,
            type: 'combat',
            message: `Escape thwarted! You took ${damage} damage from gunfire!`,
            timestamp: Date.now(),
          });
          if (state.player.health <= 0) {
            state.player.isGameOver = true;
            state.player.gameOverReason = `Killed in action while fleeing ${encounter.enemyName}.`;
          }
        }
      } else if (action === 'bribe') {
        if (isGod || state.player.cash >= encounter.bribeCost) {
          if (!isGod) state.player.cash -= encounter.bribeCost;
          state.logs.unshift({
            day: state.player.currentDay,
            city,
            type: 'combat',
            message: `Bribe accepted! ${encounter.enemyName} let you walk away.`,
            timestamp: Date.now(),
          });
          state.player.activeEncounter = null;
        } else {
          state.logs.unshift({
            day: state.player.currentDay,
            city,
            type: 'combat',
            message: `Not enough cash to bribe!`,
            timestamp: Date.now(),
          });
        }
      } else if (action === 'surrender') {
        if (!isGod) {
          state.player.cash = 0;
          state.player.inventory = {};
        }
        state.logs.unshift({
          day: state.player.currentDay,
          city,
          type: 'combat',
          message: `${encounter.enemyName} confiscated all your street holdings!`,
          timestamp: Date.now(),
        });
        state.player.activeEncounter = null;
      } else if (action === 'fight') {
        const winRoll = isGod || Math.random() > 0.4;
        if (winRoll) {
          state.logs.unshift({
            day: state.player.currentDay,
            city,
            type: 'combat',
            message: `Victory! You eliminated ${encounter.enemyName} and secured your cargo.`,
            timestamp: Date.now(),
          });
          state.player.activeEncounter = null;
        } else {
          const damage = Math.floor(20 + Math.random() * 35);
          state.player.health = Math.max(0, state.player.health - damage);
          state.logs.unshift({
            day: state.player.currentDay,
            city,
            type: 'combat',
            message: `Firefight was brutal! You suffered ${damage} damage!`,
            timestamp: Date.now(),
          });
          if (state.player.health <= 0) {
            state.player.isGameOver = true;
            state.player.gameOverReason = `Killed in a gun battle with ${encounter.enemyName}.`;
          }
        }
      }

      syncStateToMemory(state);
      set({
        player: state.player,
        logs: state.logs,
      });
    },

    runCheat: (cmd: string) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        cheats: { ...get().player.cheats },
      };

      const result = executeCheat(cmd, state);
      if (result.success) {
        state.player.cheats = state.cheats;
        const currentCity = CITY_MAP.get(state.player.currentCityId)?.name ?? 'Terminal';

        const updatedLogs = [
          {
            day: state.player.currentDay,
            city: currentCity,
            type: 'cheat' as const,
            message: `[DEV COMMAND] ${cmd} => ${result.message}`,
            timestamp: Date.now(),
          },
          ...get().logs,
        ];

        syncStateToMemory({ player: state.player, market: state.market, logs: updatedLogs });

        set({
          player: state.player,
          market: state.market,
          logs: updatedLogs,
        });
      }
      return result;
    },

    applyKonamiCode: () => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };

      state.player.cash += 10000000;
      state.player.bank += 50000000;
      state.player.debt = 0;
      state.player.loanSharkId = null;
      state.player.loanDaysLeft = 0;
      state.player.health = 100;
      state.player.maxDays += 100;
      state.player.currentRankId = 'drug_lord';
      state.player.cheats.godMode = true;
      state.player.cheats.extraCapacity += 10000;

      state.logs.unshift({
        day: state.player.currentDay,
        city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'HQ',
        type: 'cheat',
        message: '⚡ [KONAMI OVERRIDE] Syndicate God Mode Activated: +$10M Cash, +$50M Bank, +10,000 Capacity, Invulnerability ON.',
        timestamp: Date.now(),
      });

      syncStateToMemory(state);
      set({
        player: state.player,
        logs: state.logs,
      });
    },

    checkMemoryUpdates: () => {
      const current = {
        player: { ...get().player },
        market: { ...get().market },
        logs: get().logs,
      };
      const wasModifiedExternally = syncStateFromMemory(current);
      if (wasModifiedExternally) {
        set({ player: current.player });
      }
    },

    restartGame: () => {
      const fresh = createInitialState();
      syncStateToMemory(fresh);
      set({
        ...fresh,
        activeTab: 'market',
        placesSubTab: 'bank',
        isTerminalOpen: false,
        priceHistory: createInitialPriceHistory(fresh.market),
        tradeModal: { isOpen: false, drugId: null, mode: 'buy' },
      });
    },
  };

  // Register window.drugLordCheat API for browser F12 DevTools console
  registerWindowCheatApi({
    executeCheat: storeApi.runCheat,
  });

  return storeApi;
});
