import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Repeat,
  Activity,
} from 'lucide-react';
import { DEFAULT_SPEEDS, stepPlaybackSpeed } from '../utils/graphAnimation';

const SPEEDS = DEFAULT_SPEEDS;

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

  // Animation & Playback Engine State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [animationMode, setAnimationMode] = useState<'timeline' | 'live_pulse'>('timeline');
  const [liveWavePhase, setLiveWavePhase] = useState<number>(0);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

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

  const baseRatio = drug.basePrice > 0 ? ((currentPrice - drug.basePrice) / drug.basePrice) * 100 : 0;

  // Reset playback to start whenever drug or city changes
  useEffect(() => {
    setPlaybackProgress(0);
    setIsPlaying(true);
  }, [drug.id, selectedCityId]);

  // Animation frame update loop
  useEffect(() => {
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (isPlaying) {
        if (animationMode === 'timeline') {
          const maxIdx = Math.max(1, rawSeries.length - 1);
          const stepRate = 1.25 * speed; // 1.25 data points per second at 1x
          setPlaybackProgress((prev) => {
            const next = prev + dt * stepRate;
            if (next >= maxIdx) {
              if (isLooping) {
                return 0; // seamless loop back to Day 1
              } else {
                setIsPlaying(false);
                return maxIdx;
              }
            }
            return next;
          });
        } else {
          // Live pulse sinusoidal oscillation
          setLiveWavePhase((prev) => prev + dt * 2.8 * speed);
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, speed, isLooping, animationMode, rawSeries.length]);

  // Speed Handlers
  const handleDecreaseSpeed = () => {
    setSpeed((prev) => stepPlaybackSpeed(prev, 'decrease', SPEEDS));
  };

  const handleIncreaseSpeed = () => {
    setSpeed((prev) => stepPlaybackSpeed(prev, 'increase', SPEEDS));
  };

  const handleRestart = () => {
    setPlaybackProgress(0);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!isPlaying && playbackProgress >= rawSeries.length - 1 && animationMode === 'timeline') {
      setPlaybackProgress(0);
    }
    setIsPlaying((prev) => !prev);
  };

  // Keyboard shortcut listener (Spacebar = Play/Pause, Arrows = Scrub, +/- = Speed)
  useEffect(() => {
    if (!isDrugGraphOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setPlaybackProgress((prev) => Math.min(rawSeries.length - 1, prev + 0.5));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setPlaybackProgress((prev) => Math.max(0, prev - 0.5));
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleIncreaseSpeed();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleDecreaseSpeed();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrugGraphOpen, playbackProgress, rawSeries.length, animationMode, speed, isPlaying]);

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

  // Interpolation & Physics Calculations
  const maxSeriesIdx = Math.max(1, rawSeries.length - 1);
  const clampedProgress = Math.max(0, Math.min(maxSeriesIdx, playbackProgress));
  const currIdx = Math.floor(clampedProgress);
  const frac = clampedProgress - currIdx;
  const nextIdx = Math.min(rawSeries.length - 1, currIdx + 1);

  // Timeline values
  const p1 = rawSeries[currIdx] ?? drug.basePrice;
  const p2 = rawSeries[nextIdx] ?? p1;
  const timelinePrice = Math.round(p1 + (p2 - p1) * frac);
  const timelineSlope = p2 - p1;

  // Live Pulse harmonic wave
  const livePulseSine = Math.sin(liveWavePhase);
  const livePulseAmp = Math.max(10, drug.basePrice * Math.min(0.35, Math.max(0.08, drug.volatility * 0.25)));
  const livePulsePrice = Math.round(currentPrice + livePulseSine * livePulseAmp);
  const livePulseSlope = Math.cos(liveWavePhase);

  // Active display values
  const activePrice = animationMode === 'timeline' ? timelinePrice : livePulsePrice;
  const activeSlope = animationMode === 'timeline' ? timelineSlope : livePulseSlope;
  const isRising = activeSlope > 0.001;
  const isFalling = activeSlope < -0.001;

  const currentAnimatedDay = Math.max(1, player.currentDay - (rawSeries.length - 1 - currIdx));
  const totalDaysRecorded = rawSeries.length;

  // Visual Theme Colors
  const themeColor = isRising ? '#10b981' : isFalling ? '#f43f5e' : '#38bdf8';
  const haloColor = isRising ? '#34d399' : isFalling ? '#fb7185' : '#7dd3fc';
  const textClass = isRising ? 'text-emerald-400' : isFalling ? 'text-rose-400' : 'text-sky-400';

  // SVG Paths
  const points = rawSeries.map((val, idx) => ({ x: getX(idx), y: getY(val), val, idx }));

  const ghostPathData = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Active Timeline Path
  const headX = getX(clampedProgress);
  const headY = getY(activePrice);

  const activePoints = points.slice(0, currIdx + 1).map((pt) => ({ ...pt }));
  if (frac > 0.001 || activePoints.length === 0) {
    activePoints.push({ x: headX, y: headY, val: activePrice, idx: clampedProgress });
  }

  const activePathData = activePoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const activeAreaPath = activePoints.length > 0
    ? `${activePathData} L ${headX} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : '';

  // Live Pulse Path
  const livePoints = points.map((pt, idx) => {
    if (idx === points.length - 1) {
      return { ...pt, y: getY(livePulsePrice), val: livePulsePrice };
    }
    return pt;
  });
  const liveHeadX = livePoints[livePoints.length - 1].x;
  const liveHeadY = livePoints[livePoints.length - 1].y;

  const livePathData = livePoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const liveAreaPath = livePoints.length > 0
    ? `${livePathData} L ${liveHeadX} ${paddingTop + chartHeight} L ${livePoints[0].x} ${paddingTop + chartHeight} Z`
    : '';

  const renderedHeadX = animationMode === 'timeline' ? headX : liveHeadX;
  const renderedHeadY = animationMode === 'timeline' ? headY : liveHeadY;
  const renderedPathData = animationMode === 'timeline' ? activePathData : livePathData;
  const renderedAreaPath = animationMode === 'timeline' ? activeAreaPath : liveAreaPath;

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
              className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open Global Multi-Country Arbitrage Radar"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>All Cities Radar</span>
            </button>
            <button
              onClick={closeDrugGraph}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: City Selector & Dynamic Spot Readout */}
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
              <span className="text-slate-500 uppercase text-[10px] block">Animated Spot Price</span>
              <span className={`text-base font-black ${textClass}`}>
                ${activePrice.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 uppercase text-[10px] block">Momentum State</span>
              <span className={`font-bold inline-flex items-center gap-0.5 ${textClass}`}>
                {isRising ? <TrendingUp className="w-3.5 h-3.5 animate-pulse" /> : isFalling ? <TrendingDown className="w-3.5 h-3.5 animate-pulse" /> : null}
                {isRising ? `▲ RISING` : isFalling ? `▼ FALLING` : 'STEADY'}
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
                <span className={`flex items-center gap-1 font-bold ${textClass}`}>
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm shadow-emerald-500" style={{ backgroundColor: themeColor }} /> Spot Trend
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
                    <stop offset="0%" stopColor={themeColor} stopOpacity="0.38" />
                    <stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
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
                  strokeOpacity="0.65"
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
                  strokeOpacity="0.65"
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
                  strokeOpacity="0.55"
                />

                {/* Ghost Trajectory Outline in Timeline Mode */}
                {animationMode === 'timeline' && (
                  <path
                    d={ghostPathData}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.4"
                  />
                )}

                {/* Gradient Fill Area */}
                {renderedAreaPath && <path d={renderedAreaPath} fill="url(#drugGradient)" />}

                {/* Active Dynamic Price Stroke Line */}
                {renderedPathData && (
                  <path
                    d={renderedPathData}
                    fill="none"
                    stroke={themeColor}
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="drop-shadow(0 2px 8px rgba(0, 0, 0, 0.7))"
                  />
                )}

                {/* Vertical Scanning Laser Guide */}
                <line
                  x1={renderedHeadX}
                  y1={paddingTop}
                  x2={renderedHeadX}
                  y2={paddingTop + chartHeight}
                  stroke={themeColor}
                  strokeWidth="1.25"
                  strokeDasharray="3 2"
                  strokeOpacity="0.8"
                />

                {/* Interactive Points on X-axis */}
                {points.map((pt) => {
                  const isLast = pt.idx === points.length - 1;
                  const isHovered = hoveredPoint?.index === pt.idx;
                  const isPast = pt.idx <= currIdx;
                  return (
                    <g key={pt.idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : isLast ? 4.5 : 3}
                        fill={isPast ? themeColor : '#334155'}
                        stroke="#05080e"
                        strokeWidth="2"
                        className="transition-all cursor-pointer hover:scale-125"
                        onClick={() => {
                          setPlaybackProgress(pt.idx);
                          setIsPlaying(false);
                        }}
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
                        fill={isPast ? '#94a3b8' : '#475569'}
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="monospace"
                        className="cursor-pointer"
                        onClick={() => {
                          setPlaybackProgress(pt.idx);
                          setIsPlaying(false);
                        }}
                      >
                        D{Math.max(1, player.currentDay - (points.length - 1 - pt.idx))}
                      </text>
                    </g>
                  );
                })}

                {/* Animated Pulsing Radar Beacon on the Head */}
                {isPlaying && (
                  <circle
                    cx={renderedHeadX}
                    cy={renderedHeadY}
                    r="11"
                    fill="none"
                    stroke={themeColor}
                    strokeWidth="1.5"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Prominent Head Dot */}
                <circle
                  cx={renderedHeadX}
                  cy={renderedHeadY}
                  r="5.5"
                  fill={haloColor}
                  stroke="#05080e"
                  strokeWidth="2.5"
                />

                {/* Floating Head Price Tag */}
                <g transform={`translate(${renderedHeadX}, ${Math.max(paddingTop + 14, renderedHeadY - 20)})`}>
                  <rect
                    x="-36"
                    y="-13"
                    width="72"
                    height="18"
                    rx="4"
                    fill="#0f172a"
                    stroke={themeColor}
                    strokeWidth="1"
                    fillOpacity="0.95"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                  />
                  <text
                    x="0"
                    y="-1"
                    fill={themeColor}
                    fontSize="9.5"
                    fontWeight="900"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    ${activePrice.toLocaleString()}
                  </text>
                </g>

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

          {/* Interactive Graph Animation & Playback Engine */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col gap-3 font-mono shadow-md">
            {/* Row 1: Primary Playback Controls & Mode Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Left: Play/Pause, Rewind, Status */}
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 shadow-sm ${
                    isPlaying
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black shadow-emerald-950/50'
                  }`}
                  title={isPlaying ? 'Pause graph animation (Spacebar)' : 'Play graph animation (Spacebar)'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                  <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>

                <button
                  onClick={handleRestart}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
                  title="Rewind animation to Day 1"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Animation Status Beacon */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${
                  isPlaying
                    ? isRising
                      ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-400'
                      : isFalling
                      ? 'bg-rose-950/80 border-rose-700/80 text-rose-400'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    isPlaying
                      ? isRising
                        ? 'bg-emerald-400 animate-pulse'
                        : isFalling
                        ? 'bg-rose-400 animate-pulse'
                        : 'bg-slate-400'
                      : 'bg-slate-600'
                  }`} />
                  <span>
                    {isPlaying
                      ? isRising
                        ? `▲ RISING (${speed}x)`
                        : isFalling
                        ? `▼ FALLING (${speed}x)`
                        : `STEADY (${speed}x)`
                      : 'PAUSED'}
                  </span>
                </div>
              </div>

              {/* Right: Speed Controls & Mode Selection */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-500 text-[11px] font-bold uppercase mr-1 hidden sm:inline">
                  Speed:
                </span>
                <button
                  onClick={handleDecreaseSpeed}
                  disabled={speed <= SPEEDS[0]}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-slate-300 transition-all cursor-pointer active:scale-95"
                  title="Decrease Speed (-)"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {SPEEDS.map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSpeed(spd)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        speed === spd
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                      title={`Set playback speed to ${spd}x`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleIncreaseSpeed}
                  disabled={speed >= SPEEDS[SPEEDS.length - 1]}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-slate-300 transition-all cursor-pointer active:scale-95"
                  title="Increase Speed (+)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {/* Mode Toggle Pills */}
                <div className="flex items-center gap-1 ml-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setAnimationMode('timeline')}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      animationMode === 'timeline'
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                    title="Timeline Replay: Animates historical rise & fall day by day"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Timeline</span>
                  </button>

                  <button
                    onClick={() => setAnimationMode('live_pulse')}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      animationMode === 'live_pulse'
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                    title="Live Waves: Real-time rising and falling market oscillation"
                  >
                    <Activity className="w-3 h-3" />
                    <span>Live Waves</span>
                  </button>
                </div>

                {/* Loop toggle in Timeline mode */}
                {animationMode === 'timeline' && (
                  <button
                    onClick={() => setIsLooping(!isLooping)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ml-1 ${
                      isLooping
                        ? 'bg-indigo-950/80 border-indigo-600 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                    title={isLooping ? 'Continuous loop enabled' : 'Loop disabled'}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Loop</span>
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: Interactive Scrubber Slider (only in timeline mode) */}
            {animationMode === 'timeline' && (
              <div className="flex items-center gap-3 pt-1 border-t border-slate-800/60">
                <span className="text-[11px] text-slate-400 font-bold shrink-0">
                  Day {currentAnimatedDay} / {totalDaysRecorded}
                </span>
                <input
                  type="range"
                  min="0"
                  max={Math.max(1, rawSeries.length - 1)}
                  step="0.01"
                  value={playbackProgress}
                  onChange={(e) => {
                    setPlaybackProgress(parseFloat(e.target.value));
                    setIsPlaying(false);
                  }}
                  className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  title="Drag scrubber to inspect historical prices"
                />
                <span className={`text-[11px] font-black shrink-0 ${textClass}`}>
                  ${activePrice.toLocaleString()}
                </span>
              </div>
            )}
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
