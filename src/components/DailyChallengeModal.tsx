import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  Trophy,
  Calendar,
  ShieldAlert,
  Plane,
  FlaskConical,
  Briefcase,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
  Zap,
  Dices,
  Search,
  FileText,
  Clock,
  Compass,
  Star,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  BOUNTY_CHALLENGES,
  getTodayDailySeed,
  generateRandomSeed,
  getDailyChallengeRecords,
  clearDailyChallengeRecords,
  generateChallengeDossierText,
  verifyChallengeProofCode,
  DailyChallengeRecord,
} from '../engine/dailyChallenge';
import { GameDurationMode, DURATION_MODES } from '../engine/types';

interface DailyChallengeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = () => {
  const isOpen = useGameStore((s) => s.isDailyChallengeOpen);
  const onClose = useGameStore((s) => s.closeDailyChallenge);
  const activeTab = useGameStore((s) => s.dailyChallengeTab);
  const setActiveTab = useGameStore((s) => s.openDailyChallenge);
  const startChallengeRun = useGameStore((s) => s.startChallengeRun);
  const player = useGameStore((s) => s.player);

  // Local state for countdown clock
  const [dailyInfo, setDailyInfo] = useState(getTodayDailySeed());
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [copiedRecordId, setCopiedRecordId] = useState<string | null>(null);
  const [copiedProofId, setCopiedProofId] = useState<string | null>(null);

  // Custom Seed Lab State
  const [customSeedInput, setCustomSeedInput] = useState<string>(() => generateRandomSeed());
  const [selectedDurationMode, setSelectedDurationMode] = useState<GameDurationMode>('classic');
  const [customChallengePreset, setCustomChallengePreset] = useState<string>('daily_seed');

  // Proof Verifier Inspector State
  const [inspectorCodeInput, setInspectorCodeInput] = useState<string>('');
  const [inspectorResult, setInspectorResult] = useState<ReturnType<typeof verifyChallengeProofCode> | null>(null);

  // Refresh trigger for history
  const [historyTick, setHistoryTick] = useState<number>(0);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Live timer for UTC midnight countdown
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setDailyInfo(getTodayDailySeed());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const records = useMemo(() => {
    return getDailyChallengeRecords();
  }, [isOpen, historyTick]);

  const activeChallenge = useMemo(() => {
    if (!player.activeChallengeId) return null;
    return BOUNTY_CHALLENGES.find((c) => c.id === player.activeChallengeId) || null;
  }, [player.activeChallengeId]);

  if (!isOpen) return null;

  const handleCopySeed = (seedStr: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(seedStr).catch(() => {});
    }
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  const handleCopyProofCode = (record: DailyChallengeRecord) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(record.proofCode).catch(() => {});
    }
    setCopiedProofId(record.id);
    setTimeout(() => setCopiedProofId(null), 2000);
  };

  const handleCopyDossier = (record: DailyChallengeRecord) => {
    const text = generateChallengeDossierText(record);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedRecordId(record.id);
    setTimeout(() => setCopiedRecordId(null), 2500);
  };

  const handleVerifyInputCode = () => {
    if (!inspectorCodeInput.trim()) return;
    const result = verifyChallengeProofCode(inspectorCodeInput);
    setInspectorResult(result);
  };

  const handleClearHistory = () => {
    clearDailyChallengeRecords();
    setHistoryTick((t) => t + 1);
    setShowClearConfirm(false);
  };

  const getDifficultyStars = (difficulty: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i < difficulty ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
          />
        ))}
      </div>
    );
  };

  const getChallengeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calendar':
        return <Calendar className="w-5 h-5 text-amber-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-sky-400" />;
      case 'Plane':
        return <Plane className="w-5 h-5 text-cyan-400" />;
      case 'FlaskConical':
        return <FlaskConical className="w-5 h-5 text-emerald-400" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-rose-400" />;
      default:
        return <Trophy className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 font-mono">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95">
        {/* Top Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/40">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-amber-300 uppercase tracking-wider">
                  Cartel Smuggling Bounty Board
                </h2>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                  PHASE 5 ENGINE
                </span>
                {activeChallenge && (
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> ACTIVE RUN: {activeChallenge.badge} (DAY {player.currentDay})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic daily PRNG markets, unique cartel bounty modifiers & verified dossier signatures
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Today's Daily Seed</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-700 text-amber-300 font-mono">
                {dailyInfo.timeUntilNextUtcMidnightFormatted.split(' ')[0]}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('bounties')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bounties'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Bounty Board</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {BOUNTY_CHALLENGES.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>Custom Seed Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'records'
                  ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Dossiers & Verifier</span>
              {records.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/70 border border-purple-700 text-purple-300">
                  {records.length}
                </span>
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>UTC Reset in: <strong className="text-amber-300">{dailyInfo.timeUntilNextUtcMidnightFormatted}</strong></span>
          </div>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* ==================================================== */}
          {/* TAB 1: TODAY'S DAILY SEED                            */}
          {/* ==================================================== */}
          {activeTab === 'daily' && (
            <div className="space-y-5">
              {/* Daily Hero Banner */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-6 shadow-xl">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase font-black tracking-widest text-amber-400 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/80">
                        OFFICIAL SYNCHRONIZED SEED RUN
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Resets in {dailyInfo.timeUntilNextUtcMidnightFormatted}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-100 tracking-tight">
                      Global Daily Syndicate Sprint (30 Days)
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Every operative worldwide faces identical market pricing, shortage events, cartel turf wars, and police crackdowns today. Test your instincts and compete under exact standardized conditions.
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
                        <span className="text-slate-400">PRNG Seed:</span>
                        <code className="text-amber-300 font-bold">{dailyInfo.seed}</code>
                        <button
                          onClick={() => handleCopySeed(dailyInfo.seed)}
                          className="text-slate-400 hover:text-amber-300 transition-colors p-1"
                          title="Copy daily seed"
                        >
                          {copiedSeed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <span>Bounty Target:</span>
                        <strong className="text-emerald-400 font-bold">$10,000,000 Net Worth</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <button
                      onClick={() => {
                        startChallengeRun('daily_seed', dailyInfo.seed, 'classic');
                        onClose();
                      }}
                      className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-950/60 active:scale-95 transition-all cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>Deploy Daily Seed Run</span>
                    </button>

                    <span className="text-[11px] text-slate-400">
                      30-Day Classic Mode • Starts in New York ($1,000 Cash / $1,000 Debt)
                    </span>
                  </div>
                </div>
              </div>

              {/* Standardized Rules & Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                    <Compass className="w-4 h-4" />
                    <span>Deterministic Market</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Powered by 32-bit Mulberry32 PRNG. Commodity prices, inventory volumes, and price crashes follow an identical sequence across all devices worldwide.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Synchronized Events</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Cartel turf wars and inside wire informant tips occur on identical calendar days, creating standardized arbitrage windows.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                    <Trophy className="w-4 h-4" />
                    <span>Verified Proof Signatures</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upon retirement or day 30 conclusion, you receive a tamper-proof <code className="text-amber-300">DL2-DLY...</code> signature code to verify and share your final score.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: CARTEL BOUNTY BOARD (5 CHALLENGES)            */}
          {/* ==================================================== */}
          {activeTab === 'bounties' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Cartel syndicate high councils have issued special bounty contracts. Each challenge imposes unique tactical constraints, weapon bans, or regulatory handicaps with rewarding payouts.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BOUNTY_CHALLENGES.map((challenge) => {
                  const isActive = player.activeChallengeId === challenge.id;
                  const bestRecord = records.find((r) => r.challengeId === challenge.id);

                  return (
                    <div
                      key={challenge.id}
                      className={`bg-slate-950/80 border rounded-xl p-5 flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                        isActive
                          ? 'border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                              {getChallengeIcon(challenge.iconName)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                                  {challenge.title}
                                </h4>
                                {isActive && (
                                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse">
                                    ACTIVE
                                  </span>
                                )}
                                {bestRecord && (
                                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
                                    Best: ${bestRecord.finalScore.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <span className="font-bold text-amber-400">{challenge.badge}</span>
                                <span>•</span>
                                <span>{challenge.durationMode === 'classic' ? '30 Days' : '90 Days'}</span>
                                <span>•</span>
                                {getDifficultyStars(challenge.difficulty)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 font-semibold italic">
                          "{challenge.tagline}"
                        </p>

                        <p className="text-xs text-slate-400 leading-relaxed">
                          {challenge.description}
                        </p>

                        {/* Perks & Handicaps Chips */}
                        <div className="space-y-2 pt-1">
                          <div className="space-y-1">
                            {challenge.perks.map((perk, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-400">
                                <span className="text-emerald-500 font-black shrink-0">+</span>
                                <span>{perk}</span>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-1">
                            {challenge.handicaps.map((handicap, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11px] text-rose-400">
                                <span className="text-rose-500 font-black shrink-0">-</span>
                                <span>{handicap}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer & Action */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                        <div className="text-xs">
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Payout</span>
                          <span className="text-amber-300 font-bold">
                            ${challenge.targetScore.toLocaleString()} Score
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            startChallengeRun(challenge.id);
                            onClose();
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                            isActive
                              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                              : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-amber-400'
                          }`}
                        >
                          <span>{isActive ? 'Restart Challenge' : 'Accept Bounty'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: CUSTOM SEED LAB                               */}
          {/* ==================================================== */}
          {activeTab === 'custom' && (
            <div className="space-y-5">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wide flex items-center gap-2">
                    <Dices className="w-4 h-4 text-emerald-400" /> Custom Seed Generator & Rule Weaver
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Input any arbitrary text string or hash phrase to forge a deterministic market universe. Share the seed with friends to run head-to-head simulations.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Seed Input & Random Button */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Deterministic PRNG Seed String
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customSeedInput}
                        onChange={(e) => setCustomSeedInput(e.target.value)}
                        placeholder="e.g. EL_CHAPO_2026, MIAMI_VICE_84, CARTEL_999"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-amber-300 font-bold text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      <button
                        onClick={() => setCustomSeedInput(generateRandomSeed())}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Roll random narco seed"
                      >
                        <Dices className="w-4 h-4 text-emerald-400" />
                        <span>Roll Seed</span>
                      </button>
                    </div>
                  </div>

                  {/* Challenge Rule Preset */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Bounty Modifier Preset
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {BOUNTY_CHALLENGES.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCustomChallengePreset(c.id)}
                          className={`p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                            customChallengePreset === c.id
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="truncate">{c.badge}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration Mode Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Simulation Duration Mode
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {DURATION_MODES.map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setSelectedDurationMode(mode.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedDurationMode === mode.id
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-200">{mode.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{mode.badge}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Launch Custom Seed Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        startChallengeRun(customChallengePreset, customSeedInput, selectedDurationMode);
                        onClose();
                      }}
                      disabled={!customSeedInput.trim()}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>Launch Seeded Run: [{customSeedInput.trim()}]</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: VERIFIED DOSSIERS & PROOF INSPECTOR           */}
          {/* ==================================================== */}
          {activeTab === 'records' && (
            <div className="space-y-6">
              {/* Proof Code Inspector Tool */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wide flex items-center gap-2">
                    <Search className="w-4 h-4 text-purple-400" /> Cryptographic Proof Inspector & Verifier
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Paste any authentic <code className="text-amber-300">DL2-...</code> proof code to verify its authenticity, inspect the decoded score, and confirm zero memory modifications.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inspectorCodeInput}
                    onChange={(e) => setInspectorCodeInput(e.target.value)}
                    placeholder="DL2-PAC-1E-00A1F30C-9C4B7E11"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-purple-500 uppercase"
                  />
                  <button
                    onClick={handleVerifyInputCode}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Verify Code
                  </button>
                </div>

                {/* Verification Result Banner */}
                {inspectorResult && (
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                      inspectorResult.valid
                        ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-500/80 text-rose-200'
                    }`}
                  >
                    <div className="p-1 rounded-lg shrink-0">
                      {inspectorResult.valid ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-black uppercase tracking-wider">
                        {inspectorResult.valid ? '✅ VERIFIED AUTHENTIC UNDERWORLD DOSSIER' : '❌ INVALID OR TAMPERED PROOF CODE'}
                      </div>
                      {inspectorResult.valid ? (
                        <div className="text-xs space-y-0.5 text-slate-300">
                          <div>Challenge: <strong className="text-amber-300">{inspectorResult.challengeTitle}</strong></div>
                          <div>Verified Score: <strong className="text-emerald-300">${inspectorResult.score?.toLocaleString()} PTS</strong></div>
                          <div>Days Active: <strong className="text-slate-200">{inspectorResult.days} Days</strong></div>
                          <div className="text-[10px] text-emerald-400 font-bold mt-1">Cryptographic checksum verified against 2026 cartel salt hash.</div>
                        </div>
                      ) : (
                        <div className="text-xs text-rose-300">
                          {inspectorResult.error || 'Code syntax failed checksum verification.'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Saved Challenge Dossiers History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Completed Bounty Dossiers ({records.length})</span>
                  </h4>

                  {records.length > 0 && (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      Clear History
                    </button>
                  )}
                </div>

                {showClearConfirm && (
                  <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <span className="text-rose-200">Delete all saved bounty records?</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleClearHistory}
                        className="px-2 py-1 rounded bg-rose-600 text-white font-bold"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}

                {records.length === 0 ? (
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-8 text-center space-y-2">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                    <div className="text-xs font-bold text-slate-400">No Bounty Dossiers Recorded Yet</div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Complete a daily seed run or accept a challenge from the Bounty Board. Finished runs automatically generate verified dossier records.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {records.map((record) => (
                      <div
                        key={record.id}
                        className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-100 uppercase">
                              {record.challengeTitle}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {record.date}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                              Seed: [{record.seed}]
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-3">
                            <span>Score: <strong className="text-emerald-400">${record.finalScore.toLocaleString()}</strong></span>
                            <span>•</span>
                            <span>Rank: <strong className="text-amber-300">{record.finalRank}</strong></span>
                            <span>•</span>
                            <span>Day {record.daysSurvived}/{record.maxDays}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyProofCode(record)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Copy Proof Code"
                          >
                            {copiedProofId === record.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">Proof Code</span>
                          </button>

                          <button
                            onClick={() => handleCopyDossier(record)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Copy Full ASCII Dossier to Clipboard"
                          >
                            {copiedRecordId === record.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                            <span>Share Dossier</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Underworld PRNG Engine: Active & Seeded</span>
          </div>
          <div>
            <span>Deterministic Cross-Platform Synchronization</span>
          </div>
        </div>
      </div>
    </div>
  );
};
