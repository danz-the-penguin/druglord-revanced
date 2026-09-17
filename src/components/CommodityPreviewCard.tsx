import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Drug } from '../engine/types';
import { DrugImage } from './DrugImage';
import { useGameStore } from '../store/gameStore';
import { getDrugDetails } from '../engine/drugDetails';
import { Globe, Briefcase, AlertTriangle, Crosshair } from 'lucide-react';

interface CommodityPreviewCardProps {
  drug: Drug;
  formatFormula: (formula?: string) => string;
  theme?: 'emerald' | 'indigo';
  containerRef?: React.RefObject<HTMLDivElement | null>;
  extraFooter?: React.ReactNode;
}

export const CommodityPreviewCard: React.FC<CommodityPreviewCardProps> = ({
  drug,
  formatFormula,
  theme = 'emerald',
  extraFooter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);

  const fontScale = useGameStore((s) => s.fontScale);
  const market = useGameStore((s) => s.market);
  const player = useGameStore((s) => s.player);
  const openDrugGraph = useGameStore((s) => s.openDrugGraph);
  const openGlobalAnalytics = useGameStore((s) => s.openGlobalAnalytics);

  const fontScaleClass =
    fontScale === 'xl' ? 'font-scale-xl' : fontScale === 'large' ? 'font-scale-large' : 'font-scale-normal';

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate viewport-aware fixed coordinates
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    if (triggerRect.width === 0 && triggerRect.height === 0) return;

    const padding = 16;
    const cardWidth = 520; // expanded verbose dossier width
    const cardHeight = popoverRef.current ? popoverRef.current.offsetHeight : 440;

    // Align left with trigger cell, keeping within viewport
    let left = triggerRect.left;
    if (left + cardWidth > window.innerWidth - padding) {
      left = Math.max(padding, window.innerWidth - padding - cardWidth);
    }
    if (left < padding) {
      left = padding;
    }

    // Center vertically on the trigger row
    let top = triggerRect.top + triggerRect.height / 2;
    const halfHeight = cardHeight / 2;

    // Viewport bounds clamping: only clamp if overflowing screen top or bottom
    if (top - halfHeight < padding) {
      top = padding + halfHeight;
    } else if (top + halfHeight > window.innerHeight - padding) {
      top = window.innerHeight - padding - halfHeight;
    }

    setCoords({ left, top });
  }, []);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (isPinned) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 80);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinned) {
      setIsPinned(false);
      setIsOpen(false);
    } else {
      updatePosition();
      setIsPinned(true);
      setIsOpen(true);
    }
  };

  const handlePopoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPinned) {
      setIsPinned(true);
    }
  };

  const handleUnpin = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinned(false);
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen || isPinned) {
      updatePosition();
      const timer = setTimeout(updatePosition, 16);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, isPinned, updatePosition]);

  // Handle clicking outside to unpin
  useEffect(() => {
    if (!isPinned) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsPinned(false);
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPinned]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const showPopover = isOpen || isPinned;

  const isEmerald = theme === 'emerald';
  const borderActive = isEmerald ? 'border-emerald-400' : 'border-indigo-400';
  const textAccent = isEmerald ? 'text-emerald-300' : 'text-indigo-300';
  const glowShadow = isEmerald
    ? 'shadow-[0_20px_60px_-15px_rgba(16,185,129,0.35)]'
    : 'shadow-[0_20px_60px_-15px_rgba(99,102,241,0.35)]';
  const ringColor = isEmerald ? 'ring-emerald-400/80' : 'ring-indigo-400/80';
  const tagBg = isEmerald
    ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
    : 'bg-indigo-950 border-indigo-700 text-indigo-300';

  return (
    <div
      ref={triggerRef}
      className="relative select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleTriggerClick}
    >
      {/* Resting Compact Card in Table */}
      <div
        className={`rounded-xl border p-2.5 transition-all duration-200 cursor-pointer ${
          showPopover
            ? isEmerald
              ? 'border-emerald-500/80 bg-slate-900/90 shadow-md'
              : 'border-indigo-500/80 bg-slate-900/90 shadow-md'
            : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
        }`}
        title="Hover to view drug dossier • Click to pin"
      >
        <div className="flex items-center gap-3">
          <DrugImage drug={drug} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-base transition-colors ${showPopover ? textAccent : 'text-slate-100'}`}>
                {drug.name}
              </span>
              {drug.chemicalFormula && (
                <span
                  className={`px-1.5 py-0.5 rounded bg-slate-950 font-bold border text-[10px] tracking-tight shrink-0 ${
                    isEmerald ? 'text-emerald-400 border-emerald-900/60' : 'text-indigo-400 border-indigo-900/60'
                  }`}
                >
                  {formatFormula(drug.chemicalFormula)}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 truncate max-w-[170px] sm:max-w-[210px] mt-0.5">
              {drug.scientificName ? drug.scientificName : drug.description}
            </div>
          </div>
        </div>
      </div>

      {/* Zoomed Hover / Pinned Inspection Card rendered via Portal to escape overflow contexts */}
      {showPopover &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              left: `${coords.left}px`,
              top: `${coords.top}px`,
              transform: 'translateY(-50%)',
              transformOrigin: 'left center',
              zIndex: 99999,
            }}
            className={`w-[480px] sm:w-[520px] max-w-[calc(100vw-2rem)] flex z-[99999] rounded-3xl border-2 ${borderActive} bg-slate-950/98 p-5 ${glowShadow} backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 gap-4 items-start ring-1 ring-white/10 pointer-events-auto shadow-2xl ${fontScaleClass}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handlePopoverClick}
          >
            {/* Large Image with the card */}
            <div className="shrink-0">
              <DrugImage drug={drug} size="lg" className={`ring-2 ${ringColor} shadow-2xl rounded-2xl`} />
            </div>

            {/* Details & Verbose Dossier */}
            {(() => {
              const details = getDrugDetails(drug.id);
              const spotPrice = market[drug.id]?.price ?? drug.basePrice;
              const spread = drug.basePrice > 0 ? ((spotPrice - drug.basePrice) / drug.basePrice) * 100 : 0;
              const inventoryHolding = player.inventory[drug.id];
              const inBriefcase = inventoryHolding?.units ?? 0;
              const avgCost = inventoryHolding?.avgCost ?? 0;
              const inVaults = Object.values(player.vaults || {}).reduce(
                (sum, v) => sum + (v[drug.id] || 0),
                0
              );
              const pnl = inBriefcase > 0 ? (spotPrice - avgCost) * inBriefcase : 0;
              const pnlPct = inBriefcase > 0 && avgCost > 0 ? ((spotPrice - avgCost) / avgCost) * 100 : 0;

              return (
                <div className="flex-1 min-w-0 font-mono space-y-2.5">
                  {/* Title & Formula Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="min-w-0">
                      <span className={`font-black ${textAccent} text-lg uppercase tracking-wide truncate block`}>
                        {drug.name}
                      </span>
                      {drug.scientificName && (
                        <span className="text-[11px] font-bold text-sky-400 block mt-0.5 truncate">
                          {drug.scientificName}
                        </span>
                      )}
                    </div>
                    {drug.chemicalFormula && (
                      <span className={`px-2 py-0.5 rounded-lg font-black border text-xs shrink-0 shadow-sm ${tagBg}`}>
                        {formatFormula(drug.chemicalFormula)}
                      </span>
                    )}
                  </div>

                  {/* DEA / Legal Schedule & Class */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">
                      {details.schedule}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 truncate max-w-[280px]">
                      {details.drugClass}
                    </span>
                  </div>

                  {/* Street Slang */}
                  {details.streetSlang.length > 0 && (
                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-500 font-semibold">Street Aliases:</span>{' '}
                      <span className="text-slate-200">{details.streetSlang.join(', ')}</span>
                    </div>
                  )}

                  {/* Description & Clinical Pharmacology */}
                  <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                    {drug.description} {details.clinicalEffects}
                  </p>

                  {/* Spot Market vs Global Benchmark */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block">Current Spot</span>
                      <strong className="text-slate-100 text-sm font-black">${spotPrice.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-amber-400/90 font-bold block">Global Base</span>
                      <strong className="text-amber-300 text-sm font-black">${drug.basePrice.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block">Spread vs Base</span>
                      <strong
                        className={`text-xs font-black ${
                          spread >= 10 ? 'text-rose-400' : spread <= -10 ? 'text-emerald-400' : 'text-slate-300'
                        }`}
                      >
                        {spread >= 0 ? '+' : ''}{spread.toFixed(0)}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block">Volatility</span>
                      <strong className="text-violet-400 text-xs font-black">±{Math.round(drug.volatility * 100)}%</strong>
                    </div>
                  </div>

                  {/* Smuggling Route & Risk Profile */}
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cheap Producers:</span>
                      <span className="text-emerald-400 font-bold">{details.topProducerCities.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Top Consumer Markups:</span>
                      <span className="text-cyan-400 font-bold">{details.topConsumerCities.join(', ')}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800/60">
                      <span className="text-slate-500">Street Heat / Dog Risk:</span>
                      <span className="text-slate-300 font-bold">
                        Heat: {details.heatImpact} • Sniffer Dogs: {details.customsRisk}
                      </span>
                    </div>
                  </div>

                  {/* Player Inventory, Cost Basis & Holding P&L */}
                  {(() => {
                    const totalUnits = inBriefcase + inVaults;
                    return (
                      <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs">
                        {/* Header: Title & Total Badge */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>Your Current Stash</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                            {totalUnits > 0 ? `${totalUnits.toLocaleString()} units total` : '0 units'}
                          </span>
                        </div>

                        {totalUnits === 0 ? (
                          <div className="text-xs text-slate-500 italic py-0.5 text-center">
                            No units currently held in pocket or property vaults
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Row 1: Stash Distribution across Pocket & Vaults */}
                            <div className="flex items-center justify-between bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px]">
                              <span className="text-slate-400 text-[10px] uppercase font-bold">Stash Locations:</span>
                              <div className="flex items-center gap-2 font-mono font-bold text-slate-200">
                                <span className={inBriefcase > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                                  {inBriefcase.toLocaleString()} pocket
                                </span>
                                <span className="text-slate-600">•</span>
                                <span className={inVaults > 0 ? 'text-cyan-400' : 'text-slate-500'}>
                                  {inVaults.toLocaleString()} in vaults
                                </span>
                              </div>
                            </div>

                            {/* Counterfeit Warning Badge if holding contains fake units */}
                            {inventoryHolding?.fakeUnits && inventoryHolding.fakeUnits > 0 && (
                              <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-500/60 px-3 py-1.5 rounded-xl text-[11px] text-amber-200 shadow-sm">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>
                                  <strong className="text-amber-300 font-bold">{inventoryHolding.fakeUnits} fake units</strong> detected in batch. Selling will cause buyer penalties & heat!
                                </span>
                              </div>
                            )}

                            {/* Row 2: Financial Performance (Avg Cost & Unrealized P&L) */}
                            <div className="grid grid-cols-2 gap-2 text-center">
                              {/* Avg Cost */}
                              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                                <span className="text-[9px] uppercase font-bold text-slate-500 block">Avg Cost</span>
                                <strong className="text-xs font-black text-indigo-300 block mt-0.5">
                                  {inBriefcase > 0 ? `$${avgCost.toLocaleString()}` : '—'}
                                </strong>
                                <span className="text-[9px] text-slate-500 block mt-0.5">per unit</span>
                              </div>

                              {/* Unrealized P&L */}
                              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                                <span className="text-[9px] uppercase font-bold text-slate-500 block">Unrealized P&L</span>
                                {inBriefcase > 0 ? (
                                  <div className="mt-0.5">
                                    <strong
                                      className={`text-xs font-black block leading-tight ${
                                        pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                      }`}
                                    >
                                      {pnl >= 0 ? '+' : ''}${Math.round(pnl).toLocaleString()}
                                    </strong>
                                    <span
                                      className={`text-[10px] font-bold block ${
                                        pnl >= 0 ? 'text-emerald-400/90' : 'text-rose-400/90'
                                      }`}
                                    >
                                      ({pnl >= 0 ? '+' : ''}{pnlPct.toFixed(0)}%)
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500 block mt-0.5">—</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Extra Footer if supplied */}
                        {extraFooter && (
                          <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                            {extraFooter}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Action Shortcuts: Open Graph & Global Radar */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPinned(false);
                        setIsOpen(false);
                        openDrugGraph(drug.id);
                      }}
                      className="py-1.5 px-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      title="Open 14D Historical Chart & Target Price Estimator"
                    >
                      <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                      <span>Chart & Estimator</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPinned(false);
                        setIsOpen(false);
                        openGlobalAnalytics(drug.id);
                      }}
                      className="py-1.5 px-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Global Radar</span>
                    </button>
                  </div>

                  {isPinned ? (
                    <button
                      type="button"
                      onClick={handleUnpin}
                      className={`w-full text-center text-[10px] font-bold py-1 px-2 rounded-lg border transition-colors cursor-pointer ${
                        isEmerald
                          ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/60'
                          : 'bg-indigo-950/60 border-indigo-700/80 text-indigo-300 hover:bg-indigo-900/60'
                      }`}
                    >
                      ✕ PINNED (Click to Close / Unpin)
                    </button>
                  ) : (
                    <div className="text-[10px] text-slate-500 text-right uppercase tracking-wider">
                      Click to Pin Dossier
                    </div>
                  )}
                </div>
              );
            })()}
          </div>,
          document.body
        )}
    </div>
  );
};
