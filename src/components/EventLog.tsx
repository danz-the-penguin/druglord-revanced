import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Terminal } from 'lucide-react';

export const EventLog: React.FC = () => {
  const logs = useGameStore((s) => s.logs);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl font-mono">
      <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Intelligence Feed & Street Wire
          </h2>
        </div>
        <span className="text-[10px] text-slate-500">Live Telemetry</span>
      </div>

      <div className="p-3 max-h-48 overflow-y-auto space-y-2 text-xs">
        {logs.slice(0, 20).map((entry, idx) => {
          let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
          if (entry.type === 'market') badgeColor = 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
          else if (entry.type === 'finance') badgeColor = 'bg-cyan-950/80 text-cyan-400 border-cyan-800';
          else if (entry.type === 'travel') badgeColor = 'bg-sky-950/80 text-sky-400 border-sky-800';
          else if (entry.type === 'combat') badgeColor = 'bg-rose-950/80 text-rose-400 border-rose-800';
          else if (entry.type === 'event') badgeColor = 'bg-amber-950/80 text-amber-400 border-amber-800';

          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 hover:bg-slate-950/80 transition-colors"
            >
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0 ${badgeColor}`}
              >
                Day {entry.day} • {entry.city}
              </span>
              <span className="text-slate-300 leading-snug flex-1">{entry.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
