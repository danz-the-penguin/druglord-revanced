import React from 'react';
import { useGameStore } from '../store/gameStore';
import { RANK_MAP } from '../engine/constants';
import { getTotalWealth } from '../engine/game';
import { soundEngine } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import {
  Crown,
  X,
  Trophy,
  Building,
  Plane,
  ShieldCheck,
  Coins,
  Award,
  Briefcase,
  Star,
} from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface PenthouseShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PenthouseShowcaseModal: React.FC<PenthouseShowcaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const player = useGameStore((s) => s.player);
  const openHallOfFame = useGameStore((s) => s.openHallOfFame);

  if (!isOpen) return null;

  const currentRank = RANK_MAP.get(player.currentRankId);
  const rankTier = parseInt(player.currentRankId.replace(/\D/g, '') || '1', 10);
  const totalWealth = getTotalWealth(player);
  const safehouseCount = player.ownedProperties?.length ?? 0;
  const aircraftCount = player.ownedAircraft?.length ?? 0;
  const businessesControlled = player.ownedBusinesses?.length ?? 0;
  const achievementsCount = player.unlockedAchievements?.length ?? 0;

  // Visual Theme of the Suite based on Rank
  const isHighRoller = rankTier >= 8;
  const isMidTier = rankTier >= 4 && rankTier < 8;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-950 border-2 border-amber-500/70 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col font-mono shadow-2xl shadow-amber-950/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 p-4 sm:p-5 border-b border-amber-600/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/60 text-amber-400">
              <Crown className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-950 border border-amber-600/70 text-amber-300">
                  CARTEL COMMAND SUITE
                </span>
                <span className="text-xs text-slate-400">
                  {currentRank?.name ?? 'Underworld Don'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 tracking-wide">
                The Kingpin's Executive Penthouse
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.play('click');
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Dynamic Penthouse Architectural Environment Banner */}
          <div className={`p-6 rounded-2xl border relative overflow-hidden flex flex-col justify-between min-h-[180px] shadow-2xl ${
            isHighRoller
              ? 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-emerald-950/50 border-amber-500/80'
              : isMidTier
              ? 'bg-gradient-to-br from-slate-900 via-sky-950/40 to-slate-950 border-sky-600/60'
              : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-800'
          }`}>
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {isHighRoller
                    ? 'Skyline Skyscraper Penthouse • 68th Floor'
                    : isMidTier
                    ? 'Industrial Waterfront Warehouse Loft'
                    : 'Street-Level Underground Hideout'}
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {isHighRoller
                    ? 'Global Syndicate Command Fortress'
                    : isMidTier
                    ? 'Trafficking Operations Center'
                    : 'Modest Safehouse Headquarters'}
                </h4>
                <p className="text-xs text-slate-300 font-sans mt-1.5 max-w-xl leading-relaxed">
                  {isHighRoller
                    ? 'Floor-to-ceiling panoramic glass overlooking the neon city skyline. Solid gold bullion stacked in reinforced display cases, custom-tuned Gulfstream jet waiting on the helipad.'
                    : isMidTier
                    ? 'Wall of CRT surveillance monitors tracking precinct patrol cars. Steel gun racks holding tactical rifles, high-speed money counters humming constantly on the desk.'
                    : 'A sparse room with heavy deadbolts, radio scanners monitoring police dispatch, and a stash box hidden under the floorboards.'}
                </p>
              </div>

              {/* Net Worth Callout */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-amber-500/50 text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase block">Total Net Worth</span>
                <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                  <AnimatedCounter value={totalWealth} prefix="$" />
                </span>
              </div>
            </div>

            {/* Ambient Graphic Silhouettes */}
            <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none">
              <Crown className="w-64 h-64 text-amber-400 transform translate-x-12 translate-y-12" />
            </div>
          </div>

          {/* 2. Four Pillars of the Empire */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Liquid Cash & Swiss Vault */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                <Coins className="w-4 h-4" />
                <span>Liquid Reserves</span>
              </div>
              <div className="text-lg font-black text-white font-mono">
                <AnimatedCounter value={player.cash} prefix="$" />
              </div>
              <span className="text-[10px] text-slate-400 block font-sans">
                Offshore Bank: <strong className="text-cyan-300">${player.bank.toLocaleString()}</strong>
              </span>
            </div>

            {/* Properties & Safehouses */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase">
                <Building className="w-4 h-4" />
                <span>Real Estate</span>
              </div>
              <div className="text-lg font-black text-white font-mono">
                {safehouseCount} Safehouses
              </div>
              <span className="text-[10px] text-slate-400 block font-sans">
                Across {Object.keys(player.vaults || {}).length} global hubs
              </span>
            </div>

            {/* Corporate Fronts */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                <Briefcase className="w-4 h-4" />
                <span>Shell Fronts</span>
              </div>
              <div className="text-lg font-black text-white font-mono">
                {businessesControlled} Controlled
              </div>
              <span className="text-[10px] text-slate-400 block font-sans">
                {Object.keys(player.businessShares || {}).length} active stock positions
              </span>
            </div>

            {/* Private Aircraft Fleet */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase">
                <Plane className="w-4 h-4" />
                <span>Private Wings</span>
              </div>
              <div className="text-lg font-black text-white font-mono">
                {aircraftCount} Aircraft
              </div>
              <span className="text-[10px] text-slate-400 block font-sans">
                {player.selectedAircraftId ? 'Flagship in hangar' : 'No personal craft'}
              </span>
            </div>
          </div>

          {/* 3. The Trophy Case: Wall of Achievements & Relics */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Syndicate Trophy Showcase ({achievementsCount} Unlocked)</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  soundEngine.play('click');
                  openHallOfFame('achievements');
                  onClose();
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold hover:underline cursor-pointer"
              >
                View Hall of Fame &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Relic 1: Gold AK-47 */}
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                rankTier >= 6 ? 'bg-amber-950/30 border-amber-500/60' : 'bg-slate-950/40 border-slate-800 opacity-50'
              }`}>
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-200">24K Gold-Plated Armory</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                    {rankTier >= 6 ? 'Awarded for reaching Master Smuggler rank.' : 'Unlocks at Rank 6.'}
                  </p>
                </div>
              </div>

              {/* Relic 2: Diplomatic Seal */}
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                player.consularImmunity && player.consularImmunity !== 'none'
                  ? 'bg-sky-950/30 border-sky-500/60'
                  : 'bg-slate-950/40 border-slate-800 opacity-50'
              }`}>
                <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-200">Consular Immunity Seal</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                    {player.consularImmunity && player.consularImmunity !== 'none'
                      ? 'Diplomatic pouch active from Swiss Bank.'
                      : 'Purchase consular status in Zurich.'}
                  </p>
                </div>
              </div>

              {/* Relic 3: Supreme Don Scepter */}
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                rankTier >= 10 ? 'bg-purple-950/30 border-purple-500/60' : 'bg-slate-950/40 border-slate-800 opacity-50'
              }`}>
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-200">Cartel Don Supreme</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                    {rankTier >= 10 ? 'Undisputed global underworld sovereign.' : 'Reach Rank 10 to crown Don.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900/90 p-4 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono">
            ESTABLISHED DAY {player.currentDay} • EMPIRE STANDING {currentRank?.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md"
          >
            Return to Operations
          </button>
        </div>
      </div>
    </div>
  );
};
