import React from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUG_MAP } from '../engine/constants';
import { Briefcase, Trash2 } from 'lucide-react';

export const InventoryBoard: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const market = useGameStore((s) => s.market);
  const openTradeModal = useGameStore((s) => s.openTradeModal);

  const inventoryEntries = Object.values(player.inventory).filter((item) => item.units > 0);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200">
            Player Stash Holdings
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {inventoryEntries.length} Items in Trench Coat / Trunk
        </span>
      </div>

      {inventoryEntries.length === 0 ? (
        <div className="p-8 text-center text-slate-500 font-mono text-xs">
          Your pockets are completely empty. Buy commodities from the Street Market to start trading.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Commodity</th>
                <th className="py-2.5 px-3 font-semibold text-right">Units</th>
                <th className="py-2.5 px-3 font-semibold text-right">Avg Cost</th>
                <th className="py-2.5 px-3 font-semibold text-right">Current Value</th>
                <th className="py-2.5 px-3 font-semibold text-right">Unrealized P&L</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {inventoryEntries.map((item) => {
                const drug = DRUG_MAP.get(item.drugId);
                const currentPrice = market[item.drugId]?.price ?? item.avgCost;
                const totalCost = item.units * item.avgCost;
                const totalValue = item.units * currentPrice;
                const profit = totalValue - totalCost;
                const profitPercent = Math.round((profit / Math.max(1, totalCost)) * 100);

                return (
                  <tr
                    key={item.drugId}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-bold text-slate-200">
                      {drug?.name ?? item.drugId}
                    </td>
                    <td className="py-2.5 px-3 text-right text-indigo-300 font-bold">
                      {item.units}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      ${item.avgCost.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200 font-semibold">
                      ${totalValue.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span
                        className={
                          profit > 0
                            ? 'text-emerald-400'
                            : profit < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {profit >= 0 ? '+' : ''}${profit.toLocaleString()} ({profitPercent}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openTradeModal(item.drugId, 'sell')}
                          className="px-2.5 py-1 rounded text-xs font-bold bg-sky-600 hover:bg-sky-500 text-slate-950 transition-colors"
                        >
                          Sell
                        </button>
                        <button
                          onClick={() => openTradeModal(item.drugId, 'dump')}
                          className="p-1 rounded text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-700/60 transition-colors"
                          title="Dump into sewer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
