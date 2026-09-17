import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Weapon } from '../engine/types';
import { WeaponImage } from './WeaponImage';
import { useGameStore } from '../store/gameStore';
import {
  Shield,
  Crosshair,
  Zap,
  Package,
  Check,
  Flame,
  ShieldCheck,
} from 'lucide-react';

interface ArmoryPreviewCardProps {
  item: Weapon;
  onPurchase: (id: string) => void;
  canAfford: boolean;
  isOwned: boolean;
  ownedCount: number;
}

export const ArmoryPreviewCard: React.FC<ArmoryPreviewCardProps> = ({
  item,
  onPurchase,
  canAfford,
  isOwned,
  ownedCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);

  const player = useGameStore((s) => s.player);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isUtility = item.type === 'utility';
  const isArmor = item.type === 'armor';
  const isWeapon = item.type === 'weapon';

  const maxHold = item.maxHold ?? 10;
  const isMaxCapacity = isUtility && ownedCount >= maxHold;
  const isEquippedArmor = isArmor && isOwned;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    if (triggerRect.width === 0 && triggerRect.height === 0) return;

    const padding = 16;
    const cardWidth = 460;
    const cardHeight = popoverRef.current ? popoverRef.current.offsetHeight : 380;

    let left = triggerRect.left;
    if (left + cardWidth > window.innerWidth - padding) {
      left = Math.max(padding, window.innerWidth - padding - cardWidth);
    }
    if (left < padding) {
      left = padding;
    }

    let top = triggerRect.top + triggerRect.height / 2;
    const halfHeight = cardHeight / 2;

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
    // Only toggle if not clicking button inside card
    if ((e.target as HTMLElement).closest('button')) return;
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

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const showPopover = isOpen || isPinned;

  // Stat summary text for compact card
  let compactStatText = '';
  if (isWeapon) {
    compactStatText = `Damage: ${item.damage} ${ownedCount > 0 ? `(Arsenal: ${ownedCount})` : ''}`;
  } else if (isArmor) {
    compactStatText = `Defense: +${Math.round((item.defense ?? 0) * 100)}% DMG Reduction`;
  } else {
    if (item.id === 'no_scent') {
      compactStatText = `Masks: 100 units/can (${ownedCount}/${maxHold})`;
    } else if (item.id === 'flashbang') {
      compactStatText = `Stun: 100% Miss Next Turn (${ownedCount}/${maxHold})`;
    } else if (item.id === 'smoke_grenade') {
      compactStatText = `Flee: +50% Escape Chance (${ownedCount}/${maxHold})`;
    } else if (item.id === 'combat_medkit') {
      compactStatText = `Heal: +40 HP In Combat (${ownedCount}/${maxHold})`;
    } else {
      compactStatText = item.description;
    }
  }

  // Category styling
  const categoryLabel = isWeapon
    ? 'Lethal Firearm'
    : isArmor
    ? 'Ballistic Armor'
    : 'Tactical Utility';

  const categoryColor = isWeapon
    ? 'text-rose-400 bg-rose-950/80 border-rose-700/70'
    : isArmor
    ? 'text-cyan-400 bg-cyan-950/80 border-cyan-700/70'
    : 'text-emerald-400 bg-emerald-950/80 border-emerald-700/70';

  const glowBorder = showPopover
    ? isWeapon
      ? 'border-rose-500/80 shadow-rose-950/40'
      : isArmor
      ? 'border-cyan-500/80 shadow-cyan-950/40'
      : 'border-emerald-500/80 shadow-emerald-950/40'
    : 'border-slate-800 hover:border-slate-700';

  return (
    <div
      ref={triggerRef}
      className="relative select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleTriggerClick}
    >
      {/* Compact Resting Card */}
      <div
        className={`bg-slate-950/60 border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer ${glowBorder} ${
          showPopover ? 'bg-slate-900/90 shadow-xl' : ''
        }`}
        title="Hover to inspect stats • Click to pin preview"
      >
        <div className="flex items-start gap-3.5">
          <WeaponImage item={item} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-100 text-sm truncate">{item.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-tight border ${categoryColor}`}
                >
                  {categoryLabel}
                </span>
              </div>
              <span className="text-amber-400 font-black text-sm shrink-0">
                ${item.price.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs gap-2">
          <span className="text-slate-300 font-semibold truncate text-[11px]">
            {compactStatText}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPurchase(item.id);
            }}
            disabled={!canAfford || isEquippedArmor || isMaxCapacity}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 font-bold text-xs transition-colors shadow-sm shrink-0 active:scale-95 cursor-pointer"
          >
            {isEquippedArmor
              ? 'Equipped'
              : isMaxCapacity
              ? 'Max Held'
              : 'Purchase'}
          </button>
        </div>
      </div>

      {/* Expanded Zoom Popover via Portal */}
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
            className="w-[440px] sm:w-[480px] max-w-[calc(100vw-2rem)] rounded-3xl border-2 border-indigo-500/80 bg-slate-950/98 p-5 shadow-[0_25px_70px_rgba(99,102,241,0.35)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/10 pointer-events-auto flex flex-col gap-4"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handlePopoverClick}
          >
            {/* Top Header Row */}
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-1 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-inner">
                <WeaponImage item={item} size="lg" className="rounded-xl ring-1 ring-indigo-400/40" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${categoryColor}`}>
                    {categoryLabel}
                  </span>
                  {isPinned && (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700 text-[10px] font-bold">
                      Pinned
                    </span>
                  )}
                </div>
                <h4 className="text-base font-black text-slate-100 mt-1">{item.name}</h4>
                <div className="text-xl font-black text-amber-400 mt-0.5">
                  ${item.price.toLocaleString()}{' '}
                  <span className="text-[11px] font-bold text-slate-400 font-normal">Cash</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed font-mono">
              {item.description}
            </p>

            {/* Tactical Stats Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              {isWeapon && (
                <>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                    <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Firepower / Lethality</span>
                      <strong className="text-rose-300 font-bold text-sm">{item.damage} DMG</strong>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                    <Crosshair className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Base Accuracy</span>
                      <strong className="text-cyan-300 font-bold text-sm">{item.accuracy ?? 90}% Hit Rate</strong>
                    </div>
                  </div>
                </>
              )}

              {isArmor && (
                <>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Damage Absorption</span>
                      <strong className="text-cyan-300 font-bold text-sm">
                        +{Math.round((item.defense ?? 0) * 100)}% Defense
                      </strong>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Durability Rating</span>
                      <strong className="text-amber-300 font-bold text-sm">{item.durability ?? 100} Hits</strong>
                    </div>
                  </div>
                </>
              )}

              {isUtility && (
                <>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Tactical Effect</span>
                      <strong className="text-emerald-300 font-bold text-xs">
                        {item.id === 'no_scent'
                          ? 'Masks K-9 Sniffer Dogs'
                          : item.id === 'flashbang'
                          ? 'Forces Enemy Miss'
                          : item.id === 'smoke_grenade'
                          ? '+50% Escape Probability'
                          : '+40 HP Combat Trauma'}
                      </strong>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Stack Limit</span>
                      <strong className="text-indigo-300 font-bold text-sm">{maxHold} Max Units</strong>
                    </div>
                  </div>
                </>
              )}

              {/* Status in Inventory */}
              <div className="col-span-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Current Arsenal Holding:</span>
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  {isArmor ? (
                    isEquippedArmor ? (
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Equipped ({player.armor?.durability ?? 100}% Durability)
                      </span>
                    ) : (
                      <span className="text-slate-500">Not Equipped</span>
                    )
                  ) : isUtility ? (
                    <span className={ownedCount > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                      {ownedCount} / {maxHold} Held
                    </span>
                  ) : (
                    <span className={ownedCount > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                      {ownedCount} in Arsenal
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Popover Footer Action */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 text-[11px]">
                {canAfford ? 'Sufficient cash on hand' : 'Insufficient cash on hand'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPurchase(item.id);
                }}
                disabled={!canAfford || isEquippedArmor || isMaxCapacity}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 font-black text-xs transition-all shadow-md shadow-indigo-950/60 active:scale-95 cursor-pointer"
              >
                {isEquippedArmor
                  ? 'Currently Equipped'
                  : isMaxCapacity
                  ? 'Capacity Limit Reached'
                  : `Purchase for $${item.price.toLocaleString()}`}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
