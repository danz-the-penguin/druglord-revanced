import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { Terminal, Filter, Maximize2, Minimize2, Search, Radio, Clock } from 'lucide-react';
import { sanitizeLogMessage } from '../utils/formatters';

export const EventLog: React.FC = () => {
  const logs = useGameStore((s) => s.logs);
  const fontScale = useGameStore((s) => s.fontScale);

  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const fontScaleClass =
    fontScale === 'xl' ? 'text-base' : fontScale === 'large' ? 'text-sm' : 'text-sm';

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      const matchesType = selectedType === 'all' || entry.type === selectedType;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        entry.message.toLowerCase().includes(query) ||
        entry.city.toLowerCase().includes(query) ||
        `day ${entry.day}`.includes(query);
      return matchesType && matchesQuery;
    });
  }, [logs, selectedType, searchQuery]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl font-mono backdrop-blur-md transition-all">
      {/* Top Header Bar */}
      <div className="px-5 py-3 bg-slate-800/80 border-b border-slate-700/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                Intelligence Feed & Street Wire
              </h2>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-700/80 text-[10px] font-bold text-emerald-400">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                <span>LIVE TELEMETRY</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time underworld syndicate intercepts, market movements & law enforcement wires ({logs.length} logged)
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Quick search input */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wire logs..."
              className="w-full bg-slate-950/80 border border-slate-700/70 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={isExpanded ? 'Collapse wire view' : 'Expand full wire feed'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 py-2 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-500 flex items-center gap-1 mr-1 text-[11px] uppercase font-bold">
          <Filter className="w-3 h-3 text-slate-400" /> Feed Filter:
        </span>
        {['all', 'market', 'finance', 'travel', 'combat', 'event', 'system'].map((type) => {
          const isActive = selectedType === type;
          const count = type === 'all' ? logs.length : logs.filter((l) => l.type === type).length;

          const activeThemes: Record<string, string> = {
            all: 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-300 font-black shadow-md shadow-emerald-950/60',
            market: 'bg-sky-400 text-slate-950 ring-2 ring-sky-300 font-black shadow-md shadow-sky-950/60',
            finance: 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 font-black shadow-md shadow-amber-950/60',
            travel: 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-300 font-black shadow-md shadow-cyan-950/60',
            combat: 'bg-rose-500 text-white ring-2 ring-rose-400 font-black shadow-md shadow-rose-950/60',
            event: 'bg-purple-400 text-slate-950 ring-2 ring-purple-300 font-black shadow-md shadow-purple-950/60',
            system: 'bg-slate-200 text-slate-950 ring-2 ring-white font-black shadow-md shadow-slate-900/60',
          };

          const activeClass = activeThemes[type] || 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-300 font-black';

          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                isActive
                  ? activeClass
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
              }`}
            >
              <span>{type}</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  isActive ? 'bg-black/20 text-current font-black' : 'bg-slate-900 text-slate-500 font-bold'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lengthened & Enlarged Feed Scroll Area */}
      <div
        className={`p-4 overflow-y-auto space-y-2.5 transition-all duration-300 ${
          isExpanded ? 'max-h-[650px]' : 'max-h-[380px]'
        }`}
      >
        {filteredLogs.slice(0, 75).map((entry, idx) => {
          let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
          let indicatorDot = 'bg-slate-400';

          if (entry.type === 'market') {
            badgeColor = 'bg-emerald-950/90 text-emerald-300 border-emerald-700';
            indicatorDot = 'bg-emerald-400';
          } else if (entry.type === 'finance') {
            badgeColor = 'bg-cyan-950/90 text-cyan-300 border-cyan-700';
            indicatorDot = 'bg-cyan-400';
          } else if (entry.type === 'travel') {
            badgeColor = 'bg-sky-950/90 text-sky-300 border-sky-700';
            indicatorDot = 'bg-sky-400';
          } else if (entry.type === 'combat') {
            badgeColor = 'bg-rose-950/90 text-rose-300 border-rose-700';
            indicatorDot = 'bg-rose-400';
          } else if (entry.type === 'event') {
            badgeColor = 'bg-amber-950/90 text-amber-300 border-amber-700';
            indicatorDot = 'bg-amber-400';
          } else if (entry.type === 'system') {
            badgeColor = 'bg-purple-950/90 text-purple-300 border-purple-700';
            indicatorDot = 'bg-purple-400';
          }

          return (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:bg-slate-950/90 hover:border-slate-700/80 transition-all shadow-sm"
            >
              {/* Type Dot and Day / City Tag */}
              <div className="flex flex-col items-start gap-1 shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border flex items-center gap-1.5 shadow-sm ${badgeColor}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${indicatorDot}`} />
                  <span>Day {entry.day}</span>
                  <span className="opacity-50">•</span>
                  <span>{entry.city}</span>
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1 pl-1">
                  <Clock className="w-2.5 h-2.5" />
                  {entry.type.toUpperCase()}
                </span>
              </div>

              {/* Message with enlarged font */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className={`${fontScaleClass} text-slate-200 font-medium leading-relaxed select-text`}>
                  {sanitizeLogMessage(entry.message)}
                </p>
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="py-12 text-center text-slate-500 font-mono text-sm">
            No intelligence wire entries match your current filter.
          </div>
        )}
      </div>
    </div>
  );
};
