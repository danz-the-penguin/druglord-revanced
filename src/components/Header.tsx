import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  CITY_MAP,
} from '../engine/constants';
import { DealerProfileCard } from './DealerProfileCard';
import {
  getInventoryTotalUnits,
  getCarryingCapacity,
  getTotalWealth,
  getCityHeat,
} from '../engine/game';
import {
  DollarSign,
  Building2,
  AlertTriangle,
  Heart,
  Package,
  MapPin,
  Calendar,
  Trophy,
  Terminal,
  Shield,
  HardDrive,
  Flame,
  Volume2,
  VolumeX,
  Globe,
  Plane,
  Handshake,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const Header: React.FC = () => {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const player = useGameStore((s) => s.player);
  const toggleTerminal = useGameStore((s) => s.toggleTerminal);
  const toggleSaveModal = useGameStore((s) => s.toggleSaveModal);
  const openHallOfFame = useGameStore((s) => s.openHallOfFame);
  const openDailyChallenge = useGameStore((s) => s.openDailyChallenge);
  const openGlobalAnalytics = useGameStore((s) => s.openGlobalAnalytics);
  const openFlightBoard = useGameStore((s) => s.openFlightBoard);
  const openSyndicateModal = useGameStore((s) => s.openSyndicateModal);
  const lastSavedAt = useGameStore((s) => s.lastSavedAt);
  const fontScale = useGameStore((s) => s.fontScale);
  const setFontScale = useGameStore((s) => s.setFontScale);
  const audioVolume = useGameStore((s) => s.audioVolume);
  const isAudioMuted = useGameStore((s) => s.isAudioMuted);
  const setAudioVolume = useGameStore((s) => s.setAudioVolume);
  const toggleAudioMute = useGameStore((s) => s.toggleAudioMute);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const city = CITY_MAP.get(player.currentCityId);

  const totalUnits = getInventoryTotalUnits(player);
  const capacity = getCarryingCapacity(player);
  const netWorth = getTotalWealth(player);
  const isOverdue = player.debt > 0 && player.loanDaysLeft <= 0;
  const isGod = player.cheats?.godMode;

  const capacityPercent = Math.min(100, Math.round((totalUnits / capacity) * 100));
  const currentCityHeat = getCityHeat(player, player.currentCityId);

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-3 sticky top-0 z-40">
      <div className="max-w-[1750px] mx-auto font-mono space-y-2 sm:space-y-3">
        {/* Top Bar: Brand, City, Day & Mobile Quick Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Logo & God Mode */}
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-black tracking-wider text-emerald-400">
              DRUG LORD
            </span>
            <span className="text-[10px] sm:text-xs uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-black">
              REVANCED
            </span>
            {isGod && (
              <span className="text-[10px] sm:text-xs uppercase px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1 font-bold animate-pulse">
                <Shield className="w-3 h-3" /> <span className="hidden sm:inline">GOD MODE</span>
              </span>
            )}
          </div>

          {/* Center Info on Tablet/Desktop, Quick Pills on Mobile */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400 flex-wrap justify-end">
            <button
              onClick={() => setActiveTab('travel')}
              className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors cursor-pointer bg-slate-950/60 sm:bg-transparent px-2 py-1 sm:p-0 rounded-lg border border-slate-800 sm:border-0"
              title="Open Interactive Tactical Smuggling Map"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold truncate max-w-[120px] sm:max-w-none">{city?.name ?? 'Unknown'}</span>
            </button>

            {/* City Police Heat Indicator */}
            <span
              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 transition-all ${
                currentCityHeat >= 70
                  ? 'bg-red-950/90 text-red-300 border-red-500 animate-pulse font-black'
                  : currentCityHeat >= 30
                  ? 'bg-amber-950/70 text-amber-300 border-amber-600'
                  : 'bg-emerald-950/50 text-emerald-400 border-emerald-800/70'
              }`}
              title={`Local Police Heat in ${city?.name}: ${currentCityHeat}%`}
            >
              <Flame className={`w-3 h-3 shrink-0 ${currentCityHeat >= 70 ? 'text-red-400' : currentCityHeat >= 30 ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span>{currentCityHeat}%</span>
            </span>

            {/* Day Counter */}
            <span className="flex items-center gap-1 text-amber-400 bg-slate-950/60 sm:bg-transparent px-2 py-0.5 sm:p-0 rounded-lg border border-slate-800 sm:border-0 text-[11px] sm:text-xs">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              Day {player.currentDay}/{player.isEndless ? '∞' : player.maxDays}
            </span>

            {/* Mobile Tools Drawer Toggle Button */}
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className={`md:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                isToolsOpen
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle Tactical Tools & Underworld Console"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Tools</span>
              {isToolsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Financial + Vital Stats Strip */}
        <div className="grid grid-cols-3 gap-2 sm:hidden">
          {/* Cash */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-2 flex flex-col justify-between">
            <div className="text-[9px] text-emerald-400/80 uppercase font-bold flex items-center gap-1">
              <DollarSign className="w-2.5 h-2.5 shrink-0" /> Cash
            </div>
            <div className="text-emerald-300 font-black text-sm tracking-tight truncate mt-0.5">
              ${player.cash.toLocaleString()}
            </div>
          </div>

          {/* Bank */}
          <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-2 flex flex-col justify-between">
            <div className="text-[9px] text-cyan-400/80 uppercase font-bold flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5 shrink-0" /> Bank
            </div>
            <div className="text-cyan-300 font-black text-sm tracking-tight truncate mt-0.5">
              ${player.bank.toLocaleString()}
            </div>
          </div>

          {/* Debt */}
          <div
            className={`rounded-xl p-2 border flex flex-col justify-between ${
              isOverdue
                ? 'bg-red-950/80 border-red-500 animate-pulse'
                : player.debt > 0
                ? 'bg-rose-950/40 border-rose-800/60'
                : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div
              className={`text-[9px] uppercase font-bold flex items-center gap-1 ${
                isOverdue ? 'text-red-400' : 'text-rose-400/80'
              }`}
            >
              <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Debt
            </div>
            <div
              className={`font-black text-sm tracking-tight truncate mt-0.5 ${
                isOverdue ? 'text-red-400' : 'text-rose-300'
              }`}
            >
              ${player.debt.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Mobile Mini Vital Meters: HP & Stash */}
        <div className="grid grid-cols-2 gap-2 sm:hidden text-xs">
          {/* Health Bar */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 fill-rose-500/20 text-rose-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-rose-400 font-bold">HP</span>
                <span className="text-slate-200 font-mono font-bold">{player.health}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    player.health > 50 ? 'bg-rose-500' : player.health > 25 ? 'bg-amber-500' : 'bg-red-600 animate-pulse'
                  }`}
                  style={{ width: `${Math.max(0, player.health)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stash Capacity Bar */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-indigo-400 font-bold">Stash</span>
                <span className="text-slate-200 font-mono font-bold">{totalUnits}/{capacity}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    capacityPercent >= 100 ? 'bg-amber-500' : capacityPercent > 70 ? 'bg-indigo-400' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Collapsible Tools Drawer */}
        {isToolsOpen && (
          <div className="sm:hidden bg-slate-950/95 border border-slate-800 rounded-2xl p-3 space-y-3 shadow-xl animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-bold text-slate-300">Underworld Console & Utilities</span>
              <span className="text-[11px] text-amber-300">Net Worth: ${netWorth.toLocaleString()}</span>
            </div>

            {/* Quick Actions Grid for Mobile */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  toggleSaveModal();
                  setIsToolsOpen(false);
                }}
                className="py-2 px-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[11px] font-bold flex flex-col items-center justify-center gap-1 active:scale-95"
              >
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>Vault Save</span>
              </button>

              <button
                onClick={() => {
                  openHallOfFame('leaderboard');
                  setIsToolsOpen(false);
                }}
                className="py-2 px-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-300 text-[11px] font-bold flex flex-col items-center justify-center gap-1 active:scale-95"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Hall of Fame</span>
              </button>

              <button
                onClick={() => {
                  openDailyChallenge('daily');
                  setIsToolsOpen(false);
                }}
                className="py-2 px-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-300 text-[11px] font-bold flex flex-col items-center justify-center gap-1 active:scale-95"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Daily Bounty</span>
              </button>

              <button
                onClick={() => {
                  openGlobalAnalytics();
                  setIsToolsOpen(false);
                }}
                className="py-2 px-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[11px] font-bold flex flex-col items-center justify-center gap-1 active:scale-95"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Price Radar</span>
              </button>

              <button
                onClick={() => {
                  openFlightBoard();
                  setIsToolsOpen(false);
                }}
                className="py-2 px-1.5 rounded-xl bg-sky-950/60 hover:bg-sky-900 border border-sky-800 text-sky-300 text-[11px] font-bold flex flex-col items-center justify-center gap-1 active:scale-95"
              >
                <Plane className="w-4 h-4 text-sky-400" />
                <span>Flight Board</span>
              </button>

              <button
                onClick={() => {
                  openSyndicateModal();
                  setIsToolsOpen(false);
                }}
                className="py-2 px-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-bold flex flex-col items-center justify-center gap-1 active:scale-95"
              >
                <Handshake className="w-4 h-4 text-rose-400" />
                <span>Cartels</span>
              </button>

              <button
                onClick={() => {
                  toggleTerminal();
                  setIsToolsOpen(false);
                }}
                className="py-2 px-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 text-[11px] font-bold flex flex-col items-center justify-center gap-1 active:scale-95 col-span-3"
              >
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Open Cartel Debug Terminal [~]</span>
                </div>
              </button>
            </div>

            {/* Audio Volume & Font Size for Mobile */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAudioMute}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isAudioMuted ? 0 : audioVolume}
                  onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-slate-800 accent-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setFontScale('normal')}
                  className={`px-2 py-1 rounded font-bold text-xs ${fontScale === 'normal' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontScale('large')}
                  className={`px-2 py-1 rounded font-bold text-xs ${fontScale === 'large' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontScale('xl')}
                  className={`px-2 py-1 rounded font-bold text-xs ${fontScale === 'xl' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                >
                  A+
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tablet (iPad Pro) & Desktop Full Bar */}
        <div className="hidden sm:flex flex-wrap items-center justify-between gap-4 pt-1">
          {/* Health & Stash & Dealer Profile */}
          <div className="flex items-center gap-3 flex-wrap">
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
                    player.health > 50 ? 'bg-rose-500' : player.health > 25 ? 'bg-amber-500' : 'bg-red-600 animate-pulse'
                  }`}
                  style={{ width: `${Math.max(0, player.health)}%` }}
                />
              </div>
            </div>

            {/* Stash Capacity */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 min-w-[160px]">
              <div className="flex items-center justify-between gap-3 text-xs mb-1">
                <span className="flex items-center gap-1.5 text-indigo-400 font-semibold shrink-0">
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  <span>Stash</span>
                </span>
                <span className="font-bold text-slate-200 font-mono shrink-0">
                  {totalUnits.toLocaleString()} / {capacity.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    capacityPercent >= 100 ? 'bg-amber-500' : capacityPercent > 70 ? 'bg-indigo-400' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
            </div>

            {/* Dealer Profile Card */}
            <DealerProfileCard />

            {/* Font Scale Switcher */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-1 flex items-center gap-1 text-xs">
              <button
                onClick={() => setFontScale('normal')}
                className={`px-2 py-0.5 rounded font-bold transition-colors ${
                  fontScale === 'normal' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Standard Font Size"
              >
                A-
              </button>
              <button
                onClick={() => setFontScale('large')}
                className={`px-2 py-0.5 rounded font-bold transition-colors ${
                  fontScale === 'large' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Large Font Size"
              >
                A
              </button>
              <button
                onClick={() => setFontScale('xl')}
                className={`px-2 py-0.5 rounded font-bold transition-colors ${
                  fontScale === 'xl' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Extra Large Font Size"
              >
                A+
              </button>
            </div>

            {/* Sound FX Controls */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-1 flex items-center gap-1.5 text-xs">
              <button
                onClick={toggleAudioMute}
                className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                  isAudioMuted
                    ? 'text-rose-400 bg-rose-950/40 border border-rose-900/50'
                    : 'text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 shadow-sm'
                }`}
                title={isAudioMuted ? 'Sound Muted' : `Sound Active (${Math.round(audioVolume * 100)}%)`}
              >
                {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isAudioMuted ? 0 : audioVolume}
                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                className="w-12 sm:w-16 h-1 bg-slate-800 accent-emerald-500"
              />
            </div>
          </div>

          {/* Desktop & iPad Pro Financial Strip */}
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

        {/* Action Buttons Row on Tablet & Desktop */}
        <div className="hidden sm:flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleTerminal}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="Cartel Debug Terminal [~]"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>DEV [~]</span>
            </button>

            <button
              onClick={() => toggleSaveModal()}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="Underworld Data Vault"
            >
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>VAULT</span>
              {lastSavedAt && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            </button>

            <button
              onClick={() => openHallOfFame('leaderboard')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-700/80 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="Hall of Fame Leaderboard & Badges"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>HOF</span>
              {player.unlockedAchievements && player.unlockedAchievements.length > 0 && (
                <span className="text-[10px] text-amber-300 font-bold bg-amber-900/60 px-1 py-0.2 rounded border border-amber-600">
                  {player.unlockedAchievements.length}
                </span>
              )}
            </button>

            <button
              onClick={() => openDailyChallenge('daily')}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer ${
                player.activeChallengeId
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black animate-pulse'
                  : 'bg-amber-950/80 hover:bg-amber-900 border-amber-700/80 text-amber-300'
              }`}
              title="Daily Seed Run & Cartel Bounty Board"
            >
              <Zap className={`w-3.5 h-3.5 ${player.activeChallengeId ? 'fill-slate-950 text-slate-950' : 'text-amber-400'}`} />
              <span>{player.activeChallengeId ? 'BOUNTY' : 'DAILY'}</span>
            </button>

            <button
              onClick={() => openGlobalAnalytics()}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Global Price Radar"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>RADAR</span>
            </button>

            <button
              onClick={() => openFlightBoard()}
              className="px-2.5 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-700/80 text-sky-300 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Airport Departure Board"
            >
              <Plane className="w-3.5 h-3.5 text-sky-400" />
              <span>FLIGHTS</span>
            </button>

            <button
              onClick={() => openSyndicateModal()}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-300 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Syndicates & Cartels Dossier"
            >
              <Handshake className="w-3.5 h-3.5 text-rose-400" />
              <span>CARTELS</span>
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Net Worth: <strong className="text-amber-300 font-bold">${netWorth.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </header>
  );
};
