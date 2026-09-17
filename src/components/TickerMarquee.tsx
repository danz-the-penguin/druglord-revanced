import React from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUGS } from '../engine/constants';
import { TrendingUp, TrendingDown, Radio, Zap, AlertTriangle, ShieldAlert } from 'lucide-react';

export const TickerMarquee: React.FC = () => {
  const market = useGameStore((s) => s.market);
  const priceHistory = useGameStore((s) => s.priceHistory);
  const openTradeModal = useGameStore((s) => s.openTradeModal);

  const renderTickerTrack = (keyPrefix: string) => (
    <div className="flex items-center gap-3 shrink-0 pr-3">
      {/* 20 Commodity Tickers */}
      {DRUGS.map((drug) => {
        const item = market[drug.id];
        const price = item?.price ?? drug.basePrice;
        const hist = priceHistory[drug.id] || [];
        const prev = hist.length > 1 ? hist[hist.length - 2] : drug.basePrice;
        const delta = price - prev;
        const deltaPct = Math.round((delta / Math.max(1, prev)) * 100);
        const isUp = delta >= 0;

        return (
          <div
            key={`${keyPrefix}-${drug.id}`}
            onClick={() => openTradeModal(drug.id, 'buy')}
            className="flex items-center gap-2 shrink-0 cursor-pointer bg-slate-900/70 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 px-2.5 py-1 rounded-lg transition-all group text-xs sm:text-sm select-none"
            title={`Click to open trade order for ${drug.name} (Spot: $${price.toLocaleString()})`}
          >
            <span className="text-slate-400 font-bold group-hover:text-slate-200 transition-colors">
              {drug.name.toUpperCase()}:
            </span>
            <span className="text-slate-100 font-black group-hover:text-emerald-400 transition-colors">
              ${price.toLocaleString()}
            </span>
            <span
              className={`flex items-center gap-0.5 text-xs font-black ${
                isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isUp ? <TrendingUp className="w-3.5 h-3.5 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 shrink-0" />}
              {isUp ? '+' : ''}
              {deltaPct}%
            </span>
          </div>
        );
      })}

      {/* Underworld News & Arbitrage Bulletins */}
      <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-800/40 px-2.5 py-1 rounded-lg text-amber-300 font-bold shrink-0 text-xs select-none">
        <span className="px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-600/80 text-[9px] uppercase tracking-wider flex items-center gap-1 text-amber-400 shrink-0">
          <Zap className="w-2.5 h-2.5 shrink-0" /> ARBITRAGE SPREAD
        </span>
        <span className="text-slate-200">
          BOGOTA COCAINE ($7.7k) ➔ SYDNEY ($48.4k) <strong className="text-emerald-400">[+528% MARGIN]</strong>
        </span>
      </div>

      <div className="flex items-center gap-2 bg-rose-950/30 border border-rose-800/40 px-2.5 py-1 rounded-lg text-rose-300 font-bold shrink-0 text-xs select-none">
        <span className="px-1.5 py-0.5 rounded bg-rose-950/90 border border-rose-600/80 text-[9px] uppercase tracking-wider flex items-center gap-1 text-rose-400 shrink-0">
          <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> STREET ALERT
        </span>
        <span className="text-slate-200">
          DOCTORED MORPHINE (FENTANYL) & TRANQ FLOODING EAST COAST METROPOLISES
        </span>
      </div>

      <div className="flex items-center gap-2 bg-sky-950/30 border border-sky-800/40 px-2.5 py-1 rounded-lg text-sky-300 font-bold shrink-0 text-xs select-none">
        <span className="px-1.5 py-0.5 rounded bg-sky-950/90 border border-sky-600/80 text-[9px] uppercase tracking-wider flex items-center gap-1 text-sky-400 shrink-0">
          <ShieldAlert className="w-2.5 h-2.5 shrink-0" /> DEA DISPATCH
        </span>
        <span className="text-slate-200">
          INTERDICTION TEAMS DEPLOYED TO HEATHROW & SYDNEY KINGSFORD AIRPORTS
        </span>
      </div>

      <div className="flex items-center gap-2 bg-cyan-950/30 border border-cyan-800/40 px-2.5 py-1 rounded-lg text-cyan-300 font-bold shrink-0 text-xs select-none">
        <span className="px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-600/80 text-[9px] uppercase tracking-wider shrink-0 text-cyan-400">
          LIQUIDITY WIRE
        </span>
        <span className="text-slate-200">
          SWISS & CAYMAN OFFSHORE WIRES OPERATIONAL AT 0.10% DAILY OVERNIGHT COMPOUND
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-950 border-b border-slate-800/80 text-xs sm:text-sm font-mono overflow-hidden whitespace-nowrap flex items-center select-none py-2 px-3 relative z-20">
      {/* Live status badge */}
      <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md bg-emerald-950/90 border border-emerald-700/80 text-emerald-400 font-black uppercase tracking-wider text-[11px] sm:text-xs shrink-0 mr-2 sm:mr-4 shadow-sm shadow-emerald-950 z-10 select-none">
        <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400 shrink-0" />
        <span className="hidden sm:inline">UNDERWORLD </span>
        <span>TERMINAL FEED</span>
      </div>

      {/* Seamless Dual-Track Infinite Scrolling Ribbon with Smooth Edge Gradient Masks */}
      <div className="overflow-hidden flex-1 relative [mask-image:linear-gradient(to_right,transparent,black_28px,black_calc(100%-28px),transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_28px,black_calc(100%-28px),transparent)]">
        <div className="animate-ticker">
          {renderTickerTrack('track1')}
          {renderTickerTrack('track2')}
        </div>
      </div>
    </div>
  );
};

