import React, { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  Trophy,
  Award,
  Crown,
  Lock,
  X,
  Share2,
  Trash2,
  Check,
  CheckCircle2,
  Sparkles,
  Zap,
  DollarSign,
  Building2,
  Package,
  Plane,
  Globe,
  Flame,
  EyeOff,
  Home,
  ShieldCheck,
  Crosshair,
  Swords,
  HeartPulse,
  Radio,
  Truck,
  Briefcase,
} from 'lucide-react';
import { ACHIEVEMENTS, AchievementCategory } from '../engine/achievements';
import {
  getHallOfFameEntries,
  clearHallOfFame,
  generateShareableDossierText,
  HallOfFameEntry,
} from '../engine/hallOfFame';
import { GameDurationMode } from '../engine/types';

interface HallOfFameModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'leaderboard' | 'achievements';
}

const CATEGORIES: { id: AchievementCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Badges' },
  { id: 'wealth', label: 'Wealth' },
  { id: 'smuggling', label: 'Smuggling' },
  { id: 'empire', label: 'Empire' },
  { id: 'combat', label: 'Combat' },
  { id: 'notoriety', label: 'Notoriety' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  Briefcase: <Briefcase className="w-5 h-5" />,
  CheckCircle2: <CheckCircle2 className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  DollarSign: <DollarSign className="w-5 h-5" />,
  Building2: <Building2 className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
  Plane: <Plane className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />,
  EyeOff: <EyeOff className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  Crosshair: <Crosshair className="w-5 h-5" />,
  Swords: <Swords className="w-5 h-5" />,
  HeartPulse: <HeartPulse className="w-5 h-5" />,
  Radio: <Radio className="w-5 h-5" />,
  Truck: <Truck className="w-5 h-5" />,
  Lock: <Lock className="w-5 h-5" />,
  Trophy: <Trophy className="w-5 h-5" />,
  Crown: <Crown className="w-5 h-5" />,
};

export const HallOfFameModal: React.FC<HallOfFameModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'leaderboard',
}) => {
  const player = useGameStore((s) => s.player);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements'>(initialTab);
  const [durationFilter, setDurationFilter] = useState<GameDurationMode | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const entries = useMemo(() => {
    if (!isOpen) return [];
    try {
      return getHallOfFameEntries(durationFilter);
    } catch {
      return [];
    }
  }, [isOpen, durationFilter, refreshTick]);

  const unlockedSet = useMemo(
    () => new Set(player?.unlockedAchievements || []),
    [player?.unlockedAchievements]
  );
  const totalUnlocked = unlockedSet.size;
  const totalAchievements = ACHIEVEMENTS.length;
  const totalPoints = useMemo(
    () =>
      ACHIEVEMENTS.reduce(
        (sum, a) => (unlockedSet.has(a.id) ? sum + a.prestigePoints : sum),
        0
      ),
    [unlockedSet]
  );

  if (!isOpen) return null;

  const handleCopyDossier = (entry: HallOfFameEntry) => {
    const text = generateShareableDossierText(entry);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleClearRecords = () => {
    clearHallOfFame();
    setShowClearConfirm(false);
    setRefreshTick((t) => t + 1);
  };

  const filteredAchievements = ACHIEVEMENTS.filter(
    (a) => categoryFilter === 'all' || a.category === categoryFilter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 font-mono">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95">
        {/* Top Header */}
        <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                Underworld Hall of Fame & Badges
              </h2>
              <p className="text-xs text-slate-400">
                Historical kingpin rankings, career dossiers, and criminal achievements
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-950/60 px-5 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>Leaderboard ({entries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'achievements'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Achievements ({totalUnlocked}/{totalAchievements})</span>
            </button>
          </div>

          {activeTab === 'achievements' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Score Multiplier:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                +{totalPoints.toLocaleString()} Prestige PTS
              </span>
            </div>
          )}
        </div>

        {/* Tab 1: Leaderboard View */}
        {activeTab === 'leaderboard' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] uppercase font-bold text-slate-500 mr-1">Lifespan:</span>
                {(['all', 'classic', 'quarter', 'year', 'endless'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDurationFilter(mode)}
                    className={`px-2.5 py-1 rounded text-xs font-bold capitalize transition-all ${
                      durationFilter === mode
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode === 'all' ? 'All Modes' : mode}
                  </button>
                ))}
              </div>

              {entries.length > 0 && (
                <div>
                  {!showClearConfirm ? (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="px-2 py-1 rounded text-[11px] font-bold text-rose-400 hover:bg-rose-950/50 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Records
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-rose-400 font-bold text-[11px]">Purge all?</span>
                      <button
                        onClick={handleClearRecords}
                        className="px-2 py-0.5 rounded bg-red-600 text-slate-950 font-bold text-[11px]"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Leaderboard Table / Cards */}
            {entries.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Trophy className="w-12 h-12 mx-auto text-slate-700" />
                <p className="text-sm font-bold text-slate-400">No Historical Records Found</p>
                <p className="text-xs">
                  Complete an underworld run (Retirement, Survival, or Demise) to cement your name in the Hall of Fame.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {entries.map((entry, idx) => {
                  const medalColor =
                    idx === 0
                      ? 'text-amber-300 border-amber-500/80 bg-amber-950/20'
                      : idx === 1
                      ? 'text-slate-300 border-slate-400/80 bg-slate-800/40'
                      : idx === 2
                      ? 'text-amber-600 border-amber-700/80 bg-amber-950/10'
                      : 'text-slate-400 border-slate-800 bg-slate-950/60';

                  const outcome = entry?.outcome || 'retirement';
                  const outcomeBadge =
                    outcome === 'victory'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : outcome === 'retirement'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                      : outcome === 'killed'
                      ? 'bg-red-950 text-red-300 border-red-700'
                      : 'bg-rose-950 text-rose-300 border-rose-700';

                  const scoreVal = typeof entry?.score === 'number' ? entry.score : 0;
                  const netWorthVal = typeof entry?.netWorth === 'number' ? entry.netWorth : 0;
                  const dateStr = entry?.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'N/A';

                  return (
                    <div
                      key={entry?.id || `entry_${idx}`}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${medalColor}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-700 flex items-center justify-center font-black text-sm shrink-0">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-100 text-sm">{entry?.playerName || 'Kingpin'}</span>
                            <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded border bg-slate-900 text-amber-300 border-amber-700">
                              {entry?.scoreTitle || 'Operative'}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${outcomeBadge}`}>
                              {outcome}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-cyan-400 font-bold capitalize">
                              {entry?.isEndless ? '∞ Endless' : `${entry?.gameDurationMode || 'classic'} (${entry?.daysSurvived || 0}/${entry?.maxDays || 30}d)`}
                            </span>
                            <span>•</span>
                            <span>Rank: <strong className="text-slate-200">{entry?.finalRank || 'Wannabe'}</strong></span>
                            <span>•</span>
                            <span>Net Worth: <strong className="text-emerald-400">${netWorthVal.toLocaleString()}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                        <div className="text-right">
                          <div className="text-sm font-black text-amber-300 tracking-tight">
                            {scoreVal.toLocaleString()} <span className="text-[10px] text-amber-400/80 font-normal">PTS</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {dateStr}
                          </div>
                        </div>

                        <button
                          onClick={() => handleCopyDossier(entry)}
                          className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                            copiedId === entry?.id
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title="Copy Full Career Dossier to Clipboard"
                        >
                          {copiedId === entry?.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{copiedId === entry?.id ? 'Copied' : 'Share'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Achievements View */}
        {activeTab === 'achievements' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b border-slate-800">
              <span className="text-[11px] uppercase font-bold text-slate-500 mr-1">Category:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    categoryFilter === cat.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredAchievements.map((ach) => {
                const isUnlocked = unlockedSet.has(ach.id);

                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                      isUnlocked
                        ? 'bg-emerald-950/20 border-emerald-500/70 shadow-sm shadow-emerald-950/30'
                        : 'bg-slate-950/50 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isUnlocked
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      {isUnlocked ? (
                        ICON_MAP[ach.icon] ?? <Award className="w-5 h-5" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isUnlocked ? 'text-slate-100' : 'text-slate-400'
                          }`}
                        >
                          {ach.title}
                        </h4>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                            isUnlocked
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}
                        >
                          +{ach.prestigePoints} PTS
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {ach.description}
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-[10px]">
                        <span className="uppercase font-bold text-slate-500">
                          {ach.category}
                        </span>
                        {isUnlocked && (
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5 ml-auto">
                            <Sparkles className="w-3 h-3" /> Unlocked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Global Syndicate Registry</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
