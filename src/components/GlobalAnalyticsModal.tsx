import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUGS, DRUG_MAP, CITIES, CITY_MAP } from '../engine/constants';
import { getDrugDetails } from '../engine/drugDetails';
import {
  Globe,
  X,
  Plane,
  Compass,
} from 'lucide-react';

const CITY_PALETTE: Record<string, string> = {
  new_york: '#f59e0b', // amber
  bogota: '#10b981', // emerald
  london: '#38bdf8', // sky
  tokyo: '#c084fc', // purple
  miami: '#fb7185', // rose
  berlin: '#22d3ee', // cyan
  amsterdam: '#a3e635', // lime
  los_angeles: '#fb923c', // orange
  zurich: '#818cf8', // indigo
  hong_kong: '#f43f5e', // red
  bangkok: '#e879f9', // fuchsia
  sydney: '#34d399', // teal
  medellin: '#4ade80', // green
  tijuana: '#fdba74', // warm
  frankfurt: '#94a3b8', // slate
  dubai: '#fbbf24', // gold
  rio_de_janeiro: '#2dd4bf', // mint
  johannesburg: '#a78bfa', // violet
  chicago: '#f97316', // orange-red
  seattle: '#06b6d4', // cyan-dark
  moscow: '#ef4444', // crimson
};

const DEFAULT_ACTIVE_CITIES = ['bogota', 'new_york', 'london', 'tokyo', 'miami'];

export const GlobalAnalyticsModal: React.FC = () => {
  const {
    isGlobalAnalyticsOpen,
    selectedAnalyticsDrugId,
    setSelectedAnalyticsDrugId,
    closeGlobalAnalytics,
    openTradeModal,
    travel,
    globalPriceHistory,
    market,
    player,
  } = useGameStore();

  const [activeCities, setActiveCities] = useState<string[]>(DEFAULT_ACTIVE_CITIES);

  const activeDrugId = selectedAnalyticsDrugId || 'cocaine';
  const drug = DRUG_MAP.get(activeDrugId) || DRUGS[0];
  const drugDetails = getDrugDetails(drug.id);

  if (!isGlobalAnalyticsOpen) return null;

  const toggleCity = (cityId: string) => {
    setActiveCities((prev) => {
      if (prev.includes(cityId)) {
        if (prev.length <= 1) return prev; // keep at least 1
        return prev.filter((id) => id !== cityId);
      } else {
        if (prev.length >= 7) return prev; // max 7
        return [...prev, cityId];
      }
    });
  };

  // Compile full price list across all 21 cities
  const cityPriceEntries = CITIES.map((city) => {
    const isCurrent = city.id === player.currentCityId;
    const history = globalPriceHistory[drug.id]?.[city.id] || [];
    const price = isCurrent
      ? (market[drug.id]?.price ?? drug.basePrice)
      : (history[history.length - 1] ?? Math.round(drug.basePrice * (city.drugModifiers[drug.id] ?? 1.0)));

    const baseSpread = drug.basePrice > 0 ? ((price - drug.basePrice) / drug.basePrice) * 100 : 0;
    const vaultUnits = player.vaults?.[city.id]?.[drug.id] ?? 0;

    return {
      city,
      price,
      history,
      baseSpread,
      vaultUnits,
      isCurrent,
    };
  }).sort((a, b) => a.price - b.price);

  const cheapestEntry = cityPriceEntries[0];
  const highestEntry = cityPriceEntries[cityPriceEntries.length - 1];
  const grossArbitrageSpread = Math.max(0, highestEntry.price - cheapestEntry.price);
  const grossRoi = cheapestEntry.price > 0 ? (grossArbitrageSpread / cheapestEntry.price) * 100 : 0;

  // Chart setup
  const svgWidth = 720;
  const svgHeight = 280;
  const paddingLeft = 70;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 35;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Find max length among active cities
  const seriesLengths = activeCities.map(
    (cId) => globalPriceHistory[drug.id]?.[cId]?.length || 5
  );
  const maxSeriesLength = Math.max(5, ...seriesLengths);

  // Compute all prices in active series to bound Y-axis
  const allActivePrices: number[] = [];
  activeCities.forEach((cId) => {
    const s = globalPriceHistory[drug.id]?.[cId] || [];
    if (s.length > 0) allActivePrices.push(...s);
    else {
      const city = CITY_MAP.get(cId);
      allActivePrices.push(Math.round(drug.basePrice * (city?.drugModifiers[drug.id] ?? 1.0)));
    }
  });

  const minVal = Math.floor(Math.min(...allActivePrices) * 0.85);
  const maxVal = Math.ceil(Math.max(...allActivePrices) * 1.12);
  const valRange = Math.max(1, maxVal - minVal);

  const getX = (index: number) => {
    if (maxSeriesLength <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (maxSeriesLength - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;
  };

  const yTicks = [
    minVal,
    Math.round(minVal + valRange * 0.25),
    Math.round(minVal + valRange * 0.5),
    Math.round(minVal + valRange * 0.75),
    maxVal,
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-mono select-none animate-in fade-in duration-200">
      <div className="bg-slate-950 border-2 border-cyan-500/80 rounded-3xl w-full max-w-5xl overflow-hidden shadow-[0_25px_70px_rgba(6,182,212,0.25)] flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-700/80 text-cyan-400 shrink-0">
              <Globe className="w-6 h-6 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-cyan-300 uppercase tracking-wider">
                  Global Underworld Exchange & Multi-Country Radar
                </h3>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-bold">
                  21 Cities Monitored
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {drug.name} ({drugDetails.drugClass}) • Cross-border commodity arbitrage and historical price curves.
              </p>
            </div>
          </div>

          <button
            onClick={closeGlobalAnalytics}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drug Selector Pills Bar */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-slate-500 uppercase font-bold text-[11px] shrink-0 mr-1">
            Select Commodity:
          </span>
          {DRUGS.map((d) => {
            const isSelected = d.id === drug.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedAnalyticsDrugId(d.id)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{d.name}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Optimal Smuggling Route Recommendation Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-emerald-950/30 to-slate-900 border border-cyan-800/80 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black text-cyan-400 tracking-wider block">
                  Optimal Global Smuggling Route for {drug.name}
                </span>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-sm">
                  <span className="font-bold text-emerald-300">
                    Buy in {cheapestEntry.city.name} (${cheapestEntry.price.toLocaleString()})
                  </span>
                  <span className="text-slate-500 font-black">&rarr;</span>
                  <span className="font-bold text-cyan-300">
                    Sell in {highestEntry.city.name} (${highestEntry.price.toLocaleString()})
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Flight fare: ${cheapestEntry.city.flightCost + highestEntry.city.flightCost} • Net profit per 100 units: <strong className="text-emerald-400 font-bold">+${(grossArbitrageSpread * 100).toLocaleString()}</strong>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase text-slate-400 block">Gross Spread</span>
              <div className="text-xl font-black text-emerald-400">
                +${grossArbitrageSpread.toLocaleString()} / unit
              </div>
              <span className="text-xs text-emerald-300 font-bold">
                +{grossRoi.toFixed(0)}% Profit Margin
              </span>
            </div>
          </div>

          {/* Multi-City Historical Comparison Chart */}
          <div className="bg-[#05080e] border border-slate-800 rounded-2xl p-5 shadow-inner space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-300">
                  Historical City Price Action (Last {maxSeriesLength} Days)
                </span>
              </div>

              {/* Active City Toggle Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {CITIES.map((c) => {
                  const isActive = activeCities.includes(c.id);
                  const color = CITY_PALETTE[c.id] || '#38bdf8';
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCity(c.id)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 shadow-sm'
                          : 'bg-slate-950/60 opacity-40 hover:opacity-80 border-slate-800 text-slate-400'
                      }`}
                      style={{
                        borderColor: isActive ? color : undefined,
                        color: isActive ? color : undefined,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SVG Chart */}
            <div className="relative w-full aspect-[22/8] max-h-[280px]">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
              >
                {/* Y-axis Gridlines */}
                {yTicks.map((val, idx) => {
                  const y = getY(val);
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={svgWidth - paddingRight}
                        y2={y}
                        stroke="#1e293b"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 3}
                        fill="#64748b"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        ${val.toLocaleString()}
                      </text>
                    </g>
                  );
                })}

                {/* Plot each active city's price curve */}
                {activeCities.map((cId) => {
                  const series = globalPriceHistory[drug.id]?.[cId] || [];
                  const color = CITY_PALETTE[cId] || '#38bdf8';
                  if (series.length === 0) return null;

                  const pts = series.map((val, idx) => ({
                    x: getX(idx),
                    y: getY(val),
                    val,
                    idx,
                  }));

                  const d = pts.reduce((acc, pt, idx) => {
                    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                  }, '');

                  return (
                    <g key={cId}>
                      <path
                        d={d}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                      />
                      {pts.map((pt) => (
                        <circle
                          key={pt.idx}
                          cx={pt.x}
                          cy={pt.y}
                          r="3"
                          fill={color}
                          stroke="#05080e"
                          strokeWidth="1.5"
                          className="hover:r-5 transition-all cursor-pointer"
                        />
                      ))}
                    </g>
                  );
                })}

                {/* X-axis Day Labels */}
                {Array.from({ length: maxSeriesLength }).map((_, idx) => {
                  const x = getX(idx);
                  const dayNum = Math.max(1, player.currentDay - (maxSeriesLength - 1 - idx));
                  return (
                    <text
                      key={idx}
                      x={x}
                      y={svgHeight - 12}
                      fill="#64748b"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      D{dayNum}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Global Arbitrage Matrix Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-2">
                <span>All 21 Cities Price Arbitrage Table</span>
                <span className="text-slate-500 font-normal">(Sorted from Lowest to Highest)</span>
              </h4>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <th className="py-2.5 px-4 font-semibold">City & Country</th>
                    <th className="py-2.5 px-3 font-semibold">Region</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Spot Price</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Spread vs Base</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Vault Stash</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {cityPriceEntries.map((entry, idx) => {
                    const isCheapest = idx === 0;
                    const isHighest = idx === cityPriceEntries.length - 1;

                    return (
                      <tr
                        key={entry.city.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          entry.isCurrent ? 'bg-cyan-950/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: CITY_PALETTE[entry.city.id] || '#38bdf8' }}
                            />
                            <span className="font-bold text-slate-100">
                              {entry.city.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ({entry.city.country})
                            </span>
                            {entry.isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 text-[9px] font-black uppercase">
                                You
                              </span>
                            )}
                            {isCheapest && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px] font-black uppercase">
                                Best Buy
                              </span>
                            )}
                            {isHighest && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700 text-[9px] font-black uppercase">
                                Top Sell
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-slate-400">
                          {entry.city.region || 'Americas'}
                        </td>

                        <td className="py-2.5 px-3 text-right font-bold text-slate-100 font-mono text-sm">
                          ${entry.price.toLocaleString()}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span
                            className={
                              entry.baseSpread <= -10
                                ? 'text-emerald-400'
                                : entry.baseSpread >= 10
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }
                          >
                            {entry.baseSpread >= 0 ? '+' : ''}
                            {entry.baseSpread.toFixed(0)}%
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono">
                          {entry.vaultUnits > 0 ? (
                            <span className="text-emerald-400 font-bold">
                              {entry.vaultUnits.toLocaleString()} units
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        <td className="py-2.5 px-4 text-right">
                          {entry.isCurrent ? (
                            <button
                              onClick={() => {
                                closeGlobalAnalytics();
                                openTradeModal(drug.id, 'buy');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors shadow-sm"
                            >
                              Trade Here
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                travel(entry.city.id);
                                closeGlobalAnalytics();
                              }}
                              disabled={player.cash < entry.city.flightCost}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1 ml-auto"
                            >
                              <Plane className="w-3 h-3 text-sky-400" />
                              <span>Fly (${entry.city.flightCost})</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400">
            Current Benchmark Base Price: <strong className="text-slate-200 font-bold">${drug.basePrice.toLocaleString()}</strong>
          </div>
          <button
            onClick={closeGlobalAnalytics}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors"
          >
            Close Radar
          </button>
        </div>
      </div>
    </div>
  );
};
