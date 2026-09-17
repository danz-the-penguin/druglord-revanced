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
                    {/* Commodity Card with Hover Zoom & Embedded Large Image */}
                    <td className="py-2 px-3 relative">
                      <div className="relative group/card">
                        {/* Resting Card View */}
                        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5 transition-all duration-200 group-hover/card:border-indigo-500/80 group-hover/card:bg-slate-900/90 cursor-pointer">
                          <div className="flex items-center gap-3">
                            {drug && <DrugImage drug={drug} size="sm" />}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-100 text-base group-hover/card:text-indigo-300 transition-colors">
                                  {drug?.name ?? item.drugId}
                                </span>
                                {drug?.chemicalFormula && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-400 font-bold border border-indigo-900/60 text-[10px] tracking-tight shrink-0">
                                    {formatFormula(drug.chemicalFormula)}
                                  </span>
                                )}
                              </div>
                              {/* Shorter resting definition */}
                              <div className="text-xs text-slate-400 truncate max-w-[160px] sm:max-w-[190px] mt-0.5">
                                {drug?.scientificName ? drug.scientificName : drug?.description}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* The Whole Zoomed Hover Card (Bigger zoom & bigger image with the card!) */}
                        {drug && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[440px] hidden group-hover/card:flex z-50 rounded-3xl border-2 border-indigo-400 bg-slate-950/98 p-5 shadow-[0_20px_60px_-15px_rgba(99,102,241,0.35)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 scale-105 pointer-events-none gap-4 items-start ring-1 ring-indigo-500/40">
                            {/* Much larger image WITH the card */}
                            <div className="shrink-0">
                              <DrugImage drug={drug} size="lg" className="ring-2 ring-indigo-400/80 shadow-2xl rounded-2xl" />
                            </div>

                            {/* Complete Details & Definition */}
                            <div className="flex-1 min-w-0 font-mono">
                              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
                                <span className="font-black text-indigo-300 text-lg uppercase tracking-wide truncate">
                                  {drug.name}
                                </span>
                                {drug.chemicalFormula && (
                                  <span className="px-2 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 font-black border border-indigo-700 text-xs shrink-0 shadow-sm">
                                    {formatFormula(drug.chemicalFormula)}
                                  </span>
                                )}
                              </div>

                              {drug.scientificName && (
                                <div className="text-xs font-bold text-sky-400 mb-1.5 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
                                  {drug.scientificName}
                                </div>
                              )}

                              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                                {drug.description}
                              </p>

                              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                                <span>Mol Mass: <strong className="text-slate-100">{drug.molecularWeight || 'N/A'}</strong></span>
                                <span>Avg Cost: <strong className="text-indigo-400 font-bold">${item.avgCost.toLocaleString()}</strong></span>
                              </div>
                            </div>
                          </div>
                        )}
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
