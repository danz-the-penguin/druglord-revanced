import React, { useRef, useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUG_MAP } from '../engine/constants';
import { CommodityPreviewCard } from './CommodityPreviewCard';
import {
  Briefcase,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownAZ,
  ArrowDownZA,
  ArrowDown10,
  Search,
  X,
  SlidersHorizontal,
  Layers,
  RotateCcw,
  PackageOpen,
  ShoppingCart,
} from 'lucide-react';

type InvSortField = 'default' | 'name' | 'units' | 'value' | 'pnl';
type InvSortDirection = 'asc' | 'desc';

export const InventoryBoard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const player = useGameStore((s) => s.player);
  const market = useGameStore((s) => s.market);
  const openTradeModal = useGameStore((s) => s.openTradeModal);

  const inventoryEntries = Object.values(player.inventory).filter((item) => item.units > 0);

  // Sorting & search state
  const [sortField, setSortField] = useState<InvSortField>('default');
  const [sortDirection, setSortDirection] = useState<InvSortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSortToggle = (field: InvSortField, defaultDir: InvSortDirection = 'desc') => {
    if (sortField === field) {
      if (sortDirection === defaultDir) {
        setSortDirection(defaultDir === 'desc' ? 'asc' : 'desc');
      } else {
        setSortField('default');
      }
    } else {
      setSortField(field);
      setSortDirection(defaultDir);
    }
  };

  const handleReset = () => {
    setSortField('default');
    setSortDirection('desc');
    setSearchQuery('');
  };

  // Processed inventory entries
  const processedEntries = useMemo(() => {
    let list = [...inventoryEntries];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((item) => {
        const drug = DRUG_MAP.get(item.drugId);
        return (
          drug?.name.toLowerCase().includes(q) ||
          drug?.chemicalFormula?.toLowerCase().includes(q) ||
          drug?.scientificName?.toLowerCase().includes(q) ||
          item.drugId.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    if (sortField === 'name') {
      list.sort((a, b) => {
        const nameA = DRUG_MAP.get(a.drugId)?.name ?? a.drugId;
        const nameB = DRUG_MAP.get(b.drugId)?.name ?? b.drugId;
        const res = nameA.localeCompare(nameB);
        return sortDirection === 'asc' ? res : -res;
      });
    } else if (sortField === 'units') {
      list.sort((a, b) => {
        return sortDirection === 'asc' ? a.units - b.units : b.units - a.units;
      });
    } else if (sortField === 'value') {
      list.sort((a, b) => {
        const valA = a.units * (market[a.drugId]?.price ?? a.avgCost);
        const valB = b.units * (market[b.drugId]?.price ?? b.avgCost);
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
    } else if (sortField === 'pnl') {
      list.sort((a, b) => {
        const pnlA = a.units * ((market[a.drugId]?.price ?? a.avgCost) - a.avgCost);
        const pnlB = b.units * ((market[b.drugId]?.price ?? b.avgCost) - b.avgCost);
        return sortDirection === 'asc' ? pnlA - pnlB : pnlB - pnlA;
      });
    }

    return list;
  }, [inventoryEntries, searchQuery, sortField, sortDirection, market]);

  const scrollToOrderBook = () => {
    const el = document.getElementById('market-order-book');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header Bar */}
      <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
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
        <div className="p-10 sm:p-14 flex flex-col items-center justify-center text-center font-mono space-y-3.5 select-none">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border-2 border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-950/50 mb-1 animate-in zoom-in-95">
            <PackageOpen className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-base font-black text-slate-200 uppercase tracking-wider">
            Your Trench Coat & Stash Are Empty
          </h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed font-sans">
            You currently hold 0 contraband units in your personal inventory. Scan the live Institutional Order Book to initiate your first commodity arbitrage trades.
          </p>
          <button
            onClick={scrollToOrderBook}
            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-950/60 cursor-pointer active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Browse Institutional Order Book ↓</span>
          </button>
        </div>
      ) : (
        <>
          {/* Sorting & Search Toolbar */}
          <div className="bg-slate-950/80 px-5 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stash..."
                className="w-full bg-slate-900 border border-slate-700/70 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Sort Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 text-[11px] font-bold uppercase flex items-center gap-1 mr-1">
                <SlidersHorizontal className="w-3 h-3 text-slate-400" /> Sort:
              </span>

              <button
                onClick={() => handleSortToggle('name', 'asc')}
                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  sortField === 'name'
                    ? 'bg-indigo-950 border border-indigo-600 text-indigo-300'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title="Sort alphabetically by name"
              >
                {sortField === 'name' && sortDirection === 'desc' ? (
                  <ArrowDownZA className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <ArrowDownAZ className="w-3.5 h-3.5 text-indigo-400" />
                )}
                Alphabetical
              </button>

              <button
                onClick={() => handleSortToggle('units', 'desc')}
                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  sortField === 'units'
                    ? 'bg-indigo-950 border border-indigo-600 text-indigo-300'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title="Sort by quantity of units held"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Quantity {sortField === 'units' && (sortDirection === 'desc' ? '▼' : '▲')}
              </button>

              <button
                onClick={() => handleSortToggle('value', 'desc')}
                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  sortField === 'value'
                    ? 'bg-indigo-950 border border-indigo-600 text-indigo-300'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title="Sort by total market value"
              >
                <ArrowDown10 className="w-3.5 h-3.5 text-indigo-400" />
                Value {sortField === 'value' && (sortDirection === 'desc' ? '▼' : '▲')}
              </button>

              <button
                onClick={() => handleSortToggle('pnl', 'desc')}
                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  sortField === 'pnl'
                    ? 'bg-indigo-950 border border-indigo-600 text-indigo-300'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title="Sort by unrealized profit/loss"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
                P&L {sortField === 'pnl' && (sortDirection === 'desc' ? '▼' : '▲')}
              </button>

              {(sortField !== 'default' || searchQuery) && (
                <button
                  onClick={handleReset}
                  className="px-2 py-1 rounded-md text-[11px] font-bold text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 flex items-center gap-1 transition-colors ml-1 cursor-pointer"
                  title="Reset sorting and search"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-xs">
                <tr>
                  <th
                    onClick={() => handleSortToggle('name', 'asc')}
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-indigo-400 transition-colors select-none group"
                    title="Click to sort by commodity name"
                  >
                    <span className="flex items-center gap-1.5">
                      Commodity & Formula
                      {sortField === 'name' ? (
                        <span className="text-indigo-400">{sortDirection === 'asc' ? '▲ (A-Z)' : '▼ (Z-A)'}</span>
                      ) : (
                        <span className="text-slate-600 group-hover:text-slate-400">↕</span>
                      )}
                    </span>
                  </th>
                  <th
                    onClick={() => handleSortToggle('units', 'desc')}
                    className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-indigo-400 transition-colors select-none group"
                    title="Click to sort by units held"
                  >
                    <span className="flex items-center justify-end gap-1.5">
                      Units
                      {sortField === 'units' ? (
                        <span className="text-indigo-400">{sortDirection === 'desc' ? '▼' : '▲'}</span>
                      ) : (
                        <span className="text-slate-600 group-hover:text-slate-400">↕</span>
                      )}
                    </span>
                  </th>
                  <th className="py-3 px-3 font-semibold text-right">Avg Cost</th>
                  <th
                    onClick={() => handleSortToggle('value', 'desc')}
                    className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-indigo-400 transition-colors select-none group"
                    title="Click to sort by total market value"
                  >
                    <span className="flex items-center justify-end gap-1.5">
                      Mkt Value
                      {sortField === 'value' ? (
                        <span className="text-indigo-400">{sortDirection === 'desc' ? '▼' : '▲'}</span>
                      ) : (
                        <span className="text-slate-600 group-hover:text-slate-400">↕</span>
                      )}
                    </span>
                  </th>
                  <th
                    onClick={() => handleSortToggle('pnl', 'desc')}
                    className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-indigo-400 transition-colors select-none group"
                    title="Click to sort by unrealized profit/loss"
                  >
                    <span className="flex items-center justify-end gap-1.5">
                      Unrealized P&L
                      {sortField === 'pnl' ? (
                        <span className="text-indigo-400">{sortDirection === 'desc' ? '▼' : '▲'}</span>
                      ) : (
                        <span className="text-slate-600 group-hover:text-slate-400">↕</span>
                      )}
                    </span>
                  </th>
                  <th className="py-3 px-4 font-semibold text-right">Execution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {processedEntries.map((item) => {
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
                      {/* Commodity Card with Boundary-Safe Hover & Click Zoom */}
                      <td className="py-2 px-3 relative">
                        <CommodityPreviewCard
                          drug={drug || { id: item.drugId, name: item.drugId, basePrice: item.avgCost, minPrice: item.avgCost, maxPrice: item.avgCost, volatility: 0.2, description: 'Player commodity holding' }}
                          formatFormula={formatFormula}
                          theme="indigo"
                          containerRef={containerRef}
                        />
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
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            Liquidate
                          </button>
                          <button
                            onClick={() => openTradeModal(item.drugId, 'dump')}
                            className="p-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 border border-slate-700/60 transition-colors cursor-pointer"
                            title="Dump into sewer to avoid DEA detection"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {processedEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-sm">
                      No stash items match your search "{searchQuery}".
                      <button
                        onClick={handleReset}
                        className="ml-2 text-indigo-400 underline hover:text-indigo-300 font-bold cursor-pointer"
                      >
                        Clear Search
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

