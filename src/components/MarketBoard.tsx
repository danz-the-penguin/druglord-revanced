import React, { useRef, useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUGS } from '../engine/constants';
import { getInventoryTotalUnits, getCarryingCapacity } from '../engine/game';
import { Sparkline } from './Sparkline';
import { CommodityPreviewCard } from './CommodityPreviewCard';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  ArrowDownRight,
  ArrowUpRight,
  ArrowDownAZ,
  ArrowDownZA,
  ArrowDown01,
  ArrowDown10,
  Search,
  X,
  SlidersHorizontal,
  Layers,
  RotateCcw,
  Radio,
  LineChart,
  Globe,
} from 'lucide-react';

type SortField = 'default' | 'name' | 'price' | 'quantity' | 'stash';
type SortDirection = 'asc' | 'desc';
type FilterMode = 'all' | 'affordable' | 'in_stash' | 'surges';

export const MarketBoard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const market = useGameStore((s) => s.market);
  const player = useGameStore((s) => s.player);
  const priceHistory = useGameStore((s) => s.priceHistory);
  const openTradeModal = useGameStore((s) => s.openTradeModal);
  const openDrugGraph = useGameStore((s) => s.openDrugGraph);
  const openGlobalAnalytics = useGameStore((s) => s.openGlobalAnalytics);

  const totalUnits = getInventoryTotalUnits(player);
  const capacity = getCarryingCapacity(player);
  const remainingCapacity = Math.max(0, capacity - totalUnits);

  // Sorting and Filtering State
  const [sortField, setSortField] = useState<SortField>('default');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

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

  // Toggle sorting logic
  const handleSortToggle = (field: SortField, defaultDir: SortDirection = 'desc') => {
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

  const handleResetFilters = () => {
    setSortField('default');
    setSortDirection('desc');
    setSearchQuery('');
    setFilterMode('all');
  };

  // Counts for filter pills
  const affordableCount = useMemo(() => {
    return DRUGS.filter((d) => {
      const p = market[d.id]?.price ?? d.basePrice;
      const u = market[d.id]?.availableUnits ?? 0;
      return player.cash >= p && u > 0 && remainingCapacity > 0;
    }).length;
  }, [market, player.cash, remainingCapacity]);

  const inStashCount = useMemo(() => {
    return DRUGS.filter((d) => (player.inventory[d.id]?.units ?? 0) > 0).length;
  }, [player.inventory]);

  const surgesCount = useMemo(() => {
    return DRUGS.filter((d) => {
      const surge = market[d.id]?.surge;
      return surge === 'high' || surge === 'crash';
    }).length;
  }, [market]);

  // Filtered and Sorted Drugs List
  const processedDrugs = useMemo(() => {
    let list = [...DRUGS];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.chemicalFormula?.toLowerCase().includes(q) ||
          d.scientificName?.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filterMode === 'affordable') {
      list = list.filter((d) => {
        const p = market[d.id]?.price ?? d.basePrice;
        const u = market[d.id]?.availableUnits ?? 0;
        return player.cash >= p && u > 0 && remainingCapacity > 0;
      });
    } else if (filterMode === 'in_stash') {
      list = list.filter((d) => (player.inventory[d.id]?.units ?? 0) > 0);
    } else if (filterMode === 'surges') {
      list = list.filter((d) => {
        const surge = market[d.id]?.surge;
        return surge === 'high' || surge === 'crash';
      });
    }

    // Sorting
    if (sortField === 'name') {
      list.sort((a, b) => {
        const res = a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? res : -res;
      });
    } else if (sortField === 'price') {
      list.sort((a, b) => {
        const pA = market[a.id]?.price ?? a.basePrice;
        const pB = market[b.id]?.price ?? b.basePrice;
        return sortDirection === 'asc' ? pA - pB : pB - pA;
      });
    } else if (sortField === 'quantity') {
      list.sort((a, b) => {
        const qA = market[a.id]?.availableUnits ?? 0;
        const qB = market[b.id]?.availableUnits ?? 0;
        return sortDirection === 'asc' ? qA - qB : qB - qA;
      });
    } else if (sortField === 'stash') {
      list.sort((a, b) => {
        const sA = player.inventory[a.id]?.units ?? 0;
        const sB = player.inventory[b.id]?.units ?? 0;
        return sortDirection === 'asc' ? sA - sB : sB - sA;
      });
    }

    return list;
  }, [searchQuery, filterMode, sortField, sortDirection, market, player.inventory, player.cash, remainingCapacity]);

  return (
    <div ref={containerRef} className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header Bar */}
      <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShoppingCart className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold uppercase tracking-wider font-mono text-slate-100">
            Institutional Order Book & Spot Market
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openGlobalAnalytics()}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
            title="Open 21-City Global Price Radar & Smuggling Arbitrage"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>Global Radar</span>
          </button>
          <span className="text-sm text-slate-300 font-mono">
            Available Stash: <strong className="text-emerald-400 text-base">{remainingCapacity}</strong> / {capacity} units
          </span>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-slate-950/80 px-5 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Search and Filter Mode Pills */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drug or formula..."
              className="w-full bg-slate-900 border border-slate-700/70 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
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

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All ({DRUGS.length})
            </button>

            <button
              onClick={() => setFilterMode('affordable')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                filterMode === 'affordable'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Affordable ({affordableCount})
            </button>

            <button
              onClick={() => setFilterMode('in_stash')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                filterMode === 'in_stash'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              In Stash ({inStashCount})
            </button>

            <button
              onClick={() => setFilterMode('surges')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                filterMode === 'surges'
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Shocks ({surgesCount})
            </button>
          </div>
        </div>

        {/* Right: Quick Sort Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 text-[11px] font-bold uppercase flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-400" /> Sort:
          </span>

          <button
            onClick={() => handleSortToggle('name', 'asc')}
            className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              sortField === 'name'
                ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="Sort alphabetically by name"
          >
            {sortField === 'name' && sortDirection === 'desc' ? (
              <ArrowDownZA className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ArrowDownAZ className="w-3.5 h-3.5 text-emerald-400" />
            )}
            Alphabetical {sortField === 'name' && (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)')}
          </button>

          <button
            onClick={() => handleSortToggle('price', 'desc')}
            className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              sortField === 'price'
                ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="Sort by spot price"
          >
            {sortField === 'price' && sortDirection === 'asc' ? (
              <ArrowDown01 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ArrowDown10 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            Price {sortField === 'price' && (sortDirection === 'desc' ? '▼' : '▲')}
          </button>

          <button
            onClick={() => handleSortToggle('quantity', 'desc')}
            className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              sortField === 'quantity'
                ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="Sort by available supply quantity"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Quantity {sortField === 'quantity' && (sortDirection === 'desc' ? '▼' : '▲')}
          </button>

          {(sortField !== 'default' || filterMode !== 'all' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="px-2 py-1 rounded-md text-[11px] font-bold text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 flex items-center gap-1 transition-colors ml-1 cursor-pointer"
              title="Reset all filters and sort order"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-mono">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-xs">
            <tr>
              <th
                onClick={() => handleSortToggle('name', 'asc')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-emerald-400 transition-colors select-none group"
                title="Click to sort by commodity name"
              >
                <span className="flex items-center gap-1.5">
                  Commodity & Formula
                  {sortField === 'name' ? (
                    <span className="text-emerald-400">{sortDirection === 'asc' ? '▲ (A-Z)' : '▼ (Z-A)'}</span>
                  ) : (
                    <span className="text-slate-600 group-hover:text-slate-400">↕</span>
                  )}
                </span>
              </th>
              <th
                onClick={() => handleSortToggle('price', 'desc')}
                className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-emerald-400 transition-colors select-none group"
                title="Click to sort by spot price"
              >
                <span className="flex items-center justify-end gap-1.5">
                  Spot / Base
                  {sortField === 'price' ? (
                    <span className="text-emerald-400">{sortDirection === 'desc' ? '▼' : '▲'}</span>
                  ) : (
                    <span className="text-slate-600 group-hover:text-slate-400">↕</span>
                  )}
                </span>
              </th>
              <th className="py-3 px-3 font-semibold text-center">14D Action</th>
              <th className="py-3 px-3 font-semibold text-center">Market Trend</th>
              <th
                onClick={() => handleSortToggle('quantity', 'desc')}
                className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-emerald-400 transition-colors select-none group"
                title="Click to sort by market supply quantity"
              >
                <span className="flex items-center justify-end gap-1.5">
                  Supply
                  {sortField === 'quantity' ? (
                    <span className="text-emerald-400">{sortDirection === 'desc' ? '▼' : '▲'}</span>
                  ) : (
                    <span className="text-slate-600 group-hover:text-slate-400">↕</span>
                  )}
                </span>
              </th>
              <th
                onClick={() => handleSortToggle('stash', 'desc')}
                className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-emerald-400 transition-colors select-none group"
                title="Click to sort by quantity in stash"
              >
                <span className="flex items-center justify-end gap-1.5">
                  In Stash
                  {sortField === 'stash' ? (
                    <span className="text-emerald-400">{sortDirection === 'desc' ? '▼' : '▲'}</span>
                  ) : (
                    <span className="text-slate-600 group-hover:text-slate-400">↕</span>
                  )}
                </span>
              </th>
              <th className="py-3 px-4 font-semibold text-right">Execution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {processedDrugs.map((drug) => {
              const marketItem = market[drug.id];
              const price = marketItem?.price ?? drug.basePrice;
              const availableUnits = marketItem?.availableUnits ?? 0;
              const playerHolding = player.inventory[drug.id]?.units ?? 0;
              const vaultHolding = player.vaults?.[player.currentCityId]?.[drug.id] ?? 0;
              const activeIntelTip = player.activeIntel?.find(
                (t) => t.cityId === player.currentCityId && t.drugId === drug.id && t.purchased && t.targetDay >= player.currentDay
              );
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

                  {/* Spot Price & Global Base Price */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="font-black text-slate-100 text-base lg:text-lg leading-tight">
                      ${price.toLocaleString()}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                      <span>Base:</span>
                      <span className="text-slate-300 font-semibold">${drug.basePrice.toLocaleString()}</span>
                      {(() => {
                        const diff = price - drug.basePrice;
                        const pct = Math.round((diff / drug.basePrice) * 100);
                        if (pct === 0) return null;
                        return (
                          <span
                            className={`text-[10px] font-bold px-1 py-0.2 rounded font-mono ${
                              diff > 0
                                ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/60'
                                : 'text-rose-400 bg-rose-950/80 border border-rose-800/60'
                            }`}
                            title={`Spot price is ${diff > 0 ? '+' : ''}${diff.toLocaleString()} (${diff > 0 ? '+' : ''}${pct}%) compared to global baseline`}
                          >
                            {diff > 0 ? `+${pct}%` : `${pct}%`}
                          </span>
                        );
                      })()}
                    </div>
                  </td>

                  {/* 14D Sparkline Chart */}
                  <td
                    onClick={() => openDrugGraph(drug.id)}
                    className="py-3.5 px-3 text-center cursor-pointer group/spark hover:bg-slate-800/80 transition-colors"
                    title={`Click to open ${drug.name} price graph modal`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Sparkline data={history} width={100} height={26} />
                      <LineChart className="w-3.5 h-3.5 text-slate-500 group-hover/spark:text-emerald-400 opacity-60 group-hover/spark:opacity-100 transition-all shrink-0" />
                    </div>
                  </td>

                  {/* Trend / Surge & Inside Intel */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex flex-col items-center gap-1">
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

                      {activeIntelTip && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-950/90 border border-orange-600 text-orange-300 animate-pulse cursor-help"
                          title={`Wiretip: ${activeIntelTip.headline}`}
                        >
                          <Radio className="w-3 h-3 text-orange-400" />
                          <span>Day {activeIntelTip.targetDay} {activeIntelTip.eventType === 'surge_spike' ? '+Spike' : activeIntelTip.eventType === 'market_glut' ? '-Glut' : 'Raid'}</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Available Units */}
                  <td className="py-3.5 px-3 text-right">
                    {availableUnits > 0 ? (
                      <span className="text-slate-200 font-bold text-sm">{availableUnits}</span>
                    ) : (
                      <span className="text-slate-600 italic text-xs">0 (Bids only)</span>
                    )}
                  </td>

                  {/* Stash & Local Vault */}
                  <td className="py-3.5 px-3 text-right">
                    {playerHolding > 0 || vaultHolding > 0 ? (
                      <div>
                        {playerHolding > 0 ? (
                          <span className="text-emerald-400 font-black text-sm">{playerHolding}</span>
                        ) : (
                          <span className="text-slate-600 text-sm">0</span>
                        )}
                        {vaultHolding > 0 && (
                          <span
                            className="text-[10px] text-teal-400 block font-bold font-mono"
                            title="Stored in local safehouse vault"
                          >
                            +{vaultHolding} vlt
                          </span>
                        )}
                      </div>
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
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          canAfford
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/60 active:scale-95'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => openTradeModal(drug.id, 'sell')}
                        disabled={!canSell}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          canSell
                            ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-950/60 active:scale-95'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                        }`}
                      >
                        Sell
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {processedDrugs.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 font-mono text-sm">
                  No commodities match your filter criteria "{searchQuery || filterMode}".
                  <button
                    onClick={handleResetFilters}
                    className="ml-2 text-emerald-400 underline hover:text-emerald-300 font-bold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

