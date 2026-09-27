import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ShellBusiness } from '../engine/types';
import { ShellImage } from './ShellImage';
import { Sparkline } from './Sparkline';
import { useGameStore } from '../store/gameStore';
import {
  getBusinessSharePrice,
  getBusinessSharesOwned,
  calculateEffectiveFeeRate,
  calculateEffectiveDailyCapacity,
  TOTAL_SHARES_PER_BUSINESS,
  CONTROLLING_STAKE_SHARES,
  BROKERAGE_FEE_RATE,
} from '../engine/laundering';
import { SHELL_TICKERS, SHELL_SECTORS } from './PlacesModal';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  ShieldCheck,
  Briefcase,
  Sparkles,
  Lock,
  X,
  PieChart,
} from 'lucide-react';

interface ShellPreviewCardProps {
  business: ShellBusiness;
  children: React.ReactNode;
  className?: string;
  onSelect?: () => void;
}

export const ShellPreviewCard: React.FC<ShellPreviewCardProps> = ({
  business,
  children,
  className = '',
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);

  const player = useGameStore((s) => s.player);
  const fontScale = useGameStore((s) => s.fontScale);

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fontScaleClass =
    fontScale === 'xl' ? 'font-scale-xl' : fontScale === 'large' ? 'font-scale-large' : 'font-scale-normal';

  // Calculate coordinates relative to trigger and viewport
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    if (triggerRect.width === 0 && triggerRect.height === 0) return;

    const padding = 12;
    const isMobile = window.innerWidth < 640;
    const cardWidth = Math.min(window.innerWidth - padding * 2, 480);
    const cardHeight = popoverRef.current ? popoverRef.current.offsetHeight : 450;

    let left: number;
    if (isMobile) {
      // Center horizontally on mobile viewports like iPhone 15 Pro (393px)
      left = Math.max(padding, (window.innerWidth - cardWidth) / 2);
    } else {
      left = triggerRect.left;
      if (left + cardWidth > window.innerWidth - padding) {
        left = Math.max(padding, window.innerWidth - padding - cardWidth);
      }
      if (left < padding) {
        left = padding;
      }
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
    }, 100);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
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

  // Real-time metrics calculations
  const sharePrice = getBusinessSharePrice(business, player.currentDay);
  const baseSharePrice = Math.max(1, Math.round(business.purchaseCost / TOTAL_SHARES_PER_BUSINESS));
  const volPct = Math.round(((sharePrice - baseSharePrice) / baseSharePrice) * 100);
  const ticker = SHELL_TICKERS[business.id] || '$SHLL';
  const sector = SHELL_SECTORS[business.id] || 'Commercial Services';

  const sharesOwned = getBusinessSharesOwned(player, business.id);
  const equityPct = ((sharesOwned / TOTAL_SHARES_PER_BUSINESS) * 100).toFixed(1);
  const isControlling = sharesOwned > CONTROLLING_STAKE_SHARES;
  const isSubsidiary = sharesOwned >= TOTAL_SHARES_PER_BUSINESS;

  const marketCap = TOTAL_SHARES_PER_BUSINESS * sharePrice;
  const holdingValue = sharesOwned * sharePrice;

  const effectiveFee = calculateEffectiveFeeRate(business, player.corporateUpgrades);
  const effectiveCap = calculateEffectiveDailyCapacity(business, player.corporateUpgrades);
  const currentDividends = Math.round((sharesOwned / TOTAL_SHARES_PER_BUSINESS) * business.passiveDailyProfit);

  const remainingToControl = Math.max(0, CONTROLLING_STAKE_SHARES + 1 - sharesOwned);
  const costToControl = Math.round(remainingToControl * sharePrice * (1 + BROKERAGE_FEE_RATE));

  const history7d = [6, 5, 4, 3, 2, 1, 0].map((d) =>
    getBusinessSharePrice(business, Math.max(1, player.currentDay - d))
  );

  return (
    <div
      ref={triggerRef}
      className={`relative select-none ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleTriggerClick}
    >
      {children}

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
              zIndex: 99999,
            }}
            className={`w-[min(480px,calc(100vw-1.5rem))] max-h-[88dvh] overflow-y-auto rounded-3xl border-2 border-emerald-500/80 bg-slate-950/98 p-4 sm:p-5 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.35)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/10 pointer-events-auto text-slate-100 font-mono ${fontScaleClass}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handlePopoverClick}
          >
            {/* Header: Entity Dossier & Ticker */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <ShellImage business={business} size="md" className="ring-2 ring-emerald-500/40 shadow-lg" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-amber-400 text-base">{ticker}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 border border-sky-600 text-sky-300 uppercase">
                        💼 Minority ({equityPct}%)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 uppercase">
                        Unacquired (0%)
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-100 text-sm sm:text-base leading-snug mt-0.5 truncate max-w-[240px] sm:max-w-[300px]">
                    {business.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-sans">{sector}</div>
                </div>
              </div>

              {/* Pin Close & Spot Price Badge */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                {isPinned && (
                  <button
                    type="button"
                    onClick={handleUnpin}
                    className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                    title="Close preview"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="text-right">
                  <div className="text-base sm:text-lg font-black text-slate-100">${sharePrice.toLocaleString()}</div>
                  <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${volPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {volPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{volPct >= 0 ? `+${volPct}%` : `${volPct}%`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Operational Synergies */}
            <div className="py-2.5 border-b border-slate-800/80 space-y-1.5 text-xs font-sans">
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {business.description}
              </p>
              {business.specialPerk && (
                <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-[11px] flex items-center gap-2 font-mono">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Operational Synergy:</strong> {business.specialPerk}</span>
                </div>
              )}
            </div>

            {/* Financial & Valuation Estimator Matrix */}
            <div className="py-3 border-b border-slate-800/80 space-y-2.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1 text-emerald-400">
                  <PieChart className="w-3.5 h-3.5" />
                  <span>Corporate Valuation & Cash Flow</span>
                </span>
                <span className="text-slate-500 font-normal">Float: 10,000 Common Shares</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Market Cap</span>
                  <span className="font-bold text-slate-200">${marketCap.toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Clean Capacity</span>
                  <span className="font-bold text-emerald-400">${effectiveCap.toLocaleString()}/d</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Laundering Fee</span>
                  <span className="font-bold text-sky-400">{Math.round(effectiveFee * 1000) / 10}%</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Dividend Payout</span>
                  <span className="font-bold text-emerald-300">+${currentDividends.toLocaleString()}/d</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">FinCEN Audit Risk</span>
                  <span className="font-bold text-amber-400">{Math.round(business.auditRisk * 100)}%</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Heat Dissipation</span>
                  <span className="font-bold text-cyan-300">-{business.heatShield || 0} Heat/d</span>
                </div>
              </div>
            </div>

            {/* Your Holdings & 7-Day Trend */}
            <div className="py-3 border-b border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                <span className="flex items-center gap-1 text-sky-400">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Your Equity Portfolio</span>
                </span>
                <span>7-Day Spot Price Action</span>
              </div>

              <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-xs text-slate-300 font-bold">
                    {sharesOwned.toLocaleString()} / 10,000 shares ({equityPct}%)
                  </div>
                  <div className="text-[11px] text-emerald-400 font-bold">
                    Equity Valuation: ${holdingValue.toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Sparkline
                    data={history7d}
                    width={90}
                    height={24}
                    color={volPct >= 0 ? '#10b981' : '#f43f5e'}
                  />
                  <span className="text-[9px] text-slate-500 font-mono">7-Day Trajectory</span>
                </div>
              </div>
            </div>

            {/* Controlling Stake & Acquisition Target Estimator */}
            <div className="pt-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                <span className="flex items-center gap-1 text-amber-400">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Governance & Takeover Estimator</span>
                </span>
                <span className="font-mono text-slate-400">Target: &gt;50.0% (5,001 sh)</span>
              </div>

              {isControlling ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-600/70 text-emerald-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="block font-bold">Majority Executive Control Established</strong>
                    <span className="text-[11px] text-emerald-400/90 font-sans">
                      Corporate governance ledger unlocked. Route dirty street cash directly to bank reserves.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Shares to Seize Control:</span>
                    </span>
                    <strong className="text-amber-300">+{remainingToControl.toLocaleString()} shares</strong>
                  </div>

                  {/* Progress bar to 50% */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 relative">
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, (sharesOwned / TOTAL_SHARES_PER_BUSINESS) * 100 * 2)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-900/40">
                    <span className="text-slate-400">Capital Required (incl. 1.5% fee):</span>
                    <strong className="text-emerald-400 font-bold">${costToControl.toLocaleString()}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Hint */}
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 text-center font-sans">
              Click anywhere to select and launch the Share-by-Share Order Pad
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
