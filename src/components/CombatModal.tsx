import React from 'react';
import { useGameStore } from '../store/gameStore';
import { ShieldAlert, Crosshair, DollarSign, Flag, Footprints, AlertOctagon } from 'lucide-react';

export const CombatModal: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const resolveEncounterAction = useGameStore((s) => s.resolveEncounterAction);
  const restartGame = useGameStore((s) => s.restartGame);

  const encounter = player.activeEncounter;

  if (player.isGameOver) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 font-mono">
        <div className="bg-slate-900 border-2 border-red-600/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
          <AlertOctagon className="w-14 h-14 text-red-500 mx-auto animate-bounce" />
          <h2 className="text-2xl font-black text-red-500 uppercase tracking-wider">
            GAME OVER
          </h2>
          <p className="text-sm text-slate-300">
            {player.gameOverReason ?? 'Your career in the underworld has come to an end.'}
          </p>
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-left space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Days Survived:</span>
              <span className="text-slate-200 font-bold">{player.currentDay} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cash on Hand:</span>
              <span className="text-emerald-400 font-bold">${player.cash.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bank Deposits:</span>
              <span className="text-cyan-400 font-bold">${player.bank.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Outstanding Debt:</span>
              <span className="text-rose-400 font-bold">${player.debt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-sm">
              <span className="text-slate-300">Net Worth:</span>
              <span className="text-amber-400">
                ${(player.cash + player.bank - player.debt).toLocaleString()}
              </span>
            </div>
          </div>
          <button
            onClick={restartGame}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-sm tracking-wider transition-colors shadow-lg shadow-emerald-950/50"
          >
            Start New Run
          </button>
        </div>
      </div>
    );
  }

  if (!encounter) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border-2 border-amber-600/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-950/40 border-b border-amber-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-amber-400 animate-pulse" />
            <div>
              <h3 className="font-black text-amber-300 uppercase tracking-wider text-base">
                Hostile Encounter!
              </h3>
              <p className="text-xs text-amber-400/80">
                {encounter.count}x {encounter.enemyName}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700 text-amber-200 text-[10px] font-bold uppercase">
            Danger Level {encounter.danger}/10
          </span>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            You are cornered by <strong className="text-amber-300">{encounter.enemyName}</strong>!
            Weapons are drawn and tension is high. Make your move carefully.
          </p>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Your Health:</span>
              <span className="text-rose-400 font-bold">{player.health}% HP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bribe Demand:</span>
              <span className="text-emerald-400 font-bold">
                ${encounter.bribeCost.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={() => resolveEncounterAction('fight')}
              className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold flex flex-col items-center justify-center gap-1 transition-colors shadow-md shadow-rose-950/50"
            >
              <Crosshair className="w-5 h-5" />
              <span>Fight Back</span>
            </button>

            <button
              onClick={() => resolveEncounterAction('flee')}
              disabled={!encounter.canFlee}
              className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 font-bold flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Footprints className="w-5 h-5" />
              <span>Attempt Escape</span>
            </button>

            <button
              onClick={() => resolveEncounterAction('bribe')}
              disabled={!encounter.canBribe || player.cash < encounter.bribeCost}
              className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <DollarSign className="w-5 h-5" />
              <span>Bribe Officer (${encounter.bribeCost.toLocaleString()})</span>
            </button>

            <button
              onClick={() => resolveEncounterAction('surrender')}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 transition-colors"
            >
              <Flag className="w-5 h-5" />
              <span>Surrender (Drop All)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
