import React from 'react';
import { useGameStore } from '../store/gameStore';
import {
  CITY_MAP,
  RANK_MAP,
} from '../engine/constants';
import {
  getInventoryTotalUnits,
  getCarryingCapacity,
  getTotalWealth,
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
  Terminal,
  Shield,
} from 'lucide-react';

export const Header: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const toggleTerminal = useGameStore((s) => s.toggleTerminal);
  const fontScale = useGameStore((s) => s.fontScale);
  const setFontScale = useGameStore((s) => s.setFontScale);
  const city = CITY_MAP.get(player.currentCityId);
  const rank = RANK_MAP.get(player.currentRankId);

  const totalUnits = getInventoryTotalUnits(player);
  const capacity = getCarryingCapacity(player);
  const netWorth = getTotalWealth(player);
  const isOverdue = player.debt > 0 && player.loanDaysLeft <= 0;
  const isGod = player.cheats?.godMode;

  const capacityPercent = Math.min(100, Math.round((totalUnits / capacity) * 100));

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur px-4 py-3 sticky top-0 z-40">
      <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-4 font-mono">
        {/* Logo & City & Day */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider text-emerald-400">
                DRUG LORD 2
              </span>
              <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                FINTECH
              </span>
              {isGod && (
                <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1 font-bold animate-pulse">
                  <Shield className="w-3 h-3" /> GOD MODE
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1 text-sky-400">
                <MapPin className="w-3.5 h-3.5" />
                {city?.name ?? 'Unknown'}, {city?.country}
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                Day {player.currentDay} / {player.maxDays}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">
                Net Worth: <strong className="text-amber-300">${netWorth.toLocaleString()}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Health & Rank Bar */}
        <div className="flex items-center gap-3">
          {/* Health */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 min-w-[130px]">
            <div className="flex items-center justify-between text-xs mb-1">
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
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 min-w-[130px]">
            <div className="flex items-center justify-between text-xs mb-1">
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
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs hidden lg:block">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              {rank?.name}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
              {rank?.container}
            </div>
          </div>

          {/* Font Scale Switcher */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-1 flex items-center gap-1 text-xs">
            <button
              onClick={() => setFontScale('normal')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                fontScale === 'normal'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Standard Font Size (100%)"
            >
              A-
            </button>
            <button
              onClick={() => setFontScale('large')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                fontScale === 'large'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Large Font Size (115%)"
            >
              A
            </button>
            <button
              onClick={() => setFontScale('xl')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                fontScale === 'xl'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Extra Large Font Size (130%)"
            >
              A+
            </button>
          </div>

          {/* Dev Mode Terminal Button */}
          <button
            onClick={toggleTerminal}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-950/50"
            title="Open Cartel Debug Terminal & Cheat Engine Buffer (HotKey: ~)"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">DEV</span> [~]
          </button>
        </div>

        {/* Financial Meters */}
        <div className="flex items-center gap-2 sm:gap-3 text-sm">
          {/* Cash */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg px-3 py-1.5">
            <div className="text-[10px] text-emerald-400/80 uppercase font-semibold flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Liquid Cash
            </div>
            <div className="text-emerald-300 font-bold text-base tracking-tight">
              ${player.cash.toLocaleString()}
            </div>
          </div>

          {/* Bank */}
          <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-lg px-3 py-1.5">
            <div className="text-[10px] text-cyan-400/80 uppercase font-semibold flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Offshore Bank
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
              <AlertTriangle className="w-3 h-3" /> Shark Debt
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
