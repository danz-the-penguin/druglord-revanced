import React from 'react';
import { useGameStore } from './store/gameStore';
import { Header } from './components/Header';
import { MarketBoard } from './components/MarketBoard';
import { InventoryBoard } from './components/InventoryBoard';
import { PlacesModal } from './components/PlacesModal';
import { TravelModal } from './components/TravelModal';
import { TradeModal } from './components/TradeModal';
import { CombatModal } from './components/CombatModal';
import { EventLog } from './components/EventLog';
import { ShoppingCart, Building, Plane, Moon, RotateCcw } from 'lucide-react';

export const App: React.FC = () => {
  const { activeTab, setActiveTab, nextDay, restartGame } = useGameStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top persistent dashboard */}
      <Header />

      {/* Main navigation & quick actions */}
      <nav className="bg-slate-900/60 border-b border-slate-800 px-4 py-2 sticky top-[73px] z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 font-mono">
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
              <Building className="w-4 h-4" /> Places & Services
            </button>

            <button
              onClick={() => setActiveTab('travel')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                activeTab === 'travel'
                  ? 'bg-sky-500 text-slate-950 shadow-sm shadow-sky-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Plane className="w-4 h-4" /> Airport Travel
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={restartGame}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700/60"
              title="Restart Game"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restart
            </button>

            <button
              onClick={nextDay}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950/50 active:scale-95"
            >
              <Moon className="w-3.5 h-3.5 text-amber-300" /> Stay & Advance Day
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
        {activeTab === 'market' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <MarketBoard />
            </div>
            <div className="lg:col-span-5 space-y-4">
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

      {/* Floating Modals */}
      <TradeModal />
      <CombatModal />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-3 px-4 text-center text-[11px] text-slate-500 font-mono">
        Drug Lord 2 Modern Edition • Turn-Based Underworld Economy Simulator
      </footer>
    </div>
  );
};
