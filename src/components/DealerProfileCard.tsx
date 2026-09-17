import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../store/gameStore';
import { RANK_MAP, RANKS } from '../engine/constants';
import { getTotalWealth, getNextRank, getPreviousRank, getCarryingCapacity } from '../engine/game';
import { RankImage } from './RankImage';
import {
  Award,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Crown,
  Flame,
  ArrowUpCircle,
  Briefcase,
} from 'lucide-react';

export const DealerProfileCard: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const fontScale = useGameStore((s) => s.fontScale);

  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentRank = RANK_MAP.get(player.currentRankId) || RANKS[0];
  const nextRank = getNextRank(player);
  const prevRank = getPreviousRank(player);
  const netWorth = getTotalWealth(player);
  const totalCapacity = getCarryingCapacity(player);

  const isUnderFunded = prevRank && currentRank && netWorth < currentRank.cashRequired;
  const isReadyForPromotion = nextRank && netWorth >= nextRank.cashRequired;

  const currentRankIndex = RANKS.findIndex((r) => r.id === player.currentRankId);
  const nextRankProgress = nextRank
    ? Math.min(100, Math.max(0, Math.round((netWorth / nextRank.cashRequired) * 100)))
    : 100;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const cardWidth = 420;
    let left = rect.left;
    if (left + cardWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - 16 - cardWidth);
    }
    const top = rect.bottom + 8;
    setCoords({ left, top });
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 120);
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  const fontScaleClass =
    fontScale === 'xl' ? 'font-scale-xl' : fontScale === 'large' ? 'font-scale-large' : 'font-scale-normal';

  return (
    <>
      {/* Trigger Badge in Header */}
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`bg-slate-950/80 border rounded-xl px-3 py-1.5 text-xs transition-all cursor-pointer select-none group relative shadow-sm ${
          isUnderFunded
            ? 'border-red-500/80 bg-red-950/30 hover:border-red-400'
            : isReadyForPromotion
            ? 'border-emerald-500/80 bg-emerald-950/30 hover:border-emerald-400'
            : 'border-slate-800 hover:border-amber-500/60'
        }`}
        title="Hover to view dealer profile, promotion eligibility, and downgrade warnings"
      >
        <div className="flex items-center gap-1.5 font-bold">
          {currentRank.id === 'drug_lord' ? (
            <Crown className="w-4 h-4 text-amber-300" />
          ) : (
            <Award
              className={`w-4 h-4 ${
                isUnderFunded ? 'text-red-400 animate-pulse' : 'text-amber-400 group-hover:scale-110 transition-transform'
              }`}
            />
          )}

          <span
            className={`transition-colors ${
              isUnderFunded
                ? 'text-red-300 font-black'
                : isReadyForPromotion
                ? 'text-emerald-300 font-black'
                : 'text-amber-300'
            }`}
          >
            {currentRank.name}
          </span>

          {/* Underfunded warning indicator */}
          {isUnderFunded && (
            <span className="text-[10px] bg-red-950 text-red-300 border border-red-600 px-1 py-0.2 rounded font-black animate-pulse">
              ⚠️ {player.daysInsolvent || 1}/3
            </span>
          )}

          {/* Promotion ready indicator */}
          {!isUnderFunded && isReadyForPromotion && (
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1 py-0.2 rounded font-black animate-pulse">
              READY {player.daysHoldingRankCash || 0}/3
            </span>
          )}
        </div>

        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px] flex items-center gap-1">
          <Briefcase className="w-2.5 h-2.5 text-slate-500 shrink-0" />
          <span>{currentRank.container}</span>
        </div>
      </div>

      {/* Popover Hover Card rendered via Portal */}
      {isOpen &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              position: 'fixed',
              left: `${coords.left}px`,
              top: `${coords.top}px`,
              zIndex: 99999,
            }}
            className={`w-[430px] max-w-[calc(100vw-2rem)] rounded-2xl border-2 bg-slate-950/98 p-5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 font-mono space-y-4 ring-1 ring-white/10 ${
              isUnderFunded
                ? 'border-red-500 shadow-red-950/60'
                : isReadyForPromotion
                ? 'border-emerald-500 shadow-emerald-950/60'
                : 'border-amber-500/80 shadow-amber-950/40'
            } ${fontScaleClass}`}
          >
            {/* Header: Dealer Persona & Container */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <RankImage rank={currentRank} size="sm" />
                  <div>
                    <h3 className="font-black text-slate-100 text-base uppercase tracking-wider">
                      {currentRank.name}
                    </h3>
                    <span className="text-xs text-amber-400/90 font-bold block">
                      Underworld Standing Tier {currentRankIndex + 1} of {RANKS.length}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed font-sans">
                  {currentRank.description}
                </p>
              </div>
            </div>

            {/* Current Gear & Stash Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Standard Container</span>
                <strong className="text-slate-200 text-sm">{currentRank.container}</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Base cap: {currentRank.capacity} units</span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Stash Capacity</span>
                <strong className="text-emerald-400 text-sm">{totalCapacity.toLocaleString()} Units</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Includes properties & perks</span>
              </div>
            </div>

            {/* Critical Downgrade Warning Banner */}
            {isUnderFunded ? (
              <div className="p-3.5 rounded-xl bg-red-950/80 border-2 border-red-500 text-red-100 space-y-2 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs text-red-300 uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce" />
                    <span>INSOLVENCY & DEMOTION THREAT</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-900 text-red-100 text-[10px] font-black uppercase border border-red-500 animate-pulse">
                    Day {player.daysInsolvent || 1}/3
                  </span>
                </div>

                <p className="text-xs text-red-200 leading-relaxed font-sans">
                  Your net worth (<strong className="text-white">${netWorth.toLocaleString()}</strong>) has fallen below the minimum requirement of{' '}
                  <strong className="text-white">${currentRank.cashRequired.toLocaleString()}</strong> for{' '}
                  <strong className="text-red-300">{currentRank.name}</strong> status.
                </p>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-red-800/80">
                  <span className="text-red-300 font-bold">Current Shortfall:</span>
                  <strong className="text-red-100 font-black">
                    -${(currentRank.cashRequired - netWorth).toLocaleString()}
                  </strong>
                </div>

                <div className="text-[11px] text-red-300/90 font-mono bg-red-950 p-2 rounded-lg border border-red-800">
                  ⚠️ <strong>PENALTY WARNING:</strong> If funds remain deficient on Day 3, you will be stripped of status and demoted back to{' '}
                  <span className="underline font-bold">{prevRank?.name}</span> ({prevRank?.container}). Excess inventory will be lost!
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Financial Solvency:
                </span>
                <span className="text-emerald-400 font-bold">
                  Above Min. Stand ($${currentRank.cashRequired.toLocaleString()})
                </span>
              </div>
            )}

            {/* Next Rank Live Checker & Promotion Tracker */}
            {nextRank ? (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase">
                    <ArrowUpCircle className="w-4 h-4 text-sky-400" />
                    <span>Next Rank: {nextRank.name}</span>
                  </div>
                  <span className="text-xs font-black text-amber-300">
                    ${nextRank.cashRequired.toLocaleString()} Net Worth
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Net Worth Target</span>
                    <span className="font-bold text-slate-200">
                      ${Math.max(0, netWorth).toLocaleString()} / ${nextRank.cashRequired.toLocaleString()} ({nextRankProgress}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        nextRankProgress >= 100 ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${nextRankProgress}%` }}
                    />
                  </div>
                </div>

                {/* Live Requirements Checklist */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      {netWorth >= nextRank.cashRequired ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      Capital Requirement
                    </span>
                    <span className={`font-bold ${netWorth >= nextRank.cashRequired ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {netWorth >= nextRank.cashRequired
                        ? 'FULFILLED'
                        : `Need +$${(nextRank.cashRequired - netWorth).toLocaleString()}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      {(player.daysHoldingRankCash || 0) >= 3 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Flame className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      )}
                      3-Day Capital Hold
                    </span>
                    <span className="font-bold text-sky-400">
                      {player.daysHoldingRankCash || 0} / 3 Days Held
                    </span>
                  </div>
                </div>

                {/* Promotion Ready Status */}
                {isReadyForPromotion ? (
                  <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      READY! Advance {3 - (player.daysHoldingRankCash || 0)} more days with capital to promote!
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400">
                    Upgrade to receive <strong className="text-amber-300">{nextRank.container}</strong> ({nextRank.capacity} units)
                    {!player.isEndless && ` & +${nextRank.bonusDays} bonus days`}.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs font-bold text-center">
                👑 MAXIMUM CARTEL SOVEREIGNTY ACHIEVED • DRUG LORD STATUS PERMANENT
              </div>
            )}

            {/* Rank Ladder Overview */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase block font-bold mb-1.5">
                Underworld Hierarchy Progression
              </span>
              <div className="grid grid-cols-6 gap-1 text-center text-[9px] font-bold">
                {RANKS.map((r, index) => {
                  const isCurrent = r.id === player.currentRankId;
                  const isPast = index < currentRankIndex;
                  return (
                    <div
                      key={r.id}
                      className={`p-1 rounded-md border truncate ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                          : isPast
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                          : 'bg-slate-900/60 text-slate-500 border-slate-800'
                      }`}
                      title={`${r.name}: $${r.cashRequired.toLocaleString()} requirement (${r.container})`}
                    >
                      {r.name.split(' ')[0]}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
