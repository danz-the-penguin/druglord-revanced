import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUGS, DRUG_MAP, CITIES, CITY_MAP } from '../engine/constants';
import { DrugImage } from './DrugImage';
import { getDrugDetails } from '../engine/drugDetails';
import {
  TrendingUp,
  TrendingDown,
  X,
  Globe,
  ShoppingCart,
  Calendar,
} from 'lucide-react';

export const DrugGraphModal: React.FC = () => {
  const {
    isDrugGraphOpen,
    selectedGraphDrugId,
    closeDrugGraph,
    openTradeModal,
    openGlobalAnalytics,
    globalPriceHistory,
    priceHistory,
    market,
    player,
  } = useGameStore();

  const [selectedCityId, setSelectedCityId] = useState<string>(player.currentCityId);
  const [hoveredPoint, setHoveredPoint] = useState<{ day: number; price: number; index: number; x: number; y: number } | null>(null);

  const activeDrugId = selectedGraphDrugId || 'cocaine';
  const drug = DRUG_MAP.get(activeDrugId) || DRUGS[0];
  const drugDetails = getDrugDetails(drug.id);
  const city = CITY_MAP.get(selectedCityId) || CITY_MAP.get(player.currentCityId) || CITIES[0];

  // Retrieve price series for this drug in the selected city
  const rawSeries = useMemo(() => {
    const cityHistory = globalPriceHistory[drug.id]?.[selectedCityId];
    if (cityHistory && cityHistory.length > 0) {
      return cityHistory;
    }
    if (selectedCityId === player.currentCityId && priceHistory[drug.id] && priceHistory[drug.id].length > 0) {
      return priceHistory[drug.id];
    }
    const base = Math.round(drug.basePrice * (city.drugModifiers[drug.id] ?? 1.0));
    return [base * 0.95, base * 1.02, base * 0.98, base * 1.05, base];
  }, [globalPriceHistory, priceHistory, drug.id, drug.basePrice, selectedCityId, player.currentCityId, city.drugModifiers]);

  const currentPrice = selectedCityId === player.currentCityId
    ? (market[drug.id]?.price ?? rawSeries[rawSeries.length - 1] ?? drug.basePrice)
    : (rawSeries[rawSeries.length - 1] ?? Math.round(drug.basePrice * (city.drugModifiers[drug.id] ?? 1.0)));

  const ath = useMemo(() => Math.max(...rawSeries, currentPrice), [rawSeries, currentPrice]);
  const atl = useMemo(() => Math.min(...rawSeries, currentPrice), [rawSeries, currentPrice]);
  const avg = useMemo(() => Math.round(rawSeries.reduce((a, b) => a + b, 0) / rawSeries.length), [rawSeries]);

  const prevPrice = rawSeries.length > 1 ? rawSeries[rawSeries.length - 2] : currentPrice;
  const delta = currentPrice - prevPrice;
  const deltaPct = prevPrice > 0 ? (delta / prevPrice) * 100 : 0;

  const baseRatio = drug.basePrice > 0 ? ((currentPrice - drug.basePrice) / drug.basePrice) * 100 : 0;

  if (!isDrugGraphOpen) return null;

  // Chart Dimensions
  const svgWidth = 660;
  const svgHeight = 260;
  const paddingLeft = 65;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 35;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const minVal = Math.floor(atl * 0.88);
  const maxVal = Math.ceil(ath * 1.12);
  const valRange = Math.max(1, maxVal - minVal);

  const getX = (index: number) => {
    if (rawSeries.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (rawSeries.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;
  };

  // Generate SVG path
  const points = rawSeries.map((val, idx) => ({ x: getX(idx), y: getY(val), val, idx }));
  const pathData = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = points.length > 0
    ? `${pathData} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : '';

  const yTicks = [
    minVal,
    Math.round(minVal + valRange * 0.33),
    Math.round(minVal + valRange * 0.66),
    maxVal,
  ];

  const athY = getY(ath);
  const atlY = getY(atl);
  const avgY = getY(avg);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-mono select-none animate-in fade-in duration-200">
      <div className="bg-slate-950 border-2 border-emerald-500/80 rounded-3xl w-full max-w-3xl overflow-hidden shadow-[0_25px_70px_rgba(16,185,129,0.25)] flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-700/80 shrink-0">
              <DrugImage drug={drug} size="md" className="w-10 h-10 rounded-lg" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-emerald-300 uppercase tracking-wider">
                  {drug.name}
                </h3>
                {drug.chemicalFormula && (
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-emerald-800 text-emerald-400 text-xs font-bold">
                    {drug.chemicalFormula}
                  </span>
                )}
                <span className="text-xs text-slate-400">• {drugDetails.drugClass}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {drug.scientificName} • {drugDetails.schedule}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openGlobalAnalytics(drug.id)}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Open Global Multi-Country Arbitrage Radar"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>All Cities Radar</span>
            </button>
            <button
              onClick={closeDrugGraph}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: City Selector & Drug Tabs */}
        <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 uppercase font-bold text-[11px] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> City Chart:
            </span>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-bold text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.country}) {c.id === player.currentCityId ? '★ You Are Here' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Spot Price ({city.name})</span>
              <span className="text-base font-black text-slate-100">
                ${currentPrice.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 uppercase text-[10px] block">24H Velocity</span>
              <span className={`font-bold inline-flex items-center gap-0.5 ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {delta >= 0 ? '+' : ''}{deltaPct.toFixed(1)}% (${Math.abs(delta).toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body: Retro Chart View */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Retro Drug Lord Style SVG Graph */}
          <div className="bg-[#05080e] border border-slate-800 rounded-2xl p-4 shadow-inner relative overflow-hidden">
            {/* Legend & Indicator Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-[11px]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500" /> Spot Trend
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <span className="w-2 h-0.5 bg-amber-400 border-t border-dashed" /> ATH (${ath.toLocaleString()})
                </span>
                <span className="flex items-center gap-1 text-sky-400 font-bold">
                  <span className="w-2 h-0.5 bg-sky-400 border-t border-dashed" /> ATL (${atl.toLocaleString()})
                </span>
                <span className="flex items-center gap-1 text-violet-400 font-bold">
                  <span className="w-2 h-0.5 bg-violet-400 border-t border-dashed" /> Avg (${avg.toLocaleString()})
                </span>
              </div>
              <span className="text-slate-500 text-[10px] font-mono">
                Historical Window: Last {rawSeries.length} Days Recorded
              </span>
            </div>

            {/* SVG Canvas */}
            <div className="relative w-full aspect-[22/9] max-h-[260px]">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="drugGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Background Grid Lines & Y-axis labels */}
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

                {/* Reference Lines */}
                {/* ATH */}
                <line
                  x1={paddingLeft}
                  y1={athY}
                  x2={svgWidth - paddingRight}
                  y2={athY}
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                  strokeOpacity="0.7"
                />
                {/* ATL */}
                <line
                  x1={paddingLeft}
                  y1={atlY}
                  x2={svgWidth - paddingRight}
                  y2={atlY}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                  strokeOpacity="0.7"
                />
                {/* Moving Avg */}
                <line
                  x1={paddingLeft}
                  y1={avgY}
                  x2={svgWidth - paddingRight}
                  y2={avgY}
                  stroke="#a855f7"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  strokeOpacity="0.6"
                />

                {/* Gradient Fill Area */}
                {areaPath && <path d={areaPath} fill="url(#drugGradient)" />}

                {/* Price Stroke Line */}
                {pathData && (
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="drop-shadow(0 2px 6px rgba(16, 185, 129, 0.4))"
                  />
                )}

                {/* Interactive Points */}
                {points.map((pt) => {
                  const isLast = pt.idx === points.length - 1;
                  const isHovered = hoveredPoint?.index === pt.idx;
                  return (
                    <g key={pt.idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : isLast ? 4.5 : 3}
                        fill={isLast ? '#34d399' : '#10b981'}
                        stroke="#05080e"
                        strokeWidth="2"
                        className="transition-all cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredPoint({
                            day: Math.max(1, player.currentDay - (points.length - 1 - pt.idx)),
                            price: pt.val,
                            index: pt.idx,
                            x: pt.x,
                            y: pt.y,
                          })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {/* Day Label on X-axis */}
                      <text
                        x={pt.x}
                        y={svgHeight - 10}
                        fill="#64748b"
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        D{Math.max(1, player.currentDay - (points.length - 1 - pt.idx))}
                      </text>
                    </g>
                  );
                })}

                {/* Hover Tooltip inside SVG */}
                {hoveredPoint && (
                  <g transform={`translate(${hoveredPoint.x}, ${Math.max(paddingTop + 15, hoveredPoint.y - 30)})`}>
                    <rect
                      x="-45"
                      y="-18"
                      width="90"
                      height="22"
                      rx="4"
                      fill="#0f172a"
                      stroke="#10b981"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="-4"
                      fill="#f1f5f9"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      ${hoveredPoint.price.toLocaleString()}
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Key Financial Indicators Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
              <span className="text-[10px] uppercase text-slate-500 block">All-Time High (ATH)</span>
              <div className="text-base font-black text-amber-400 mt-0.5">
                ${ath.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">Peak recorded</span>
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
              <span className="text-[10px] uppercase text-slate-500 block">All-Time Low (ATL)</span>
              <div className="text-base font-black text-sky-400 mt-0.5">
                ${atl.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">Trough floor</span>
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
              <span className="text-[10px] uppercase text-slate-500 block">Spread vs Base</span>
              <div
                className={`text-base font-black mt-0.5 ${
                  baseRatio >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {baseRatio >= 0 ? '+' : ''}{baseRatio.toFixed(0)}%
              </div>
              <span className="text-[10px] text-slate-400">
                Base: ${drug.basePrice.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
              <span className="text-[10px] uppercase text-slate-500 block">Volatility Rating</span>
              <div className="text-base font-black text-violet-400 mt-0.5">
                ±{Math.round(drug.volatility * 100)}%
              </div>
              <span className="text-[10px] text-slate-400">Daily amplitude</span>
            </div>
          </div>

          {/* Underworld Trade Arbitrage Summary */}
          <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400">Primary Global Smuggling Pipeline:</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  Cheap Source: {drugDetails.topProducerCities.join(', ')}
                </span>
                <span className="text-slate-500">&rarr;</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  Top Markup: {drugDetails.topConsumerCities.join(', ')}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-400">Street Heat / Sniff Risk:</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 rounded font-black uppercase text-[10px] ${
                    drugDetails.heatImpact === 'Extreme'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : drugDetails.heatImpact === 'High'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Heat: {drugDetails.heatImpact}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                  Dogs: {drugDetails.customsRisk}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              closeDrugGraph();
              openGlobalAnalytics(drug.id);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Multi-Country Arbitrage Radar</span>
          </button>

          <div className="flex items-center gap-2">
            {selectedCityId === player.currentCityId && (
              <button
                onClick={() => {
                  closeDrugGraph();
                  openTradeModal(drug.id, 'buy');
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Trade in {city.name}</span>
              </button>
            )}
            <button
              onClick={closeDrugGraph}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors"
            >
              Close Graph
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
