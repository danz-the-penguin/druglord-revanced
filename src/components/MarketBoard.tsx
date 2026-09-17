import React, { useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUGS } from '../engine/constants';
import { getInventoryTotalUnits, getCarryingCapacity } from '../engine/game';
import { Sparkline } from './Sparkline';
import { CommodityPreviewCard } from './CommodityPreviewCard';
import { TrendingUp, TrendingDown, ShoppingCart, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const MarketBoard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const market = useGameStore((s) => s.market);
  const player = useGameStore((s) => s.player);
  const priceHistory = useGameStore((s) => s.priceHistory);
  const openTradeModal = useGameStore((s) => s.openTradeModal);

  const totalUnits = getInventoryTotalUnits(player);
  const capacity = getCarryingCapacity(player);
  const remainingCapacity = Math.max(0, capacity - totalUnits);

  // Format formula with subscripts
  const formatFormula = (formula?: string) => {
    if (!formula) return '';
    return formula.replace(/(\d+)/g, (match) => {
      const subMap: Record<string, string> = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      };
      return match.split('').map((c) => subMap[c] || c).join('');
    });
  };

  return (
    <div ref={containerRef} className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShoppingCart className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold uppercase tracking-wider font-mono text-slate-100">
            Institutional Order Book & Spot Market
          </h2>
        </div>
        <span className="text-sm text-slate-300 font-mono">
          Available Stash: <strong className="text-emerald-400 text-base">{remainingCapacity}</strong> / {capacity} units
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-mono">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-xs">
            <tr>
              <th className="py-3 px-4 font-semibold">Commodity & Formula</th>
              <th className="py-3 px-3 font-semibold text-right">Spot Price</th>
              <th className="py-3 px-3 font-semibold text-center">14D Action</th>
              <th className="py-3 px-3 font-semibold text-center">Market Trend</th>
              <th className="py-3 px-3 font-semibold text-right">Supply</th>
              <th className="py-3 px-3 font-semibold text-right">In Stash</th>
              <th className="py-3 px-4 font-semibold text-right">Execution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {DRUGS.map((drug) => {
              const marketItem = market[drug.id];
              const price = marketItem?.price ?? drug.basePrice;
              const availableUnits = marketItem?.availableUnits ?? 0;
              const playerHolding = player.inventory[drug.id]?.units ?? 0;
              const canAfford = player.cash >= price && remainingCapacity > 0 && availableUnits > 0;
              const canSell = playerHolding > 0;
              const history = priceHistory[drug.id] || [drug.basePrice, price];

              return (
                <tr
                  key={drug.id}
                  className="hover:bg-slate-800/50 transition-colors group"
                >
                  {/* Commodity Card with Boundary-Safe Hover & Click Zoom */}
                  <td className="py-2 px-3 relative">
                    <CommodityPreviewCard
                      drug={drug}
                      formatFormula={formatFormula}
                      theme="emerald"
                      containerRef={containerRef}
                    />
                  </td>

                  {/* Spot Price */}
                  <td className="py-3.5 px-3 text-right font-black text-slate-100 text-base lg:text-lg">
                    ${price.toLocaleString()}
                  </td>

                  {/* 14D Sparkline Chart */}
                  <td className="py-3.5 px-3 text-center">
                    <Sparkline data={history} width={110} height={26} />
                  </td>

                  {/* Trend / Surge */}
                  <td className="py-3.5 px-3 text-center">
                    {marketItem?.surge === 'high' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-amber-950/90 border border-amber-600 text-amber-300 animate-pulse">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Shortage
                      </span>
                    ) : marketItem?.surge === 'crash' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-rose-950/90 border border-rose-600 text-rose-300">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Flooded
                      </span>
                    ) : price > drug.basePrice ? (
                      <span className="text-emerald-400 inline-flex items-center gap-0.5 text-xs font-semibold">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Bull
                      </span>
                    ) : (
                      <span className="text-slate-400 inline-flex items-center gap-0.5 text-xs font-semibold">
                        <ArrowDownRight className="w-3.5 h-3.5" /> Bear
                      </span>
                    )}
                  </td>

                  {/* Available Units */}
                  <td className="py-3.5 px-3 text-right">
                    {availableUnits > 0 ? (
                      <span className="text-slate-200 font-bold text-sm">{availableUnits}</span>
                    ) : (
                      <span className="text-slate-600 italic text-xs">0 (Bids only)</span>
                    )}
                  </td>

                  {/* Stash */}
                  <td className="py-3.5 px-3 text-right">
                    {playerHolding > 0 ? (
                      <span className="text-emerald-400 font-black text-sm">{playerHolding}</span>
                    ) : (
                      <span className="text-slate-600 text-sm">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openTradeModal(drug.id, 'buy')}
                        disabled={!canAfford}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                          canAfford
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/60 active:scale-95'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => openTradeModal(drug.id, 'sell')}
                        disabled={!canSell}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                          canSell
                            ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-950/60 active:scale-95'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        Sell
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
