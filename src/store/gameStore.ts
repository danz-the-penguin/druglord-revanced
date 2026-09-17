import { create } from 'zustand';
import {
  createInitialState,
  GameEngineState,
  buyDrug,
  sellDrug,
  dumpDrug,
  dumpFakeDrugs,
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
  retireEmpire,
  purchaseCleanIdentity,
  bribePolice,
  modifyCityHeat,
  depositToVault,
  withdrawFromVault,
  dispatchCourier,
  purchaseIntelTip,
  buyShellBusiness,
  buyCorporateUpgrade,
  executeBusinessLaundering,
  acceptSyndicateContract,
  deliverSyndicateContract,
  paySyndicateTributeAction,
  buyAircraft,
  selectActiveAircraft,
  getTotalWealth,
  buySwissSecurityTier,
  buyBearerBond,
  claimMaturedBearerBonds,
  buyConsularImmunity,
  buyPropertyUpgrade,
  overhaulAircraft,
  buyAvionicsUpgrade,
  collectProtectionRacket,
  executeStrikeContract,
} from '../engine/game';
import { CITY_MAP, CITIES, DRUGS, RANK_MAP } from '../engine/constants';
import {
  BOUNTY_CHALLENGES,
  getTodayDailySeed,
  generateRandomSeed,
  generateChallengeProofCode,
  saveDailyChallengeRecord,
  applyChallengeModifiersToNewGame,
} from '../engine/dailyChallenge';
import { generateAllCitiesPrices, createInitialGlobalPriceHistory } from '../engine/economy';
import { executeCheat, registerWindowCheatApi } from '../engine/cheats';
import {
  GameDurationMode,
  DURATION_MODES,
  FlightSeatClass,
  SyndicateId,
  CombatDuelAction,
  SwissAccountTier,
  BearerBond,
  ConsularImmunityLevel,
  SafehouseUpgradeId,
} from '../engine/types';
import {
  SaveSlotId,
  DrugLordSaveFile,
  createSaveFile,
  saveToLocalStorage,
  loadFromLocalStorage,
  deleteLocalSaveSlot,
  clearAllLocalSaves,
  parseAndValidateSave,
} from '../engine/persistence';
import { soundEngine, SoundEffect } from '../utils/audio';
import {
  evaluateAchievements,
  getGlobalAchievements,
  Achievement,
  AchievementEvaluationContext,
} from '../engine/achievements';
import {
  recordHallOfFameEntry,
  HallOfFameEntry,
} from '../engine/hallOfFame';
import { LabType } from '../engine/productionTypes';
import {
  buildLab,
  buyPrecursor,
  startCookBatch,
  collectCookBatch,
  cancelCookBatch,
} from '../engine/production';
import { CorruptOfficialId } from '../engine/corruptionTypes';
import {
  hireOfficial,
  fireOfficial,
  bribeGrandJury,
  emergencyExtraditionEscape,
} from '../engine/corruption';

export interface GameStore extends GameEngineState {
  // Modal / View Controls
  activeTab: 'market' | 'places' | 'travel';
  placesSubTab: 'bank' | 'loans' | 'hospital' | 'armory' | 'laundering' | 'properties' | 'vaults' | 'informant' | 'aviation' | 'labs';
  isTerminalOpen: boolean;
  isSaveModalOpen: boolean;
  isHallOfFameOpen: boolean;
  hallOfFameTab: 'leaderboard' | 'achievements';
  recentlyUnlockedAchievement: Achievement | null;
  fontScale: 'normal' | 'large' | 'xl';
  tradeModal: {
    isOpen: boolean;
    drugId: string | null;
    mode: 'buy' | 'sell' | 'dump';
  };

  // 14-Day Price History for Sparklines
  priceHistory: Record<string, number[]>;

  // Multi-Country Price History across all 30 cities and 20 drugs
  globalPriceHistory: Record<string, Record<string, number[]>>;

  // Drug Graph Modal (Old Drug Lord Style)
  isDrugGraphOpen: boolean;
  selectedGraphDrugId: string | null;
  openDrugGraph: (drugId: string) => void;
  closeDrugGraph: () => void;

  // Global Multi-Country Price Analytics & Arbitrage Modal
  isGlobalAnalyticsOpen: boolean;
  selectedAnalyticsDrugId: string;
  openGlobalAnalytics: (drugId?: string) => void;
  closeGlobalAnalytics: () => void;
  setSelectedAnalyticsDrugId: (drugId: string) => void;

  // Syndicate Cartels Diplomacy Modal
  isSyndicateModalOpen: boolean;
  openSyndicateModal: () => void;
  closeSyndicateModal: () => void;
  acceptContract: (contractId: string) => { success: boolean; message: string };
  deliverContract: (contractId: string) => { success: boolean; message: string };
  paySyndicateTribute: (syndicateId: SyndicateId) => { success: boolean; message: string };

  // Daily Challenge & Cartel Bounty Board Modal
  isDailyChallengeOpen: boolean;
  dailyChallengeTab: 'daily' | 'bounties' | 'custom' | 'records';
  openDailyChallenge: (tab?: 'daily' | 'bounties' | 'custom' | 'records') => void;
  closeDailyChallenge: () => void;
  startChallengeRun: (challengeId: string, customSeed?: string, durationMode?: GameDurationMode) => { success: boolean; message: string };

  // Airport Flights & Departures Board Modal
  isFlightBoardOpen: boolean;
  openFlightBoard: () => void;
  closeFlightBoard: () => void;
  bookFlightAction: (
    targetCityId: string,
    seatClass: FlightSeatClass,
    ticketCostOverride?: number,
    useOwnedAircraft?: boolean
  ) => { success: boolean; message: string };

  // Private Aircraft Fleet & Hangars
  buyAircraftAction: (aircraftId: string) => { success: boolean; message: string };
  selectActiveAircraftAction: (aircraftId: string | null) => { success: boolean; message: string };
  overhaulAircraftAction: (aircraftId: string) => { success: boolean; message: string };
  buyAvionicsUpgradeAction: (aircraftId: string, upgradeType: 'aux_tanks' | 'hidden_compartment' | 'transponder_spoofer') => { success: boolean; message: string };

  // Swiss Offshore Private Banking & Bearer Bonds
  buySwissSecurityTierAction: (tier: SwissAccountTier) => { success: boolean; message: string };
  buyBearerBondAction: (bondType: BearerBond['bondType']) => { success: boolean; message: string };
  claimMaturedBearerBondsAction: () => { success: boolean; message: string; claimedCash: number };
  buyConsularImmunityAction: (level: ConsularImmunityLevel) => { success: boolean; message: string };

  // Safehouse Modular Upgrades
  buyPropertyUpgradeAction: (propertyId: string, upgradeId: SafehouseUpgradeId) => { success: boolean; message: string };

  // Syndicate War Room
  collectProtectionRacketAction: () => { success: boolean; message: string; collectedCash: number };
  executeStrikeContractAction: (contractId: string) => { success: boolean; message: string; cashReward?: number; repReward?: number };

  // Shell Businesses & Corporate Laundering
  buyShellBusinessAction: (businessId: string) => { success: boolean; message: string };
  buyCorporateUpgradeAction: (upgradeId: string) => { success: boolean; message: string };
  executeBusinessLaunderAction: (businessId: string, amount: number) => { success: boolean; message: string };

  // Clandestine Production Labs & Precursors
  buildLabAction: (propertyId: string, labType: LabType) => { success: boolean; message: string };
  buyPrecursorAction: (precursorId: string, units: number, payFrom?: 'cash' | 'bank') => { success: boolean; message: string };
  startCookBatchAction: (propertyId: string, recipeId: string, batchCount?: number) => { success: boolean; message: string };
  collectCookBatchAction: (batchId: string, destination?: 'pocket' | 'vault') => { success: boolean; message: string };
  cancelCookBatchAction: (batchId: string) => { success: boolean; message: string };

  // Corruption & Federal Grand Jury RICO Indictment Actions
  hireOfficialAction: (officialId: CorruptOfficialId, assignedBusinessId?: string) => { success: boolean; message: string };
  fireOfficialAction: (officialId: CorruptOfficialId) => { success: boolean; message: string };
  bribeGrandJuryAction: (amount?: number) => { success: boolean; message: string };
  emergencyExtraditionEscapeAction: (destinationCityId: string) => { success: boolean; message: string };

  // Tactical Firefight Duel Combat
  tacticalCombatRound: number;
  combatCoverActive: boolean;
  enemyBlindedRounds: number;
  combatLogs: string[];
  resolveTacticalCombatAction: (action: CombatDuelAction) => void;

  // Persistence & Save Manager
  lastSavedAt: number | null;
  toggleSaveModal: (open?: boolean) => void;
  saveGame: (slotId: SaveSlotId, title?: string) => { success: boolean; message: string };
  loadGame: (saveData: DrugLordSaveFile) => { success: boolean; message: string };
  exportCurrentSave: (slotId?: SaveSlotId) => DrugLordSaveFile;
  importGameString: (rawInput: string) => { success: boolean; message: string; data?: DrugLordSaveFile };
  deleteSave: (slotId: SaveSlotId) => void;
  clearAllSaves: () => void;

  // Actions
  setActiveTab: (tab: 'market' | 'places' | 'travel') => void;
  setPlacesSubTab: (subTab: 'bank' | 'loans' | 'hospital' | 'armory' | 'laundering' | 'properties' | 'vaults' | 'informant' | 'aviation' | 'labs') => void;
  setFontScale: (scale: 'normal' | 'large' | 'xl') => void;
  toggleTerminal: () => void;
  openTradeModal: (drugId: string, mode: 'buy' | 'sell' | 'dump') => void;
  closeTradeModal: () => void;

  buy: (drugId: string, units: number) => { success: boolean; message: string };
  sell: (drugId: string, units: number) => { success: boolean; message: string };
  dump: (drugId: string, units: number) => { success: boolean; message: string };
  dumpFakeDrugsAction: (drugId: string) => { success: boolean; message: string };
  depositToVaultAction: (drugId: string, units: number, cityId?: string) => { success: boolean; message: string };
  withdrawFromVaultAction: (drugId: string, units: number, cityId?: string) => { success: boolean; message: string };
  dispatchCourierAction: (params: {
    shipperId: string;
    originCityId?: string;
    targetCityId: string;
    drugId: string;
    units: number;
    source?: 'inventory' | 'vault';
  }) => { success: boolean; message: string };
  buyIntelAction: (tipId: string) => { success: boolean; message: string };
  buyPropertyAction: (propId: string) => { success: boolean; message: string };
  buyWeaponAction: (weaponId: string) => { success: boolean; message: string };
  deposit: (amount: number) => { success: boolean; message: string };
  withdraw: (amount: number) => { success: boolean; message: string };
  repay: (amount: number) => { success: boolean; message: string };
  borrow: (sharkId: string, amount: number) => { success: boolean; message: string };
  heal: (targetHp: number) => { success: boolean; message: string };
  travel: (targetCityId: string, seatClass?: FlightSeatClass, flightCostOverride?: number, useOwnedAircraft?: boolean) => { success: boolean; message: string };
  nextDay: () => void;
  resolveEncounterAction: (action: 'fight' | 'flee' | 'bribe' | 'surrender') => void;
  runCheat: (cmd: string) => { success: boolean; message: string };
  applyKonamiCode: () => void;
  checkMemoryUpdates: () => void;
  retireEmpireAction: () => { success: boolean; message: string };
  buyCleanIdentityAction: () => { success: boolean; message: string };
  bribePoliceAction: () => { success: boolean; message: string };
  setDurationMode: (mode: GameDurationMode) => void;
  restartGame: (mode?: GameDurationMode) => void;

  // Web Audio & Sound FX
  audioVolume: number;
  isAudioMuted: boolean;
  setAudioVolume: (volume: number) => void;
  toggleAudioMute: () => void;
  playSfx: (effect: SoundEffect) => void;

  // Hall of Fame & Achievements
  openHallOfFame: (tab?: 'leaderboard' | 'achievements') => void;
  closeHallOfFame: () => void;
  dismissAchievementToast: () => void;
  submitRunToHallOfFame: (alias: string) => HallOfFameEntry;
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

let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
function triggerAutoSave(get: () => GameStore, set: any) {
  if (typeof window === 'undefined') return;
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    try {
      const current = get();
      const saveFile = createSaveFile(
        {
          player: current.player,
          market: current.market,
          logs: current.logs,
          priceHistory: current.priceHistory,
          globalPriceHistory: current.globalPriceHistory,
        },
        'autosave'
      );
      const ok = saveToLocalStorage('autosave', saveFile);
      if (ok) {
        set({ lastSavedAt: Date.now() });
      }
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
  }, 350);
}

function getInitialStoreState() {
  const fresh = createInitialState();
  if (typeof window === 'undefined') {
    return {
      state: fresh,
      priceHistory: createInitialPriceHistory(fresh.market),
      globalPriceHistory: createInitialGlobalPriceHistory(fresh.player.currentCityId, fresh.market),
      lastSavedAt: null,
    };
  }

  const saved = loadFromLocalStorage('autosave');
  if (saved && saved.state?.player) {
    syncStateToMemory(saved.state);
    return {
      state: {
        player: saved.state.player,
        market: saved.state.market,
        logs: saved.state.logs,
      },
      priceHistory: saved.state.priceHistory || createInitialPriceHistory(saved.state.market),
      globalPriceHistory:
        saved.state.globalPriceHistory && Object.keys(saved.state.globalPriceHistory).length > 0
          ? saved.state.globalPriceHistory
          : createInitialGlobalPriceHistory(saved.state.player.currentCityId, saved.state.market),
      lastSavedAt: saved.savedAt || null,
    };
  }

  return {
    state: fresh,
    priceHistory: createInitialPriceHistory(fresh.market),
    globalPriceHistory: createInitialGlobalPriceHistory(fresh.player.currentCityId, fresh.market),
    lastSavedAt: null,
  };
}

function checkAchievementsAndUpdate(
  get: () => GameStore,
  set: (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void,
  context?: AchievementEvaluationContext
) {
  const current = get();
  const globalUnlocked = getGlobalAchievements();
  const runUnlocked = current.player.unlockedAchievements || [];
  const merged = new Set([...globalUnlocked, ...runUnlocked]);

  const { newlyUnlocked, allUnlocked } = evaluateAchievements(current.player, merged, context);

  if (newlyUnlocked.length > 0) {
    const updatedLogs = [...current.logs];
    for (const ach of newlyUnlocked) {
      updatedLogs.unshift({
        day: current.player.currentDay,
        city: CITY_MAP.get(current.player.currentCityId)?.name ?? 'Syndicate',
        type: 'event',
        message: `🎖️ ACHIEVEMENT UNLOCKED: "${ach.title}" — ${ach.description} (+${ach.prestigePoints} Prestige PTS)`,
        timestamp: Date.now(),
      });
      soundEngine.play('victory');
    }

    set({
      player: {
        ...current.player,
        unlockedAchievements: Array.from(allUnlocked),
      },
      logs: updatedLogs,
      recentlyUnlockedAchievement: newlyUnlocked[0],
    });
  }
}

export const useGameStore = create<GameStore>((set, get) => {
  const initialPayload = getInitialStoreState();
  const storeApi = {
    ...initialPayload.state,
    activeTab: 'market' as const,
    placesSubTab: 'bank' as const,
    isTerminalOpen: false,
    isSaveModalOpen: false,
    isHallOfFameOpen: false,
    hallOfFameTab: 'leaderboard' as const,
    recentlyUnlockedAchievement: null,
    lastSavedAt: initialPayload.lastSavedAt,
    fontScale: 'normal' as const,
    tradeModal: {
      isOpen: false,
      drugId: null,
      mode: 'buy' as const,
    },
    priceHistory: initialPayload.priceHistory,
    globalPriceHistory: initialPayload.globalPriceHistory,

    // Drug Graph Modal
    isDrugGraphOpen: false,
    selectedGraphDrugId: null,
    openDrugGraph: (drugId: string) => {
      soundEngine.play('click');
      set({ isDrugGraphOpen: true, selectedGraphDrugId: drugId });
    },
    closeDrugGraph: () => {
      soundEngine.play('click');
      set({ isDrugGraphOpen: false, selectedGraphDrugId: null });
    },

    // Global Analytics Modal
    isGlobalAnalyticsOpen: false,
    selectedAnalyticsDrugId: 'cocaine',
    openGlobalAnalytics: (drugId?: string) => {
      soundEngine.play('click');
      set({
        isGlobalAnalyticsOpen: true,
        selectedAnalyticsDrugId: drugId || get().selectedAnalyticsDrugId || 'cocaine',
      });
    },
    closeGlobalAnalytics: () => {
      soundEngine.play('click');
      set({ isGlobalAnalyticsOpen: false });
    },
    setSelectedAnalyticsDrugId: (drugId: string) => {
      set({ selectedAnalyticsDrugId: drugId });
    },

    // Syndicate Cartels Diplomacy Modal
    isSyndicateModalOpen: false,
    openSyndicateModal: () => {
      soundEngine.play('click');
      set({ isSyndicateModalOpen: true });
    },
    closeSyndicateModal: () => {
      soundEngine.play('click');
      set({ isSyndicateModalOpen: false });
    },

    // Airport Flights & Departures Board Modal
    isFlightBoardOpen: false,
    openFlightBoard: () => {
      soundEngine.play('click');
      set({ isFlightBoardOpen: true });
    },
    closeFlightBoard: () => {
      soundEngine.play('click');
      set({ isFlightBoardOpen: false });
    },

    // Daily Challenge & Cartel Bounty Board Modal
    isDailyChallengeOpen: false,
    dailyChallengeTab: 'daily' as 'daily' | 'bounties' | 'custom' | 'records',
    openDailyChallenge: (tab: 'daily' | 'bounties' | 'custom' | 'records' = 'daily') => {
      soundEngine.play('click');
      set({ isDailyChallengeOpen: true, dailyChallengeTab: tab });
    },
    closeDailyChallenge: () => {
      soundEngine.play('click');
      set({ isDailyChallengeOpen: false });
    },
    startChallengeRun: (challengeId: string, customSeed?: string, durationMode?: GameDurationMode) => {
      const challenge = BOUNTY_CHALLENGES.find((c) => c.id === challengeId);
      let seed = customSeed?.trim();
      if (!seed) {
        if (challengeId === 'daily_seed') {
          seed = getTodayDailySeed().seed;
        } else {
          seed = generateRandomSeed();
        }
      }
      const mode = durationMode || challenge?.durationMode || 'classic';
      deleteLocalSaveSlot('autosave');
      const fresh = createInitialState(mode);
      applyChallengeModifiersToNewGame(fresh, challengeId, seed);
      syncStateToMemory(fresh);
      set({
        ...fresh,
        activeTab: 'market',
        placesSubTab: 'bank',
        isTerminalOpen: false,
        isSaveModalOpen: false,
        isHallOfFameOpen: false,
        isDailyChallengeOpen: false,
        recentlyUnlockedAchievement: null,
        lastSavedAt: null,
        priceHistory: createInitialPriceHistory(fresh.market),
        globalPriceHistory: createInitialGlobalPriceHistory(fresh.player.currentCityId, fresh.market),
        isDrugGraphOpen: false,
        selectedGraphDrugId: null,
        isGlobalAnalyticsOpen: false,
        tradeModal: { isOpen: false, drugId: null, mode: 'buy' },
      });
      soundEngine.play('victory');
      return {
        success: true,
        message: `Bounty run [${challenge?.title ?? challengeId}] initialized with seed [${seed}]`,
      };
    },

    // Tactical Firefight Duel Combat State
    tacticalCombatRound: 1,
    combatCoverActive: false,
    enemyBlindedRounds: 0,
    combatLogs: [],

    // Web Audio & Sound FX
    audioVolume: soundEngine.getVolume(),
    isAudioMuted: soundEngine.isMuted(),

    setAudioVolume: (volume: number) => {
      soundEngine.setVolume(volume);
      set({ audioVolume: soundEngine.getVolume() });
      soundEngine.play('click');
    },

    toggleAudioMute: () => {
      const muted = soundEngine.toggleMute();
      set({ isAudioMuted: muted });
      if (!muted) {
        soundEngine.play('click');
      }
    },

    playSfx: (effect: SoundEffect) => {
      soundEngine.play(effect);
    },

    openHallOfFame: (tab: 'leaderboard' | 'achievements' = 'leaderboard') => {
      set({ isHallOfFameOpen: true, hallOfFameTab: tab });
      soundEngine.play('click');
    },

    closeHallOfFame: () => {
      set({ isHallOfFameOpen: false });
      soundEngine.play('click');
    },

    dismissAchievementToast: () => {
      set({ recentlyUnlockedAchievement: null });
    },

    submitRunToHallOfFame: (alias: string) => {
      const entry = recordHallOfFameEntry(get().player, alias);
      soundEngine.play('victory');
      return entry;
    },

    toggleSaveModal: (open?: boolean) =>
      set((state) => ({ isSaveModalOpen: open !== undefined ? open : !state.isSaveModalOpen })),

    saveGame: (slotId: SaveSlotId, title?: string) => {
      const current = get();
      const saveFile = createSaveFile(
        {
          player: current.player,
          market: current.market,
          logs: current.logs,
          priceHistory: current.priceHistory,
          globalPriceHistory: current.globalPriceHistory,
        },
        slotId,
        title
      );
      const ok = saveToLocalStorage(slotId, saveFile);
      if (ok) {
        set({ lastSavedAt: Date.now() });
        return {
          success: true,
          message: `Saved successfully to ${slotId === 'autosave' ? 'Auto-Save' : slotId.replace('_', ' ').toUpperCase()}!`,
        };
      }
      return { success: false, message: 'Failed to write to browser local storage.' };
    },

    loadGame: (saveData: DrugLordSaveFile) => {
      if (!saveData || !saveData.state || !saveData.state.player) {
        return { success: false, message: 'Corrupted save data payload' };
      }
      const st = saveData.state;
      syncStateToMemory(st);
      set({
        player: st.player,
        market: st.market,
        logs: st.logs,
        priceHistory: st.priceHistory || createInitialPriceHistory(st.market),
        globalPriceHistory:
          st.globalPriceHistory && Object.keys(st.globalPriceHistory).length > 0
            ? st.globalPriceHistory
            : createInitialGlobalPriceHistory(st.player.currentCityId, st.market),
        lastSavedAt: saveData.savedAt || Date.now(),
        tradeModal: { isOpen: false, drugId: null, mode: 'buy' },
      });
      triggerAutoSave(get, set);
      return {
        success: true,
        message: `Run restored: Day ${st.player.currentDay} • $${st.player.cash.toLocaleString()} Cash`,
      };
    },

    exportCurrentSave: (slotId: SaveSlotId = 'autosave') => {
      const current = get();
      return createSaveFile(
        {
          player: current.player,
          market: current.market,
          logs: current.logs,
          priceHistory: current.priceHistory,
          globalPriceHistory: current.globalPriceHistory,
        },
        slotId
      );
    },

    importGameString: (rawInput: string) => {
      const res = parseAndValidateSave(rawInput);
      if (!res.success) {
        return { success: false, message: res.error };
      }
      const loadRes = get().loadGame(res.data);
      return { success: loadRes.success, message: loadRes.message, data: res.data };
    },

    deleteSave: (slotId: SaveSlotId) => {
      deleteLocalSaveSlot(slotId);
    },

    clearAllSaves: () => {
      clearAllLocalSaves();
      set({ lastSavedAt: null });
    },

    setActiveTab: (tab: 'market' | 'places' | 'travel') => set({ activeTab: tab }),
    setPlacesSubTab: (subTab: 'bank' | 'loans' | 'hospital' | 'armory' | 'laundering' | 'properties' | 'vaults' | 'informant' | 'aviation' | 'labs') =>
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
        triggerAutoSave(get, set);
        soundEngine.play('buy');
        checkAchievementsAndUpdate(get, set, { lastAction: 'buy', unitsTraded: units });
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
        triggerAutoSave(get, set);
        soundEngine.play('sell');
        checkAchievementsAndUpdate(get, set, { lastAction: 'sell', unitsTraded: units });
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
        triggerAutoSave(get, set);
        soundEngine.play('click');
      }
      return result;
    },

    dumpFakeDrugsAction: (drugId: string) => {
      const state = {
        player: { ...get().player, inventory: { ...get().player.inventory }, stats: { ...(get().player.stats || {}) } },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = dumpFakeDrugs(state, drugId);
      if (result.success) {
        syncStateToMemory(state);
        set({
          player: state.player,
          logs: state.logs,
        });
        triggerAutoSave(get, set);
        soundEngine.play('click');
      }
      return result;
    },

    depositToVaultAction: (drugId: string, units: number, cityId?: string) => {
      const state = {
        player: {
          ...get().player,
          inventory: { ...get().player.inventory },
          vaults: { ...get().player.vaults },
        },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = depositToVault(state, drugId, units, cityId);
      if (result.success) {
        syncStateToMemory(state);
        set({
          player: state.player,
          logs: state.logs,
        });
        triggerAutoSave(get, set);
        soundEngine.play('vault');
        checkAchievementsAndUpdate(get, set, { lastAction: 'vault' });
      }
      return result;
    },

    withdrawFromVaultAction: (drugId: string, units: number, cityId?: string) => {
      const state = {
        player: {
          ...get().player,
          inventory: { ...get().player.inventory },
          vaults: { ...get().player.vaults },
        },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = withdrawFromVault(state, drugId, units, cityId);
      if (result.success) {
        syncStateToMemory(state);
        set({
          player: state.player,
          logs: state.logs,
        });
        triggerAutoSave(get, set);
        soundEngine.play('vault');
      }
      return result;
    },

    dispatchCourierAction: (params: {
      shipperId: string;
      originCityId?: string;
      targetCityId: string;
      drugId: string;
      units: number;
      source?: 'inventory' | 'vault';
    }) => {
      const state = {
        player: {
          ...get().player,
          inventory: { ...get().player.inventory },
          vaults: { ...get().player.vaults },
          shipments: [...get().player.shipments],
          stats: { ...(get().player.stats || {}) },
        },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = dispatchCourier(state, params);
      if (result.success) {
        state.player.stats = state.player.stats || {};
        state.player.stats.couriersDispatchedCount = (state.player.stats.couriersDispatchedCount || 0) + 1;
        syncStateToMemory(state);
        set({
          player: state.player,
          logs: state.logs,
        });
        triggerAutoSave(get, set);
        soundEngine.play('courier');
        checkAchievementsAndUpdate(get, set, { lastAction: 'courier' });
      }
      return result;
    },

    buyIntelAction: (tipId: string) => {
      const state = {
        player: {
          ...get().player,
          activeIntel: Array.from(get().player.activeIntel || []),
          stats: { ...(get().player.stats || {}) },
        },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = purchaseIntelTip(state, tipId);
      if (result.success) {
        state.player.stats = state.player.stats || {};
        state.player.stats.intelPurchasedCount = (state.player.stats.intelPurchasedCount || 0) + 1;
        syncStateToMemory(state);
        set({
          player: state.player,
          logs: state.logs,
        });
        triggerAutoSave(get, set);
        soundEngine.play('pager');
        checkAchievementsAndUpdate(get, set, { lastAction: 'intel' });
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
        triggerAutoSave(get, set);
        soundEngine.play('vault');
        checkAchievementsAndUpdate(get, set, { lastAction: 'property' });
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
        triggerAutoSave(get, set);
        soundEngine.play('gunshot');
        checkAchievementsAndUpdate(get, set);
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
        triggerAutoSave(get, set);
        soundEngine.play('bank');
        checkAchievementsAndUpdate(get, set);
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
        triggerAutoSave(get, set);
        soundEngine.play('bank');
        checkAchievementsAndUpdate(get, set);
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
        triggerAutoSave(get, set);
        soundEngine.play('sell');
        checkAchievementsAndUpdate(get, set);
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
        triggerAutoSave(get, set);
        soundEngine.play('bank');
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
        triggerAutoSave(get, set);
        soundEngine.play('heal');
      }
      return result;
    },

    travel: (
      targetCityId: string,
      seatClass: FlightSeatClass = 'economy',
      flightCostOverride?: number,
      useOwnedAircraft = false
    ) => {
      const state = {
        player: {
          ...get().player,
          stats: { ...(get().player.stats || {}) },
        },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = travelToCity(state, targetCityId, seatClass, flightCostOverride, useOwnedAircraft);
      if (result.success) {
        state.player.stats = state.player.stats || {};
        state.player.stats.citiesVisited = state.player.stats.citiesVisited || [];
        if (!state.player.stats.citiesVisited.includes(targetCityId)) {
          state.player.stats.citiesVisited.push(targetCityId);
        }

        // Record price history
        const updatedHistory = { ...get().priceHistory };
        for (const drug of DRUGS) {
          const p = state.market[drug.id]?.price ?? drug.basePrice;
          const hist = updatedHistory[drug.id] ? [...updatedHistory[drug.id]] : [];
          hist.push(p);
          if (hist.length > 14) hist.shift();
          updatedHistory[drug.id] = hist;
        }

        // Record multi-country global price history
        const allPrices = generateAllCitiesPrices(
          targetCityId,
          state.market,
          state.player.currentDay,
          state.player.activeIntel,
          state.player.activeTurfWars,
          state.player.activeMacroEvents
        );
        const updatedGlobal = { ...get().globalPriceHistory };
        for (const drug of DRUGS) {
          if (!updatedGlobal[drug.id]) updatedGlobal[drug.id] = {};
          for (const city of CITIES) {
            const hist = updatedGlobal[drug.id][city.id] ? [...updatedGlobal[drug.id][city.id]] : [];
            const p = allPrices[drug.id]?.[city.id] ?? Math.round(drug.basePrice * (city.drugModifiers[drug.id] ?? 1.0));
            hist.push(p);
            if (hist.length > 20) hist.shift();
            updatedGlobal[drug.id][city.id] = hist;
          }
        }

        syncStateToMemory(state);
        set({
          player: state.player,
          market: state.market,
          logs: state.logs,
          priceHistory: updatedHistory,
          globalPriceHistory: updatedGlobal,
          activeTab: 'market',
          tacticalCombatRound: 1,
          combatCoverActive: false,
          enemyBlindedRounds: 0,
          combatLogs: [],
        });
        triggerAutoSave(get, set);
        if (state.player.activeEncounter) {
          soundEngine.play('police');
        } else {
          soundEngine.play('travel');
        }
        checkAchievementsAndUpdate(get, set, { lastAction: 'travel' });
      }
      return result;
    },

    nextDay: () => {
      const prevRank = get().player.currentRankId;
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

      // Record multi-country global price history
      const allPrices = generateAllCitiesPrices(
        state.player.currentCityId,
        state.market,
        state.player.currentDay,
        state.player.activeIntel,
        state.player.activeTurfWars,
        state.player.activeMacroEvents
      );
      const updatedGlobal = { ...get().globalPriceHistory };
      for (const drug of DRUGS) {
        if (!updatedGlobal[drug.id]) updatedGlobal[drug.id] = {};
        for (const city of CITIES) {
          const hist = updatedGlobal[drug.id][city.id] ? [...updatedGlobal[drug.id][city.id]] : [];
          const p = allPrices[drug.id]?.[city.id] ?? Math.round(drug.basePrice * (city.drugModifiers[drug.id] ?? 1.0));
          hist.push(p);
          if (hist.length > 20) hist.shift();
          updatedGlobal[drug.id][city.id] = hist;
        }
      }

      syncStateToMemory(state);
      set({
        player: state.player,
        market: state.market,
        logs: state.logs,
        priceHistory: updatedHistory,
        globalPriceHistory: updatedGlobal,
      });
      triggerAutoSave(get, set);

      if (state.player.isGameOver) {
        soundEngine.play(state.player.health <= 0 ? 'defeat' : 'victory');
        if (state.player.activeChallengeId) {
          const score = getTotalWealth(state.player);
          const outcome = state.player.health <= 0 ? 'killed' : 'completed';
          const proofCode = generateChallengeProofCode(
            state.player.activeChallengeId,
            state.player.activeChallengeSeed || 'SEED',
            score,
            state.player.currentDay,
            outcome
          );
          const challenge = BOUNTY_CHALLENGES.find((c) => c.id === state.player.activeChallengeId);
          saveDailyChallengeRecord({
            id: `chal_${Date.now()}`,
            challengeId: state.player.activeChallengeId,
            challengeTitle: challenge?.title ?? 'Challenge Run',
            seed: state.player.activeChallengeSeed || 'SEED',
            date: new Date().toISOString().slice(0, 10),
            timestamp: Date.now(),
            finalScore: score,
            netWorth: getTotalWealth(state.player),
            daysSurvived: state.player.currentDay,
            maxDays: state.player.maxDays,
            finalRank: RANK_MAP.get(state.player.currentRankId)?.name ?? state.player.currentRankId,
            outcome,
            proofCode,
            verified: true,
          });
          state.logs.unshift({
            day: state.player.currentDay,
            city: 'Cartel Command',
            type: 'system',
            message: `🔐 BOUNTY RUN RECORDED: Score: ${score.toLocaleString()} PTS • Proof: ${proofCode}`,
            timestamp: Date.now(),
          });
        }
      } else if (state.player.activeEncounter) {
        soundEngine.play('police');
      } else if (state.player.currentRankId !== prevRank) {
        soundEngine.play('demotion');
      } else {
        const anyIntelToday = state.player.activeIntel?.some(
          (i) => i.purchased && i.targetDay === state.player.currentDay
        );
        if (anyIntelToday) {
          soundEngine.play('pager');
        } else {
          soundEngine.play('click');
        }
      }
      checkAchievementsAndUpdate(get, set, { lastAction: 'advanceDay' });
    },

    resolveEncounterAction: (action: 'fight' | 'flee' | 'bribe' | 'surrender') => {
      const state = {
        player: {
          ...get().player,
          stats: { ...(get().player.stats || {}) },
        },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const encounter = state.player.activeEncounter;
      if (!encounter) return;

      const city = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';
      const isGod = state.player.cheats?.godMode;
      let fightWon = false;

      if (action === 'flee') {
        modifyCityHeat(state, state.player.currentCityId, 10);
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
          soundEngine.play('flee');
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
          soundEngine.play('gunshot');
          if (state.player.health <= 0) {
            state.player.isGameOver = true;
            state.player.gameOverReason = `Killed in action while fleeing ${encounter.enemyName}.`;
            soundEngine.play('defeat');
          }
        }
      } else if (action === 'bribe') {
        modifyCityHeat(state, state.player.currentCityId, 8);
        if (isGod || state.player.cash >= encounter.bribeCost) {
          if (!isGod) state.player.cash -= encounter.bribeCost;
          state.player.stats = state.player.stats || {};
          state.player.stats.bribesCount = (state.player.stats.bribesCount || 0) + 1;
          state.logs.unshift({
            day: state.player.currentDay,
            city,
            type: 'combat',
            message: `Bribe accepted! ${encounter.enemyName} let you walk away.`,
            timestamp: Date.now(),
          });
          state.player.activeEncounter = null;
          soundEngine.play('bribe');
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
        modifyCityHeat(state, state.player.currentCityId, -15);
        state.player.stats = state.player.stats || {};
        state.player.stats.surrendersCount = (state.player.stats.surrendersCount || 0) + 1;
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
        soundEngine.play('defeat');
      } else if (action === 'fight') {
        modifyCityHeat(state, state.player.currentCityId, 20);
        const winRoll = isGod || Math.random() > 0.4;
        fightWon = winRoll;
        if (winRoll) {
          state.player.stats = state.player.stats || {};
          state.player.stats.combatWins = (state.player.stats.combatWins || 0) + 1;
          state.logs.unshift({
            day: state.player.currentDay,
            city,
            type: 'combat',
            message: `Victory! You eliminated ${encounter.enemyName} and secured your cargo.`,
            timestamp: Date.now(),
          });
          state.player.activeEncounter = null;
          soundEngine.play('victory');
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
          soundEngine.play('gunshot');
          if (state.player.health <= 0) {
            state.player.isGameOver = true;
            state.player.gameOverReason = `Killed in a gun battle with ${encounter.enemyName}.`;
            soundEngine.play('defeat');
          }
        }
      }

      syncStateToMemory(state);
      set({
        player: state.player,
        logs: state.logs,
      });
      triggerAutoSave(get, set);
      checkAchievementsAndUpdate(get, set, {
        lastAction: 'combat',
        combatWon: fightWon,
        nearDeathSurvival: state.player.health > 0 && state.player.health <= 15,
      });
    },

    resolveTacticalCombatAction: (action: CombatDuelAction) => {
      const state = {
        player: {
          ...get().player,
          inventory: { ...get().player.inventory },
          weapons: { ...get().player.weapons },
          combatConsumables: {
            ...(get().player.combatConsumables || { flashbangs: 0, smokeGrenades: 0, medkits: 0 }),
          },
          stats: { ...(get().player.stats || {}) },
        },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const encounter = state.player.activeEncounter;
      if (!encounter) return;

      const city = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';
      const isGod = state.player.cheats?.godMode;
      const combatLogs = [...(get().combatLogs || [])];
      let currentCover = get().combatCoverActive;
      let blinded = get().enemyBlindedRounds;
      const roundNum = get().tacticalCombatRound + 1;

      let roundEnded = false;
      let playerWon = false;

      if (action === 'use_medkit') {
        if ((state.player.combatConsumables?.medkits ?? 0) <= 0) {
          combatLogs.unshift(`[R${roundNum}] No combat medkits remaining in trauma pack!`);
          set({ combatLogs });
          return;
        }
        state.player.combatConsumables.medkits -= 1;
        const healAmount = 40;
        state.player.health = Math.min(100, state.player.health + healAmount);
        combatLogs.unshift(`[R${roundNum}] MEDKIT: Injected military adrenaline (+${healAmount} HP). Health: ${state.player.health}% HP.`);
        soundEngine.play('heal');
      } else if (action === 'use_flashbang') {
        if ((state.player.combatConsumables?.flashbangs ?? 0) <= 0) {
          combatLogs.unshift(`[R${roundNum}] No M84 flashbangs remaining!`);
          set({ combatLogs });
          return;
        }
        state.player.combatConsumables.flashbangs -= 1;
        blinded = 2;
        combatLogs.unshift(`[R${roundNum}] FLASHBANG: Detonated M84 Stun Grenade! ${encounter.enemyName} is blinded and disoriented!`);
        soundEngine.play('gunshot');
      } else if (action === 'use_smoke') {
        if ((state.player.combatConsumables?.smokeGrenades ?? 0) <= 0) {
          combatLogs.unshift(`[R${roundNum}] No tactical smoke grenades remaining!`);
          set({ combatLogs });
          return;
        }
        state.player.combatConsumables.smokeGrenades -= 1;
        const escapeSuccess = isGod || Math.random() < 0.90;
        if (escapeSuccess) {
          combatLogs.unshift(`[R${roundNum}] SMOKE SCREEN: Thick white phosphorus deployed! Escaped into the alleyways.`);
          state.logs.unshift({
            day: state.player.currentDay,
            city,
            type: 'combat',
            message: `Escaped cleanly from ${encounter.enemyName} behind a dense tactical smoke screen!`,
            timestamp: Date.now(),
          });
          state.player.activeEncounter = null;
          soundEngine.play('flee');
          roundEnded = true;
        } else {
          combatLogs.unshift(`[R${roundNum}] SMOKE SCREEN: Thermal scopes penetrated smoke! Escape cut off!`);
        }
      } else if (action === 'take_cover') {
        currentCover = true;
        combatLogs.unshift(`[R${roundNum}] TACTICAL COVER: Ducked behind armored barricade (-50% incoming damage this turn).`);
        soundEngine.play('click');
      } else if (action === 'flee') {
        const fleeBonus = state.player.challengeModifiers?.fleeAgilityBonus ?? 0;
        const fleeThreshold = Math.max(0.08, 0.35 - fleeBonus);
        const fleeSuccess = isGod || Math.random() > fleeThreshold;
        if (fleeSuccess) {
          combatLogs.unshift(`[R${roundNum}] ESCAPE: Dashed down subway steps and broke contact!`);
          state.logs.unshift({
            day: state.player.currentDay,
            city,
            type: 'combat',
            message: `Escaped cleanly from ${encounter.enemyName}!`,
            timestamp: Date.now(),
          });
          state.player.activeEncounter = null;
          soundEngine.play('flee');
          roundEnded = true;
        } else {
          combatLogs.unshift(`[R${roundNum}] ESCAPE THWARTED: Enforcers pinned your exit corridor!`);
        }
      } else if (action === 'bribe') {
        if (isGod || state.player.cash >= encounter.bribeCost) {
          if (!isGod) state.player.cash -= encounter.bribeCost;
          state.player.stats.bribesCount = (state.player.stats.bribesCount || 0) + 1;
          state.logs.unshift({
            day: state.player.currentDay,
            city,
            type: 'combat',
            message: `Bribe accepted! Handed over $${encounter.bribeCost.toLocaleString()} to ${encounter.enemyName}.`,
            timestamp: Date.now(),
          });
          state.player.activeEncounter = null;
          soundEngine.play('bribe');
          roundEnded = true;
        } else {
          combatLogs.unshift(`[R${roundNum}] BRIBE REJECTED: Not enough cash to satisfy bribe demand!`);
        }
      } else if (action === 'surrender') {
        if (!isGod) {
          state.player.cash = 0;
          state.player.inventory = {};
        }
        state.player.stats.surrendersCount = (state.player.stats.surrendersCount || 0) + 1;
        state.logs.unshift({
          day: state.player.currentDay,
          city,
          type: 'combat',
          message: `${encounter.enemyName} confiscated all your street holdings!`,
          timestamp: Date.now(),
        });
        state.player.activeEncounter = null;
        soundEngine.play('defeat');
        roundEnded = true;
      } else {
        // Attack actions: snap_fire, aim_fire, suppress
        let accuracy = 0.70;
        let suppressEnemy = false;

        if (action === 'aim_fire') {
          accuracy = 0.90;
        } else if (action === 'suppress') {
          accuracy = 0.60;
          suppressEnemy = true;
        }

        const hit = isGod || Math.random() < accuracy;
        if (hit) {
          encounter.count = Math.max(0, encounter.count - 1);
          soundEngine.play('gunshot');
          combatLogs.unshift(
            `[R${roundNum}] HIT! ${action.toUpperCase()}: Direct hit eliminates 1x hostile! (${encounter.count} enemies remaining)`
          );
          if (encounter.count <= 0) {
            playerWon = true;
            roundEnded = true;
            state.player.stats.combatWins = (state.player.stats.combatWins || 0) + 1;
            state.logs.unshift({
              day: state.player.currentDay,
              city,
              type: 'combat',
              message: `VICTORY! You eliminated ${encounter.enemyName} and secured your cargo.`,
              timestamp: Date.now(),
            });
            state.player.activeEncounter = null;
            soundEngine.play('victory');
          }
        } else {
          combatLogs.unshift(`[R${roundNum}] MISS: Shot went wide! No damage dealt.`);
          soundEngine.play('gunshot');
        }

        if (suppressEnemy) {
          blinded = Math.max(blinded, 1);
        }
      }

      // Enemy counterattack (if encounter still active and enemy not blinded)
      if (!roundEnded && state.player.activeEncounter) {
        if (blinded > 0) {
          combatLogs.unshift(`[R${roundNum}] ENEMY SUPPRESSED: ${encounter.enemyName} is blinded and cannot return fire!`);
          blinded -= 1;
        } else {
          const enemyAccuracy = Math.min(0.75, 0.40 + encounter.danger * 0.04);
          const enemyHit = Math.random() < enemyAccuracy;
          if (enemyHit && !isGod) {
            let incomingDamage = Math.floor(12 + Math.random() * (encounter.danger * 4));
            if (currentCover) {
              incomingDamage = Math.round(incomingDamage * 0.5);
              combatLogs.unshift(`[R${roundNum}] COVER ABSORBED: Incoming fire reduced to ${incomingDamage} HP!`);
            }
            // Armor absorption
            if (state.player.armor && state.player.armor.durability > 0) {
              const absorbed = Math.min(state.player.armor.durability, Math.round(incomingDamage * 0.6));
              state.player.armor.durability -= absorbed;
              incomingDamage -= absorbed;
              if (state.player.armor.durability <= 0) {
                state.player.armor = null;
                combatLogs.unshift(`[R${roundNum}] ARMOR SHATTERED! Ballistic armor was destroyed!`);
              }
            }
            state.player.health = Math.max(0, state.player.health - incomingDamage);
            combatLogs.unshift(`[R${roundNum}] ENEMY FIRE: Hit by ${encounter.enemyName}! Took ${incomingDamage} damage! (${state.player.health}% HP left)`);
            soundEngine.play('gunshot');
            if (state.player.health <= 0) {
              state.player.isGameOver = true;
              state.player.gameOverReason = `Killed in action during a firefight with ${encounter.enemyName}.`;
              state.player.activeEncounter = null;
              soundEngine.play('defeat');
            }
          } else {
            combatLogs.unshift(`[R${roundNum}] ENEMY MISSED: Enemy fire pinged harmlessly off masonry.`);
          }
        }
      }

      // Reset cover after round
      if (action !== 'take_cover') {
        currentCover = false;
      }

      syncStateToMemory(state);
      set({
        player: state.player,
        logs: state.logs,
        tacticalCombatRound: roundNum,
        combatCoverActive: currentCover,
        enemyBlindedRounds: blinded,
        combatLogs: combatLogs.slice(0, 8),
      });
      triggerAutoSave(get, set);
      checkAchievementsAndUpdate(get, set, {
        lastAction: 'combat',
        combatWon: playerWon,
        nearDeathSurvival: state.player.health > 0 && state.player.health <= 15,
      });
    },

    bookFlightAction: (
      targetCityId: string,
      seatClass: FlightSeatClass,
      ticketCostOverride?: number,
      useOwnedAircraft = false
    ) => {
      return get().travel(targetCityId, seatClass, ticketCostOverride, useOwnedAircraft);
    },

    buyAircraftAction: (aircraftId: string) => {
      const state = {
        player: {
          ...get().player,
          ownedAircraft: [...(get().player.ownedAircraft || [])],
        },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = buyAircraft(state, aircraftId);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
        soundEngine.play('vault');
        checkAchievementsAndUpdate(get, set, { lastAction: 'aircraft' });
      }
      return result;
    },

    selectActiveAircraftAction: (aircraftId: string | null) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = selectActiveAircraft(state, aircraftId);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
      }
      return result;
    },

    overhaulAircraftAction: (aircraftId: string) => {
      const player = { ...get().player };
      const result = overhaulAircraft(player, aircraftId);
      if (result.success) {
        set({ player });
        triggerAutoSave(get, set);
        soundEngine.play('buy');
      } else {
        soundEngine.play('defeat');
      }
      return result;
    },

    buyAvionicsUpgradeAction: (
      aircraftId: string,
      upgradeType: 'aux_tanks' | 'hidden_compartment' | 'transponder_spoofer'
    ) => {
      const player = { ...get().player };
      const result = buyAvionicsUpgrade(player, aircraftId, upgradeType);
      if (result.success) {
        set({ player });
        triggerAutoSave(get, set);
        soundEngine.play('vault');
      } else {
        soundEngine.play('defeat');
      }
      return result;
    },

    buySwissSecurityTierAction: (tier: SwissAccountTier) => {
      const player = { ...get().player };
      const result = buySwissSecurityTier(player, tier);
      if (result.success) {
        set({ player });
        triggerAutoSave(get, set);
        soundEngine.play('bank');
      } else {
        soundEngine.play('defeat');
      }
      return result;
    },

    buyBearerBondAction: (bondType: BearerBond['bondType']) => {
      const player = { ...get().player };
      const result = buyBearerBond(player, bondType);
      if (result.success) {
        set({ player });
        triggerAutoSave(get, set);
        soundEngine.play('bank');
      } else {
        soundEngine.play('defeat');
      }
      return result;
    },

    claimMaturedBearerBondsAction: () => {
      const player = { ...get().player };
      const result = claimMaturedBearerBonds(player);
      if (result.success) {
        set({ player });
        triggerAutoSave(get, set);
        soundEngine.play('bank');
      } else {
        soundEngine.play('defeat');
      }
      return result;
    },

    buyConsularImmunityAction: (level: ConsularImmunityLevel) => {
      const player = { ...get().player };
      const result = buyConsularImmunity(player, level);
      if (result.success) {
        set({ player });
        triggerAutoSave(get, set);
        soundEngine.play('vault');
      } else {
        soundEngine.play('defeat');
      }
      return result;
    },

    buyPropertyUpgradeAction: (propertyId: string, upgradeId: SafehouseUpgradeId) => {
      const player = { ...get().player };
      const result = buyPropertyUpgrade(player, propertyId, upgradeId);
      if (result.success) {
        set({ player });
        triggerAutoSave(get, set);
        soundEngine.play('buy');
      } else {
        soundEngine.play('defeat');
      }
      return result;
    },

    collectProtectionRacketAction: () => {
      const player = { ...get().player };
      const result = collectProtectionRacket(player);
      if (result.success) {
        set({ player });
        triggerAutoSave(get, set);
        soundEngine.play('bank');
      } else {
        soundEngine.play('defeat');
      }
      return result;
    },

    executeStrikeContractAction: (contractId: string) => {
      const player = { ...get().player };
      const result = executeStrikeContract(player, contractId);
      if (result.success) {
        set({ player });
        triggerAutoSave(get, set);
        soundEngine.play('victory');
      } else {
        soundEngine.play('defeat');
      }
      return result;
    },

    buyShellBusinessAction: (businessId: string) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = buyShellBusiness(state, businessId);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
        soundEngine.play('bank');
      }
      return result;
    },

    buyCorporateUpgradeAction: (upgradeId: string) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = buyCorporateUpgrade(state, upgradeId);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
        soundEngine.play('bank');
      }
      return result;
    },

    executeBusinessLaunderAction: (businessId: string, amount: number) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = executeBusinessLaundering(state, businessId, amount);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
        soundEngine.play('bank');
      }
      return result;
    },

    buildLabAction: (propertyId: string, labType: LabType) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = buildLab(state, propertyId, labType);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
      }
      return result;
    },

    buyPrecursorAction: (precursorId: string, units: number, payFrom: 'cash' | 'bank' = 'cash') => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = buyPrecursor(state, precursorId, units, payFrom);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
      }
      return result;
    },

    startCookBatchAction: (propertyId: string, recipeId: string, batchCount = 1) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = startCookBatch(state, propertyId, recipeId, batchCount);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
      }
      return result;
    },

    collectCookBatchAction: (batchId: string, destination: 'pocket' | 'vault' = 'pocket') => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = collectCookBatch(state, batchId, destination);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
      }
      return result;
    },

    cancelCookBatchAction: (batchId: string) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = cancelCookBatch(state, batchId);
      if (result.success) {
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
      }
      return result;
    },

    hireOfficialAction: (officialId: CorruptOfficialId, assignedBusinessId?: string) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = hireOfficial(state, officialId, assignedBusinessId);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
        soundEngine.play('bribe');
      }
      return result;
    },

    fireOfficialAction: (officialId: CorruptOfficialId) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = fireOfficial(state, officialId);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
        soundEngine.play('click');
      }
      return result;
    },

    bribeGrandJuryAction: (amount = 50000) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = bribeGrandJury(state, amount);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
        soundEngine.play('bribe');
      }
      return result;
    },

    emergencyExtraditionEscapeAction: (destinationCityId: string) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = emergencyExtraditionEscape(state, destinationCityId);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
        soundEngine.play('travel');
      }
      return result;
    },

    acceptContract: (contractId: string) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = acceptSyndicateContract(state, contractId);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
        soundEngine.play('click');
      }
      return result;
    },

    deliverContract: (contractId: string) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = deliverSyndicateContract(state, contractId);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
        soundEngine.play('victory');
        checkAchievementsAndUpdate(get, set);
      }
      return result;
    },

    paySyndicateTribute: (syndicateId: SyndicateId) => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = paySyndicateTributeAction(state, syndicateId);
      if (result.success) {
        syncStateToMemory(state);
        set({ player: state.player, logs: state.logs });
        triggerAutoSave(get, set);
        soundEngine.play('bank');
      }
      return result;
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
        triggerAutoSave(get, set);
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
      triggerAutoSave(get, set);
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

    retireEmpireAction: () => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = retireEmpire(state);
      if (result.success) {
        if (state.player.activeChallengeId) {
          const score = getTotalWealth(state.player);
          const proofCode = generateChallengeProofCode(
            state.player.activeChallengeId,
            state.player.activeChallengeSeed || 'SEED',
            score,
            state.player.currentDay,
            'retirement'
          );
          const challenge = BOUNTY_CHALLENGES.find((c) => c.id === state.player.activeChallengeId);
          saveDailyChallengeRecord({
            id: `chal_${Date.now()}`,
            challengeId: state.player.activeChallengeId,
            challengeTitle: challenge?.title ?? 'Challenge Run',
            seed: state.player.activeChallengeSeed || 'SEED',
            date: new Date().toISOString().slice(0, 10),
            timestamp: Date.now(),
            finalScore: score,
            netWorth: getTotalWealth(state.player),
            daysSurvived: state.player.currentDay,
            maxDays: state.player.maxDays,
            finalRank: RANK_MAP.get(state.player.currentRankId)?.name ?? state.player.currentRankId,
            outcome: 'retirement',
            proofCode,
            verified: true,
          });
          state.logs.unshift({
            day: state.player.currentDay,
            city: 'Cartel Command',
            type: 'system',
            message: `🔐 BOUNTY RUN RECORDED: Score: ${score.toLocaleString()} PTS • Proof: ${proofCode}`,
            timestamp: Date.now(),
          });
        }
        syncStateToMemory(state);
        set({
          player: state.player,
          logs: state.logs,
        });
        triggerAutoSave(get, set);
        soundEngine.play('victory');
      }
      return result;
    },

    buyCleanIdentityAction: () => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = purchaseCleanIdentity(state);
      if (result.success) {
        syncStateToMemory(state);
        set({
          player: state.player,
          logs: state.logs,
        });
        triggerAutoSave(get, set);
        soundEngine.play('victory');
      }
      return result;
    },

    bribePoliceAction: () => {
      const state = {
        player: { ...get().player },
        market: { ...get().market },
        logs: [...get().logs],
      };
      const result = bribePolice(state);
      if (result.success) {
        syncStateToMemory(state);
        set({
          player: state.player,
          logs: state.logs,
        });
        triggerAutoSave(get, set);
        soundEngine.play('bribe');
      }
      return result;
    },

    setDurationMode: (mode: GameDurationMode) => {
      const modeConfig = DURATION_MODES.find((m) => m.id === mode) ?? DURATION_MODES[0];
      const state = { ...get().player };
      state.gameDurationMode = modeConfig.id;
      state.isEndless = modeConfig.isEndless;
      if (!modeConfig.isEndless) {
        state.maxDays = Math.max(state.currentDay, modeConfig.days);
      } else {
        state.maxDays = modeConfig.days;
      }
      set({ player: state });
      triggerAutoSave(get, set);
    },

    restartGame: (mode?: GameDurationMode) => {
      deleteLocalSaveSlot('autosave');
      const chosenMode = mode || get().player.gameDurationMode || 'classic';
      const fresh = createInitialState(chosenMode);
      syncStateToMemory(fresh);
      set({
        ...fresh,
        activeTab: 'market',
        placesSubTab: 'bank',
        isTerminalOpen: false,
        isSaveModalOpen: false,
        isHallOfFameOpen: false,
        recentlyUnlockedAchievement: null,
        lastSavedAt: null,
        priceHistory: createInitialPriceHistory(fresh.market),
        globalPriceHistory: createInitialGlobalPriceHistory(fresh.player.currentCityId, fresh.market),
        isDrugGraphOpen: false,
        selectedGraphDrugId: null,
        isGlobalAnalyticsOpen: false,
        tradeModal: { isOpen: false, drugId: null, mode: 'buy' },
      });
      soundEngine.play('click');
    },
  };

  // Register window.drugLordCheat API for browser F12 DevTools console
  registerWindowCheatApi({
    executeCheat: storeApi.runCheat,
  });

  return storeApi;
});
