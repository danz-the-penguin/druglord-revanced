import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  ShieldAlert,
  Shield,
  Crosshair,
  DollarSign,
  Flag,
  Footprints,
  AlertOctagon,
  Trophy,
  Palmtree,
  Award,
  Sparkles,
  CheckCircle2,
  Crown,
  Share2,
  Check,
} from 'lucide-react';
import { getTotalWealth } from '../engine/game';
import { RANK_MAP } from '../engine/constants';
import { DURATION_MODES, GameDurationMode } from '../engine/types';
import { soundEngine } from '../utils/audio';
import { calculateKingpinScore, generateShareableDossierText } from '../engine/hallOfFame';

export const CombatModal: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const resolveEncounterAction = useGameStore((s) => s.resolveEncounterAction);
  const restartGame = useGameStore((s) => s.restartGame);

  const submitRunToHallOfFame = useGameStore((s) => s.submitRunToHallOfFame);
  const openHallOfFame = useGameStore((s) => s.openHallOfFame);
  const resolveTacticalCombatAction = useGameStore((s) => s.resolveTacticalCombatAction);
  const combatLogs = useGameStore((s) => s.combatLogs);
  const tacticalCombatRound = useGameStore((s) => s.tacticalCombatRound);
  const combatCoverActive = useGameStore((s) => s.combatCoverActive);
  const enemyBlindedRounds = useGameStore((s) => s.enemyBlindedRounds);

  const [combatMode, setCombatMode] = useState<'tactical' | 'quick'>('tactical');
  const [selectedNextMode, setSelectedNextMode] = useState<GameDurationMode>(
    player.gameDurationMode || 'classic'
  );
  const [alias, setAlias] = useState('Kingpin');
  const [submittedEntry, setSubmittedEntry] = useState<any>(null);
  const [copiedDossier, setCopiedDossier] = useState(false);

  const encounter = player.activeEncounter;

  const playAttackSound = () => {
    const weapons = player.weapons || {};
    if ((weapons['rocket_launcher'] ?? 0) > 0 || (weapons['dynamite'] ?? 0) > 0 || (weapons['hand_grenade'] ?? 0) > 0) {
      soundEngine.play('bomb');
    } else if ((weapons['barrett_m82'] ?? 0) > 0 || (weapons['desert_eagle'] ?? 0) > 0 || (weapons['shotgun'] ?? 0) > 0) {
      soundEngine.play('heavy_shot');
    } else {
      soundEngine.play('gunshot');
    }
  };

  const handleTacticalAction = (action: Parameters<typeof resolveTacticalCombatAction>[0]) => {
    if (action === 'snap_fire' || action === 'aim_fire') {
      playAttackSound();
    } else if (action === 'suppress') {
      soundEngine.play('heavy_shot');
    } else if (action === 'use_flashbang') {
      soundEngine.play('bomb');
    } else if (action === 'use_smoke') {
      soundEngine.play('flee');
    } else if (action === 'use_medkit') {
      soundEngine.play('heal');
    } else if (action === 'bribe') {
      soundEngine.play('bribe');
    } else if (action === 'flee') {
      soundEngine.play('flee');
    } else if (action === 'take_cover') {
      soundEngine.play('click');
    }
    resolveTacticalCombatAction(action);
  };

  const handleQuickFight = () => {
    playAttackSound();
    resolveEncounterAction('fight');
  };

  const handleQuickFlee = () => {
    soundEngine.play('flee');
    resolveEncounterAction('flee');
  };

  const handleQuickBribe = () => {
    soundEngine.play('bribe');
    resolveEncounterAction('bribe');
  };

  // Play audio on hostile encounter trigger
  useEffect(() => {
    if (encounter) {
      soundEngine.play('police');
    }
  }, [encounter?.enemyName, encounter?.danger]);

  // Play victory or defeat on game conclusion
  useEffect(() => {
    if (player.isGameOver) {
      const netWorth = getTotalWealth(player);
      const isRetirement = player.gameOverReason?.toLowerCase().includes('retirement');
      const isTimeLimit = player.gameOverReason?.toLowerCase().includes('time limit');
      const isVictory = isRetirement || (isTimeLimit && netWorth > 0);
      soundEngine.play(isVictory ? 'victory' : 'defeat');
    }
  }, [player.isGameOver]);

  if (player.isGameOver) {
    const netWorth = getTotalWealth(player);
    const isRetirement = player.gameOverReason?.toLowerCase().includes('retirement');
    const isTimeLimit = player.gameOverReason?.toLowerCase().includes('time limit');
    const isVictory = isRetirement || (isTimeLimit && netWorth > 0);
    const currentRank = RANK_MAP.get(player.currentRankId);
    const scoreBreakdown = calculateKingpinScore(player);

    const handleSubmitHallOfFame = (e: React.FormEvent) => {
      e.preventDefault();
      if (!submittedEntry) {
        const entry = submitRunToHallOfFame(alias);
        setSubmittedEntry(entry);
      }
    };

    const handleCopyDossier = () => {
      if (submittedEntry) {
        const text = generateShareableDossierText(submittedEntry);
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        setCopiedDossier(true);
        setTimeout(() => setCopiedDossier(false), 2500);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 font-mono overflow-y-auto">
        <div
          className={`border-2 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8 animate-in zoom-in-95 ${
            isVictory
              ? 'bg-slate-900 border-amber-500/80 shadow-amber-950/50 text-center'
              : 'bg-slate-900 border-red-600/80 shadow-red-950/50 text-center'
          }`}
        >
          {isVictory ? (
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-400">
                {isRetirement ? <Palmtree className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
              </div>
              <h2 className="text-2xl font-black text-amber-400 uppercase tracking-wider mt-3">
                {isRetirement ? 'UNDERWORLD RETIREMENT' : 'SYNDICATE VICTORY'}
              </h2>
              <div className="text-[11px] font-bold text-emerald-400 tracking-widest uppercase">
                // FINAL EMPIRE DOSSIER //
              </div>
            </div>
          ) : (
            <div>
              <AlertOctagon className="w-14 h-14 text-red-500 mx-auto animate-bounce" />
              <h2 className="text-2xl font-black text-red-500 uppercase tracking-wider mt-2">
                GAME OVER
              </h2>
            </div>
          )}

          {/* Prestige Score Hero Banner */}
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/50 shadow-inner space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80">
              Final Kingpin Prestige Score
            </div>
            <div className="text-3xl font-black text-amber-300 tracking-tight">
              {scoreBreakdown.totalScore.toLocaleString()}{' '}
              <span className="text-xs text-amber-400/80 font-normal">PTS</span>
            </div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Title: {scoreBreakdown.scoreTitle}
            </div>
            {scoreBreakdown.isKilledPenalty && (
              <div className="text-[10px] text-red-400 font-bold">
                ⚠️ 50% Score Reduction Applied (Killed in Action)
              </div>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed px-2">
            {player.gameOverReason ?? 'Your career in the underworld has concluded.'}
          </p>

          {/* Dossier Financial & Score Breakdown Card */}
          <div className="bg-slate-950/85 p-4 rounded-xl border border-slate-800 text-left space-y-1.5 text-xs">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/80">
              <span className="text-slate-500">Duration Mode:</span>
              <span className="text-cyan-400 font-bold capitalize">
                {player.isEndless ? '∞ Endless Sandbox' : `${player.gameDurationMode || 'Classic'} (${player.maxDays} Days)`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Days Active:</span>
              <span className="text-slate-200 font-bold">{player.currentDay} days (+${(scoreBreakdown.survivalBonus).toLocaleString()})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Final Rank:</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {currentRank?.name ?? player.currentRankId}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Total Net Worth:</span>
              <span className="text-emerald-400 font-bold">${netWorth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Real Estate Estates:</span>
              <span className="text-indigo-400 font-bold">
                {player.ownedProperties?.length ?? 0} Properties (+${(scoreBreakdown.propertiesBonus).toLocaleString()})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Combat Victories:</span>
              <span className="text-rose-400 font-bold">
                {player.stats?.combatWins ?? 0} Won (+${(scoreBreakdown.combatBonus).toLocaleString()})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Achievements:</span>
              <span className="text-amber-300 font-bold">
                {player.unlockedAchievements?.length ?? 0} Unlocked (+${(scoreBreakdown.achievementsBonus).toLocaleString()})
              </span>
            </div>
            {player.debt > 0 && (
              <div className="flex justify-between items-center text-rose-400">
                <span>Unpaid Shark Debt:</span>
                <span className="font-bold">-${player.debt.toLocaleString()} (-${(scoreBreakdown.debtPenalty).toLocaleString()} Penalty)</span>
              </div>
            )}
          </div>

          {/* Hall of Fame Submission Form */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-amber-500/30 text-left space-y-2">
            {!submittedEntry ? (
              <form onSubmit={handleSubmitHallOfFame} className="space-y-2">
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Submit Run to Local Hall of Fame:</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Operative Alias (e.g. Kingpin)"
                    maxLength={25}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
                  >
                    Submit Score
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Recorded in Hall of Fame!
                  </span>
                  <button
                    onClick={() => openHallOfFame('leaderboard')}
                    className="text-amber-400 hover:text-amber-300 font-bold underline text-[11px]"
                  >
                    View Leaderboard
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDossier}
                  className={`w-full py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    copiedDossier
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {copiedDossier ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedDossier ? 'Copied Career Dossier to Clipboard!' : 'Copy Shareable Dossier'}</span>
                </button>
              </div>
            )}
          </div>

          {/* New Run Mode Picker */}
          <div className="text-left space-y-2 pt-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Select Next Operation Lifespan:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedNextMode(mode.id)}
                  type="button"
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedNextMode === mode.id
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{mode.badge}</span>
                    {selectedNextMode === mode.id && <Sparkles className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{mode.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Restart Button */}
          <button
            onClick={() => restartGame(selectedNextMode)}
            className={`w-full py-3.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all shadow-lg active:scale-95 ${
              isVictory
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/50'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/50'
            }`}
          >
            Launch New Syndicate ({DURATION_MODES.find((m) => m.id === selectedNextMode)?.badge})
          </button>
        </div>
      </div>
    );
  }

  if (!encounter) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border-2 border-amber-600/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-5 py-3.5 bg-amber-950/40 border-b border-amber-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-amber-400 animate-pulse" />
              <div>
                <h3 className="font-black text-amber-300 uppercase tracking-wider text-sm">
                  Hostile Encounter!
                </h3>
                <p className="text-xs text-amber-400/80">
                  {encounter.count}x {encounter.enemyName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded bg-slate-950 border border-slate-800 p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setCombatMode('tactical')}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    combatMode === 'tactical' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Tactical Duel
                </button>
                <button
                  type="button"
                  onClick={() => setCombatMode('quick')}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    combatMode === 'quick' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Quick
                </button>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700 text-amber-200 text-[10px] font-bold uppercase">
                Danger {encounter.danger}/10
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3.5 text-xs overflow-y-auto">
            {/* Status Bars */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Player Vitals:</span>
                <div className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold font-mono">{player.health}% HP</span>
                  {player.armor && (
                    <span className="text-sky-400 text-[10px] font-mono">
                      Armor: {player.armor.durability} DEF
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Hostiles:</span>
                <span className="text-amber-400 font-bold font-mono">{encounter.count}x {encounter.enemyName}</span>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                {combatCoverActive && (
                  <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-500/60 text-sky-300 font-bold">
                    🛡️ IN COVER (-50% DMG)
                  </span>
                )}
                {enemyBlindedRounds > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500/60 text-amber-300 font-bold animate-pulse">
                    🕶️ ENEMY BLINDED ({enemyBlindedRounds}R)
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  Round {tacticalCombatRound}
                </span>
              </div>
            </div>

            {/* Combat Feed */}
            {combatLogs && combatLogs.length > 0 && (
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1 font-mono text-[10px] max-h-24 overflow-y-auto">
                {combatLogs.map((log, i) => (
                  <div key={i} className="text-slate-300 leading-tight">
                    {log}
                  </div>
                ))}
              </div>
            )}

            {combatMode === 'tactical' ? (
              <div className="space-y-3">
                {/* Firearm Attacks */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Firearm Volleys:
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTacticalAction('snap_fire')}
                      className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold text-xs flex flex-col items-center gap-0.5 transition-all shadow cursor-pointer"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Snap Fire</span>
                      <span className="text-[9px] font-normal opacity-80">70% Acc</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTacticalAction('aim_fire')}
                      className="p-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex flex-col items-center gap-0.5 transition-all shadow cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Careful Aim</span>
                      <span className="text-[9px] font-normal opacity-80">90% Acc</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTacticalAction('suppress')}
                      className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold text-xs flex flex-col items-center gap-0.5 transition-all shadow cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Suppress</span>
                      <span className="text-[9px] font-normal opacity-80">Full Auto</span>
                    </button>
                  </div>
                </div>

                {/* Tactical Maneuvers & Consumables */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tactical Maneuvers & Consumables:
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTacticalAction('take_cover')}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex flex-col items-center gap-0.5 transition-all border border-slate-700 cursor-pointer"
                    >
                      <span>🛡️ Cover</span>
                      <span className="text-[9px] text-slate-400">-50% Dmg</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTacticalAction('use_flashbang')}
                      disabled={(player.combatConsumables?.flashbangs ?? 0) <= 0}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 font-bold text-[11px] flex flex-col items-center gap-0.5 transition-all border border-slate-700 cursor-pointer"
                    >
                      <span>💥 Stun</span>
                      <span className="text-[9px] text-slate-400">{player.combatConsumables?.flashbangs ?? 0} Left</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTacticalAction('use_smoke')}
                      disabled={(player.combatConsumables?.smokeGrenades ?? 0) <= 0}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold text-[11px] flex flex-col items-center gap-0.5 transition-all border border-slate-700 cursor-pointer"
                    >
                      <span>💨 Smoke</span>
                      <span className="text-[9px] text-slate-400">{player.combatConsumables?.smokeGrenades ?? 0} Left</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTacticalAction('use_medkit')}
                      disabled={(player.combatConsumables?.medkits ?? 0) <= 0 || player.health >= 100}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-300 font-bold text-[11px] flex flex-col items-center gap-0.5 transition-all border border-slate-700 cursor-pointer"
                    >
                      <span>💉 Medkit</span>
                      <span className="text-[9px] text-slate-400">{player.combatConsumables?.medkits ?? 0} Left</span>
                    </button>
                  </div>
                </div>

                {/* Negotiation & Retreat */}
                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleTacticalAction('flee')}
                    disabled={!encounter.canFlee}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 font-bold text-xs border border-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    <span>Escape</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTacticalAction('bribe')}
                    disabled={!encounter.canBribe || player.cash < encounter.bribeCost}
                    className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 disabled:opacity-40 text-emerald-300 font-bold text-xs border border-emerald-800/60 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Bribe (${encounter.bribeCost.toLocaleString()})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTacticalAction('surrender')}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-xs border border-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Surrender</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Quick Resolution */
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleQuickFight}
                  className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold flex flex-col items-center justify-center gap-1 transition-colors shadow-md cursor-pointer"
                >
                  <Crosshair className="w-5 h-5" />
                  <span>Fight Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickFlee}
                  disabled={!encounter.canFlee}
                  className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 font-bold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Footprints className="w-5 h-5" />
                  <span>Attempt Escape</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickBribe}
                  disabled={!encounter.canBribe || player.cash < encounter.bribeCost}
                  className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Bribe (${encounter.bribeCost.toLocaleString()})</span>
                </button>

                <button
                  type="button"
                  onClick={() => resolveEncounterAction('surrender')}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 transition-colors"
                >
                  <Flag className="w-5 h-5" />
                  <span>Surrender (Drop All)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

