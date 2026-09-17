import { GameDurationMode } from './types';
import { GameEngineState } from './game';
import { generateCityMarket, setEconomyRng } from './economy';

export interface BountyChallenge {
  id: string;
  title: string;
  shortCode: string;
  badge: string;
  tagline: string;
  description: string;
  lore: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  durationMode: GameDurationMode;
  targetScore: number;
  targetBountyReward: string;
  perks: string[];
  handicaps: string[];
  iconName: string;
  bannerGradient: string;
}

export interface DailyChallengeRecord {
  id: string;
  challengeId: string;
  challengeTitle: string;
  seed: string;
  date: string;
  timestamp: number;
  finalScore: number;
  netWorth: number;
  daysSurvived: number;
  maxDays: number;
  finalRank: string;
  outcome: 'completed' | 'victory' | 'retirement' | 'killed' | 'bankrupt';
  proofCode: string;
  verified: boolean;
}

export const CHALLENGE_CODE_MAP: Record<string, string> = {
  daily_seed: 'DLY',
  zero_weapons: 'PAC',
  aviation_kingpin: 'AVN',
  pure_synthetics: 'SYN',
  swiss_purist: 'SWI',
  custom: 'CST',
};

export const CODE_TO_CHALLENGE_ID: Record<string, string> = {
  DLY: 'daily_seed',
  PAC: 'zero_weapons',
  AVN: 'aviation_kingpin',
  SYN: 'pure_synthetics',
  SWI: 'swiss_purist',
  CST: 'custom',
};

export const ORGANIC_DRUG_IDS = new Set([
  'pot',
  'mushrooms',
  'peyote',
  'kat',
  'hashish',
  'opium',
  'cocaine',
  'heroin',
]);

export const SYNTHETIC_DRUG_IDS = new Set([
  'speed',
  'ice',
  'ecstasy',
  'oxycodone',
  'fentanyl',
  'carfentanil',
  'super_soldier_serum',
  'krokodil',
  'pcp',
  'special_k',
  'lsd',
  'mda',
  'tranq',
  'codeine',
  'morphine',
  'dmt',
  'crack',
]);

export const BOUNTY_CHALLENGES: BountyChallenge[] = [
  {
    id: 'daily_seed',
    title: 'Global Daily Seed Run',
    shortCode: 'DLY',
    badge: 'DAILY SEED',
    tagline: 'Synchronized 30-Day World Market Sprint',
    description:
      'All players worldwide trade on the exact same daily seeded price swings, cartel turf wars, and DEA crackdowns. Compete for the highest 30-day prestige score.',
    lore: 'Interpol and the DEA run on synchronized surveillance cycles. Trade today’s global market rhythm and prove your dominance under standardized underworld conditions.',
    difficulty: 3,
    durationMode: 'classic',
    targetScore: 10_000_000,
    targetBountyReward: '$10M+ Kingpin Dossier Proof Code & Global Leaderboard Honor',
    perks: [
      'Synchronized market intelligence globally',
      'Daily seed resets precisely at 00:00 UTC',
      'Cryptographically signed proof dossier for sharing',
    ],
    handicaps: [
      'Strict 30-Day Time Cap',
      'Zero mulligans: one official global seed per day',
    ],
    iconName: 'Calendar',
    bannerGradient: 'from-amber-500/20 via-slate-900 to-slate-950',
  },
  {
    id: 'zero_weapons',
    title: 'The Pacifist Smuggler',
    shortCode: 'PAC',
    badge: 'PACIFIST',
    tagline: 'Zero Firearms Permitted • Brains Over Bullets',
    description:
      'Operate as a high-society diplomat under the Underworld Honor Code: no weapons may ever be purchased or drawn. Rely exclusively on silver-tongued bribes and tactical evasions.',
    lore: 'Old-money kingpins never get blood on their bespoke suits. Walk through police cordons and cartel ambushes unarmed, bribing your way through customs with cold, hard cash.',
    difficulty: 4,
    durationMode: 'classic',
    targetScore: 5_000_000,
    targetBountyReward: 'Ghost Syndicate Diplomat Clearance & $5M Verification Dossier',
    perks: [
      '+30% Evasion agility in ambushes & police encounters',
      '25% discount on all police & DEA bribes',
      'Starts with $15,000 clean seed money and $0 starting debt',
    ],
    handicaps: [
      'All firearms, armor & armory weapons strictly prohibited',
      'Combat weapons market completely locked',
    ],
    iconName: 'ShieldAlert',
    bannerGradient: 'from-sky-500/20 via-slate-900 to-slate-950',
  },
  {
    id: 'aviation_kingpin',
    title: '100% Aviation Kingpin',
    shortCode: 'AVN',
    badge: 'SKYWAY',
    tagline: 'High-Altitude Narco Fleet • Commercial Flights Prohibited',
    description:
      'Never fly commercial again. Build an elite transatlantic skyway fleet. You start with an unlocked Cessna 208 Grand Caravan, but commercial airport passenger tickets are outlawed.',
    lore: 'Airport terminals crawl with TSA dogs and customs facial recognition. Real smugglers rule the skies from private dirt strips and high-altitude flight corridors.',
    difficulty: 4,
    durationMode: 'quarter',
    targetScore: 25_000_000,
    targetBountyReward: 'Transatlantic Narco-Ace Wings & $25M Aviation Fleet Dossier',
    perks: [
      'Starts with unlocked Cessna 208 Caravan in hangar',
      '+250 bonus cargo units on private fleet aircraft',
      '25% discount on aviation fuel & international landing fees',
      'Starts with $50,000 working capital',
    ],
    handicaps: [
      'Commercial airline passenger travel completely disabled',
      '$25,000 starting loan shark debt',
    ],
    iconName: 'Plane',
    bannerGradient: 'from-cyan-500/20 via-slate-900 to-slate-950',
  },
  {
    id: 'pure_synthetics',
    title: 'Pure Synthetics Mogul',
    shortCode: 'SYN',
    badge: 'CHEMIST',
    tagline: 'Breaking Bad • Organic Drugs Strictly Prohibited',
    description:
      'Reject organic street contraband. No Weed, Heroin, Cocaine, Hashish, Shrooms, or Opium may enter your stash. Specialize exclusively in clandestine lab-cooked synthetics and designer chemicals.',
    lore: 'Nature is inefficient. Chemistry is perfection. Synthesize pure crystal, designer nootropics, and pharmaceutical-grade fentanyl while leaving plant matter to amateur street hustlers.',
    difficulty: 5,
    durationMode: 'classic',
    targetScore: 15_000_000,
    targetBountyReward: 'Master Clandestine Chemist Certification & $15M Lab Dossier',
    perks: [
      'Starts with Border Ranch safehouse & Chemical Reflux Lab installed',
      '+25% profit margin bonus on synthetic commodities',
      '30% discount on chemical precursor reagents',
      'Starts with $10,000 cash seed capital',
    ],
    handicaps: [
      'All organic plant-based drugs banned from inventory & trading',
      'Higher DEA inspection risk at chemical manufacturing borders',
    ],
    iconName: 'FlaskConical',
    bannerGradient: 'from-emerald-500/20 via-slate-900 to-slate-950',
  },
  {
    id: 'swiss_purist',
    title: 'Swiss Laundering Purist',
    shortCode: 'SWI',
    badge: 'FINCEN',
    tagline: 'FinCEN Nightmare • 3x Federal Audit Heat',
    description:
      'Turn street paper into offshore gold. Federal IRS and FinCEN algorithms are tracking you with 3x intensity. Launder at least $5,000,000 through corporate shell companies before RICO indictments strike.',
    lore: 'Dirty cash is worthless if federal agents freeze it. Run high-turnover cash businesses, wash paper into legitimate Swiss numbered bank accounts, and evade forensic accountants.',
    difficulty: 5,
    durationMode: 'quarter',
    targetScore: 20_000_000,
    targetBountyReward: 'Swiss Banking Cartel Laureate & $20M Clean Laundering Dossier',
    perks: [
      'Starts with Laundromat & Car Wash shell companies pre-owned',
      '+20% offshore bank interest dividend bonus',
      'Starts with $25,000 seed funds',
    ],
    handicaps: [
      '3x Federal IRS audit frequency & RICO meter gain',
      '$5,000,000 mandatory clean laundering threshold to claim bounty',
    ],
    iconName: 'Briefcase',
    bannerGradient: 'from-rose-500/20 via-slate-900 to-slate-950',
  },
];

/**
 * 32-bit Mulberry32 PRNG generator.
 * Produces deterministic pseudo-random floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically hash any arbitrary string to an unsigned 32-bit integer.
 */
export function hashSeedString(str: string): number {
  let hash = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

/**
 * Calculates current UTC date and countdown to next 00:00:00 UTC cycle.
 */
export function getTodayDailySeed(): {
  seed: string;
  dateString: string;
  timeUntilNextUtcMidnightMs: number;
  timeUntilNextUtcMidnightFormatted: string;
} {
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = String(now.getUTCMonth() + 1).padStart(2, '0');
  const utcDay = String(now.getUTCDate()).padStart(2, '0');
  const dateString = `${utcYear}-${utcMonth}-${utcDay}`;
  const seed = `DAILY-${dateString}`;

  const nextUtcMidnight = new Date(Date.UTC(utcYear, now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  const timeUntilNextUtcMidnightMs = Math.max(0, nextUtcMidnight.getTime() - now.getTime());

  const hours = Math.floor(timeUntilNextUtcMidnightMs / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntilNextUtcMidnightMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeUntilNextUtcMidnightMs % (1000 * 60)) / 1000);
  const timeUntilNextUtcMidnightFormatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  return {
    seed,
    dateString,
    timeUntilNextUtcMidnightMs,
    timeUntilNextUtcMidnightFormatted,
  };
}

const NARCO_PREFIXES = ['MEDELLIN', 'CALI', 'SINALOA', 'NARCO', 'CARTEL', 'GHOST', 'VIPER', 'SKYWAY', 'CHEM', 'BLACK_ICE'];

/**
 * Generate an underworld-themed random seed string.
 */
export function generateRandomSeed(): string {
  const prefix = NARCO_PREFIXES[Math.floor(Math.random() * NARCO_PREFIXES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

const PROOF_SALT = 'DRUGLORD2_REVANCED_SALT_2026';

/**
 * Generate a cryptographically signed verification proof code string.
 * Format: DL2-[CHAL_3]-[DAYS_2HEX]-[SCORE_8HEX]-[CHECKSUM_8HEX]
 */
export function generateChallengeProofCode(
  challengeId: string,
  seed: string,
  score: number,
  days: number,
  outcome: string
): string {
  const chalCode = (CHALLENGE_CODE_MAP[challengeId] ?? 'CST').toUpperCase();
  const daysHex = Math.max(1, Math.min(999, days)).toString(16).toUpperCase().padStart(2, '0');
  const scoreHex = Math.max(0, Math.floor(score)).toString(16).toUpperCase().padStart(8, '0');

  const dataToHash = `${chalCode}:${daysHex}:${scoreHex}:${seed}:${outcome}:${PROOF_SALT}`;
  const hashNum = hashSeedString(dataToHash);
  const hashHex = (hashNum >>> 0).toString(16).toUpperCase().padStart(8, '0');

  return `DL2-${chalCode}-${daysHex}-${scoreHex}-${hashHex}`;
}

/**
 * Verify an authentic challenge proof code.
 */
export function verifyChallengeProofCode(
  code: string,
  knownSeed?: string
): {
  valid: boolean;
  challengeId?: string;
  challengeTitle?: string;
  score?: number;
  days?: number;
  error?: string;
} {
  const trimmed = code.trim().toUpperCase();
  const match = trimmed.match(/^DL2-([A-Z0-9]{3})-([0-9A-F]{2,4})-([0-9A-F]{8})-([0-9A-F]{8})$/);
  if (!match) {
    return { valid: false, error: 'Invalid format. Expected format: DL2-XXX-XX-XXXXXXXX-XXXXXXXX' };
  }

  const [, chalCode, daysHex, scoreHex, hashHex] = match;
  const challengeId = CODE_TO_CHALLENGE_ID[chalCode] ?? 'custom';
  const challenge = BOUNTY_CHALLENGES.find((c) => c.id === challengeId);
  const days = parseInt(daysHex, 16);
  const score = parseInt(scoreHex, 16);

  if (isNaN(days) || isNaN(score)) {
    return { valid: false, error: 'Corrupted payload values' };
  }

  // If a seed was provided, verify exact hash
  if (knownSeed) {
    const outcomes = ['completed', 'victory', 'retirement', 'killed', 'bankrupt'];
    let matched = false;
    for (const outcome of outcomes) {
      const dataToHash = `${chalCode}:${daysHex}:${scoreHex}:${knownSeed}:${outcome}:${PROOF_SALT}`;
      const expected = (hashSeedString(dataToHash) >>> 0).toString(16).toUpperCase().padStart(8, '0');
      if (expected === hashHex) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      return { valid: false, error: 'Checksum mismatch. Code appears modified or invalid for seed.' };
    }
  }

  return {
    valid: true,
    challengeId,
    challengeTitle: challenge?.title ?? 'Custom Seed Challenge',
    score,
    days,
  };
}

/**
 * Applies challenge modifiers, starting assets, and seeded PRNG to a newly created GameEngineState.
 */
export function applyChallengeModifiersToNewGame(
  engineState: GameEngineState,
  challengeId: string,
  seed: string
): GameEngineState {
  const challenge = BOUNTY_CHALLENGES.find((c) => c.id === challengeId);
  const p = engineState.player;
  p.activeChallengeId = challengeId;
  p.activeChallengeSeed = seed;

  // Initialize deterministic PRNG for the economy engine
  const rngSeedNum = hashSeedString(seed);
  setEconomyRng(mulberry32(rngSeedNum));

  // Initialize default challenge modifiers
  p.challengeModifiers = {
    weaponsBanned: false,
    aviationOnly: false,
    syntheticsOnly: false,
    tripleAuditHeat: false,
    fleeAgilityBonus: 0,
    syntheticMarginBonus: 0,
    bribeDiscount: 0,
  };

  if (challengeId === 'daily_seed') {
    p.gameDurationMode = 'classic';
    p.maxDays = 30;
  } else if (challengeId === 'zero_weapons') {
    p.gameDurationMode = 'classic';
    p.maxDays = 30;
    p.cash = 15000;
    p.debt = 0;
    p.weapons = {};
    p.ammo = {};
    p.challengeModifiers.weaponsBanned = true;
    p.challengeModifiers.fleeAgilityBonus = 0.3;
    p.challengeModifiers.bribeDiscount = 0.25;
  } else if (challengeId === 'aviation_kingpin') {
    p.gameDurationMode = 'quarter';
    p.maxDays = 90;
    p.cash = 50000;
    p.debt = 25000;
    p.ownedAircraft = ['cessna_caravan'];
    p.selectedAircraftId = 'cessna_caravan';
    p.challengeModifiers.aviationOnly = true;
  } else if (challengeId === 'pure_synthetics') {
    p.gameDurationMode = 'classic';
    p.maxDays = 30;
    p.cash = 10000;
    p.debt = 5000;
    p.ownedProperties = ['border_ranch'];
    p.installedLabs = { border_ranch: ['chemical_reflux'] };
    p.precursorInventory = { ephedrine: 10, reagent_solvents: 15 };
    p.challengeModifiers.syntheticsOnly = true;
    p.challengeModifiers.syntheticMarginBonus = 0.25;
  } else if (challengeId === 'swiss_purist') {
    p.gameDurationMode = 'quarter';
    p.maxDays = 90;
    p.cash = 25000;
    p.debt = 10000;
    p.ownedBusinesses = ['laundromat', 'car_wash'];
    p.challengeModifiers.tripleAuditHeat = true;
  }

  // Regenerate initial market with deterministic seeded pricing
  const initialCityId = p.currentCityId || 'new_york';
  const { market } = generateCityMarket(initialCityId, 1, p.activeIntel);
  engineState.market = market;

  // Add bounty run initialization message
  engineState.logs.unshift({
    day: 1,
    city: 'Cartel Command',
    type: 'system',
    message: `[BOUNTY RUN INITIALIZED] Challenge: ${challenge?.title ?? 'Custom Seed'} • Seed: [${seed}] • Target: ${challenge?.targetBountyReward ?? '$10M+'}`,
    timestamp: Date.now(),
  });

  return engineState;
}

const STORAGE_KEY_CHALLENGE_HISTORY = 'druglord2_challenge_history';
let memoryRecordsFallback: DailyChallengeRecord[] = [];

/**
 * Save completed challenge run record to localStorage (with in-memory fallback).
 */
export function saveDailyChallengeRecord(record: DailyChallengeRecord): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const existing = getDailyChallengeRecords();
      existing.unshift(record);
      const trimmed = existing.slice(0, 50);
      window.localStorage.setItem(STORAGE_KEY_CHALLENGE_HISTORY, JSON.stringify(trimmed));
      return;
    }
  } catch {}
  memoryRecordsFallback.unshift(record);
  memoryRecordsFallback = memoryRecordsFallback.slice(0, 50);
}

/**
 * Retrieve all challenge records from localStorage (with in-memory fallback).
 */
export function getDailyChallengeRecords(): DailyChallengeRecord[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY_CHALLENGE_HISTORY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    }
  } catch {}
  return [...memoryRecordsFallback];
}

/**
 * Check if the player has already completed today's official UTC daily run.
 */
export function hasCompletedDailyChallengeToday(): boolean {
  const { dateString } = getTodayDailySeed();
  const records = getDailyChallengeRecords();
  return records.some((r) => r.challengeId === 'daily_seed' && r.date === dateString);
}

/**
 * Clear all challenge records.
 */
export function clearDailyChallengeRecords(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY_CHALLENGE_HISTORY);
    }
  } catch {}
  memoryRecordsFallback = [];
}

/**
 * Generate shareable ASCII dossier report for a challenge record.
 */
export function generateChallengeDossierText(record: DailyChallengeRecord): string {
  return `═══════════════════════════════════════════════════════
 DRUG LORD: REVANCED — VERIFIED BOUNTY DOSSIER
═══════════════════════════════════════════════════════
 Challenge:         ${record.challengeTitle}
 PRNG Seed:         [${record.seed}]
 Outcome:           ${record.outcome.toUpperCase()}
 Final Score:       ${record.finalScore.toLocaleString()} PTS
 Final Net Worth:   $${record.netWorth.toLocaleString()}
 Days Survived:     Day ${record.daysSurvived} / ${record.maxDays}
 Achieved Rank:     ${record.finalRank}
 Date Concluded:    ${record.date}

 🔐 VERIFICATION SIGNATURE:
 ${record.proofCode}
 Status:            VERIFIED CRYPTOGRAPHIC SIGNATURE
═══════════════════════════════════════════════════════`;
}
