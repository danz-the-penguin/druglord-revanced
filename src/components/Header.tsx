import React from 'react';
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
  Volume1,
  Globe,
  Plane,
  Handshake,
  Scale,
} from 'lucide-react';

export const Header: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const toggleTerminal = useGameStore((s) => s.toggleTerminal);
  const toggleSaveModal = useGameStore((s) => s.toggleSaveModal);
  const openHallOfFame = useGameStore((s) => s.openHallOfFame);
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
  const city = CITY_MAP.get(player.currentCityId);

  const totalUnits = getInventoryTotalUnits(player);
  const capacity = getCarryingCapacity(player);
  const netWorth = getTotalWealth(player);
  const isOverdue = player.debt > 0 && player.loanDaysLeft <= 0;
  const isGod = player.cheats?.godMode;

  const capacityPercent = Math.min(100, Math.round((totalUnits / capacity) * 100));
  const currentCityHeat = getCityHeat(player, player.currentCityId);

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur px-4 py-3 sticky top-0 z-40">
      <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-4 font-mono">
        {/* Logo & City & Day */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider text-emerald-400">
                DRUG LORD
              </span>
              <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-black">
                REVANCED
              </span>
              {isGod && (
                <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1 font-bold animate-pulse">
                  <Shield className="w-3 h-3" /> GOD MODE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-sky-400">
                <MapPin className="w-3.5 h-3.5" />
                {city?.name ?? 'Unknown'}, {city?.country}
              </span>

              {/* City Police Heat Indicator */}
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 transition-all ${
                  currentCityHeat >= 70
                    ? 'bg-red-950/90 text-red-300 border-red-500 animate-pulse font-black'
                    : currentCityHeat >= 30
                    ? 'bg-amber-950/70 text-amber-300 border-amber-600'
                    : 'bg-emerald-950/50 text-emerald-400 border-emerald-800/70'
                }`}
                title={`Local Police & DEA Heat in ${city?.name}: ${currentCityHeat}%. Critical heat (≥70%) triggers DEA raids and armed airport customs interceptions.`}
              >
                <Flame className={`w-3 h-3 ${currentCityHeat >= 70 ? 'text-red-400' : currentCityHeat >= 30 ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span>Heat {currentCityHeat}%</span>
              </span>

              {/* Federal RICO Meter Indicator */}
              {((typeof player.ricoMeter === 'number' && player.ricoMeter > 0) || player.isBankFrozen) && (
                <button
                  onClick={() => {
                    useGameStore.getState().setActiveTab('places');
                    useGameStore.getState().setPlacesSubTab('informant');
                  }}
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 transition-all cursor-pointer ${
                    player.isBankFrozen || (player.ricoMeter && player.ricoMeter >= 75)
                      ? 'bg-rose-950/90 text-rose-300 border-rose-500 animate-pulse font-black'
                      : (player.ricoMeter && player.ricoMeter >= 45)
                      ? 'bg-amber-950/70 text-amber-300 border-amber-600'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                  title={
                    player.isBankFrozen
                      ? '🚨 BANK ASSETS FROZEN: US Federal Grand Jury RICO Indictment! Click to open Corruption & Extradition Sanctuary command.'
                      : `Federal Grand Jury RICO Indictment Meter: ${player.ricoMeter}%. Reaching 100% triggers bank asset freezes and emergency extradition warrants.`
                  }
                >
                  <Scale className="w-3 h-3 text-rose-400" />
                  <span>{player.isBankFrozen ? 'RICO 100% [FROZEN]' : `RICO ${player.ricoMeter}%`}</span>
                </button>
              )}

              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                Day {player.currentDay} / {player.isEndless ? <span className="text-emerald-400 font-bold">∞</span> : player.maxDays}
              </span>
              {player.isEndless && (
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 tracking-wider">
                  ENDLESS
                </span>
              )}
              {player.daysInsolvent && player.daysInsolvent > 0 ? (
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                    player.daysInsolvent >= 2
                      ? 'bg-red-950 text-red-300 border-red-500 animate-pulse'
                      : 'bg-amber-950 text-amber-300 border-amber-600'
                  }`}
                  title={`${player.daysInsolvent}/3 days net worth below rank requirement. Demoted on day 3!`}
                >
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  {player.daysInsolvent === 1 ? 'Insolvency 1/3' : 'Demotion Risk 2/3'}
                </span>
              ) : null}
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

          {/* Dealer Profile & Rank Hover Card */}
          <DealerProfileCard />

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

          {/* Web Audio & Sound FX Controls */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-1 flex items-center gap-1.5 text-xs">
            <button
              onClick={toggleAudioMute}
              className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                isAudioMuted
                  ? 'text-rose-400 bg-rose-950/40 border border-rose-900/50'
                  : 'text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 shadow-sm'
              }`}
              title={
                isAudioMuted
                  ? 'Sound Muted - Click to Unmute'
                  : `Sound FX Active (${Math.round(audioVolume * 100)}%) - Click to Mute`
              }
            >
              {isAudioMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : audioVolume > 0.5 ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Volume1 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden xl:inline text-[11px] font-mono">
                {isAudioMuted ? 'MUTE' : `${Math.round(audioVolume * 100)}%`}
              </span>
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isAudioMuted ? 0 : audioVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setAudioVolume(val);
                if (isAudioMuted && val > 0) {
                  toggleAudioMute();
                }
              }}
              className="w-12 sm:w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
              title={`Adjust Sound FX Volume: ${Math.round(audioVolume * 100)}%`}
            />
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

          {/* Underworld Data Vault (Save / Export / Import) */}
          <button
            onClick={() => toggleSaveModal()}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-cyan-950/50"
            title="Underworld Data Vault: Save Slots, Export JSON & Syndicate Codes"
          >
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">VAULT</span>
            {lastSavedAt && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                title="Auto-saved to local browser storage"
              />
            )}
          </button>

          {/* Underworld Hall of Fame & Badges */}
          <button
            onClick={() => openHallOfFame('leaderboard')}
            className="px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-700/80 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-amber-950/50"
            title="Underworld Hall of Fame Leaderboard & Badges"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">HOF</span>
            {player.unlockedAchievements && player.unlockedAchievements.length > 0 && (
              <span className="text-[10px] text-amber-300 font-bold bg-amber-900/60 px-1 py-0.2 rounded border border-amber-600">
                {player.unlockedAchievements.length}
              </span>
            )}
          </button>

          {/* Global Arbitrage Radar */}
          <button
            onClick={() => openGlobalAnalytics()}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-cyan-950/50 cursor-pointer"
            title="Open Global Price Radar & Smuggling Arbitrage"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span className="hidden sm:inline">RADAR</span>
          </button>

          {/* Real-Time Airport Flight Board */}
          <button
            onClick={() => openFlightBoard()}
            className="px-2.5 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-700/80 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-sky-950/50 cursor-pointer"
            title="Open Live Airport Departure Flip-Board & Real-Time Flight Schedules"
          >
            <Plane className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">FLIGHTS</span>
          </button>

          {/* Syndicate Cartels Diplomacy */}
          <button
            onClick={() => openSyndicateModal()}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-rose-950/50 cursor-pointer"
            title="Open Underworld Crime Syndicates & Cartel Faction Dossier"
          >
            <Handshake className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">CARTELS</span>
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
