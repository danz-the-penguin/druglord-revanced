import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { DRUGS, DRUG_MAP, CITIES, CITY_MAP } from '../engine/constants';
import { getDrugDetails } from '../engine/drugDetails';
import { AIRCRAFT_MAP, calculateAircraftFlightCost } from '../engine/aviation';
import {
  Globe,
  X,
  Plane,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Search,
  ArrowUpDown,
  TrendingUp,
} from 'lucide-react';
import { stepPlaybackSpeed } from '../utils/graphAnimation';

const SPEED_PRESETS = [0.5, 1, 2, 4];

// Comprehensive 30-City Distinct Underworld Radar Color Palette
const CITY_PALETTE: Record<string, string> = {
  new_york: '#f59e0b', // amber
  miami: '#fb7185', // rose
  los_angeles: '#fb923c', // orange
  detroit: '#94a3b8', // slate
  vancouver: '#38bdf8', // sky
  tijuana: '#fdba74', // peach
  bogota: '#10b981', // emerald
  medellin: '#4ade80', // bright green
  rio_de_janeiro: '#2dd4bf', // mint
  london: '#60a5fa', // blue
  paris: '#c084fc', // purple
  amsterdam: '#a3e635', // lime
  berlin: '#22d3ee', // cyan
  ibiza: '#f472b6', // pink
  sydney: '#34d399', // teal
  tokyo: '#e879f9', // fuchsia
  bangkok: '#facc15', // yellow
  hong_kong: '#f43f5e', // red
  dubai: '#fbbf24', // gold
  johannesburg: '#a78bfa', // violet
  lagos: '#f97316', // orange-dark
  panama_city: '#14b8a6', // caribbean teal
  singapore: '#06b6d4', // dark cyan
  zurich: '#818cf8', // indigo
  istanbul: '#ea580c', // amber-red
  mexico_city: '#e11d48', // crimson
  frankfurt: '#64748b', // cool-slate
  sao_paulo: '#16a34a', // jungle green
  madrid: '#c2410c', // terracotta
  toronto: '#0284c7', // cobalt
};

const DEFAULT_ACTIVE_CITIES = ['bogota', 'new_york', 'london', 'tokyo', 'medellin'];

type RadarSortField = 'price' | 'name' | 'region' | 'spread' | 'vault';
type RadarSortDirection = 'asc' | 'desc';

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
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<RadarSortField>('price');
  const [sortDirection, setSortDirection] = useState<RadarSortDirection>('asc');

  // Playback & Animation State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  const activeDrugId = selectedAnalyticsDrugId || 'cocaine';
  const drug = DRUG_MAP.get(activeDrugId) || DRUGS[0];
  const drugDetails = getDrugDetails(drug.id);

  // Private aircraft detection for realistic flight cost calculations
  const activeAircraft = player.selectedAircraftId ? AIRCRAFT_MAP.get(player.selectedAircraftId) : null;
  const privateFuelCost = activeAircraft ? calculateAircraftFlightCost(activeAircraft, player.ownedProperties || []) : 0;

  // Calculate actual flight cost to any target city
  const getFlightCost = (targetCity: { flightCost: number; id: string }) => {
    if (activeAircraft) return privateFuelCost;
    return targetCity.flightCost;
  };

  const toggleCity = (cityId: string) => {
    setActiveCities((prev) => {
      if (prev.includes(cityId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== cityId);
      } else {
        if (prev.length >= 8) return prev;
        return [...prev, cityId];
      }
    });
  };

  // Compile full price list across all 30 cities with robust fallbacks
  const allCityPriceEntries = useMemo(() => {
    return CITIES.map((city) => {
      const isCurrent = city.id === player.currentCityId;
      const history = (globalPriceHistory && globalPriceHistory[drug.id]?.[city.id]) || [];
      const regionalModifier = city.drugModifiers?.[drug.id] ?? 1.0;
      const fallbackPrice = Math.max(1, Math.round(drug.basePrice * regionalModifier));

      let price = fallbackPrice;
      if (isCurrent) {
        price = market[drug.id]?.price ?? fallbackPrice;
      } else if (history.length > 0) {
        const last = history[history.length - 1];
        if (typeof last === 'number' && !isNaN(last) && isFinite(last) && last > 0) {
          price = last;
        }
      }

      const baseSpread = drug.basePrice > 0 ? ((price - drug.basePrice) / drug.basePrice) * 100 : 0;
      const vaultUnits = player.vaults?.[city.id]?.[drug.id] ?? 0;
      const flightCost = getFlightCost(city);

      return {
        city,
        price,
        history,
        baseSpread,
        vaultUnits,
        isCurrent,
        flightCost,
      };
    });
  }, [drug.id, drug.basePrice, player.currentCityId, player.vaults, globalPriceHistory, market, activeAircraft, privateFuelCost]);

  // Global Best Arbitrage Route (Overall Cheapest vs Overall Highest)
  const sortedByPriceGlobal = useMemo(() => {
    return [...allCityPriceEntries].sort((a, b) => a.price - b.price);
  }, [allCityPriceEntries]);

  const cheapestGlobalEntry = sortedByPriceGlobal[0] || allCityPriceEntries[0];
  const highestGlobalEntry = sortedByPriceGlobal[sortedByPriceGlobal.length - 1] || allCityPriceEntries[0];
  const grossArbitrageSpread = Math.max(0, highestGlobalEntry.price - cheapestGlobalEntry.price);
  const grossRoi = cheapestGlobalEntry.price > 0 ? (grossArbitrageSpread / cheapestGlobalEntry.price) * 100 : 0;

  // Local Departure Arbitrage (From Current City to Top Paying Destination)
  const currentCityEntry = allCityPriceEntries.find((e) => e.isCurrent) || cheapestGlobalEntry;
  const bestDepartureDestination = useMemo(() => {
    const destinations = allCityPriceEntries.filter((e) => !e.isCurrent);
    return destinations.sort((a, b) => b.price - a.price)[0] || destinations[0];
  }, [allCityPriceEntries]);

  const localArbitrageSpread = bestDepartureDestination
    ? Math.max(0, bestDepartureDestination.price - currentCityEntry.price)
    : 0;
  const localRoi = currentCityEntry.price > 0 && bestDepartureDestination
    ? (localArbitrageSpread / currentCityEntry.price) * 100
    : 0;

  // Filtered & Sorted Table Entries
  const filteredAndSortedEntries = useMemo(() => {
    let list = allCityPriceEntries.filter((item) => {
      const matchesRegion = selectedRegion === 'All' || item.city.region === selectedRegion;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        item.city.name.toLowerCase().includes(query) ||
        item.city.country.toLowerCase().includes(query) ||
        (item.city.region && item.city.region.toLowerCase().includes(query));
      return matchesRegion && matchesQuery;
    });

    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'price') comparison = a.price - b.price;
      else if (sortField === 'name') comparison = a.city.name.localeCompare(b.city.name);
      else if (sortField === 'region') comparison = (a.city.region || '').localeCompare(b.city.region || '');
      else if (sortField === 'spread') comparison = a.baseSpread - b.baseSpread;
      else if (sortField === 'vault') comparison = a.vaultUnits - b.vaultUnits;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [allCityPriceEntries, selectedRegion, searchQuery, sortField, sortDirection]);

  // Chart setup
  const svgWidth = 720;
  const svgHeight = 280;
  const paddingLeft = 70;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 35;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Find max length among active cities safely
  const seriesLengths = activeCities.map(
    (cId) => globalPriceHistory?.[drug.id]?.[cId]?.length || 5
  );
  const maxSeriesLength = Math.max(5, ...seriesLengths);

  // Compute all prices in active series to bound Y-axis with strict NaN guards
  const allActivePrices: number[] = [];
  activeCities.forEach((cId) => {
    const s = globalPriceHistory?.[drug.id]?.[cId] || [];
    if (s.length > 0) {
      s.forEach((p) => {
        if (typeof p === 'number' && !isNaN(p) && isFinite(p) && p > 0) {
          allActivePrices.push(p);
        }
      });
    } else {
      const city = CITY_MAP.get(cId);
      const mod = city?.drugModifiers?.[drug.id] ?? 1.0;
      const validMod = typeof mod === 'number' && !isNaN(mod) ? mod : 1.0;
      const p = Math.max(1, Math.round(drug.basePrice * validMod));
      if (typeof p === 'number' && !isNaN(p) && isFinite(p)) {
        allActivePrices.push(p);
      }
    }
  });

  if (allActivePrices.length === 0) {
    allActivePrices.push(Math.round(drug.basePrice * 0.8), Math.round(drug.basePrice * 1.2));
  }

  const minVal = Math.max(1, Math.floor(Math.min(...allActivePrices) * 0.85));
  const maxVal = Math.max(minVal + 10, Math.ceil(Math.max(...allActivePrices) * 1.12));
  const valRange = Math.max(1, maxVal - minVal);

  const getX = (index: number) => {
    if (maxSeriesLength <= 1) return paddingLeft + chartWidth / 2;
    const ratio = Math.max(0, Math.min(1, index / (maxSeriesLength - 1)));
    const res = paddingLeft + ratio * chartWidth;
    return isFinite(res) ? res : paddingLeft;
  };

  const getY = (val: number) => {
    if (!isFinite(val) || isNaN(val)) return paddingTop + chartHeight / 2;
    const ratio = (val - minVal) / valRange;
    const clamped = Math.max(0, Math.min(1, ratio));
    const res = paddingTop + chartHeight - clamped * chartHeight;
    return isFinite(res) ? res : paddingTop + chartHeight;
  };

  const yTicks = [
    minVal,
    Math.round(minVal + valRange * 0.25),
    Math.round(minVal + valRange * 0.5),
    Math.round(minVal + valRange * 0.75),
    maxVal,
  ];

  // Reset animation on drug change
  useEffect(() => {
    setPlaybackProgress(0);
    setIsPlaying(true);
  }, [drug.id]);

  useEffect(() => {
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (isPlaying) {
        const maxIdx = Math.max(1, maxSeriesLength - 1);
        const stepRate = 1.25 * speed;
        setPlaybackProgress((prev) => {
          const next = prev + dt * stepRate;
          if (next >= maxIdx) {
            return 0; // continuous loop
          }
          return next;
        });
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, speed, maxSeriesLength]);

  const handleDecreaseSpeed = () => {
    setSpeed((prev) => stepPlaybackSpeed(prev, 'decrease', SPEED_PRESETS));
  };

  const handleIncreaseSpeed = () => {
    setSpeed((prev) => stepPlaybackSpeed(prev, 'increase', SPEED_PRESETS));
  };

  const togglePlay = () => {
    if (!isPlaying && playbackProgress >= maxSeriesLength - 1) {
      setPlaybackProgress(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleFlyAction = (cityId: string) => {
    const targetCity = CITY_MAP.get(cityId);
    if (!targetCity) return;
    const cost = getFlightCost(targetCity);
    if (player.cash < cost) return;

    if (activeAircraft) {
      travel(cityId, 'economy', undefined, true);
    } else {
      travel(cityId, 'economy', undefined, false);
    }
    closeGlobalAnalytics();
  };

  const handleSortToggle = (field: RadarSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (!isGlobalAnalyticsOpen) return null;

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
                  {CITIES.length} Cities Monitored
                </span>
                {activeAircraft && (
                  <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-xs font-bold flex items-center gap-1">
                    <Plane className="w-3 h-3 text-sky-400" /> Private Aviation Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {drug.name} ({drugDetails.drugClass}) • Cross-border commodity arbitrage, regional pricing, and live route navigation.
              </p>
            </div>
          </div>

          <button
            onClick={closeGlobalAnalytics}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors shrink-0 cursor-pointer"
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
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950 font-black'
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
          {/* Dual Arbitrage Highlights: Global Best vs Current Port Arbitrage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Global Best Arbitrage Route */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-emerald-950/20 to-slate-900 border border-cyan-800/80 shadow-lg flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-cyan-400 tracking-wider block">
                      Global Optimal Arbitrage Corridor
                    </span>
                    <span className="text-xs text-slate-400">Lowest buy port to highest sell port worldwide</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-black">
                  +{grossRoi.toFixed(0)}% ROI
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-sm pt-1">
                <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-emerald-900/60">
                  <span className="text-[10px] text-emerald-400 block uppercase">Source Port</span>
                  <strong className="text-emerald-300 font-bold">{cheapestGlobalEntry.city.name}</strong> (${cheapestGlobalEntry.price.toLocaleString()})
                </div>
                <span className="text-cyan-400 font-black">&rarr;</span>
                <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-cyan-900/60">
                  <span className="text-[10px] text-cyan-400 block uppercase">Destination Port</span>
                  <strong className="text-cyan-300 font-bold">{highestGlobalEntry.city.name}</strong> (${highestGlobalEntry.price.toLocaleString()})
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Gross Spread:</span>{' '}
                  <strong className="text-emerald-400 font-black">+${grossArbitrageSpread.toLocaleString()} / unit</strong>
                </div>
                {!cheapestGlobalEntry.isCurrent && (
                  <button
                    onClick={() => handleFlyAction(cheapestGlobalEntry.city.id)}
                    disabled={player.cash < cheapestGlobalEntry.flightCost}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-black text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plane className="w-3 h-3" />
                    <span>Fly to Buy Port (${cheapestGlobalEntry.flightCost})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Local Departure Arbitrage (From Current City) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-sky-950/20 to-slate-900 border border-indigo-800/80 shadow-lg flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-indigo-300 tracking-wider block">
                      Departure Arbitrage from {currentCityEntry.city.name}
                    </span>
                    <span className="text-xs text-slate-400">Best profit destination from your current location</span>
                  </div>
                </div>
                {bestDepartureDestination && (
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700 text-[10px] font-black">
                    +{localRoi.toFixed(0)}% Margin
                  </span>
                )}
              </div>

              {bestDepartureDestination ? (
                <div className="flex items-center gap-2 flex-wrap text-sm pt-1">
                  <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Buy Here</span>
                    <strong className="text-slate-100 font-bold">{currentCityEntry.city.name}</strong> (${currentCityEntry.price.toLocaleString()})
                  </div>
                  <span className="text-indigo-400 font-black">&rarr;</span>
                  <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-indigo-900/60">
                    <span className="text-[10px] text-indigo-400 block uppercase">Fly & Sell At</span>
                    <strong className="text-indigo-300 font-bold">{bestDepartureDestination.city.name}</strong> (${bestDepartureDestination.price.toLocaleString()})
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">You are in the highest paying city for {drug.name}.</div>
              )}

              {bestDepartureDestination && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Net Margin:</span>{' '}
                    <strong className="text-indigo-300 font-black">+${localArbitrageSpread.toLocaleString()} / unit</strong>
                  </div>
                  <button
                    onClick={() => handleFlyAction(bestDepartureDestination.city.id)}
                    disabled={player.cash < bestDepartureDestination.flightCost}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-slate-100 font-black text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plane className="w-3 h-3 text-sky-300" />
                    <span>Fly to Sell Port (${bestDepartureDestination.flightCost})</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Multi-City Historical Comparison Chart */}
          <div className="bg-[#05080e] border border-slate-800 rounded-2xl p-5 shadow-inner space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-300">
                  Historical Price Curves (Last {maxSeriesLength} Days)
                </span>
                <span className="text-[10px] text-slate-500">
                  • Click any city below to toggle curve (Max 8)
                </span>
              </div>

              {/* Active City Toggle Chips with horizontal scrollbar */}
              <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto">
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
                  const series = globalPriceHistory?.[drug.id]?.[cId] || [];
                  const color = CITY_PALETTE[cId] || '#38bdf8';
                  if (series.length === 0) return null;

                  const clamped = Math.max(0, Math.min(series.length - 1, playbackProgress));
                  const currIdx = Math.floor(clamped);
                  const frac = clamped - currIdx;
                  const nextIdx = Math.min(series.length - 1, currIdx + 1);

                  const p1 = series[currIdx] ?? series[0];
                  const p2 = series[nextIdx] ?? p1;
                  const interpVal = p1 + (p2 - p1) * frac;

                  const pts = series.slice(0, currIdx + 1).map((val, idx) => ({
                    x: getX(idx),
                    y: getY(val),
                    val,
                    idx,
                  }));

                  const headX = getX(clamped);
                  const headY = getY(interpVal);
                  if (frac > 0.001 || pts.length === 0) {
                    pts.push({ x: headX, y: headY, val: interpVal, idx: clamped });
                  }

                  const d = pts.reduce((acc, pt, idx) => {
                    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                  }, '');

                  // Ghost full line
                  const ghostPts = series.map((val, idx) => ({ x: getX(idx), y: getY(val) }));
                  const ghostD = ghostPts.reduce((acc, pt, idx) => {
                    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                  }, '');

                  return (
                    <g key={cId}>
                      {/* Ghost line */}
                      <path
                        d={ghostD}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        opacity="0.3"
                      />
                      {/* Active animated line */}
                      <path
                        d={d}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.95"
                        filter="drop-shadow(0 1px 4px rgba(0,0,0,0.6))"
                      />
                      {/* Animated head dot */}
                      <circle
                        cx={headX}
                        cy={headY}
                        r="4"
                        fill={color}
                        stroke="#05080e"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}

                {/* Vertical Scanning Laser */}
                <line
                  x1={getX(Math.min(maxSeriesLength - 1, playbackProgress))}
                  y1={paddingTop}
                  x2={getX(Math.min(maxSeriesLength - 1, playbackProgress))}
                  y2={paddingTop + chartHeight}
                  stroke="#06b6d4"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                  strokeOpacity="0.8"
                />

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

            {/* Radar Animation & Scrub Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  title={isPlaying ? 'Pause radar animation' : 'Play radar animation'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  onClick={() => {
                    setPlaybackProgress(0);
                    setIsPlaying(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer border border-slate-700 transition-colors"
                  title="Rewind radar animation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <div className="text-[11px] text-slate-400 font-bold ml-1">
                  <span>{isPlaying ? `RADAR SCANNING (${speed}x)` : 'RADAR PAUSED'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
                <button
                  onClick={handleDecreaseSpeed}
                  disabled={speed <= SPEED_PRESETS[0]}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-slate-300 cursor-pointer"
                  title="Decrease Speed (-)"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  {SPEED_PRESETS.map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSpeed(spd)}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                        speed === spd
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleIncreaseSpeed}
                  disabled={speed >= SPEED_PRESETS[SPEED_PRESETS.length - 1]}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-slate-300 cursor-pointer"
                  title="Increase Speed (+)"
                >
                  <Plus className="w-3 h-3" />
                </button>

                <input
                  type="range"
                  min="0"
                  max={Math.max(1, maxSeriesLength - 1)}
                  step="0.01"
                  value={playbackProgress}
                  onChange={(e) => {
                    setPlaybackProgress(parseFloat(e.target.value));
                    setIsPlaying(false);
                  }}
                  className="w-28 sm:w-40 accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
                  title="Scrub timeline"
                />
              </div>
            </div>
          </div>

          {/* 30 Cities Global Arbitrage Matrix Table */}
          <div className="space-y-3">
            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              {/* Region Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-slate-500 font-bold uppercase text-[10px] mr-1">Region:</span>
                {['All', 'Americas', 'Europe', 'Asia-Pacific', 'Middle East & Africa'].map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedRegion === region
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>

              {/* City Search Bar */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 30 cities or countries..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
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
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <th
                      onClick={() => handleSortToggle('name')}
                      className="py-2.5 px-4 font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>City & Country</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortToggle('region')}
                      className="py-2.5 px-3 font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Region</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortToggle('price')}
                      className="py-2.5 px-3 text-right font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Spot Price</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortToggle('spread')}
                      className="py-2.5 px-3 text-right font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Spread vs Base</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortToggle('vault')}
                      className="py-2.5 px-3 text-center font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Vault Stash</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th className="py-2.5 px-4 text-right font-semibold">Quick Navigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredAndSortedEntries.map((entry) => {
                    const isCheapest = entry.city.id === cheapestGlobalEntry.city.id;
                    const isHighest = entry.city.id === highestGlobalEntry.city.id;

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
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors shadow-sm cursor-pointer"
                            >
                              Trade Here
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFlyAction(entry.city.id)}
                              disabled={player.cash < entry.flightCost}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                              title={`Fly to ${entry.city.name} (${activeAircraft ? 'Private Aircraft' : 'Commercial Airfare'})`}
                            >
                              <Plane className="w-3 h-3 text-sky-400" />
                              <span>Fly (${entry.flightCost})</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAndSortedEntries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        No cities match your search filter "{searchQuery}".
                      </td>
                    </tr>
                  )}
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
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            Close Radar
          </button>
        </div>
      </div>
    </div>
  );
};
