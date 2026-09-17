import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Drug } from '../engine/types';
import { DrugImage } from './DrugImage';

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
  containerRef,
  extraFooter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Boundary collision detection
  const calculateCollision = useCallback(() => {
    if (!popoverRef.current) return;
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const container = containerRef?.current || document.body;
    const containerRect = container.getBoundingClientRect();

    const padding = 16; // Minimum 16px safety margin from parent borders
    let shiftX = 0;
    let shiftY = 0;

    // Left collision detection: if popover overlaps left boundary, shift right
    if (popoverRect.left < containerRect.left + padding) {
      shiftX = containerRect.left + padding - popoverRect.left;
    } else if (popoverRect.right > containerRect.right - padding) {
      // Right collision detection: shift left if overflowing right
      shiftX = containerRect.right - padding - popoverRect.right;
    }

    // Top and Bottom collision detection
    if (popoverRect.top < containerRect.top + padding) {
      shiftY = containerRect.top + padding - popoverRect.top;
    } else if (popoverRect.bottom > containerRect.bottom - padding) {
      shiftY = containerRect.bottom - padding - popoverRect.bottom;
    }

    setOffset({ x: shiftX, y: shiftY });
  }, [containerRef]);

  useEffect(() => {
    if (isOpen || isPinned) {
      calculateCollision();
      // Re-calculate after CSS render pass
      const timer = setTimeout(calculateCollision, 20);
      window.addEventListener('resize', calculateCollision);
      window.addEventListener('scroll', calculateCollision, true);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', calculateCollision);
        window.removeEventListener('scroll', calculateCollision, true);
      };
    } else {
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen, isPinned, calculateCollision]);

  // Handle clicking outside to unpin
  useEffect(() => {
    if (!isPinned) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsPinned(false);
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPinned]);

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
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        if (!isPinned) setIsOpen(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setIsPinned((prev) => !prev);
        setIsOpen(true);
      }}
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
        title="Click to pin/unpin preview"
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

      {/* Zoomed Hover / Pinned Inspection Card with Boundary Protection */}
      {showPopover && (
        <div
          ref={popoverRef}
          style={{
            transform: `translate(${Math.max(4, offset.x)}px, calc(-50% + ${offset.y}px)) scale(1.05)`,
            transformOrigin: 'left center',
          }}
          className={`absolute left-0 top-1/2 w-[440px] max-w-[calc(100vw-2rem)] flex z-50 rounded-3xl border-2 ${borderActive} bg-slate-950/98 p-5 ${glowShadow} backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 gap-4 items-start ring-1 ring-white/10 ${
            isPinned ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
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

            {isPinned && (
              <div className="mt-2 text-[10px] text-slate-500 text-right uppercase tracking-wider">
                [ Pinned • Click anywhere to close ]
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
