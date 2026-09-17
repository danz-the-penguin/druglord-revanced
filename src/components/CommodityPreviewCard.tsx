import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Drug } from '../engine/types';
import { DrugImage } from './DrugImage';
import { useGameStore } from '../store/gameStore';

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
    const cardWidth = 465; // popover width (440px) + scale factor allowance
    const cardHeight = (popoverRef.current ? popoverRef.current.offsetHeight : 230) * 1.05;

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
              transform: 'translateY(-50%) scale(1.05)',
              transformOrigin: 'left center',
              zIndex: 99999,
            }}
            className={`w-[440px] max-w-[calc(100vw-2rem)] flex z-[99999] rounded-3xl border-2 ${borderActive} bg-slate-950/98 p-5 ${glowShadow} backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 gap-4 items-start ring-1 ring-white/10 pointer-events-auto shadow-2xl ${fontScaleClass}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handlePopoverClick}
          >
            {/* Large Image with the card */}
            <div className="shrink-0">
              <DrugImage drug={drug} size="lg" className={`ring-2 ${ringColor} shadow-2xl rounded-2xl`} />
            </div>

            {/* Details & Definition */}
            <div className="flex-1 min-w-0 font-mono">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
                <span className={`font-black ${textAccent} text-lg uppercase tracking-wide truncate`}>
                  {drug.name}
                </span>
                {drug.chemicalFormula && (
                  <span className={`px-2 py-0.5 rounded-lg font-black border text-xs shrink-0 shadow-sm ${tagBg}`}>
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
                <span>
                  Mol Mass: <strong className="text-slate-100">{drug.molecularWeight || 'N/A'}</strong>
                </span>
                {extraFooter ? (
                  extraFooter
                ) : (
                  <span>
                    Base: <strong className="text-emerald-400 font-bold">${drug.basePrice.toLocaleString()}</strong>
                  </span>
                )}
              </div>

              {isPinned ? (
                <button
                  type="button"
                  onClick={handleUnpin}
                  className={`mt-2.5 w-full text-center text-[10px] font-bold py-1 px-2 rounded-lg border transition-colors cursor-pointer ${
                    isEmerald
                      ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/60'
                      : 'bg-indigo-950/60 border-indigo-700/80 text-indigo-300 hover:bg-indigo-900/60'
                  }`}
                >
                  ✕ PINNED (Click to Close / Unpin)
                </button>
              ) : (
                <div className="mt-2 text-[10px] text-slate-500 text-right uppercase tracking-wider">
                  Click to Pin
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
