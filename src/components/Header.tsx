import React from 'react';
import { useGameStore } from '../store/gameStore';
import {
  CITY_MAP,
  RANK_MAP,
} from '../engine/constants';
import {
  getInventoryTotalUnits,
  getCarryingCapacity,
} from '../engine/game';
import {
  DollarSign,
  Building2,
  AlertTriangle,
  Heart,
  Package,
  MapPin,
  Calendar,
  Award,
} from 'lucide-react';

export const Header: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const city = CITY_MAP.get(player.currentCityId);
  const rank = RANK_MAP.get(player.currentRankId);

  const totalUnits = getInventoryTotalUnits(player);
  const capacity = getCarryingCapacity(player);
  const isOverdue = player.debt > 0 && player.loanDaysLeft <= 0;

  const capacityPercent = Math.min(100, Math.round((totalUnits / capacity) * 100));

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo & City & Day */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider text-emerald-400 font-mono">
                DRUG LORD 2
              </span>
              <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                RELOADED
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
              <span className="flex items-center gap-1 text-sky-400">
                <MapPin className="w-3.5 h-3.5" />
                {city?.name ?? 'Unknown'}, {city?.country}
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                Day {player.currentDay} / {player.maxDays}
              </span>
            </div>
          </div>
        </div>

        {/* Health & Rank Bar */}
        <div className="flex items-center gap-4">
          {/* Health */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 min-w-[140px]">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="flex items-center gap-1 text-rose-400">
                <Heart className="w-3.5 h-3.5 fill-rose-500/20 text-rose-400" /> HP
              </span>
              <span className="font-bold text-slate-200">{player.health}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  player.health > 50
                    ? 'bg-rose-500'
                    : player.health > 25
                    ? 'bg-amber-500'
                    : 'bg-red-600 animate-pulse'
                }`}
                style={{ width: `${Math.max(0, player.health)}%` }}
              />
            </div>
          </div>

          {/* Stash Capacity */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 min-w-[140px]">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="flex items-center gap-1 text-indigo-400">
                <Package className="w-3.5 h-3.5" /> Stash
              </span>
              <span className="font-bold text-slate-200">
                {totalUnits} / {capacity}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  capacityPercent >= 100
                    ? 'bg-amber-500'
                    : capacityPercent > 70
                    ? 'bg-indigo-400'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>

          {/* Rank Badge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono hidden md:block">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              {rank?.name}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
              {rank?.container}
            </div>
          </div>
        </div>

        {/* Financial Meters */}
        <div className="flex items-center gap-2 sm:gap-3 text-sm font-mono">
          {/* Cash */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg px-3 py-1.5">
            <div className="text-[10px] text-emerald-400/80 uppercase font-semibold flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Cash
            </div>
            <div className="text-emerald-300 font-bold text-base tracking-tight">
              ${player.cash.toLocaleString()}
            </div>
          </div>

          {/* Bank */}
          <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-lg px-3 py-1.5">
            <div className="text-[10px] text-cyan-400/80 uppercase font-semibold flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Bank
            </div>
            <div className="text-cyan-300 font-bold text-base tracking-tight">
              ${player.bank.toLocaleString()}
            </div>
          </div>

          {/* Debt */}
          <div
            className={`rounded-lg px-3 py-1.5 border ${
              isOverdue
                ? 'bg-red-950/80 border-red-500 animate-pulse'
                : player.debt > 0
                ? 'bg-rose-950/40 border-rose-800/60'
                : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div
              className={`text-[10px] uppercase font-semibold flex items-center gap-1 ${
                isOverdue ? 'text-red-400' : 'text-rose-400/80'
              }`}
            >
              <AlertTriangle className="w-3 h-3" /> Debt
            </div>
            <div
              className={`font-bold text-base tracking-tight ${
                isOverdue ? 'text-red-400 font-black' : 'text-rose-300'
              }`}
            >
              ${player.debt.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
