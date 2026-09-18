import React, { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Header } from './components/Header';
import { TickerMarquee } from './components/TickerMarquee';
import { MarketBoard } from './components/MarketBoard';
import { InventoryBoard } from './components/InventoryBoard';
import { PlacesModal } from './components/PlacesModal';
import { TravelModal } from './components/TravelModal';
import { TradeModal } from './components/TradeModal';
import { CombatModal } from './components/CombatModal';
import { CartelDebugTerminal } from './components/CartelDebugTerminal';
import { SaveLoadModal } from './components/SaveLoadModal';
import { HallOfFameModal } from './components/HallOfFameModal';
import { DrugGraphModal } from './components/DrugGraphModal';
import { GlobalAnalyticsModal } from './components/GlobalAnalyticsModal';
import { FlightBoardModal } from './components/FlightBoardModal';
import { SyndicateModal } from './components/SyndicateModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { EventLog } from './components/EventLog';
import { useKonamiCode } from './hooks/useKonamiCode';
import { ShoppingCart, Building, Plane, Moon, RotateCcw, Terminal, HardDrive, AlertTriangle, X, Sparkles, Trophy, Handshake, Map as MapIcon } from 'lucide-react';
import { DURATION_MODES, GameDurationMode } from './engine/types';

export const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    nextDay,
    restartGame,
    toggleTerminal,
    toggleSaveModal,
    fontScale,
    player,
    isHallOfFameOpen,
    closeHallOfFame,
    hallOfFameTab,
    openHallOfFame,
    openFlightBoard,
    openSyndicateModal,
    recentlyUnlockedAchievement,
    dismissAchievementToast,
  } = useGameStore();

  const [showRestartModal, setShowRestartModal] = useState<boolean>(false);
  const [isMobileOpsOpen, setIsMobileOpsOpen] = useState<boolean>(false);
  const [selectedDurationMode, setSelectedDurationMode] = useState<GameDurationMode>(
    player.gameDurationMode || 'classic'
  );

  // Auto-dismiss achievement toast after 5 seconds
  useEffect(() => {
    if (!recentlyUnlockedAchievement) return;
    const timer = setTimeout(() => {
      dismissAchievementToast();
    }, 5000);
    return () => clearTimeout(timer);
  }, [recentlyUnlockedAchievement, dismissAchievementToast]);

  // Activate keyboard hotkeys: ~ (Terminal), Konami Code, and memory polling
  useKonamiCode();

  const fontScaleClass =
    fontScale === 'xl' ? 'font-scale-xl' : fontScale === 'large' ? 'font-scale-large' : 'font-scale-normal';

  return (
    <div className={`min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 transition-all ${fontScaleClass}`}>
      {/* Live Ticker Marquee at the very top */}
      <TickerMarquee />

      {/* Top persistent dashboard */}
      <Header />

      {/* Desktop & Tablet Top Navigation Bar (Hidden on Mobile) */}
      <nav className="hidden md:block bg-slate-900/70 border-b border-slate-800 px-4 py-2.5 backdrop-blur-md">
        <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('market')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                activeTab === 'market'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> Market & Stash
            </button>

            <button
              onClick={() => setActiveTab('places')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                activeTab === 'places'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Building className="w-4 h-4" /> Places & Laundering
            </button>

            <button
              onClick={() => setActiveTab('travel')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'travel'
                  ? 'bg-sky-500 text-slate-950 shadow-sm shadow-sky-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Open Interactive Tactical Smuggling Map (Hotkey: M)"
            >
              <MapIcon className="w-4 h-4" /> Smuggling Map & Travel
            </button>

            <button
              onClick={openFlightBoard}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all text-sky-300 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/60 shadow-sm cursor-pointer"
              title="Open Real-Time Flight Board with Airport Hubs & Seat Classes"
            >
              <Plane className="w-3.5 h-3.5 text-sky-400" /> Flight Board
            </button>

            <button
              onClick={openSyndicateModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 shadow-sm cursor-pointer"
              title="Open Cartel Syndicates & Faction Smuggling Contracts"
            >
              <Handshake className="w-3.5 h-3.5 text-rose-400" /> Syndicates
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSaveModal()}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Underworld Data Vault (Save Slots / JSON Export / Import)"
            >
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" /> Vault
            </button>

            <button
              onClick={toggleTerminal}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Cartel Debug Terminal (~)"
            >
              <Terminal className="w-3.5 h-3.5" /> Hack [~]
            </button>

            <button
              onClick={() => setShowRestartModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700/60"
              title="Configure & Restart Syndicate Operation"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restart
            </button>

            <button
              onClick={nextDay}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950/50 active:scale-95"
            >
              <Moon className="w-3.5 h-3.5 text-amber-300" /> Advance Day
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Body */}
      <main className="flex-1 max-w-[1750px] w-full mx-auto p-3 sm:p-5 lg:p-6 pb-28 md:pb-6 space-y-4">
        {activeTab === 'market' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-8">
              <MarketBoard />
            </div>
            <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-4 space-y-4">
              <InventoryBoard />
              <EventLog />
            </div>
          </div>
        )}

        {activeTab === 'places' && (
          <div className="space-y-4">
            <PlacesModal />
            <EventLog />
          </div>
        )}

        {activeTab === 'travel' && (
          <div className="space-y-4">
            <TravelModal />
            <EventLog />
          </div>
        )}
      </main>

      {/* Mobile iOS Bottom Navigation Bar (Tailored for iPhone 11 & 15 Pro Max) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 px-2 shadow-2xl"
      >
        <div className="flex items-center justify-around font-mono">
          {/* Market Tab */}
          <button
            onClick={() => setActiveTab('market')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[58px] ${
              activeTab === 'market'
                ? 'text-emerald-400 bg-emerald-950/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingCart className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Market</span>
          </button>

          {/* Places Tab */}
          <button
            onClick={() => setActiveTab('places')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[58px] ${
              activeTab === 'places'
                ? 'text-cyan-400 bg-cyan-950/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Places</span>
          </button>

          {/* Center Prominent Advance Day Button */}
          <button
            onClick={nextDay}
            className="flex flex-col items-center justify-center -mt-3.5 bg-gradient-to-tr from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-950/80 border border-indigo-400/40 active:scale-90 transition-all cursor-pointer min-w-[62px]"
            title="Advance Day (+1 Day)"
          >
            <Moon className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">Next Day</span>
          </button>

          {/* Travel Tab */}
          <button
            onClick={() => setActiveTab('travel')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[58px] ${
              activeTab === 'travel'
                ? 'text-sky-400 bg-sky-950/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Travel</span>
          </button>

          {/* Underworld Ops Menu Toggle */}
          <button
            onClick={() => setIsMobileOpsOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[58px] ${
              isMobileOpsOpen
                ? 'text-amber-400 bg-amber-950/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Ops</span>
          </button>
        </div>
      </nav>

      {/* Mobile Underworld Operations Drawer (Slide up sheet) */}
      {isMobileOpsOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setIsMobileOpsOpen(false)}
        >
          <div
            className="bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-5 pb-[max(env(safe-area-inset-bottom),24px)] space-y-4 font-mono shadow-2xl animate-in slide-in-from-bottom duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Underworld Operations & Consoles</span>
              </div>
              <button
                onClick={() => setIsMobileOpsOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-left">
              <button
                onClick={() => {
                  setIsMobileOpsOpen(false);
                  openFlightBoard();
                }}
                className="p-3 rounded-xl bg-sky-950/50 border border-sky-800/60 hover:bg-sky-900/60 text-sky-300 font-bold text-xs flex items-center gap-2.5 transition-all text-left"
              >
                <Plane className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="leading-tight">Flight Board</div>
                  <div className="text-[10px] text-sky-400/70 font-normal mt-0.5">Hub Departures</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileOpsOpen(false);
                  openSyndicateModal();
                }}
                className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 font-bold text-xs flex items-center gap-2.5 transition-all text-left"
              >
                <Handshake className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="leading-tight">Syndicates</div>
                  <div className="text-[10px] text-rose-400/70 font-normal mt-0.5">Cartel Contracts</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileOpsOpen(false);
                  toggleSaveModal();
                }}
                className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-800/60 hover:bg-cyan-900/60 text-cyan-300 font-bold text-xs flex items-center gap-2.5 transition-all text-left"
              >
                <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="leading-tight">Data Vault</div>
                  <div className="text-[10px] text-cyan-400/70 font-normal mt-0.5">JSON & Saves</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileOpsOpen(false);
                  openHallOfFame('leaderboard');
                }}
                className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/60 hover:bg-amber-900/60 text-amber-300 font-bold text-xs flex items-center gap-2.5 transition-all text-left"
              >
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="leading-tight">Hall of Fame</div>
                  <div className="text-[10px] text-amber-400/70 font-normal mt-0.5">Prestige & Rank</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileOpsOpen(false);
                  toggleTerminal();
                }}
                className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-300 font-bold text-xs flex items-center gap-2.5 transition-all text-left"
              >
                <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="leading-tight">Hack [~]</div>
                  <div className="text-[10px] text-emerald-400/70 font-normal mt-0.5">Debug Console</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileOpsOpen(false);
                  setShowRestartModal(true);
                }}
                className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 hover:bg-slate-700/80 text-slate-300 font-bold text-xs flex items-center gap-2.5 transition-all text-left"
              >
                <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="leading-tight">Restart Run</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">New Syndicate</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restart & Lifespan Mode Selection Modal */}
      {showRestartModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-black text-base">
                <RotateCcw className="w-5 h-5" />
                <span>Launch New Syndicate Operation</span>
              </div>
              <button
                onClick={() => setShowRestartModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200/90 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Starting a new run will wipe the current autosave session. Choose your operational lifespan mode below:
              </span>
            </div>

            <div className="space-y-2">
              {DURATION_MODES.map((mode) => (
                <div
                  key={mode.id}
                  onClick={() => setSelectedDurationMode(mode.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedDurationMode === mode.id
                      ? 'border-emerald-500 bg-emerald-950/40 shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">{mode.label}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          mode.isEndless
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {mode.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{mode.desc}</p>
                  </div>
                  {selectedDurationMode === mode.id && (
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowRestartModal(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  restartGame(selectedDurationMode);
                  setShowRestartModal(false);
                }}
                className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
              >
                Confirm & Launch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Modals & Debug Terminal */}
      <TradeModal />
      <CombatModal />
      <CartelDebugTerminal />
      <SaveLoadModal />
      {isHallOfFameOpen && (
        <HallOfFameModal
          isOpen={isHallOfFameOpen}
          onClose={closeHallOfFame}
          initialTab={hallOfFameTab}
        />
      )}
      <DrugGraphModal />
      <GlobalAnalyticsModal />
      <FlightBoardModal />
      <SyndicateModal />
      <DailyChallengeModal />

      {/* Achievement Unlocked Toast Notification */}
      {recentlyUnlockedAchievement && (
        <aside
          aria-label="Achievement notification"
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl shadow-amber-950/50 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 font-mono"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <Trophy className="w-6 h-6 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">
                  Achievement Unlocked!
                </span>
                <button
                  onClick={dismissAchievementToast}
                  className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="text-sm font-bold text-slate-100 truncate mt-0.5">
                {recentlyUnlockedAchievement.title}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                {recentlyUnlockedAchievement.description}
              </p>
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800 text-[11px]">
                <span className="text-amber-300 font-bold">
                  +{recentlyUnlockedAchievement.prestigePoints} Prestige
                </span>
                <button
                  onClick={() => {
                    openHallOfFame('achievements');
                    dismissAchievementToast();
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  View in HOF &rarr;
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-3 px-4 text-center text-[11px] text-slate-500 font-mono">
        Drug Lord: ReVanced • Underworld Fintech Edition • Press ~ for Cartel Hack Terminal • CheatEngine Buffer at 0x0000
      </footer>
    </div>
  );
};
