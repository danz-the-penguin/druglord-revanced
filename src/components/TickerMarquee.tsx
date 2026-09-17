import React from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUGS } from '../engine/constants';
import { TrendingUp, TrendingDown, Radio, Zap, AlertTriangle, ShieldAlert } from 'lucide-react';

export const TickerMarquee: React.FC = () => {
  const market = useGameStore((s) => s.market);
  const priceHistory = useGameStore((s) => s.priceHistory);
  const openTradeModal = useGameStore((s) => s.openTradeModal);

  const renderTickerTrack = (keyPrefix: string) => (
    <div className="flex items-center gap-6 shrink-0 pr-6">
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
            className="flex items-center gap-1.5 shrink-0 cursor-pointer hover:bg-slate-800/80 px-2 py-0.5 rounded transition-colors group"
            title={`Click to open trade order for ${drug.name} (Spot: $${price.toLocaleString()})`}
          >
            <span className="text-slate-400 font-bold group-hover:text-slate-200 transition-colors">
              {drug.name.toUpperCase()}:
            </span>
            <span className="text-slate-100 font-black group-hover:text-emerald-400 transition-colors">
              ${price.toLocaleString()}
            </span>
            <span
              className={`flex items-center text-[10px] font-bold ${
                isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isUp ? '+' : ''}
              {deltaPct}%
            </span>
            <span className="text-slate-700 ml-1.5">|</span>
          </div>
        );
      })}

      {/* Underworld News & Arbitrage Bulletins */}
      <div className="flex items-center gap-2 text-amber-400 font-bold shrink-0">
        <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-700/80 text-[9px] uppercase tracking-wider flex items-center gap-1">
          <Zap className="w-2.5 h-2.5" /> ARBITRAGE SPREAD
        </span>
        <span className="text-slate-200">
          BOGOTA COCAINE ($7.7k) ➔ SYDNEY ($48.4k) <strong className="text-emerald-400">[+528% MARGIN]</strong>
        </span>
        <span className="text-slate-700 ml-1.5">|</span>
      </div>

      <div className="flex items-center gap-2 text-rose-400 font-bold shrink-0">
        <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-700/80 text-[9px] uppercase tracking-wider flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" /> STREET ALERT
        </span>
        <span className="text-slate-200">
          DOCTORED MORPHINE (FENTANYL) & TRANQ FLOODING EAST COAST METROPOLISES
        </span>
        <span className="text-slate-700 ml-1.5">|</span>
      </div>

      <div className="flex items-center gap-2 text-sky-400 font-bold shrink-0">
        <span className="px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-700/80 text-[9px] uppercase tracking-wider flex items-center gap-1">
          <ShieldAlert className="w-2.5 h-2.5" /> DEA DISPATCH
        </span>
        <span className="text-slate-200">
          INTERDICTION TEAMS DEPLOYED TO HEATHROW & SYDNEY KINGSFORD AIRPORTS
        </span>
        <span className="text-slate-700 ml-1.5">|</span>
      </div>

      <div className="flex items-center gap-2 text-cyan-400 font-bold shrink-0">
        <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/80 text-[9px] uppercase tracking-wider">
          LIQUIDITY WIRE
        </span>
        <span className="text-slate-200">
          SWISS & CAYMAN OFFSHORE WIRES OPERATIONAL AT 0.10% DAILY OVERNIGHT COMPOUND
        </span>
        <span className="text-slate-700 ml-1.5">|</span>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-950 border-b border-slate-800/80 text-[11px] font-mono overflow-hidden whitespace-nowrap flex items-center select-none py-1.5 px-3 relative z-20">
      {/* Live status badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/90 border border-emerald-700/80 text-emerald-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-4 shadow-sm shadow-emerald-950 z-10">
        <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
        UNDERWORLD TERMINAL FEED
      </div>

      {/* Seamless Dual-Track Infinite Scrolling Ribbon */}
      <div className="overflow-hidden flex-1 relative">
        <div className="animate-ticker">
          {renderTickerTrack('track1')}
          {renderTickerTrack('track2')}
        </div>
      </div>
    </div>
  );
};

