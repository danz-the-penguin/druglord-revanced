import { PlayerState, GameDurationMode } from './types';
import { getTotalWealth } from './game';
import { RANK_MAP } from './constants';

export interface ScoreBreakdown {
  totalScore: number;
  netWorthPoints: number;
  propertiesBonus: number;
  combatBonus: number;
  debtPenalty: number;
  achievementsBonus: number;
  survivalBonus: number;
  scoreTitle: string;
  isKilledPenalty: boolean;
}

export interface HallOfFameEntry {
  id: string;
  playerName: string;
  timestamp: number;
  gameDurationMode: GameDurationMode;
  daysSurvived: number;
  maxDays: number;
  isEndless: boolean;
  finalRank: string;
  netWorth: number;
  cash: number;
  bank: number;
  debt: number;
  propertiesCount: number;
  combatWins: number;
  score: number;
  scoreTitle: string;
  outcome: 'victory' | 'retirement' | 'killed' | 'bankrupt';
  achievementsCount: number;
}

const STORAGE_KEY_HALL_OF_FAME = 'druglord2_hall_of_fame';

export function getScoreTitle(score: number): string {
  if (score >= 10_000_000) return 'Syndicate Overlord';
  if (score >= 5_000_000) return 'Cartel Kingpin';
  if (score >= 2_000_000) return 'Underworld Baron';
  if (score >= 1_000_000) return 'High Roller Smuggler';
  if (score >= 500_000) return 'Wholesale Boss';
  if (score >= 200_000) return 'Street Lieutenant';
  if (score >= 50_000) return 'Corner Hustler';
  return 'Petty Peddler';
}

/**
 * Calculate comprehensive Underworld Kingpin Prestige Score
 */
export function calculateKingpinScore(player: PlayerState): ScoreBreakdown {
  const netWorth = getTotalWealth(player);
  const propertiesCount = player.ownedProperties?.length ?? 0;
  const combatWins = player.stats?.combatWins ?? 0;
  const achievementsCount = player.unlockedAchievements?.length ?? 0;
  const daysSurvived = player.currentDay;

  const netWorthPoints = Math.max(0, netWorth);
  const propertiesBonus = propertiesCount * 250_000;
  const combatBonus = combatWins * 50_000;
  const debtPenalty = player.debt * 2;
  const achievementsBonus = achievementsCount * 100_000;
  const survivalBonus = daysSurvived * 10_000;

  let rawScore = netWorthPoints + propertiesBonus + combatBonus - debtPenalty + achievementsBonus + survivalBonus;
  rawScore = Math.max(0, rawScore);

  const isKilled = player.health <= 0 || (player.gameOverReason?.toLowerCase().includes('killed') ?? false);
  const isKilledPenalty = isKilled;
  const totalScore = isKilled ? Math.floor(rawScore * 0.5) : rawScore;

  return {
    totalScore,
    netWorthPoints,
    propertiesBonus,
    combatBonus,
    debtPenalty,
    achievementsBonus,
    survivalBonus,
    scoreTitle: getScoreTitle(totalScore),
    isKilledPenalty,
  };
}

/**
 * Fetch historical Hall of Fame leaderboards from localStorage
 */
export function getHallOfFameEntries(filterMode?: GameDurationMode | 'all'): HallOfFameEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HALL_OF_FAME);
    if (!raw) return [];
    const list: HallOfFameEntry[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    let filtered = list;
    if (filterMode && filterMode !== 'all') {
      filtered = list.filter((e) => e.gameDurationMode === filterMode);
    }
    return filtered.sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

/**
 * Add a completed run to the Hall of Fame
 */
export function recordHallOfFameEntry(
  player: PlayerState,
  playerName: string = 'Anonymous Kingpin'
): HallOfFameEntry {
  const breakdown = calculateKingpinScore(player);
  const rank = RANK_MAP.get(player.currentRankId)?.name ?? player.currentRankId;

  const isRetirement = player.gameOverReason?.toLowerCase().includes('retirement') ?? false;
  const isKilled = player.health <= 0 || (player.gameOverReason?.toLowerCase().includes('killed') ?? false);
  const isBankrupt = !isKilled && !isRetirement && getTotalWealth(player) <= 0;

  let outcome: 'victory' | 'retirement' | 'killed' | 'bankrupt' = 'victory';
  if (isRetirement) outcome = 'retirement';
  else if (isKilled) outcome = 'killed';
  else if (isBankrupt) outcome = 'bankrupt';

  const entry: HallOfFameEntry = {
    id: `hof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    playerName: playerName.trim() || 'Anonymous Kingpin',
    timestamp: Date.now(),
    gameDurationMode: player.gameDurationMode || 'classic',
    daysSurvived: player.currentDay,
    maxDays: player.maxDays,
    isEndless: !!player.isEndless,
    finalRank: rank,
    netWorth: getTotalWealth(player),
    cash: player.cash,
    bank: player.bank,
    debt: player.debt,
    propertiesCount: player.ownedProperties?.length ?? 0,
    combatWins: player.stats?.combatWins ?? 0,
    score: breakdown.totalScore,
    scoreTitle: breakdown.scoreTitle,
    outcome,
    achievementsCount: player.unlockedAchievements?.length ?? 0,
  };

  if (typeof localStorage !== 'undefined') {
    try {
      const current = getHallOfFameEntries('all');
      current.push(entry);
      // Keep top 50 runs sorted by score
      const sorted = current.sort((a, b) => b.score - a.score).slice(0, 50);
      localStorage.setItem(STORAGE_KEY_HALL_OF_FAME, JSON.stringify(sorted));
    } catch {
      // Sandbox storage restricted
    }
  }

  return entry;
}

/**
 * Clear the entire Hall of Fame
 */
export function clearHallOfFame(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_HALL_OF_FAME);
  } catch {}
}

/**
 * Format shareable Syndicate Dossier report for clipboard
 */
export function generateShareableDossierText(entry: HallOfFameEntry): string {
  const dateStr = new Date(entry.timestamp).toLocaleDateString();
  return `═══════════════════════════════════════════════════════
 DRUG LORD: REVANCED — CAREER DOSSIER
═══════════════════════════════════════════════════════
 Operative:         ${entry.playerName}
 Title:             ${entry.scoreTitle}
 Prestige Score:    ${entry.score.toLocaleString()} PTS
 Outcome:           ${entry.outcome.toUpperCase()}

 Duration Mode:     ${entry.isEndless ? '∞ Endless Sandbox' : `${entry.gameDurationMode.toUpperCase()} (${entry.maxDays} Days)`}
 Days Active:       ${entry.daysSurvived} Days
 Final Rank:        ${entry.finalRank}

 Net Worth:         $${entry.netWorth.toLocaleString()}
 Liquid Cash:       $${entry.cash.toLocaleString()}
 Offshore Bank:     $${entry.bank.toLocaleString()}
 Outstanding Debt:  $${entry.debt.toLocaleString()}
 Safehouses Owned:  ${entry.propertiesCount} / 6
 Combat Firefights: ${entry.combatWins} Won
 Achievements:      ${entry.achievementsCount} Unlocked
 Date Concluded:    ${dateStr}
═══════════════════════════════════════════════════════`;
}
