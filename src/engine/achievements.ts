import { PlayerState } from './types';
import { getTotalWealth, getInventoryTotalUnits, getTotalVaultUnitsAllCities } from './game';
import { CITIES } from './constants';

export type AchievementCategory = 'wealth' | 'combat' | 'smuggling' | 'empire' | 'notoriety';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  prestigePoints: number;
  unlockedAt?: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_trade',
    title: 'First Hustle',
    description: 'Complete your first contraband transaction on the street market.',
    category: 'smuggling',
    icon: 'Briefcase',
    prestigePoints: 50,
  },
  {
    id: 'debt_free',
    title: 'Debt Free',
    description: 'Completely eliminate your loan shark debt and break the cycle.',
    category: 'wealth',
    icon: 'CheckCircle2',
    prestigePoints: 100,
  },
  {
    id: 'debt_free_speed',
    title: 'Swift Settlement',
    description: 'Completely repay your initial loan shark debt within the first 7 game days.',
    category: 'wealth',
    icon: 'Zap',
    prestigePoints: 250,
  },
  {
    id: 'liquid_millionaire',
    title: 'Liquid Millionaire',
    description: 'Hold $1,000,000 or more in cold liquid cash in your briefcase.',
    category: 'wealth',
    icon: 'DollarSign',
    prestigePoints: 200,
  },
  {
    id: 'swiss_banker',
    title: 'Offshore Mogul',
    description: 'Accumulate $5,000,000 or more in secure offshore bank deposits.',
    category: 'wealth',
    icon: 'Building2',
    prestigePoints: 300,
  },
  {
    id: 'wholesale_baron',
    title: 'Wholesale Baron',
    description: 'Purchase 500+ units of a single commodity in a single street transaction.',
    category: 'smuggling',
    icon: 'Package',
    prestigePoints: 200,
  },
  {
    id: 'globe_trotter',
    title: 'Global Smuggler',
    description: 'Expand your smuggling routes across at least 10 international cities.',
    category: 'smuggling',
    icon: 'Plane',
    prestigePoints: 250,
  },
  {
    id: 'continental_syndicate',
    title: 'Continental Syndicate',
    description: 'Visit all 20 global smuggling hub cities in a single continuous career.',
    category: 'smuggling',
    icon: 'Globe',
    prestigePoints: 500,
  },
  {
    id: 'heat_wave',
    title: 'Public Enemy #1',
    description: 'Survive in an international port with Police & DEA Heat at 90% or higher.',
    category: 'notoriety',
    icon: 'Flame',
    prestigePoints: 300,
  },
  {
    id: 'stealth_courier',
    title: 'Ghost Runner',
    description: 'Travel by air carrying 150+ contraband units fully masked by No-Scent spray.',
    category: 'smuggling',
    icon: 'EyeOff',
    prestigePoints: 200,
  },
  {
    id: 'slumlord',
    title: 'Safehouse Investor',
    description: 'Purchase your first syndicate safehouse property.',
    category: 'empire',
    icon: 'Home',
    prestigePoints: 100,
  },
  {
    id: 'real_estate_mogul',
    title: 'Fortified Baron',
    description: 'Own all 6 international properties and safehouse compounds simultaneously.',
    category: 'empire',
    icon: 'ShieldCheck',
    prestigePoints: 500,
  },
  {
    id: 'heavy_artillery',
    title: 'Heavy Ordinance',
    description: 'Equip an RPG-7, Heavy Machine Gun, or Military Body Armor.',
    category: 'combat',
    icon: 'Crosshair',
    prestigePoints: 250,
  },
  {
    id: 'combat_veteran',
    title: 'Street Enforcer',
    description: 'Win 5 hostile combat firefights against local authorities or rival gangs.',
    category: 'combat',
    icon: 'Swords',
    prestigePoints: 300,
  },
  {
    id: 'near_death',
    title: 'Living on the Edge',
    description: 'Survive a gunfight or escape encounter with 15% HP or less remaining.',
    category: 'combat',
    icon: 'HeartPulse',
    prestigePoints: 200,
  },
  {
    id: 'shadow_broker',
    title: 'Shadow Broker',
    description: 'Decrypt and purchase 3 or more underground informant market tips.',
    category: 'empire',
    icon: 'Radio',
    prestigePoints: 200,
  },
  {
    id: 'courier_tycoon',
    title: 'Logistics Tycoon',
    description: 'Dispatch 3 or more inter-city cargo smuggling shipments via courier contractors.',
    category: 'empire',
    icon: 'Truck',
    prestigePoints: 250,
  },
  {
    id: 'vault_hoarder',
    title: 'Vault King',
    description: 'Store 500+ units of contraband securely across syndicate safehouse vaults.',
    category: 'empire',
    icon: 'Lock',
    prestigePoints: 300,
  },
  {
    id: 'untouchable',
    title: 'Untouchable',
    description: 'Attain a total net worth exceeding $10,000,000.',
    category: 'wealth',
    icon: 'Trophy',
    prestigePoints: 500,
  },
  {
    id: 'cartel_god',
    title: 'Underworld Legend',
    description: 'Ascend to the supreme underworld rank of Cartel Kingpin.',
    category: 'empire',
    icon: 'Crown',
    prestigePoints: 1000,
  },
];

export const ACHIEVEMENT_MAP = new Map<string, Achievement>(
  ACHIEVEMENTS.map((a) => [a.id, a])
);

const STORAGE_KEY_ACHIEVEMENTS = 'druglord2_global_achievements';

/**
 * Load globally unlocked achievement IDs from browser localStorage
 */
export function getGlobalAchievements(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return new Set(arr);
    }
  } catch {
    // Fallback to empty set
  }
  return new Set();
}

/**
 * Persist globally unlocked achievements to localStorage
 */
export function saveGlobalAchievements(ids: Set<string>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(Array.from(ids)));
  } catch {
    // Sandbox restricted
  }
}

export interface AchievementEvaluationContext {
  lastAction?: 'buy' | 'sell' | 'travel' | 'combat' | 'advanceDay' | 'property' | 'vault' | 'courier' | 'intel' | 'bribe' | 'aircraft';
  unitsTraded?: number;
  combatWon?: boolean;
  nearDeathSurvival?: boolean;
}

/**
 * Evaluate all achievement triggers against current player state
 * Returns newly unlocked achievements and updated set of all unlocked IDs
 */
export function evaluateAchievements(
  player: PlayerState,
  alreadyUnlocked: Set<string>,
  context: AchievementEvaluationContext = {}
): { newlyUnlocked: Achievement[]; allUnlocked: Set<string> } {
  const currentUnlocked = new Set(alreadyUnlocked);
  const newlyUnlocked: Achievement[] = [];

  const netWorth = getTotalWealth(player);
  const totalVaultUnits = getTotalVaultUnitsAllCities(player);
  const citiesVisited = player.stats?.citiesVisited?.length ?? 1;

  // Helper to trigger an unlock
  const unlock = (id: string) => {
    if (!currentUnlocked.has(id)) {
      const ach = ACHIEVEMENT_MAP.get(id);
      if (ach) {
        currentUnlocked.add(id);
        newlyUnlocked.push({ ...ach, unlockedAt: Date.now() });
      }
    }
  };

  // 1. First trade
  if (context.lastAction === 'buy' || context.lastAction === 'sell' || (player.stats?.totalTrades && player.stats.totalTrades > 0)) {
    unlock('first_trade');
  }

  // 2. Debt free
  if (player.debt === 0) {
    unlock('debt_free');
  }

  // 3. Debt free speed (within first 7 days)
  if (player.debt === 0 && player.currentDay <= 7) {
    unlock('debt_free_speed');
  }

  // 4. Liquid Millionaire
  if (player.cash >= 1_000_000) {
    unlock('liquid_millionaire');
  }

  // 5. Offshore Mogul
  if (player.bank >= 5_000_000) {
    unlock('swiss_banker');
  }

  // 6. Wholesale Baron (500+ single buy)
  if ((context.unitsTraded && context.unitsTraded >= 500) || (player.stats?.maxSingleBuyUnits && player.stats.maxSingleBuyUnits >= 500)) {
    unlock('wholesale_baron');
  }

  // 7. Global Smuggler (10+ cities)
  if (citiesVisited >= 10) {
    unlock('globe_trotter');
  }

  // 8. Continental Syndicate (all 20 cities)
  if (citiesVisited >= CITIES.length) {
    unlock('continental_syndicate');
  }

  // 9. Public Enemy #1 (90%+ heat)
  const currentCityHeat = player.cityHeat?.[player.currentCityId] ?? 0;
  if (currentCityHeat >= 90) {
    unlock('heat_wave');
  }

  // 10. Ghost Runner (150+ units masked)
  const totalCarried = getInventoryTotalUnits(player);
  const maskedCapacity = (player.noScentCans || 0) * 100;
  if (context.lastAction === 'travel' && totalCarried >= 150 && totalCarried <= maskedCapacity) {
    unlock('stealth_courier');
  }

  // 11. Safehouse Investor
  if (player.ownedProperties && player.ownedProperties.length >= 1) {
    unlock('slumlord');
  }

  // 12. Real Estate Mogul (all 6 properties)
  if (player.ownedProperties && player.ownedProperties.length >= 6) {
    unlock('real_estate_mogul');
  }

  // 13. Heavy Ordinance
  if (player.weapons?.['rpg7'] || player.weapons?.['machine_gun'] || player.armor?.id === 'military') {
    unlock('heavy_artillery');
  }

  // 14. Combat Veteran (5+ wins)
  if ((player.stats?.combatWins ?? 0) >= 5) {
    unlock('combat_veteran');
  }

  // 15. Living on the edge
  if (context.nearDeathSurvival || (context.lastAction === 'combat' && player.health > 0 && player.health <= 15)) {
    unlock('near_death');
  }

  // 16. Shadow broker (3+ intel purchased)
  if ((player.stats?.intelPurchasedCount ?? 0) >= 3) {
    unlock('shadow_broker');
  }

  // 17. Courier tycoon (3+ shipments dispatched)
  if ((player.stats?.couriersDispatchedCount ?? 0) >= 3) {
    unlock('courier_tycoon');
  }

  // 18. Vault King (500+ vault units)
  if (totalVaultUnits >= 500) {
    unlock('vault_hoarder');
  }

  // 19. Untouchable ($10M+ net worth)
  if (netWorth >= 10_000_000) {
    unlock('untouchable');
  }

  // 20. Underworld Legend (Kingpin rank)
  if (player.currentRankId === 'kingpin') {
    unlock('cartel_god');
  }

  if (newlyUnlocked.length > 0) {
    saveGlobalAchievements(currentUnlocked);
  }

  return { newlyUnlocked, allUnlocked: currentUnlocked };
}
