import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  SHELL_BUSINESSES,
  SHELL_MAP,
  getBusinessSharePrice,
  getBusinessSharesOwned,
  hasControllingStake,
  TOTAL_SHARES_PER_BUSINESS,
  SHELL_SECTORS,
} from '../engine/laundering';
import { ShellImage } from './ShellImage';
import { SHELL_TICKERS } from './ShellExchangeView';
import { soundEngine } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import {
  X,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Target,
} from 'lucide-react';

const PLAYBACK_SPEEDS = [0.5, 1.0, 1.5, 2.0, 3.0];

export const ShellGraphModal: React.FC = () => {
  const isShellGraphOpen = useGameStore((s) => s.isShellGraphOpen);
  const selectedShellGraphId = useGameStore((s) => s.selectedShellGraphId);
  const closeShellGraph = useGameStore((s) => s.closeShellGraph);
  const player = useGameStore((s) => s.player);
  const fontScale = useGameStore((s) => s.fontScale);
  const toggleBusinessDripAction = useGameStore((s) => s.toggleBusinessDripAction);
  const placeShellLimitOrderAction = useGameStore((s) => s.placeShellLimitOrderAction);

  const [activeTab, setActiveTab] = useState<'chart' | 'limit_order'>('chart');
  const [hoveredPoint, setHoveredPoint] = useState<{
    dayIndex: number;
    dayNumber: number;
    label: string;
    price: number;
    x: number;
    y: number;
  } | null>(null);

  // Playback & animation scrubber state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Limit Order Terminal State
  const [orderType, setOrderType] = useState<'buy_limit' | 'sell_limit' | 'stop_loss'>('buy_limit');
  const [orderTargetPrice, setOrderTargetPrice] = useState<string>('');
  const [orderShares, setOrderShares] = useState<number>(100);
  const [orderFeedback, setOrderFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Target Price Estimator state
  const [targetPriceInput, setTargetPriceInput] = useState<string>('');

  const fontScaleClass =
    fontScale === 'xl' ? 'font-scale-xl' : fontScale === 'large' ? 'font-scale-large' : 'font-scale-normal';

  const business = useMemo(() => {
    return SHELL_MAP.get(selectedShellGraphId || '') || SHELL_BUSINESSES[0];
  }, [selectedShellGraphId]);

  const ticker = SHELL_TICKERS[business.id] || '$SHLL';
  const sector = SHELL_SECTORS[business.id] || 'Underworld Enterprise';
  const sharesOwned = getBusinessSharesOwned(player, business.id);
  const equityPct = ((sharesOwned / TOTAL_SHARES_PER_BUSINESS) * 100).toFixed(1);
  const isControlling = hasControllingStake(player, business.id);
  const isSubsidiary = sharesOwned >= TOTAL_SHARES_PER_BUSINESS;
  const isDripActive = !!player.businessDrip?.[business.id];
  const costBasis = player.businessCostBasis?.[business.id];

  // Generate 30-day chronological price history
  const historyDaysCount = Math.min(30, Math.max(7, player.currentDay));
  const rawSeries = useMemo(() => {
    const list: { day: number; price: number; label: string }[] = [];
    const startDay = Math.max(1, player.currentDay - (historyDaysCount - 1));

    for (let d = startDay; d <= player.currentDay; d++) {
      const p = getBusinessSharePrice(business, d);
      const isCurrentDay = d === player.currentDay;
      const daySeq = d - startDay + 1;
      const label = isCurrentDay ? 'D Current Day' : `D${daySeq}`;
      list.push({ day: d, price: p, label });
    }
    return list;
  }, [business, player.currentDay, historyDaysCount]);

  const currentPrice = getBusinessSharePrice(business, player.currentDay);
  const basePrice = Math.max(1, Math.round(business.purchaseCost / TOTAL_SHARES_PER_BUSINESS));
  const ath = useMemo(() => Math.max(...rawSeries.map((s) => s.price), currentPrice), [rawSeries, currentPrice]);
  const atl = useMemo(() => Math.min(...rawSeries.map((s) => s.price), currentPrice), [rawSeries, currentPrice]);
  const avg = useMemo(() => {
    const sum = rawSeries.reduce((acc, curr) => acc + curr.price, 0);
    return Math.round(sum / rawSeries.length);
  }, [rawSeries]);

  const priceDiffFromBase = currentPrice - basePrice;
  const pricePctFromBase = ((priceDiffFromBase / basePrice) * 100).toFixed(1);

  // Position P&L
  const positionValuation = sharesOwned * currentPrice;
  const positionCost = sharesOwned * (costBasis ?? currentPrice);
  const positionPnl = positionValuation - positionCost;
  const positionPnlPct = positionCost > 0 ? (positionPnl / positionCost) * 100 : 0;

  // Pre-fill target price on modal open
  useEffect(() => {
    if (business) {
      setOrderTargetPrice(currentPrice.toString());
      setPlaybackProgress(0);
      setIsPlaying(true);
      setOrderFeedback(null);
    }
  }, [business, currentPrice]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeShellGraph();
      }
    };
    if (isShellGraphOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShellGraphOpen, closeShellGraph]);

  // Smooth SVG Playback loop
  useEffect(() => {
    if (!isShellGraphOpen) return;
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (isPlaying) {
        const durationMs = 4500 / speed;
        setPlaybackProgress((prev) => {
          const next = prev + deltaMs / durationMs;
          return next >= 1 ? 0 : next;
        });
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isShellGraphOpen, isPlaying, speed]);

  if (!isShellGraphOpen || !business) return null;

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 280;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const yMin = Math.floor(atl * 0.92);
  const yMax = Math.ceil(ath * 1.08);
  const yRange = Math.max(1, yMax - yMin);

  const getX = (idx: number, total: number) => {
    if (total <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (total - 1)) * plotW;
  };

  const getY = (val: number) => {
    return padTop + plotH - ((val - yMin) / yRange) * plotH;
  };

  const points = rawSeries.map((s, idx) => ({
    x: getX(idx, rawSeries.length),
    y: getY(s.price),
    ...s,
  }));

  // Build SVG path
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      pathD += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
  }

  const fillD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${padTop + plotH} L ${points[0].x} ${padTop + plotH} Z` : '';

  // Cost basis guide line Y
  const costBasisY = costBasis && costBasis >= yMin && costBasis <= yMax ? getY(costBasis) : null;

  // Scrubber playback point
  const scrubberIndex = Math.min(rawSeries.length - 1, Math.floor(playbackProgress * rawSeries.length));
  const scrubberPoint = points[scrubberIndex] || points[points.length - 1];

  const handleStepSpeed = () => {
    soundEngine.play('click');
    triggerHaptic('light');
    const idx = PLAYBACK_SPEEDS.indexOf(speed);
    const nextIdx = (idx + 1) % PLAYBACK_SPEEDS.length;
    setSpeed(PLAYBACK_SPEEDS[nextIdx]);
  };

  const handleToggleDrip = () => {
    triggerHaptic('medium');
    toggleBusinessDripAction(business.id);
  };

  const handlePlaceLimitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderFeedback(null);
    const targetNum = parseInt(orderTargetPrice.replace(/[^0-9]/g, ''), 10);
    if (isNaN(targetNum) || targetNum <= 0) {
      setOrderFeedback({ type: 'error', message: 'Enter a valid target price.' });
      return;
    }
    if (orderShares <= 0) {
      setOrderFeedback({ type: 'error', message: 'Enter a valid share quantity.' });
      return;
    }

    const res = placeShellLimitOrderAction(business.id, orderType, targetNum, orderShares);
    setOrderFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    if (res.success) {
      triggerHaptic('success');
    } else {
      triggerHaptic('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-4xl max-h-[95dvh] flex flex-col bg-slate-900 border-2 border-emerald-500/60 rounded-3xl shadow-[0_25px_70px_-15px_rgba(16,185,129,0.3)] overflow-hidden text-slate-100 font-mono ${fontScaleClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <ShellImage business={business} size="md" className="ring-2 ring-emerald-500/40 shadow-lg shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-amber-400 text-lg sm:text-xl tracking-tight">{ticker}</span>
                <h2 className="font-black text-sm sm:text-base text-slate-100 truncate">{business.name}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  Tier {business.tier}
                </span>
                {isSubsidiary ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 uppercase">
                    100% Subsidiary
                  </span>
                ) : isControlling ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-300 uppercase flex items-center gap-1">
                    👑 Majority ({equityPct}%)
                  </span>
                ) : sharesOwned > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 border border-sky-500 text-sky-300">
                    Portfolio: {equityPct}%
                  </span>
                ) : null}
              </div>
              <span className="text-xs text-slate-400 block truncate">{sector} • Underworld NASDAQ Equities</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Modal Tabs: Interactive Chart vs Limit Order Terminal */}
            <div className="hidden sm:flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('chart')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'chart' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Time Graph
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('limit_order')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'limit_order' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Limit Orders
              </button>
            </div>

            <button
              onClick={() => {
                soundEngine.play('click');
                triggerHaptic('light');
                closeShellGraph();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Key Statistics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-500 uppercase block">Spot Share Price</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-black text-emerald-400">${currentPrice.toLocaleString()}</span>
                <span className={`text-[10px] font-bold ${priceDiffFromBase >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {priceDiffFromBase >= 0 ? `+${pricePctFromBase}%` : `${pricePctFromBase}%`}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-500 uppercase block">Position Value</span>
              <div className="mt-0.5">
                <span className="text-lg font-black text-slate-100">${positionValuation.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 block">{sharesOwned.toLocaleString()} shares</span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-500 uppercase block">Cost Basis & P&L</span>
              <div className="mt-0.5">
                <span className="text-xs font-bold text-slate-300">
                  {costBasis ? `$${costBasis.toLocaleString()}/sh` : 'No position'}
                </span>
                {sharesOwned > 0 && (
                  <span className={`text-[10px] font-bold block ${positionPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {positionPnl >= 0 ? `+$${positionPnl.toLocaleString()}` : `-$${Math.abs(positionPnl).toLocaleString()}`} ({positionPnlPct >= 0 ? `+${positionPnlPct.toFixed(1)}%` : `${positionPnlPct.toFixed(1)}%`})
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-500 uppercase block">30-Day Range</span>
              <div className="flex items-center justify-between text-xs mt-0.5">
                <span className="text-rose-400 font-bold">${atl.toLocaleString()}</span>
                <span className="text-slate-600">→</span>
                <span className="text-emerald-400 font-bold">${ath.toLocaleString()}</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">AVG: ${avg.toLocaleString()}</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-500 uppercase block">Daily Flow / Clean Cap</span>
              <div className="mt-0.5 text-xs">
                <span className="text-emerald-400 font-bold block">+${business.passiveDailyProfit.toLocaleString()}/d (100%)</span>
                <span className="text-sky-400 text-[10px] block">Cap: ${business.dailyCleanCapacity.toLocaleString()}/d</span>
              </div>
            </div>

            {/* DRIP Toggle Switch */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase block">Dividend Reinvestment</span>
              <button
                type="button"
                onClick={handleToggleDrip}
                disabled={sharesOwned <= 0}
                className={`mt-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  isDripActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                } ${sharesOwned <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>DRIP</span>
                <span>{isDripActive ? 'ACTIVE' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Interactive SVG Time Graph */}
          {activeTab === 'chart' && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3">
              {/* Playback Controls & Hover Indicator */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.play('click');
                      triggerHaptic('light');
                      setIsPlaying(!isPlaying);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause animation' : 'Play animation'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleStepSpeed}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title="Change playback speed"
                  >
                    <FastForward className="w-3.5 h-3.5 text-amber-400" />
                    <span>{speed}x</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.play('click');
                      triggerHaptic('light');
                      setPlaybackProgress(0);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title="Restart scrubber"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[11px] text-slate-400 hidden sm:inline ml-1">
                    Day {scrubberPoint?.day ?? player.currentDay}: <strong className="text-emerald-400">${scrubberPoint?.price.toLocaleString()}</strong>
                  </span>
                </div>

                {/* Scrubber slider */}
                <div className="flex-1 max-w-xs flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={playbackProgress}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setPlaybackProgress(parseFloat(e.target.value));
                    }}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Active Hover readout */}
                <div className="text-right text-[11px]">
                  {hoveredPoint ? (
                    <span>
                      <strong className="text-amber-400">{hoveredPoint.label}</strong>: <strong className="text-emerald-400">${hoveredPoint.price.toLocaleString()}</strong>
                    </span>
                  ) : (
                    <span className="text-slate-500">Hover graph to inspect spot data</span>
                  )}
                </div>
              </div>

              {/* The SVG Canvas */}
              <div className="relative w-full overflow-hidden">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto max-h-[340px] select-none"
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <defs>
                    <linearGradient id="shellEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="shellGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                    const priceVal = Math.round(yMin + (1 - pct) * yRange);
                    const y = padTop + pct * plotH;
                    return (
                      <g key={pct}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={padLeft + plotW}
                          y2={y}
                          stroke="#334155"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={padLeft - 8}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="10"
                          fill="#64748b"
                          fontFamily="monospace"
                        >
                          ${priceVal.toLocaleString()}
                        </text>
                      </g>
                    );
                  })}

                  {/* Cost basis dotted horizontal line if active */}
                  {costBasisY !== null && (
                    <g>
                      <line
                        x1={padLeft}
                        y1={costBasisY}
                        x2={padLeft + plotW}
                        y2={costBasisY}
                        stroke="#0284c7"
                        strokeDasharray="6 3"
                        strokeWidth="1.5"
                      />
                      <text
                        x={padLeft + plotW - 4}
                        y={costBasisY - 4}
                        textAnchor="end"
                        fontSize="9"
                        fill="#38bdf8"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        Cost Basis: ${costBasis?.toLocaleString()}
                      </text>
                    </g>
                  )}

                  {/* Area fill */}
                  <path d={fillD} fill="url(#shellEmeraldGrad)" />

                  {/* Stroke path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    filter="url(#shellGlow)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Scrubber animation pulse ring */}
                  {scrubberPoint && (
                    <g>
                      <circle
                        cx={scrubberPoint.x}
                        cy={scrubberPoint.y}
                        r="8"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="1.5"
                        opacity="0.75"
                        className="animate-ping"
                      />
                      <circle cx={scrubberPoint.x} cy={scrubberPoint.y} r="4.5" fill="#34d399" />
                      <line
                        x1={scrubberPoint.x}
                        y1={padTop}
                        x2={scrubberPoint.x}
                        y2={padTop + plotH}
                        stroke="#34d399"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                        opacity="0.6"
                      />
                    </g>
                  )}

                  {/* X-axis relative chronological day markers */}
                  {points.map((p, idx) => {
                    const showLabel =
                      idx === 0 ||
                      idx === points.length - 1 ||
                      (points.length > 10 && idx % Math.ceil(points.length / 5) === 0);

                    return (
                      <g key={idx}>
                        {showLabel && (
                          <text
                            x={p.x}
                            y={padTop + plotH + 16}
                            textAnchor="middle"
                            fontSize="9.5"
                            fontWeight={idx === points.length - 1 ? 'bold' : 'normal'}
                            fill={idx === points.length - 1 ? '#34d399' : '#64748b'}
                            fontFamily="monospace"
                          >
                            {p.label}
                          </text>
                        )}
                        {/* Hover trigger transparent slice */}
                        <rect
                          x={p.x - plotW / (points.length * 2)}
                          y={padTop}
                          width={plotW / points.length}
                          height={plotH}
                          fill="transparent"
                          className="cursor-crosshair"
                          onMouseEnter={() => {
                            setHoveredPoint({
                              dayIndex: idx,
                              dayNumber: p.day,
                              label: p.label,
                              price: p.price,
                              x: p.x,
                              y: p.y,
                            });
                            triggerHaptic('selection');
                          }}
                        />
                      </g>
                    );
                  })}

                  {/* Hover crosshairs */}
                  {hoveredPoint && (
                    <g>
                      <line
                        x1={hoveredPoint.x}
                        y1={padTop}
                        x2={hoveredPoint.x}
                        y2={padTop + plotH}
                        stroke="#fbbf24"
                        strokeDasharray="3 3"
                        strokeWidth="1.5"
                      />
                      <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="#fbbf24" stroke="#020617" strokeWidth="2" />
                    </g>
                  )}
                </svg>
              </div>

              {/* Time-To-Peak & Target Price Estimator */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-400">Target Spot Estimator:</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input
                      type="text"
                      value={targetPriceInput}
                      onChange={(e) => setTargetPriceInput(e.target.value)}
                      placeholder={`${Math.round(currentPrice * 1.15)}`}
                      className="w-28 pl-6 pr-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  {targetPriceInput && (
                    <button
                      type="button"
                      onClick={() => setTargetPriceInput('')}
                      className="text-slate-500 hover:text-slate-300 text-[10px]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {targetPriceInput && (() => {
                  const targetNum = parseInt(targetPriceInput.replace(/[^0-9]/g, ''), 10);
                  if (isNaN(targetNum) || targetNum <= 0) return null;
                  const pctDiff = ((targetNum - currentPrice) / currentPrice) * 100;
                  const daysEst = Math.max(1, Math.round(Math.abs(pctDiff) / 4.2));

                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Target:</span>
                      <strong className={pctDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {pctDiff >= 0 ? `+${pctDiff.toFixed(1)}%` : `${pctDiff.toFixed(1)}%`}
                      </strong>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">Est. Arrival:</span>
                      <strong className="text-amber-400 font-bold">~{daysEst} {daysEst === 1 ? 'day' : 'days'}</strong>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Tab 2: Automated Limit Orders Console */}
          {activeTab === 'limit_order' && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  Automated Limit Order Terminal
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Set automated trading triggers evaluated every morning when the day advances. Execute automated dip buys, take profits, or stop-losses.
                </p>
              </div>

              {orderFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    orderFeedback.type === 'success'
                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                      : 'bg-rose-950/50 border-rose-500 text-rose-300'
                  }`}
                >
                  <span>{orderFeedback.message}</span>
                  <button onClick={() => setOrderFeedback(null)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handlePlaceLimitOrder} className="space-y-4">
                {/* Order Type Selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('buy_limit');
                      setOrderTargetPrice(Math.round(currentPrice * 0.90).toString());
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      orderType === 'buy_limit'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Buy Limit (Dip Buy)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('sell_limit');
                      setOrderTargetPrice(Math.round(currentPrice * 1.15).toString());
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      orderType === 'sell_limit'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-black'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Sell Limit (Take Profit)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('stop_loss');
                      setOrderTargetPrice(Math.round(currentPrice * 0.85).toString());
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      orderType === 'stop_loss'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-black'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Stop-Loss (Capital Defense)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target Price */}
                  <div>
                    <label className="text-[11px] text-slate-400 uppercase block mb-1.5 font-bold">
                      Target Execution Price ($/share)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                      <input
                        type="text"
                        value={orderTargetPrice}
                        onChange={(e) => setOrderTargetPrice(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Share Quantity */}
                  <div>
                    <label className="text-[11px] text-slate-400 uppercase block mb-1.5 font-bold">
                      Share Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={TOTAL_SHARES_PER_BUSINESS}
                      value={orderShares}
                      onChange={(e) => setOrderShares(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Quick Share Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[10, 50, 100, 500, 1000].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setOrderShares(count)}
                      className={`px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                        orderShares === count
                          ? 'bg-amber-500 border-amber-400 text-slate-950 font-black'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      +{count}
                    </button>
                  ))}
                  {sharesOwned > 0 && (
                    <button
                      type="button"
                      onClick={() => setOrderShares(sharesOwned)}
                      className="px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-600 text-sky-300 text-xs font-bold hover:bg-sky-900 transition-colors cursor-pointer"
                    >
                      All Held ({sharesOwned})
                    </button>
                  )}
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm tracking-wide shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  <span>Submit Limit Order Trigger</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
