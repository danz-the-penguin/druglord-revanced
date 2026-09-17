import React from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUG_MAP } from '../engine/constants';
import { DrugImage } from './DrugImage';
import { Briefcase, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const InventoryBoard: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const market = useGameStore((s) => s.market);
  const openTradeModal = useGameStore((s) => s.openTradeModal);

  const inventoryEntries = Object.values(player.inventory).filter((item) => item.units > 0);

  // Format chemical formula with true subscripts
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
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Briefcase className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold uppercase tracking-wider font-mono text-slate-100">
            Player Stash Holdings & Portfolio
          </h2>
        </div>
        <span className="text-sm text-slate-300 font-mono">
          {inventoryEntries.length} Active Positions
        </span>
      </div>

      {inventoryEntries.length === 0 ? (
        <div className="p-10 text-center text-slate-500 font-mono text-sm">
          Your trench coat and trunk are completely empty. Acquire commodities from the Order Book to start arbitrage trading.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-xs">
              <tr>
                <th className="py-3 px-4 font-semibold">Commodity & Formula</th>
                <th className="py-3 px-3 font-semibold text-right">Units</th>
                <th className="py-3 px-3 font-semibold text-right">Avg Cost</th>
                <th className="py-3 px-3 font-semibold text-right">Mkt Value</th>
                <th className="py-3 px-3 font-semibold text-right">Unrealized P&L</th>
                <th className="py-3 px-4 font-semibold text-right">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
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
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Commodity Thumbnail, Name & Formula */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {drug && <DrugImage drug={drug} size="sm" />}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-base group-hover:text-indigo-300 transition-colors">
                              {drug?.name ?? item.drugId}
                            </span>
                            {drug?.chemicalFormula && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-400 font-bold border border-indigo-900/60 text-[11px] tracking-tight shrink-0">
                                {formatFormula(drug.chemicalFormula)}
                              </span>
                            )}
                          </div>

                          {/* Shorter Definition with Zoom on Hover */}
                          <div className="relative group/def cursor-help inline-block">
                            <div className="text-xs text-slate-400 truncate max-w-[160px] sm:max-w-[190px] mt-0.5 transition-all duration-200 origin-left group-hover/def:scale-105 group-hover/def:text-indigo-300">
                              {drug?.scientificName ? drug.scientificName : drug?.description}
                            </div>

                            {/* Floating Zoomed Card */}
                            {drug && (
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover/def:block z-50 w-72 p-3 bg-slate-950/95 border border-indigo-500/80 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
                                  <span className="font-bold text-indigo-400 text-xs uppercase">{drug.name}</span>
                                  <span className="text-[10px] text-slate-400 font-bold">{formatFormula(drug.chemicalFormula)}</span>
                                </div>
                                {drug.scientificName && (
                                  <div className="text-[11px] text-sky-300 font-semibold mb-1">
                                    {drug.scientificName}
                                  </div>
                                )}
                                <p className="text-[11px] text-slate-300 leading-relaxed">
                                  {drug.description}
                                </p>
                                {drug.molecularWeight && (
                                  <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                                    <span>Molecular Mass:</span>
                                    <span className="text-indigo-400 font-bold">{drug.molecularWeight}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Units */}
                    <td className="py-3.5 px-3 text-right text-indigo-300 font-black text-base">
                      {item.units}
                    </td>

                    {/* Avg Cost */}
                    <td className="py-3.5 px-3 text-right text-slate-400 text-sm">
                      ${item.avgCost.toLocaleString()}
                    </td>

                    {/* Current Value */}
                    <td className="py-3.5 px-3 text-right text-slate-100 font-black text-sm lg:text-base">
                      ${totalValue.toLocaleString()}
                    </td>

                    {/* Unrealized P&L */}
                    <td className="py-3.5 px-3 text-right font-black text-sm">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          profit > 0
                            ? 'text-emerald-400'
                            : profit < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {profit > 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : profit < 0 ? (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        ) : null}
                        {profit >= 0 ? '+' : ''}${profit.toLocaleString()} ({profitPercent}%)
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openTradeModal(item.drugId, 'sell')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-sm active:scale-95"
                        >
                          Liquidate
                        </button>
                        <button
                          onClick={() => openTradeModal(item.drugId, 'dump')}
                          className="p-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 border border-slate-700/60 transition-colors"
                          title="Dump into sewer to avoid DEA detection"
                        >
                          <Trash2 className="w-4 h-4" />
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
