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
} from '../engine/game';
import { CITY_MAP } from '../engine/constants';

export interface GameStore extends GameEngineState {
  // Modal / View Controls
  activeTab: 'market' | 'places' | 'travel';
  placesSubTab: 'bank' | 'loans' | 'hospital' | 'armory';
  tradeModal: {
    isOpen: boolean;
    drugId: string | null;
    mode: 'buy' | 'sell' | 'dump';
  };

  // Actions
  setActiveTab: (tab: 'market' | 'places' | 'travel') => void;
  setPlacesSubTab: (subTab: 'bank' | 'loans' | 'hospital' | 'armory') => void;
  openTradeModal: (drugId: string, mode: 'buy' | 'sell' | 'dump') => void;
  closeTradeModal: () => void;

  buy: (drugId: string, units: number) => { success: boolean; message: string };
  sell: (drugId: string, units: number) => { success: boolean; message: string };
  dump: (drugId: string, units: number) => { success: boolean; message: string };
  deposit: (amount: number) => { success: boolean; message: string };
  withdraw: (amount: number) => { success: boolean; message: string };
  repay: (amount: number) => { success: boolean; message: string };
  borrow: (sharkId: string, amount: number) => { success: boolean; message: string };
  heal: (targetHp: number) => { success: boolean; message: string };
  travel: (targetCityId: string) => { success: boolean; message: string };
  nextDay: () => void;
  resolveEncounterAction: (action: 'fight' | 'flee' | 'bribe' | 'surrender') => void;
  restartGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),
  activeTab: 'market',
  placesSubTab: 'bank',
  tradeModal: {
    isOpen: false,
    drugId: null,
    mode: 'buy',
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setPlacesSubTab: (subTab) => set({ placesSubTab: subTab }),

  openTradeModal: (drugId, mode) =>
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

  buy: (drugId, units) => {
    const state = {
      player: { ...get().player, inventory: { ...get().player.inventory } },
      market: { ...get().market },
      logs: [...get().logs],
    };
    const result = buyDrug(state, drugId, units);
    if (result.success) {
      set({
        player: state.player,
        market: state.market,
        logs: state.logs,
      });
    }
    return result;
  },

  sell: (drugId, units) => {
    const state = {
      player: { ...get().player, inventory: { ...get().player.inventory } },
      market: { ...get().market },
      logs: [...get().logs],
    };
    const result = sellDrug(state, drugId, units);
    if (result.success) {
      set({
        player: state.player,
        market: state.market,
        logs: state.logs,
      });
    }
    return result;
  },

  dump: (drugId, units) => {
    const state = {
      player: { ...get().player, inventory: { ...get().player.inventory } },
      market: { ...get().market },
      logs: [...get().logs],
    };
    const result = dumpDrug(state, drugId, units);
    if (result.success) {
      set({
        player: state.player,
        logs: state.logs,
      });
    }
    return result;
  },

  deposit: (amount) => {
    const state = {
      player: { ...get().player },
      market: { ...get().market },
      logs: [...get().logs],
    };
    const result = depositBank(state, amount);
    if (result.success) {
      set({ player: state.player, logs: state.logs });
    }
    return result;
  },

  withdraw: (amount) => {
    const state = {
      player: { ...get().player },
      market: { ...get().market },
      logs: [...get().logs],
    };
    const result = withdrawBank(state, amount);
    if (result.success) {
      set({ player: state.player, logs: state.logs });
    }
    return result;
  },

  repay: (amount) => {
    const state = {
      player: { ...get().player },
      market: { ...get().market },
      logs: [...get().logs],
    };
    const result = repayLoan(state, amount);
    if (result.success) {
      set({ player: state.player, logs: state.logs });
    }
    return result;
  },

  borrow: (sharkId, amount) => {
    const state = {
      player: { ...get().player },
      market: { ...get().market },
      logs: [...get().logs],
    };
    const result = borrowLoan(state, sharkId, amount);
    if (result.success) {
      set({ player: state.player, logs: state.logs });
    }
    return result;
  },

  heal: (targetHp) => {
    const state = {
      player: { ...get().player },
      market: { ...get().market },
      logs: [...get().logs],
    };
    const result = healAtHospital(state, targetHp);
    if (result.success) {
      set({ player: state.player, logs: state.logs });
    }
    return result;
  },

  travel: (targetCityId) => {
    const state = {
      player: { ...get().player },
      market: { ...get().market },
      logs: [...get().logs],
    };
    const result = travelToCity(state, targetCityId);
    if (result.success) {
      set({
        player: state.player,
        market: state.market,
        logs: state.logs,
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
    set({
      player: state.player,
      market: state.market,
      logs: state.logs,
    });
  },

  resolveEncounterAction: (action) => {
    const state = {
      player: { ...get().player },
      market: { ...get().market },
      logs: [...get().logs],
    };
    const encounter = state.player.activeEncounter;
    if (!encounter) return;

    const city = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';

    if (action === 'flee') {
      const fleeSuccess = Math.random() > 0.35;
      if (fleeSuccess) {
        state.logs.unshift({
          day: state.player.currentDay,
          city,
          type: 'combat',
          message: `You successfully escaped from ${encounter.enemyName}!`,
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
          message: `Failed to escape! You took ${damage} damage from gunfire!`,
          timestamp: Date.now(),
        });
        if (state.player.health <= 0) {
          state.player.isGameOver = true;
          state.player.gameOverReason = `Killed in action while fleeing ${encounter.enemyName}.`;
        }
      }
    } else if (action === 'bribe') {
      if (state.player.cash >= encounter.bribeCost) {
        state.player.cash -= encounter.bribeCost;
        state.logs.unshift({
          day: state.player.currentDay,
          city,
          type: 'combat',
          message: `Paid $${encounter.bribeCost.toLocaleString()} bribe. ${encounter.enemyName} looked the other way.`,
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
      state.player.cash = 0;
      state.player.inventory = {};
      state.logs.unshift({
        day: state.player.currentDay,
        city,
        type: 'combat',
        message: `${encounter.enemyName} confiscated all your cash and drugs! Thank goodness your bank deposits are safe.`,
        timestamp: Date.now(),
      });
      state.player.activeEncounter = null;
    } else if (action === 'fight') {
      const winRoll = Math.random();
      if (winRoll > 0.4) {
        state.logs.unshift({
          day: state.player.currentDay,
          city,
          type: 'combat',
          message: `Gun battle won! You eliminated ${encounter.enemyName} and secured the scene.`,
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
          message: `You returned fire, but suffered ${damage} damage!`,
          timestamp: Date.now(),
        });
        if (state.player.health <= 0) {
          state.player.isGameOver = true;
          state.player.gameOverReason = `Killed in a gun battle with ${encounter.enemyName}.`;
        }
      }
    }

    set({
      player: state.player,
      logs: state.logs,
    });
  },

  restartGame: () => {
    set({
      ...createInitialState(),
      activeTab: 'market',
      placesSubTab: 'bank',
      tradeModal: { isOpen: false, drugId: null, mode: 'buy' },
    });
  },
}));
