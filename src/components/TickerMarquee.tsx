import React from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUGS } from '../engine/constants';
import { TrendingUp, TrendingDown, Radio } from 'lucide-react';

export const TickerMarquee: React.FC = () => {
  const market = useGameStore((s) => s.market);
  const priceHistory = useGameStore((s) => s.priceHistory);

  return (
    <div className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono overflow-hidden whitespace-nowrap flex items-center select-none py-1 px-2">
      {/* Live status badge */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-3">
        <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
        UNDERWORLD TERMINAL FEED
      </div>

      {/* Marquee ticker content */}
      <div className="flex items-center gap-6 animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused]">
        {/* Commodity tickers */}
        {DRUGS.map((drug) => {
          const item = market[drug.id];
          const price = item?.price ?? drug.basePrice;
          const hist = priceHistory[drug.id] || [];
          const prev = hist.length > 1 ? hist[hist.length - 2] : drug.basePrice;
          const delta = price - prev;
          const deltaPct = Math.round((delta / Math.max(1, prev)) * 100);
          const isUp = delta >= 0;

          return (
            <div key={drug.id} className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-400 font-bold">{drug.name.toUpperCase()}:</span>
              <span className="text-slate-100 font-black">${price.toLocaleString()}</span>
              <span
                className={`flex items-center text-[10px] font-bold ${
                  isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isUp ? '+' : ''}{deltaPct}%
              </span>
              <span className="text-slate-700 ml-2">|</span>
            </div>
          );
        })}

        {/* Arbitrage alerts */}
        <div className="flex items-center gap-2 text-amber-400 font-bold shrink-0">
          <span className="px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800 text-[9px] uppercase">
            ARBITRAGE SPREAD
          </span>
          <span>BOGOTA COCAINE ($7.7k) ➔ SYDNEY ($48.4k) [+528% MARGIN]</span>
          <span className="text-slate-700 ml-2">|</span>
        </div>

        <div className="flex items-center gap-2 text-cyan-400 font-bold shrink-0">
          <span className="px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800 text-[9px] uppercase">
            LIQUIDITY WIRE
          </span>
          <span>OFFSHORE WIRE TRANSFERS RUNNING AT 0.10% DAILY YIELD</span>
          <span className="text-slate-700 ml-2">|</span>
        </div>
      </div>
    </div>
  );
};
