import React from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUGS } from '../engine/constants';
import { getInventoryTotalUnits, getCarryingCapacity } from '../engine/game';
import { TrendingUp, TrendingDown, ShoppingCart, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const MarketBoard: React.FC = () => {
  const market = useGameStore((s) => s.market);
  const player = useGameStore((s) => s.player);
  const openTradeModal = useGameStore((s) => s.openTradeModal);

  const totalUnits = getInventoryTotalUnits(player);
  const capacity = getCarryingCapacity(player);
  const remainingCapacity = Math.max(0, capacity - totalUnits);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200">
            Street Market Prices
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Free Stash Capacity: <strong className="text-emerald-400">{remainingCapacity}</strong> units
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Commodity</th>
              <th className="py-2.5 px-3 font-semibold text-right">Street Price</th>
              <th className="py-2.5 px-3 font-semibold text-center">Market Trend</th>
              <th className="py-2.5 px-3 font-semibold text-right">Supply</th>
              <th className="py-2.5 px-3 font-semibold text-right">In Stash</th>
              <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {DRUGS.map((drug) => {
              const marketItem = market[drug.id];
              const price = marketItem?.price ?? drug.basePrice;
              const availableUnits = marketItem?.availableUnits ?? 0;
              const playerHolding = player.inventory[drug.id]?.units ?? 0;
              const canAfford = player.cash >= price && remainingCapacity > 0 && availableUnits > 0;
              const canSell = playerHolding > 0;

              return (
                <tr
                  key={drug.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Name & Flavor */}
                  <td className="py-2.5 px-4">
                    <div className="font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                      {drug.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[220px]">
                      {drug.description}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-2.5 px-3 text-right font-bold text-slate-100 text-sm">
                    ${price.toLocaleString()}
                  </td>

                  {/* Trend / Surge */}
                  <td className="py-2.5 px-3 text-center">
                    {marketItem?.surge === 'high' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 border border-amber-600/80 text-amber-300 animate-pulse">
                        <TrendingUp className="w-3 h-3 text-amber-400" /> Surge!
                      </span>
                    ) : marketItem?.surge === 'crash' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 border border-rose-600/80 text-rose-300">
                        <TrendingDown className="w-3 h-3 text-rose-400" /> Flooded
                      </span>
                    ) : price > drug.basePrice ? (
                      <span className="text-emerald-400/80 inline-flex items-center gap-0.5 text-[11px]">
                        <ArrowUpRight className="w-3 h-3" /> High
                      </span>
                    ) : (
                      <span className="text-slate-400/80 inline-flex items-center gap-0.5 text-[11px]">
                        <ArrowDownRight className="w-3 h-3" /> Low
                      </span>
                    )}
                  </td>

                  {/* Available Units */}
                  <td className="py-2.5 px-3 text-right">
                    {availableUnits > 0 ? (
                      <span className="text-slate-300 font-medium">{availableUnits}</span>
                    ) : (
                      <span className="text-slate-600 italic">None</span>
                    )}
                  </td>

                  {/* Stash */}
                  <td className="py-2.5 px-3 text-right">
                    {playerHolding > 0 ? (
                      <span className="text-emerald-400 font-bold">{playerHolding}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openTradeModal(drug.id, 'buy')}
                        disabled={!canAfford}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                          canAfford
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-900/30'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => openTradeModal(drug.id, 'sell')}
                        disabled={!canSell}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                          canSell
                            ? 'bg-sky-600 hover:bg-sky-500 text-slate-950 shadow-sm shadow-sky-900/30'
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
