import { CITIES, DRUGS, DRUG_MAP, RANKS, RANK_MAP, SHARK_MAP, CITY_MAP, PROPERTY_MAP, WEAPON_MAP, SHIPPER_MAP } from './constants';
import { generateCityMarket } from './economy';
import {
  PlayerState,
  GameLogEntry,
  MarketItem,
  Rank,
  GameDurationMode,
  DURATION_MODES,
  MarketIntelTip,
  ActiveShipment,
  FlightSeatClass,
  SyndicateId,
} from './types';
import { memoryMirror } from './memoryBuffer';
import { ORGANIC_DRUG_IDS } from './dailyChallenge';
import { generateSyndicateContracts, calculatePeaceTributeCost, SYNDICATES, getSyndicateDiscount } from './syndicates';
import { calculateSeatClassDetails } from './flightNetwork';
import {
  SHELL_MAP,
  UPGRADE_MAP,
  calculateEffectiveFeeRate,
  calculateEffectiveDailyCapacity,
  calculateTotalPassiveIncome,
  calculateTotalHeatShield,
  calculateCustomsBonusFromBusinesses,
} from './laundering';
import { AIRCRAFT_MAP, calculateAircraftFlightCost } from './aviation';
import { advanceCookBatches } from './production';
import {
  hasActiveOfficial,
  processCorruptionAndRicoDaily,
  hireOfficial,
  fireOfficial,
  bribeGrandJury,
  emergencyExtraditionEscape,
  isSovereignSanctuary,
  getRicoThreatLevel,
  CORRUPT_OFFICIALS,
  CORRUPT_MAP,
  SOVEREIGN_SANCTUARIES,
  SANCTUARY_MAP,
  getOrInitInformants,
  getOrInitWiretaps,
  bribeInformant,
  flipInformant,
  neutralizeInformant,
  scrambleWiretap,
  sellWiretapTranscript,
} from './corruption';
import {
  processTurfWarsAndMacroEventsDaily,
  getMacroCustomsMultiplier,
  triggerTurfWar,
  triggerMacroEvent,
} from './turfWars';
import {
  getSwissSecurityTier,
  calculateBankSeizureProtection,
  buySwissSecurityTier,
  buyBearerBond,
  processDailyBearerBonds,
  claimMaturedBearerBonds,
  buyConsularImmunity,
  getConsularCustomsReduction,
  SWISS_TIERS,
  SWISS_TIER_MAP,
  BEARER_BOND_TEMPLATES,
  CONSULAR_IMMUNITIES,
  CONSULAR_MAP,
} from './swissBank';
import {
  SAFEHOUSE_UPGRADES,
  SAFEHOUSE_UPGRADE_MAP,
  getPropertyUpgrades,
  hasPropertyUpgrade,
  buyPropertyUpgrade,
  calculateTotalPropertyStorageBonus,
  calculatePropertyRaidDefense,
} from './safehouseUpgrades';
import {
  getAircraftState,
  applyFlightWear,
  calculateOverhaulCost,
  overhaulAircraft,
  buyAvionicsUpgrade,
} from './aviation';
import {
  calculateTerritoryInfluences,
  calculateProtectionRacketRevenue,
  collectProtectionRacket,
  getStrikeContracts,
  executeStrikeContract,
} from './syndicateWarRoom';

export {
  hasActiveOfficial,
  processCorruptionAndRicoDaily,
  hireOfficial,
  fireOfficial,
  bribeGrandJury,
  emergencyExtraditionEscape,
  isSovereignSanctuary,
  getRicoThreatLevel,
  CORRUPT_OFFICIALS,
  CORRUPT_MAP,
  SOVEREIGN_SANCTUARIES,
  SANCTUARY_MAP,
  getOrInitInformants,
  getOrInitWiretaps,
  bribeInformant,
  flipInformant,
  neutralizeInformant,
  scrambleWiretap,
  sellWiretapTranscript,
  processTurfWarsAndMacroEventsDaily,
  getMacroCustomsMultiplier,
  triggerTurfWar,
  triggerMacroEvent,
  getSwissSecurityTier,
  calculateBankSeizureProtection,
  buySwissSecurityTier,
  buyBearerBond,
  processDailyBearerBonds,
  claimMaturedBearerBonds,
  buyConsularImmunity,
  getConsularCustomsReduction,
  SWISS_TIERS,
  SWISS_TIER_MAP,
  BEARER_BOND_TEMPLATES,
  CONSULAR_IMMUNITIES,
  CONSULAR_MAP,
  SAFEHOUSE_UPGRADES,
  SAFEHOUSE_UPGRADE_MAP,
  getPropertyUpgrades,
  hasPropertyUpgrade,
  buyPropertyUpgrade,
  calculateTotalPropertyStorageBonus,
  calculatePropertyRaidDefense,
  getAircraftState,
  applyFlightWear,
  calculateOverhaulCost,
  overhaulAircraft,
  buyAvionicsUpgrade,
  calculateTerritoryInfluences,
  calculateProtectionRacketRevenue,
  collectProtectionRacket,
  getStrikeContracts,
  executeStrikeContract,
};

export interface GameEngineState {
  player: PlayerState;
  market: Record<string, MarketItem>;
  logs: GameLogEntry[];
}

const INTEL_HEADLINES = [
  {
    type: 'surge_spike' as const,
    multiplier: 2.5,
    headlines: [
      'DEA tactical sweep seized port containers; street supply choked',
      'Rival cartel distribution hub firebombed; massive shortage incoming',
      'Border customs lockdown halted inbound smugglers; prices ready to skyrocket',
      'VIP high-society syndicate order placed; demand exceeding local supply',
    ],
    sources: ['Wiretap #402', 'Bribed Customs Agent', 'Informant "Viper"', 'Harbor Dispatcher Leak'],
  },
  {
    type: 'market_glut' as const,
    multiplier: 0.35,
    headlines: [
      'Underground chemist synthesis breakthrough flooded street with cheap supply',
      'Massive offshore submarine cargo successfully docked; wholesale prices crashing',
      'Rival syndicate liquidated warehouse inventory to pay debts; deep discounts',
      'Smuggling pipeline oversupply triggered competitive street price war',
    ],
    sources: ['Corrupt Dockworker', 'Underworld Chemist Note', 'Intercepted Pager Feed', 'Cartel Courier Memo'],
  },
  {
    type: 'police_crackdown' as const,
    multiplier: 2.2,
    headlines: [
      'Interpol task force launching special raids; street dealers gone underground',
      'Federal task force wiretaps targeting local stash spots; extreme scarcity',
      'Coast Guard blockade intercepted speedboats; regional supply drought',
      'City council zero-tolerance dragnet arresting corner pushers; product unavailable',
    ],
    sources: ['Federal Courthouse Leak', 'Police Scanner Audio', 'Street Informer "Shadow"', 'Port Authority Tipster'],
  },
];

export function generateIntelTips(
  currentDay: number,
  existingTips: MarketIntelTip[] = []
): MarketIntelTip[] {
  const validTips = existingTips.filter((t) => t.targetDay >= currentDay);
  const needed = 4 - validTips.length;
  if (needed <= 0) return validTips;

  const newTips: MarketIntelTip[] = [...validTips];

  for (let i = 0; i < needed; i++) {
    const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
    const randomDrug = DRUGS[Math.floor(Math.random() * DRUGS.length)];
    const dayOffset = 1 + Math.floor(Math.random() * 3);
    const targetDay = currentDay + dayOffset;

    const alreadyExists = newTips.some(
      (t) => t.cityId === randomCity.id && t.drugId === randomDrug.id && t.targetDay === targetDay
    );
    if (alreadyExists) continue;

    const intelCategory = INTEL_HEADLINES[Math.floor(Math.random() * INTEL_HEADLINES.length)];
    const headline = intelCategory.headlines[Math.floor(Math.random() * intelCategory.headlines.length)];
    const source = intelCategory.sources[Math.floor(Math.random() * intelCategory.sources.length)];
    const cost = Math.max(500, Math.min(5000, Math.round(randomDrug.basePrice * 0.15)));

    newTips.push({
      id: `intel_${currentDay}_${targetDay}_${randomDrug.id}_${Math.random().toString(36).slice(2, 6)}`,
      cityId: randomCity.id,
      cityName: randomCity.name,
      drugId: randomDrug.id,
      drugName: randomDrug.name,
      eventType: intelCategory.type,
      targetDay,
      multiplier: intelCategory.multiplier,
      cost,
      purchased: false,
      headline,
      source,
    });
  }

  return newTips;
}

export function createInitialState(durationMode: GameDurationMode = 'classic'): GameEngineState {
  const initialCityId = 'new_york';
  const initialSharkId = 'buddles';
  const shark = SHARK_MAP.get(initialSharkId);
  const modeConfig = DURATION_MODES.find((m) => m.id === durationMode) ?? DURATION_MODES[0];
  const initialIntel = generateIntelTips(1);

  const player: PlayerState = {
    cash: 1000,
    bank: 0,
    debt: 1000,
    loanSharkId: initialSharkId,
    loanDaysLeft: shark ? shark.repayDays : 14,
    health: 100,
    maxHealth: 100,
    currentCityId: initialCityId,
    currentDay: 1,
    maxDays: modeConfig.days,
    isEndless: modeConfig.isEndless,
    gameDurationMode: modeConfig.id,
    currentRankId: 'wannabe',
    daysHoldingRankCash: 0,
    daysInsolvent: 0,
    cleanIdentityRenewals: 0,
    inventory: {},
    weapons: {},
    ammo: {},
    armor: null,
    noScentCans: 0,
    vaults: {},
    visitedVaultToday: false,
    shipments: [],
    activeEncounter: null,
    isGameOver: false,
    ownedProperties: [],
    cityHeat: {},
    activeIntel: initialIntel,
    unlockedAchievements: [],
    syndicateReputations: {
      medellin: 0,
      golden_triangle: 0,
      synthetic_chem: 0,
      designer_ring: 0,
      balkan: 0,
    },
    syndicateContracts: generateSyndicateContracts(1, initialCityId, []),
    ownedBusinesses: [],
    corporateUpgrades: [],
    launderedToday: 0,
    combatConsumables: {
      flashbangs: 0,
      smokeGrenades: 0,
      medkits: 0,
    },
    ownedAircraft: [],
    selectedAircraftId: null,
    installedLabs: {},
    activeCookBatches: [],
    precursorInventory: {},
    corruptOfficials: {},
    ricoMeter: 0,
    isBankFrozen: false,
    pendingRaidWarning: null,
    activeTurfWars: [],
    activeMacroEvents: [],
    stats: {
      combatWins: 0,
      bribesCount: 0,
      surrendersCount: 0,
      totalTrades: 0,
      maxSingleBuyUnits: 0,
      citiesVisited: [initialCityId],
      intelPurchasedCount: 0,
      couriersDispatchedCount: 0,
      contractsCompletedCount: 0,
      businessesAcquiredCount: 0,
      totalCleanMoneyLaundered: 0,
      fakeDrugsDiscovered: 0,
      fakeDrugsFlushed: 0,
      corruptOfficialsBribed: 0,
      ricoIndictmentsEvaded: 0,
      extraditionEscapesCount: 0,
    },
    cheats: {
      godMode: false,
      extraCapacity: 0,
    },
  };

  memoryMirror.syncFromState(player, 0, 0);

  const { market } = generateCityMarket(initialCityId, 1, initialIntel);

  const initialLogs: GameLogEntry[] = [
    {
      day: 1,
      city: 'New York',
      type: 'system',
      message: 'Welcome to New York! Buddles spotted you $1,000 cash, but expects his money back with interest.',
      timestamp: Date.now(),
    },
  ];

  return { player, market, logs: initialLogs };
}

export function syncStateToMemory(state: GameEngineState): void {
  memoryMirror.syncFromState(
    state.player,
    state.player.cheats?.godMode ? 1 : 0,
    state.player.cheats?.extraCapacity ?? 0
  );
}

export function syncStateFromMemory(state: GameEngineState): boolean {
  const mem = memoryMirror.readMemory();
  let changed = false;

  if (state.player.cash !== mem.cash) {
    state.player.cash = Math.max(0, mem.cash);
    changed = true;
  }
  if (state.player.bank !== mem.bank) {
    state.player.bank = Math.max(0, mem.bank);
    changed = true;
  }
  if (state.player.debt !== mem.debt) {
    state.player.debt = Math.max(0, mem.debt);
    if (state.player.debt === 0) {
      state.player.loanSharkId = null;
      state.player.loanDaysLeft = 0;
    }
    changed = true;
  }
  if (state.player.health !== mem.health) {
    state.player.health = Math.min(100, Math.max(0, mem.health));
    changed = true;
  }
  if (state.player.currentDay !== mem.currentDay) {
    state.player.currentDay = mem.currentDay;
    changed = true;
  }
  if (state.player.maxDays !== mem.maxDays) {
    state.player.maxDays = mem.maxDays;
    changed = true;
  }
  if (state.player.cheats.godMode !== mem.godMode) {
    state.player.cheats.godMode = mem.godMode;
    changed = true;
  }
  if (state.player.cheats.extraCapacity !== mem.extraCapacity) {
    state.player.cheats.extraCapacity = mem.extraCapacity;
    changed = true;
  }

  return changed;
}

export function getInventoryTotalUnits(player: PlayerState): number {
  return Object.values(player.inventory).reduce((sum, item) => sum + item.units, 0);
}

export function getPropertyBonusCapacity(player: PlayerState): number {
  return (player.ownedProperties || []).reduce((sum, propId) => {
    const prop = PROPERTY_MAP.get(propId);
    return sum + (prop ? prop.storageUnits : 0);
  }, 0);
}

export function getCarryingCapacity(player: PlayerState): number {
  const rank = RANK_MAP.get(player.currentRankId);
  const base = rank ? rank.capacity : 10;
  const propBonus = getPropertyBonusCapacity(player);
  let aircraftBonus = 0;
  if (player.selectedAircraftId) {
    const plane = AIRCRAFT_MAP.get(player.selectedAircraftId);
    if (plane) aircraftBonus += plane.cargoBonus;
  }
  return base + propBonus + aircraftBonus + (player.cheats?.extraCapacity ?? 0);
}

export function getCityVaultUnits(player: PlayerState, cityId: string): number {
  const cityVault = player.vaults?.[cityId];
  if (!cityVault) return 0;
  return Object.values(cityVault).reduce((sum, units) => sum + units, 0);
}

export function getCityVaultCapacity(player: PlayerState, _cityId?: string): number {
  // Base local stash locker: 25 units
  // Plus storage units provided by all owned properties and installed steel doors
  const baseStorage = 25;
  const propertyBonus = getPropertyBonusCapacity(player);
  const upgradeStorage = calculateTotalPropertyStorageBonus(player);
  return baseStorage + propertyBonus + upgradeStorage;
}

export function getTotalVaultUnitsAllCities(player: PlayerState): number {
  let total = 0;
  if (player.vaults) {
    for (const cityId of Object.keys(player.vaults)) {
      total += getCityVaultUnits(player, cityId);
    }
  }
  return total;
}

export function getTotalWealth(player: PlayerState): number {
  return player.cash + player.bank - player.debt;
}

export function getNextRank(player: PlayerState): Rank | null {
  const currentIndex = RANKS.findIndex((r) => r.id === player.currentRankId);
  if (currentIndex >= 0 && currentIndex < RANKS.length - 1) {
    return RANKS[currentIndex + 1];
  }
  return null;
}

export function getPreviousRank(player: PlayerState): Rank | null {
  const currentIndex = RANKS.findIndex((r) => r.id === player.currentRankId);
  if (currentIndex > 0) {
    return RANKS[currentIndex - 1];
  }
  return null;
}

export function getCityHeat(player: PlayerState, cityId: string): number {
  return Math.max(0, Math.min(100, player.cityHeat?.[cityId] ?? 0));
}

export function getPlayerHeatReduction(player: PlayerState): number {
  let reduction = 0;
  if (player.ownedProperties) {
    for (const propId of player.ownedProperties) {
      const prop = PROPERTY_MAP.get(propId);
      if (prop?.heatReduction) {
        reduction += prop.heatReduction;
      }
    }
  }
  if (player.safehouseUpgrades) {
    for (const propId of Object.keys(player.safehouseUpgrades)) {
      if (player.safehouseUpgrades[propId]?.includes('decoy_radio')) {
        reduction += 0.35;
      }
    }
  }
  return Math.min(0.85, reduction); // max 85% heat mitigation
}

export function modifyCityHeat(
  state: GameEngineState,
  cityId: string,
  delta: number
): void {
  if (!state.player.cityHeat) {
    state.player.cityHeat = {};
  }
  const current = state.player.cityHeat[cityId] ?? 0;
  const heatShield = getPlayerHeatReduction(state.player);
  const adjustedDelta = delta > 0 ? Math.round(delta * (1 - heatShield)) : delta;
  state.player.cityHeat[cityId] = Math.max(0, Math.min(100, current + adjustedDelta));
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export function retireEmpire(state: GameEngineState): ActionResult {
  if (state.player.isGameOver) return { success: false, message: 'Game already concluded' };

  const totalWealth = getTotalWealth(state.player);
  state.player.isGameOver = true;
  state.player.gameOverReason = `Voluntary Retirement: Liquidated underworld empire on Day ${state.player.currentDay} with $${totalWealth.toLocaleString()} net worth.`;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'Caribbean',
    type: 'finance',
    message: `🏆 VOLUNTARY RETIREMENT: Liquidated all operations on Day ${state.player.currentDay} and boarded a private flight to the Caribbean with $${totalWealth.toLocaleString()} in net wealth!`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Voluntary retirement complete! Final wealth: $${totalWealth.toLocaleString()}`,
  };
}

export function purchaseCleanIdentity(state: GameEngineState): ActionResult {
  if (state.player.isEndless) {
    return { success: false, message: 'Endless mode is active. Clean identities are not needed.' };
  }

  const renewals = state.player.cleanIdentityRenewals ?? 0;
  const cost = 50000 + renewals * 25000;

  if (state.player.cash < cost) {
    return {
      success: false,
      message: `Insufficient cash for diplomatic fixers. Need $${cost.toLocaleString()} to forge credentials.`,
    };
  }

  state.player.cash -= cost;
  state.player.cleanIdentityRenewals = renewals + 1;
  state.player.maxDays += 30;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'Consulate',
    type: 'finance',
    message: `PASSPORT RENEWAL: Secured clean biometric passport and diplomatic credentials for $${cost.toLocaleString()} (+30 Days added, new term ends Day ${state.player.maxDays})!`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Clean biometric passport issued! +30 Days added (Term extended to Day ${state.player.maxDays}).`,
  };
}

export function bribePolice(state: GameEngineState): ActionResult {
  const currentCityId = state.player.currentCityId;
  const currentHeat = getCityHeat(state.player, currentCityId);
  const cityName = CITY_MAP.get(currentCityId)?.name ?? 'City';

  if (currentHeat <= 0) {
    return { success: false, message: `Police heat in ${cityName} is already at 0%.` };
  }

  let cost = Math.max(2500, Math.round(currentHeat * 150));
  if (state.player.challengeModifiers?.bribeDiscount) {
    cost = Math.max(1000, Math.round(cost * (1 - state.player.challengeModifiers.bribeDiscount)));
  }
  if (state.player.cash < cost) {
    return {
      success: false,
      message: `Insufficient cash to bribe police commanders in ${cityName}. Need $${cost.toLocaleString()}.`,
    };
  }

  state.player.cash -= cost;
  modifyCityHeat(state, currentCityId, -50);
  const newHeat = getCityHeat(state.player, currentCityId);

  state.logs.unshift({
    day: state.player.currentDay,
    city: cityName,
    type: 'finance',
    message: `POLICE BRIBE: Paid $${cost.toLocaleString()} to precinct fixers in ${cityName}. Narcotics investigation files scrubbed! Heat dropped to ${newHeat}%.`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Greased palms in ${cityName}! Police heat dropped to ${newHeat}%.`,
  };
}

export function buyProperty(state: GameEngineState, propertyId: string): ActionResult {
  const prop = PROPERTY_MAP.get(propertyId);
  if (!prop) return { success: false, message: 'Property not found' };
  if (state.player.ownedProperties.includes(propertyId)) {
    return { success: false, message: 'You already own this safehouse / property' };
  }
  if (state.player.cash < prop.price) {
    return { success: false, message: `Insufficient cash. Need $${prop.price.toLocaleString()}` };
  }

  state.player.cash -= prop.price;
  state.player.ownedProperties.push(propertyId);

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'finance',
    message: `ACQUISITION: Purchased ${prop.name} for $${prop.price.toLocaleString()} (+${prop.storageUnits.toLocaleString()} stash capacity)!`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Successfully acquired ${prop.name}!` };
}

export function buyWeapon(state: GameEngineState, weaponId: string): ActionResult {
  const item = WEAPON_MAP.get(weaponId);
  if (!item) return { success: false, message: 'Item not found in armory' };

  if (state.player.challengeModifiers?.weaponsBanned && (item.type === 'weapon' || item.type === 'armor')) {
    return { success: false, message: 'Challenge Rule: Personal weapons & armor prohibited under the Pacifist Smuggler code!' };
  }

  if (item.type === 'armor' && state.player.armor?.id === item.id) {
    return { success: false, message: `You already have ${item.name} equipped` };
  }

  if (item.type === 'utility') {
    const maxHold = item.maxHold ?? 10;
    let curCount = 0;
    if (item.id === 'no_scent') curCount = state.player.noScentCans || 0;
    else if (item.id === 'flashbang') curCount = state.player.combatConsumables?.flashbangs || 0;
    else if (item.id === 'smoke_grenade') curCount = state.player.combatConsumables?.smokeGrenades || 0;
    else if (item.id === 'combat_medkit') curCount = state.player.combatConsumables?.medkits || 0;

    if (curCount >= maxHold) {
      return { success: false, message: `You are already carrying the maximum capacity (${maxHold}) for ${item.name}` };
    }
  }

  if (state.player.cash < item.price) {
    return { success: false, message: `Insufficient cash. Need $${item.price.toLocaleString()}` };
  }

  state.player.cash -= item.price;

  if (item.type === 'weapon') {
    state.player.weapons[item.id] = (state.player.weapons[item.id] || 0) + 1;
  } else if (item.type === 'armor') {
    state.player.armor = { id: item.id, durability: item.durability ?? 100 };
  } else if (item.type === 'utility') {
    if (item.id === 'no_scent') {
      state.player.noScentCans = Math.min(10, (state.player.noScentCans || 0) + 1);
    } else if (item.id === 'flashbang') {
      if (!state.player.combatConsumables) state.player.combatConsumables = { flashbangs: 0, smokeGrenades: 0, medkits: 0 };
      state.player.combatConsumables.flashbangs = Math.min(10, (state.player.combatConsumables.flashbangs || 0) + 1);
    } else if (item.id === 'smoke_grenade') {
      if (!state.player.combatConsumables) state.player.combatConsumables = { flashbangs: 0, smokeGrenades: 0, medkits: 0 };
      state.player.combatConsumables.smokeGrenades = Math.min(10, (state.player.combatConsumables.smokeGrenades || 0) + 1);
    } else if (item.id === 'combat_medkit') {
      if (!state.player.combatConsumables) state.player.combatConsumables = { flashbangs: 0, smokeGrenades: 0, medkits: 0 };
      state.player.combatConsumables.medkits = Math.min(10, (state.player.combatConsumables.medkits || 0) + 1);
    }
  }

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'combat',
    message: `ARMORY: Acquired ${item.name} for $${item.price.toLocaleString()}.`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Acquired ${item.name}!` };
}

export function buyDrug(
  state: GameEngineState,
  drugId: string,
  units: number
): ActionResult {
  if (units <= 0) return { success: false, message: 'Invalid quantity' };

  const marketItem = state.market[drugId];
  if (!marketItem) return { success: false, message: 'Drug not found in market' };

  if (state.player.challengeModifiers?.syntheticsOnly && ORGANIC_DRUG_IDS.has(drugId)) {
    return { success: false, message: 'Challenge Rule: Organic botanical contraband is strictly prohibited in Pure Synthetics mode!' };
  }

  if (marketItem.availableUnits < units) {
    return { success: false, message: 'Not enough units available in market' };
  }

  const syndicateDiscount = getSyndicateDiscount(drugId, state.player.syndicateReputations);
  const unitPrice = Math.max(1, Math.round(marketItem.price * (1 - syndicateDiscount)));
  const totalCost = unitPrice * units;
  if (state.player.cash < totalCost) {
    return { success: false, message: "You can't afford this purchase" };
  }

  const currentUnits = getInventoryTotalUnits(state.player);
  const capacity = getCarryingCapacity(state.player);
  if (currentUnits + units > capacity) {
    return { success: false, message: 'You do not have enough pocket/coat capacity' };
  }

  // Deduct cash & market units
  state.player.cash -= totalCost;
  marketItem.availableUnits -= units;

  // Fake / Adulterated Contraband Acquisition Chance
  // Natural botanical crops (pot, mushrooms, peyote, kat) are not adulterated;
  // chemical/powder/pill synthetics risk counterfeit cuts during gluts or elevated heat.
  let fakeUnitsAcquired = 0;
  const isSyndicateAllied = syndicateDiscount >= 0.15;
  const ADULTERABLE_DRUGS = new Set([
    'cocaine', 'heroin', 'crack', 'fentanyl', 'ice', 'oxycodone',
    'ecstasy', 'special_k', 'super_soldier_serum', 'krokodil', 'tranq', 'speed', 'carfentanil'
  ]);
  if (!isSyndicateAllied && ADULTERABLE_DRUGS.has(drugId)) {
    const cityHeat = getCityHeat(state.player, state.player.currentCityId);
    if (marketItem.surge === 'crash' || cityHeat >= 20) {
      let fakeChance = 0.08; // 8% base chance during market instability or elevated heat
      if (marketItem.surge === 'crash') fakeChance += 0.10; // +10% during street market glut / price crash
      if (cityHeat >= 50) fakeChance += 0.07; // Elevated in high-heat cities

      if (Math.random() < fakeChance) {
        // Slipped in adulterated cuts (between 15% and 40% of batch, min 1, max units)
        fakeUnitsAcquired = Math.max(1, Math.min(units, Math.round(units * (0.15 + Math.random() * 0.25))));
      }
    }
  }

  // Update inventory with weighted average cost
  const existing = state.player.inventory[drugId];
  const prevFake = existing?.fakeUnits || 0;
  const newFakeUnits = prevFake + fakeUnitsAcquired;

  if (existing) {
    const totalExistingVal = existing.units * existing.avgCost;
    const newTotalUnits = existing.units + units;
    const newAvgCost = Math.round((totalExistingVal + totalCost) / newTotalUnits);
    state.player.inventory[drugId] = {
      drugId,
      units: newTotalUnits,
      avgCost: newAvgCost,
      ...(newFakeUnits > 0 ? { fakeUnits: newFakeUnits } : {}),
    };
  } else {
    state.player.inventory[drugId] = {
      drugId,
      units,
      avgCost: unitPrice,
      ...(newFakeUnits > 0 ? { fakeUnits: newFakeUnits } : {}),
    };
  }

  const drugName = DRUG_MAP.get(drugId)?.name ?? drugId;

  if (fakeUnitsAcquired > 0) {
    state.logs.unshift({
      day: state.player.currentDay,
      city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
      type: 'market',
      message: `⚠️ QUALITY ALERT: Street rumors whisper that counterfeit batches of ${drugName} are circulating in ${CITY_MAP.get(state.player.currentCityId)?.name ?? 'the area'}. Inspect purity before attempting to sell.`,
      timestamp: Date.now(),
    });
  }

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'market',
    message: `Bought ${units}x ${drugName} for $${totalCost.toLocaleString()} ($${marketItem.price.toLocaleString()}/unit).`,
    timestamp: Date.now(),
  });

  // Calculate heat generation based on contraband tier and volume
  const HIGH_HEAT_DRUGS = new Set(['cocaine', 'heroin', 'fentanyl', 'crack', 'meth']);
  const MID_HEAT_DRUGS = new Set(['ecstasy', 'opium', 'ketamine', 'lsd', 'shrooms', 'special_k', 'tranq', 'krokodil']);
  let baseHeat = 0;
  if (units >= 5) {
    if (HIGH_HEAT_DRUGS.has(drugId.toLowerCase())) {
      baseHeat = Math.max(2, Math.round(units / 8));
    } else if (MID_HEAT_DRUGS.has(drugId.toLowerCase())) {
      baseHeat = Math.max(1, Math.round(units / 15));
    } else {
      baseHeat = Math.max(1, Math.round(units / 25));
    }
  }

  if (baseHeat > 0) {
    const priorHeat = getCityHeat(state.player, state.player.currentCityId);
    modifyCityHeat(state, state.player.currentCityId, baseHeat);
    const updatedHeat = getCityHeat(state.player, state.player.currentCityId);
    if (updatedHeat >= 70 && priorHeat < 70) {
      state.logs.unshift({
        day: state.player.currentDay,
        city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
        type: 'combat',
        message: `🚨 HEAT ALERT: Police & DEA surveillance in ${CITY_MAP.get(state.player.currentCityId)?.name} is critical (${updatedHeat}%)! Raids and customs searches are imminent!`,
        timestamp: Date.now(),
      });
    }
  }

  return { success: true, message: `Successfully bought ${units} units.` };
}

export function sellDrug(
  state: GameEngineState,
  drugId: string,
  units: number
): ActionResult {
  if (units <= 0) return { success: false, message: 'Invalid quantity' };

  const inventoryItem = state.player.inventory[drugId];
  if (!inventoryItem || inventoryItem.units < units) {
    return { success: false, message: 'You do not hold that many units' };
  }

  const marketItem = state.market[drugId];
  if (!marketItem) return { success: false, message: 'No buyers in this city' };

  const fakeInHolding = inventoryItem.fakeUnits ?? 0;
  const fakeToSell = Math.min(fakeInHolding, units);
  const cleanToSell = units - fakeToSell;

  // Deduct units from inventory
  inventoryItem.units -= units;
  if (fakeToSell > 0) {
    inventoryItem.fakeUnits = Math.max(0, fakeInHolding - fakeToSell);
  }

  if (inventoryItem.units <= 0) {
    delete state.player.inventory[drugId];
  }

  const drugName = DRUG_MAP.get(drugId)?.name ?? drugId;
  const cityName = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';

  let totalRevenue = 0;
  let penaltyFine = 0;
  let heatPenalty = 0;

  // Handle counterfeit detection & penalties
  if (fakeToSell > 0) {
    penaltyFine = Math.min(state.player.cash, Math.max(250, Math.round(fakeToSell * marketItem.price * 0.4)));
    state.player.cash -= penaltyFine;

    heatPenalty = Math.min(25, 10 + fakeToSell * 2);
    modifyCityHeat(state, state.player.currentCityId, heatPenalty);

    if (!state.player.stats) state.player.stats = {};
    state.player.stats.fakeDrugsDiscovered = (state.player.stats.fakeDrugsDiscovered || 0) + fakeToSell;

    state.logs.unshift({
      day: state.player.currentDay,
      city: cityName,
      type: 'combat',
      message: `🚨 COUNTERFEIT SCANDAL: Street buyers in ${cityName} discovered ${fakeToSell}x ${drugName} was fake/adulterated bunk! Contraband confiscated, fined $${penaltyFine.toLocaleString()} in retribution, +${heatPenalty}% Heat!`,
      timestamp: Date.now(),
    });
  }

  // Handle revenue for clean genuine units
  if (cleanToSell > 0) {
    let unitSellPrice = marketItem.price;
    if (state.player.challengeModifiers?.syntheticMarginBonus && !ORGANIC_DRUG_IDS.has(drugId)) {
      unitSellPrice = Math.round(unitSellPrice * (1 + state.player.challengeModifiers.syntheticMarginBonus));
    }
    totalRevenue = unitSellPrice * cleanToSell;
    state.player.cash += totalRevenue;

    const costBasis = inventoryItem.avgCost * cleanToSell;
    const profit = totalRevenue - costBasis;
    const profitSign = profit >= 0 ? '+' : '-';
    const profitText = `${profitSign}$${Math.abs(profit).toLocaleString()}`;

    if (cleanToSell >= 50) {
      const sellHeat = Math.min(5, Math.floor(cleanToSell / 50));
      modifyCityHeat(state, state.player.currentCityId, sellHeat);
    }

    state.logs.unshift({
      day: state.player.currentDay,
      city: cityName,
      type: 'market',
      message: `Sold ${cleanToSell}x ${drugName} for $${totalRevenue.toLocaleString()} (${profitText} profit).`,
      timestamp: Date.now(),
    });
  }

  if (fakeToSell > 0 && cleanToSell === 0) {
    return {
      success: false,
      message: `Counterfeit bust! All ${fakeToSell}x units were fake and confiscated. Fined $${penaltyFine.toLocaleString()} and gained +${heatPenalty}% heat!`,
    };
  }

  if (fakeToSell > 0) {
    return {
      success: true,
      message: `Sold ${cleanToSell} pure units for $${totalRevenue.toLocaleString()}. Note: ${fakeToSell} fake units were confiscated by angry buyers (Fined $${penaltyFine.toLocaleString()}, +${heatPenalty}% heat)!`,
    };
  }

  return { success: true, message: `Successfully sold ${units} units.` };
}

export function dumpDrug(
  state: GameEngineState,
  drugId: string,
  units: number
): ActionResult {
  const inventoryItem = state.player.inventory[drugId];
  if (!inventoryItem || inventoryItem.units < units) {
    return { success: false, message: 'You do not hold that many units' };
  }

  inventoryItem.units -= units;
  if (inventoryItem.units <= 0) {
    delete state.player.inventory[drugId];
  }

  const drugName = DRUG_MAP.get(drugId)?.name ?? drugId;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'market',
    message: `Dumped ${units}x ${drugName} into the sewer to free up space.`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Dumped ${units} units.` };
}

export function dumpFakeDrugs(state: GameEngineState, drugId: string): ActionResult {
  const inventoryItem = state.player.inventory[drugId];
  const drug = DRUG_MAP.get(drugId);
  const drugName = drug?.name ?? drugId;
  const cityName = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';

  if (!inventoryItem || !inventoryItem.fakeUnits || inventoryItem.fakeUnits <= 0) {
    return { success: false, message: `No counterfeit or adulterated units found in your ${drugName} holding.` };
  }

  const flushedCount = inventoryItem.fakeUnits;
  inventoryItem.fakeUnits = 0;
  inventoryItem.units -= flushedCount;

  if (inventoryItem.units <= 0) {
    delete state.player.inventory[drugId];
  }

  if (!state.player.stats) state.player.stats = {};
  state.player.stats.fakeDrugsFlushed = (state.player.stats.fakeDrugsFlushed || 0) + flushedCount;

  state.logs.unshift({
    day: state.player.currentDay,
    city: cityName,
    type: 'market',
    message: `SANITIZATION: Safely flushed ${flushedCount.toLocaleString()}x counterfeit ${drugName} down the safehouse drain with zero heat penalty.`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Safely flushed ${flushedCount}x fake/adulterated ${drugName} units down the drain.`,
  };
}

export function depositToVault(
  state: GameEngineState,
  drugId: string,
  units: number,
  cityId?: string
): ActionResult {
  const targetCity = cityId || state.player.currentCityId;
  const cityName = CITY_MAP.get(targetCity)?.name ?? targetCity;
  const drug = DRUG_MAP.get(drugId);
  if (!drug) return { success: false, message: 'Invalid contraband type' };

  if (units <= 0 || !Number.isInteger(units)) {
    return { success: false, message: 'Must deposit at least 1 unit' };
  }

  const inventoryItem = state.player.inventory[drugId];
  if (!inventoryItem || inventoryItem.units < units) {
    return { success: false, message: `You do not have ${units} units of ${drug.name} in your pocket` };
  }

  const currentVaultUnits = getCityVaultUnits(state.player, targetCity);
  const maxVaultCapacity = getCityVaultCapacity(state.player, targetCity);
  if (currentVaultUnits + units > maxVaultCapacity) {
    const availableSpace = Math.max(0, maxVaultCapacity - currentVaultUnits);
    return {
      success: false,
      message: `Vault capacity exceeded in ${cityName}! Available space: ${availableSpace} units (Max: ${maxVaultCapacity}).`,
    };
  }

  // Intercept and destroy counterfeit units before vault storage
  const fakeInHolding = inventoryItem.fakeUnits ?? 0;
  const fakeToDeposit = Math.min(fakeInHolding, units);
  const cleanToDeposit = units - fakeToDeposit;

  if (fakeToDeposit > 0) {
    inventoryItem.fakeUnits = Math.max(0, fakeInHolding - fakeToDeposit);
    state.logs.unshift({
      day: state.player.currentDay,
      city: cityName,
      type: 'combat',
      message: `⚠️ VAULT CONTAMINATION INTERCEPTED: Safehouse security tested your deposit and incinerated ${fakeToDeposit}x counterfeit ${drug.name}! Only clean units accepted.`,
      timestamp: Date.now(),
    });
  }

  // Deduct from pocket inventory
  inventoryItem.units -= units;
  if (inventoryItem.units <= 0) {
    delete state.player.inventory[drugId];
  }

  // Add clean units to city vault
  if (cleanToDeposit > 0) {
    if (!state.player.vaults) state.player.vaults = {};
    if (!state.player.vaults[targetCity]) state.player.vaults[targetCity] = {};
    state.player.vaults[targetCity][drugId] = (state.player.vaults[targetCity][drugId] || 0) + cleanToDeposit;
  }

  state.logs.unshift({
    day: state.player.currentDay,
    city: cityName,
    type: 'market',
    message: `STASH VAULT: Deposited ${cleanToDeposit.toLocaleString()} units of ${drug.name} into ${cityName} safehouse vault.${fakeToDeposit > 0 ? ` (${fakeToDeposit} fake units incinerated)` : ''}`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: fakeToDeposit > 0
      ? `Stashed ${cleanToDeposit} pure units in ${cityName} vault (${fakeToDeposit} counterfeit units incinerated by security).`
      : `Securely stashed ${units.toLocaleString()} units of ${drug.name} in ${cityName} vault.`,
  };
}

export function withdrawFromVault(
  state: GameEngineState,
  drugId: string,
  units: number,
  cityId?: string
): ActionResult {
  const targetCity = cityId || state.player.currentCityId;
  const cityName = CITY_MAP.get(targetCity)?.name ?? targetCity;
  const drug = DRUG_MAP.get(drugId);
  if (!drug) return { success: false, message: 'Invalid contraband type' };

  if (units <= 0 || !Number.isInteger(units)) {
    return { success: false, message: 'Must withdraw at least 1 unit' };
  }

  const storedUnits = state.player.vaults?.[targetCity]?.[drugId] ?? 0;
  if (storedUnits < units) {
    return {
      success: false,
      message: `Only ${storedUnits.toLocaleString()} units of ${drug.name} stored in ${cityName} vault`,
    };
  }

  const currentCarrying = getInventoryTotalUnits(state.player);
  const maxCarrying = getCarryingCapacity(state.player);
  if (currentCarrying + units > maxCarrying) {
    const availableSpace = Math.max(0, maxCarrying - currentCarrying);
    return {
      success: false,
      message: `Pocket inventory full! Can only carry ${availableSpace} more units (Capacity: ${maxCarrying}).`,
    };
  }

  // Deduct from vault
  state.player.vaults[targetCity][drugId] -= units;
  if (state.player.vaults[targetCity][drugId] <= 0) {
    delete state.player.vaults[targetCity][drugId];
  }

  // Add to pocket inventory
  if (!state.player.inventory[drugId]) {
    state.player.inventory[drugId] = {
      drugId,
      units,
      avgCost: drug.basePrice,
    };
  } else {
    state.player.inventory[drugId].units += units;
  }

  state.logs.unshift({
    day: state.player.currentDay,
    city: cityName,
    type: 'market',
    message: `STASH VAULT: Withdrew ${units.toLocaleString()} units of ${drug.name} from ${cityName} vault into pocket inventory.`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Withdrew ${units.toLocaleString()} units of ${drug.name} from ${cityName} vault.`,
  };
}

export function getShipmentCost(shipperId: string, drugId: string, units: number): number {
  const shipper = SHIPPER_MAP.get(shipperId);
  const drug = DRUG_MAP.get(drugId);
  if (!shipper || !drug) return 0;
  const cargoEstValue = drug.basePrice * units;
  return Math.max(200, Math.round(cargoEstValue * shipper.costPercent * 0.10));
}

export function dispatchCourier(
  state: GameEngineState,
  params: {
    shipperId: string;
    originCityId?: string;
    targetCityId: string;
    drugId: string;
    units: number;
    source?: 'inventory' | 'vault';
  }
): ActionResult {
  const originCityId = params.originCityId || state.player.currentCityId;
  const originCity = CITY_MAP.get(originCityId);
  const targetCity = CITY_MAP.get(params.targetCityId);
  const drug = DRUG_MAP.get(params.drugId);
  const shipper = SHIPPER_MAP.get(params.shipperId);

  if (!originCity || !targetCity) return { success: false, message: 'Invalid origin or destination city' };
  if (originCityId === params.targetCityId) {
    return { success: false, message: 'Destination must be different from origin city' };
  }
  if (!drug) return { success: false, message: 'Invalid contraband type' };
  if (!shipper) return { success: false, message: 'Invalid courier contractor' };
  if (params.units <= 0 || !Number.isInteger(params.units)) {
    return { success: false, message: 'Must ship at least 1 unit' };
  }

  const cost = getShipmentCost(params.shipperId, params.drugId, params.units);
  if (state.player.cash < cost) {
    return { success: false, message: `Insufficient cash to hire courier. Need $${cost.toLocaleString()}` };
  }

  const source = params.source || (originCityId === state.player.currentCityId ? 'inventory' : 'vault');

  if (source === 'inventory') {
    if (originCityId !== state.player.currentCityId) {
      return { success: false, message: 'Can only ship from pocket inventory in your current city' };
    }
    const inv = state.player.inventory[params.drugId];
    if (!inv || inv.units < params.units) {
      return { success: false, message: `Not enough ${drug.name} in pocket inventory to ship` };
    }
    inv.units -= params.units;
    if (inv.units <= 0) {
      delete state.player.inventory[params.drugId];
    }
  } else {
    const stored = state.player.vaults?.[originCityId]?.[params.drugId] ?? 0;
    if (stored < params.units) {
      return { success: false, message: `Not enough ${drug.name} in ${originCity.name} vault to dispatch` };
    }
    state.player.vaults[originCityId][params.drugId] -= params.units;
    if (state.player.vaults[originCityId][params.drugId] <= 0) {
      delete state.player.vaults[originCityId][params.drugId];
    }
  }

  // Deduct shipping fee
  state.player.cash -= cost;

  // Transit days: 1 day for quick/diplomatic couriers, 2 days for standard
  const transitDays = params.shipperId === 'quicker_shipper' || params.shipperId === 'international_couriers' ? 1 : 2;

  const newShipment: ActiveShipment = {
    id: `ship_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    shipperId: params.shipperId,
    originCityId,
    targetCityId: params.targetCityId,
    drugId: params.drugId,
    units: params.units,
    costPaid: cost,
    daysRemaining: transitDays,
    status: 'in_transit',
  };

  if (!state.player.shipments) state.player.shipments = [];
  state.player.shipments.push(newShipment);

  state.logs.unshift({
    day: state.player.currentDay,
    city: originCity.name,
    type: 'travel',
    message: `LOGISTICS DISPATCH: Contracted ${shipper.name} to smuggle ${params.units.toLocaleString()}x ${drug.name} from ${originCity.name} to ${targetCity.name} (Fee: $${cost.toLocaleString()}, ETA: ${transitDays}d).`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Dispatched ${params.units.toLocaleString()} units of ${drug.name} to ${targetCity.name} via ${shipper.name}!`,
  };
}

export function purchaseIntelTip(state: GameEngineState, tipId: string): ActionResult {
  if (!state.player.activeIntel) {
    state.player.activeIntel = [];
  }
  const tip = state.player.activeIntel.find((t) => t.id === tipId);
  if (!tip) return { success: false, message: 'Intel report no longer available' };
  if (tip.purchased) return { success: false, message: 'Intel report already purchased' };
  if (state.player.cash < tip.cost) {
    return { success: false, message: `Insufficient cash to purchase intel. Need $${tip.cost.toLocaleString()}` };
  }

  state.player.cash -= tip.cost;
  tip.purchased = true;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'Terminal',
    type: 'finance',
    message: `DECRYPTED INTEL WIRE: Purchased inside intelligence on ${tip.drugName} in ${tip.cityName} for $${tip.cost.toLocaleString()}. (Target ETA: Day ${tip.targetDay})`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Intelligence acquired! "${tip.headline}" expected on Day ${tip.targetDay}.`,
  };
}

export function depositBank(state: GameEngineState, amount: number): ActionResult {
  if (state.player.isBankFrozen) {
    return {
      success: false,
      message: 'BANK ASSETS FROZEN: US Federal Grand Jury RICO injunction has locked all accounts! Escape to a Sovereign Sanctuary to restore offshore access.',
    };
  }
  if (amount <= 0) return { success: false, message: 'Invalid amount' };
  if (state.player.cash < amount) return { success: false, message: 'Not enough cash on hand' };

  state.player.cash -= amount;
  state.player.bank += amount;

  // Unlaundered raw cash deposits into bank trigger FinCEN scrutiny if substantial
  let fincenAlert = '';
  const hasFincenAuditor = hasActiveOfficial(state.player, 'fincen_auditor');
  if (amount >= 50000 && !hasFincenAuditor) {
    const ricoIncrease = Math.min(8, Math.max(2, Math.round(amount / 50000)));
    state.player.ricoMeter = Math.min(100, (state.player.ricoMeter || 0) + ricoIncrease);
    fincenAlert = ` (⚠️ CTR Flag: +${ricoIncrease}% RICO Indictment Meter, now ${state.player.ricoMeter}%)`;
    if (state.player.ricoMeter >= 100) {
      state.player.isBankFrozen = true;
    }
  }

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'finance',
    message: `Deposited $${amount.toLocaleString()} into your offshore bank account.${fincenAlert}`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Deposit successful.${fincenAlert}` };
}

export function withdrawBank(state: GameEngineState, amount: number): ActionResult {
  if (state.player.isBankFrozen) {
    return {
      success: false,
      message: 'BANK ASSETS FROZEN: US Federal Grand Jury RICO injunction has locked all accounts! Escape to a Sovereign Sanctuary to restore offshore access.',
    };
  }
  if (amount <= 0) return { success: false, message: 'Invalid amount' };
  if (state.player.bank < amount) return { success: false, message: 'Insufficient bank balance' };

  state.player.bank -= amount;
  state.player.cash += amount;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'finance',
    message: `Withdrew $${amount.toLocaleString()} from your bank account.`,
    timestamp: Date.now(),
  });

  return { success: true, message: 'Withdrawal successful' };
}

export interface EarlyRepayDetails {
  actualPayment: number;
  isEarly: boolean;
  feeRate: number;
  earlyFee: number;
  totalCashRequired: number;
}

export function getEarlyRepayDetails(player: PlayerState, amount: number): EarlyRepayDetails {
  const actualPayment = Math.max(0, Math.min(amount, player.debt));
  const shark = player.loanSharkId ? SHARK_MAP.get(player.loanSharkId) : null;
  const isEarly = (player.loanDaysLeft ?? 0) > 0 && actualPayment > 0;
  const feeRate = isEarly ? (shark?.earlyFeeRate ?? shark?.interestRate ?? 0.10) : 0;
  const earlyFee = isEarly ? Math.round(actualPayment * feeRate) : 0;
  const totalCashRequired = actualPayment + earlyFee;

  return {
    actualPayment,
    isEarly,
    feeRate,
    earlyFee,
    totalCashRequired,
  };
}

export function repayLoan(state: GameEngineState, amount: number): ActionResult {
  if (amount <= 0) return { success: false, message: 'Invalid amount' };
  if (state.player.debt <= 0) return { success: false, message: 'You have no outstanding debt' };

  const details = getEarlyRepayDetails(state.player, amount);
  const { actualPayment, isEarly, feeRate, earlyFee, totalCashRequired } = details;

  if (actualPayment <= 0) return { success: false, message: 'Invalid payment amount' };

  if (state.player.cash < totalCashRequired) {
    if (isEarly && earlyFee > 0) {
      return {
        success: false,
        message: `Not enough cash! Repaying $${actualPayment.toLocaleString()} debt early requires $${totalCashRequired.toLocaleString()} (including a $${earlyFee.toLocaleString()} early payment charge, ${Math.round(feeRate * 100)}% fee with ${state.player.loanDaysLeft} days remaining).`,
      };
    }
    return { success: false, message: 'Not enough cash' };
  }

  state.player.cash -= totalCashRequired;
  state.player.debt -= actualPayment;

  const shark = state.player.loanSharkId ? SHARK_MAP.get(state.player.loanSharkId) : null;
  const sharkName = shark?.name ?? 'Loan Shark';

  if (state.player.debt === 0) {
    state.player.loanSharkId = null;
    state.player.loanDaysLeft = 0;
  }

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'finance',
    message: isEarly && earlyFee > 0
      ? `Paid $${actualPayment.toLocaleString()} toward debt + $${earlyFee.toLocaleString()} early payment charge to ${sharkName} (${Math.round(feeRate * 100)}% prepayment penalty, ${state.player.loanDaysLeft} days left). Remaining: $${state.player.debt.toLocaleString()}.`
      : `Paid $${actualPayment.toLocaleString()} toward your loan shark debt. (Remaining: $${state.player.debt.toLocaleString()})`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: isEarly && earlyFee > 0
      ? `Paid $${actualPayment.toLocaleString()} debt + $${earlyFee.toLocaleString()} early payment charge to ${sharkName}.`
      : `Paid $${actualPayment.toLocaleString()} toward debt.`,
  };
}

export function borrowLoan(state: GameEngineState, sharkId: string, amount: number): ActionResult {
  if (state.player.debt > 0) {
    return { success: false, message: 'You already have an outstanding debt with a loan shark' };
  }

  const shark = SHARK_MAP.get(sharkId);
  if (!shark) return { success: false, message: 'Loan shark not found' };

  const maxAllowed = Math.min(shark.maxLoan, Math.max(1000, state.player.cash * shark.multiplier));
  if (amount > maxAllowed) {
    return { success: false, message: `Shark refuses to lend more than $${Math.round(maxAllowed).toLocaleString()}` };
  }

  state.player.cash += amount;
  state.player.debt = amount;
  state.player.loanSharkId = sharkId;
  state.player.loanDaysLeft = shark.repayDays;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'finance',
    message: `Borrowed $${amount.toLocaleString()} from ${shark.name} at ${Math.round(shark.interestRate * 100)}% daily interest! Repayment due in ${shark.repayDays} days.`,
    timestamp: Date.now(),
  });

  return { success: true, message: 'Loan approved' };
}

export function advanceDay(state: GameEngineState, isTravel = false): void {
  if (state.player.isGameOver) return;

  const currentCity = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';

  // 1. Debt compounding interest
  if (state.player.debt > 0 && state.player.loanSharkId) {
    const shark = SHARK_MAP.get(state.player.loanSharkId);
    const rate = shark ? shark.interestRate : 0.1;
    const interest = Math.round(state.player.debt * rate);
    state.player.debt += interest;
    state.player.loanDaysLeft = Math.max(0, state.player.loanDaysLeft - 1);

    if (state.player.loanDaysLeft === 0 && state.player.debt > 0) {
      // Overdue! Loan shark enforcers attack!
      state.logs.unshift({
        day: state.player.currentDay,
        city: currentCity,
        type: 'combat',
        message: `WARNING: Your loan with ${shark?.name ?? 'the shark'} is overdue! Enforcers have tracked you down!`,
        timestamp: Date.now(),
      });
      state.player.activeEncounter = {
        id: `shark_${Date.now()}`,
        enemyId: 'shark_enforcers',
        enemyName: `${shark?.name ?? 'Loan Shark'}'s Enforcers`,
        count: 3,
        danger: 6,
        bribeCost: Math.round(state.player.debt * 0.5),
        canFlee: true,
        canBribe: true,
        status: 'active',
      };
    }
  }

  // 2. Bank interest: 0.1% daily base + Swiss tier bonus
  if (state.player.bank > 0) {
    const swissTier = getSwissSecurityTier(state.player.swissAccountTier);
    const effectiveRate = 0.001 + (swissTier.dailyInterestBonus / 100);
    const bankInterest = Math.round(state.player.bank * effectiveRate);
    state.player.bank += bankInterest;
  }

  // 2a. Swiss Vault Bearer Bonds Yield Accrual
  if (state.player.bearerBonds && state.player.bearerBonds.length > 0) {
    const { totalYieldAccrued, updatedBonds } = processDailyBearerBonds(
      state.player.bearerBonds,
      state.player.currentDay
    );
    state.player.bearerBonds = updatedBonds;
    if (totalYieldAccrued > 0) {
      state.logs.unshift({
        day: state.player.currentDay,
        city: currentCity,
        type: 'finance',
        message: `SWISS VAULT: Accrued +$${totalYieldAccrued.toLocaleString()} daily yield across active bearer bonds.`,
        timestamp: Date.now(),
      });
    }
  }

  // 2b. Corporate Shell Businesses Passive Income
  const passiveProfit = calculateTotalPassiveIncome(state.player.ownedBusinesses);
  if (passiveProfit > 0) {
    state.player.bank += passiveProfit;
    state.logs.unshift({
      day: state.player.currentDay,
      city: currentCity,
      type: 'finance',
      message: `CORPORATE REVENUE: Received $${passiveProfit.toLocaleString()} clean dividends from ${state.player.ownedBusinesses?.length || 0} owned shell companies (credited to Bank).`,
      timestamp: Date.now(),
    });
  }

  // 2c. Corporate Heat Cooling
  const corporateHeatCooling = calculateTotalHeatShield(state.player.ownedBusinesses);
  if (corporateHeatCooling > 0) {
    modifyCityHeat(state, state.player.currentCityId, -corporateHeatCooling);
  }

  // 2d. Reset daily laundering quota
  state.player.launderedToday = 0;

  // 3. Health recovery for small scrapes
  if (state.player.health < 100 && state.player.health > 80) {
    state.player.health = Math.min(100, state.player.health + 2);
  }

  // 4. Rank promotion & demotion check
  const totalWealth = getTotalWealth(state.player);
  const nextRank = getNextRank(state.player);
  const currentRank = RANK_MAP.get(state.player.currentRankId);
  const prevRank = getPreviousRank(state.player);

  if (nextRank && totalWealth >= nextRank.cashRequired) {
    state.player.daysHoldingRankCash = (state.player.daysHoldingRankCash || 0) + 1;
    state.player.daysInsolvent = 0;

    if (state.player.daysHoldingRankCash >= 3) {
      state.player.currentRankId = nextRank.id;
      if (!state.player.isEndless) {
        state.player.maxDays += nextRank.bonusDays;
      }
      state.player.daysHoldingRankCash = 0;
      state.logs.unshift({
        day: state.player.currentDay,
        city: currentCity,
        type: 'system',
        message: `PROMOTION! You are now a ${nextRank.name}! Your carrying container upgraded to ${nextRank.container} (${nextRank.capacity} units).${!state.player.isEndless ? ` Earned +${nextRank.bonusDays} bonus days!` : ''}`,
        timestamp: Date.now(),
      });
    }
  } else {
    state.player.daysHoldingRankCash = 0;

    // Check demotion if wealth has dropped below the threshold for current rank
    if (prevRank && currentRank && totalWealth < currentRank.cashRequired) {
      state.player.daysInsolvent = (state.player.daysInsolvent || 0) + 1;

      if (state.player.daysInsolvent === 1) {
        state.logs.unshift({
          day: state.player.currentDay,
          city: currentCity,
          type: 'finance',
          message: `⚠️ [INSOLVENCY WARNING - Day 1/3]: Net worth ($${totalWealth.toLocaleString()}) dropped below requirement for ${currentRank.name} ($${currentRank.cashRequired.toLocaleString()}). Recover within 2 days or face demotion!`,
          timestamp: Date.now(),
        });
      } else if (state.player.daysInsolvent === 2) {
        state.logs.unshift({
          day: state.player.currentDay,
          city: currentCity,
          type: 'finance',
          message: `🚨 [FINAL DEMOTION NOTICE - Day 2/3]: Creditors and cartels demand liquidity! If net worth remains below $${currentRank.cashRequired.toLocaleString()} tomorrow, your status and container will be stripped!`,
          timestamp: Date.now(),
        });
      } else if (state.player.daysInsolvent >= 3) {
        state.player.currentRankId = prevRank.id;
        state.player.daysInsolvent = 0;

        const newCapacity = getCarryingCapacity(state.player);
        const totalUnits = getInventoryTotalUnits(state.player);

        if (totalUnits > newCapacity) {
          const excess = totalUnits - newCapacity;
          let overflowMessage = '';
          const hasSafehouse = state.player.ownedProperties && state.player.ownedProperties.length > 0;

          if (hasSafehouse) {
            const firstProp = PROPERTY_MAP.get(state.player.ownedProperties[0]);
            let remainingToTransfer = excess;
            if (!state.player.vaults) state.player.vaults = {};
            if (!state.player.vaults[state.player.currentCityId]) state.player.vaults[state.player.currentCityId] = {};
            const localVault = state.player.vaults[state.player.currentCityId];

            const itemKeys = Object.keys(state.player.inventory);
            for (const key of itemKeys) {
              if (remainingToTransfer <= 0) break;
              const item = state.player.inventory[key];
              if (!item) continue;
              const transferCount = Math.min(item.units, remainingToTransfer);
              item.units -= transferCount;
              localVault[key] = (localVault[key] || 0) + transferCount;
              remainingToTransfer -= transferCount;
              if (item.units <= 0) {
                delete state.player.inventory[key];
              }
            }
            overflowMessage = ` Luckily, your safehouse (${firstProp?.name ?? 'Vault'}) secured ${excess.toLocaleString()} units of overflow cargo directly into your local stash vault.`;
          } else {
            let remainingToTrim = excess;
            const itemKeys = Object.keys(state.player.inventory);
            for (const key of itemKeys) {
              if (remainingToTrim <= 0) break;
              const item = state.player.inventory[key];
              if (!item) continue;
              const removeCount = Math.min(item.units, remainingToTrim);
              item.units -= removeCount;
              remainingToTrim -= removeCount;
              if (item.units <= 0) {
                delete state.player.inventory[key];
              }
            }
            overflowMessage = ` Street scavengers and rival dealers looted ${excess.toLocaleString()} units of excess cargo you could no longer carry!`;
          }

          state.logs.unshift({
            day: state.player.currentDay,
            city: currentCity,
            type: 'combat',
            message: `📉 DEMOTED to ${prevRank.name}! Your container was downsized to ${prevRank.container} (${prevRank.capacity} units) due to 3 days of insolvency.${overflowMessage}`,
            timestamp: Date.now(),
          });
        } else {
          state.logs.unshift({
            day: state.player.currentDay,
            city: currentCity,
            type: 'system',
            message: `📉 DEMOTED to ${prevRank.name}! Your status was revoked and container downsized to ${prevRank.container} (${prevRank.capacity} units) due to prolonged insolvency.`,
            timestamp: Date.now(),
          });
        }
      }
    } else {
      state.player.daysInsolvent = 0;
    }
  }

  // 5. Advance calendar
  state.player.currentDay += 1;
  state.player.visitedVaultToday = false;

  // Passive heat decay across all cities
  for (const c of CITIES) {
    modifyCityHeat(state, c.id, -2);
  }
  // Extra safehouse heat reduction in active city
  const heatReduction = getPlayerHeatReduction(state.player);
  if (heatReduction > 0) {
    modifyCityHeat(state, state.player.currentCityId, -Math.round(heatReduction * 6));
  }

  // 5b. Process active courier shipments
  if (state.player.shipments && state.player.shipments.length > 0) {
    for (const shipment of state.player.shipments) {
      if (shipment.status !== 'in_transit') continue;
      shipment.daysRemaining -= 1;
      if (shipment.daysRemaining <= 0) {
        const shipper = SHIPPER_MAP.get(shipment.shipperId);
        const targetCityName = CITY_MAP.get(shipment.targetCityId)?.name ?? shipment.targetCityId;
        const drugName = DRUG_MAP.get(shipment.drugId)?.name ?? shipment.drugId;

        // Calculate customs interdiction risk based on courier reliability and route heat
        const originHeat = getCityHeat(state.player, shipment.originCityId);
        const targetHeat = getCityHeat(state.player, shipment.targetCityId);
        const heatPenalty = ((originHeat + targetHeat) / 200) * 0.15;
        const effectiveReliability = Math.max(0.10, (shipper?.reliability ?? 0.80) - heatPenalty);

        if (Math.random() <= effectiveReliability) {
          shipment.status = 'delivered';
          if (!state.player.vaults) state.player.vaults = {};
          if (!state.player.vaults[shipment.targetCityId]) state.player.vaults[shipment.targetCityId] = {};
          state.player.vaults[shipment.targetCityId][shipment.drugId] =
            (state.player.vaults[shipment.targetCityId][shipment.drugId] || 0) + shipment.units;

          state.logs.unshift({
            day: state.player.currentDay,
            city: targetCityName,
            type: 'travel',
            message: `📦 COURIER ARRIVAL: ${shipper?.name ?? 'Courier'} successfully delivered ${shipment.units.toLocaleString()}x ${drugName} into your ${targetCityName} safehouse vault!`,
            timestamp: Date.now(),
          });
        } else {
          shipment.status = 'seized';
          modifyCityHeat(state, shipment.targetCityId, 8);
          state.logs.unshift({
            day: state.player.currentDay,
            city: targetCityName,
            type: 'combat',
            message: `⚠️ COURIER SEIZED: Customs authorities intercepted ${shipment.units.toLocaleString()}x ${drugName} bound for ${targetCityName}! Smuggler was detained and contraband confiscated.`,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  // 5c. Refresh underworld inside intel tips
  state.player.activeIntel = generateIntelTips(state.player.currentDay, state.player.activeIntel);

  // 5d. Refresh & update syndicate contracts
  if (state.player.syndicateContracts) {
    for (const contract of state.player.syndicateContracts) {
      if (contract.status === 'active') {
        contract.daysRemaining -= 1;
        if (contract.daysRemaining <= 0) {
          contract.status = 'failed';
          if (!state.player.syndicateReputations) state.player.syndicateReputations = {};
          state.player.syndicateReputations[contract.syndicateId] = Math.max(
            -100,
            (state.player.syndicateReputations[contract.syndicateId] || 0) - contract.repPenalty
          );
          state.logs.unshift({
            day: state.player.currentDay,
            city: currentCity,
            type: 'combat',
            message: `⚠️ CONTRACT BREACH: Failed to deliver ${contract.title} in time! Syndicate reputation degraded by -${contract.repPenalty}.`,
            timestamp: Date.now(),
          });
        }
      }
    }
  }
  state.player.syndicateContracts = generateSyndicateContracts(
    state.player.currentDay,
    state.player.currentCityId,
    state.player.syndicateContracts || []
  );

  // 5e. Advance active clandestine lab cook batches
  advanceCookBatches(state);

  // 5f. Process corruption payroll retainers & Grand Jury RICO Indictment Meter
  processCorruptionAndRicoDaily(state, isTravel);

  // 5g. Process Syndicate Turf Wars and Black Swan Macro Shocks
  processTurfWarsAndMacroEventsDaily(state);

  // Check game over by calendar (only in timed modes, not Endless)
  if (!state.player.isEndless && state.player.currentDay > state.player.maxDays) {
    state.player.isGameOver = true;
    state.player.gameOverReason = `Time limit reached! You finished your run on Day ${state.player.maxDays} with $${totalWealth.toLocaleString()} net worth.`;
    state.logs.unshift({
      day: state.player.currentDay,
      city: currentCity,
      type: 'system',
      message: `GAME OVER: ${state.player.gameOverReason}`,
      timestamp: Date.now(),
    });
    return;
  }

  // 6. Regenerate market for current city with inside intelligence forecasting, turf wars, and macro events
  const { market, events } = generateCityMarket(
    state.player.currentCityId,
    state.player.currentDay,
    state.player.activeIntel,
    state.player.activeTurfWars,
    state.player.activeMacroEvents
  );
  state.market = market;

  for (const ev of events) {
    state.logs.unshift({
      day: state.player.currentDay,
      city: currentCity,
      type: 'event',
      message: ev,
      timestamp: Date.now(),
    });
  }

  // Check if an active purchased tip triggered in this city today
  const confirmedPurchasedTip = state.player.activeIntel?.find(
    (t) => t.cityId === state.player.currentCityId && t.targetDay === state.player.currentDay && t.purchased
  );
  if (confirmedPurchasedTip) {
    state.logs.unshift({
      day: state.player.currentDay,
      city: currentCity,
      type: 'market',
      message: `📡 [INSIDER INTEL CONFIRMED]: Inside tip on ${confirmedPurchasedTip.drugName} materialized! "${confirmedPurchasedTip.headline}"`,
      timestamp: Date.now(),
    });
  }

  // 7. Check DEA raid from extreme city heat (>=70%)
  const currentHeat = getCityHeat(state.player, state.player.currentCityId);
  const contrabandUnits = getInventoryTotalUnits(state.player);
  if (!state.player.activeEncounter && !isTravel && currentHeat >= 70 && contrabandUnits > 0) {
    const hasDispatcher = hasActiveOfficial(state.player, 'police_dispatcher');
    // Dispatcher intercepts tactical communications, cutting raid ambush probability by 70%
    const dispatcherFactor = hasDispatcher ? 0.3 : 1.0;
    const raidChance = ((currentHeat - 65) / 100) * (1 - heatReduction) * dispatcherFactor;
    if (Math.random() < raidChance) {
      state.player.activeEncounter = {
        id: `dea_${Date.now()}`,
        enemyId: 'dea_tactical',
        enemyName: 'DEA Federal Strike Force',
        count: hasDispatcher ? 3 : 5,
        danger: hasDispatcher ? 6 : 8,
        bribeCost: Math.max(5000, Math.round(state.player.cash * 0.45)),
        canFlee: hasDispatcher, // Dispatcher gave early warning so escape corridors are open!
        canBribe: true,
        status: 'active',
      };
      state.logs.unshift({
        day: state.player.currentDay,
        city: currentCity,
        type: 'combat',
        message: hasDispatcher
          ? `🚨 FEDERAL RAID (EARLY WARNING): DEA strike team breached the perimeter! Because of your Police Dispatcher's early warning, you prepared tactical defense (fleeing enabled, reduced tactical count)!`
          : `🚨 FEDERAL RAID! DEA strike team kicked in the door! Your local heat was ${currentHeat}%. Defend yourself or negotiate!`,
        timestamp: Date.now(),
      });
    }
  }

  // 8. Random daily encounters (only if not already in combat)
  if (!state.player.activeEncounter && !isTravel) {
    rollRandomEncounter(state);
  }
}

function rollRandomEncounter(state: GameEngineState): void {
  const roll = Math.random();
  const currentCity = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';

  if (roll < 0.05) {
    // Found wallet
    const found = Math.floor(150 + Math.random() * 600);
    state.player.cash += found;
    state.logs.unshift({
      day: state.player.currentDay,
      city: currentCity,
      type: 'event',
      message: `Lucky find! You found an abandoned wallet on the street with $${found.toLocaleString()} in cash!`,
      timestamp: Date.now(),
    });
  } else if (roll < 0.09) {
    // Pickpocket on subway
    if (state.player.cash > 200) {
      const lost = Math.min(state.player.cash, Math.floor(100 + Math.random() * 400));
      state.player.cash -= lost;
      state.logs.unshift({
        day: state.player.currentDay,
        city: currentCity,
        type: 'event',
        message: `Unlucky! You get off the subway and find $${lost.toLocaleString()} has been lifted from your pocket!`,
        timestamp: Date.now(),
      });
    }
  } else if (roll < 0.13) {
    // Police patrol encounter
    const policeRisk = CITY_MAP.get(state.player.currentCityId)?.policeRisk ?? 0.2;
    if (Math.random() < policeRisk) {
      state.player.activeEncounter = {
        id: `encounter_${Date.now()}`,
        enemyId: 'police',
        enemyName: 'the Police',
        count: Math.floor(2 + Math.random() * 3),
        danger: 5,
        bribeCost: Math.max(500, Math.round(state.player.cash * 0.3)),
        canFlee: true,
        canBribe: true,
        status: 'active',
      };
      state.logs.unshift({
        day: state.player.currentDay,
        city: currentCity,
        type: 'combat',
        message: 'Sirens blare! The police are closing in on your position!',
        timestamp: Date.now(),
      });
    }
  }
}

export function travelToCity(
  state: GameEngineState,
  targetCityId: string,
  seatClass: FlightSeatClass = 'economy',
  flightCostOverride?: number,
  useOwnedAircraft = false
): ActionResult {
  if (state.player.currentCityId === targetCityId) {
    return { success: false, message: 'You are already in this city' };
  }

  const targetCity = CITY_MAP.get(targetCityId);
  if (!targetCity) return { success: false, message: 'Unknown destination' };

  let totalCost = 0;
  let customsReduction = 0;
  let flightDesc = '';

  const activeAircraftId = state.player.selectedAircraftId || (state.player.ownedAircraft && state.player.ownedAircraft[0]);
  const activeAircraft = (useOwnedAircraft || state.player.challengeModifiers?.aviationOnly) && activeAircraftId ? AIRCRAFT_MAP.get(activeAircraftId) : null;
  const aircraftState = activeAircraft ? getAircraftState(state.player, activeAircraft.id) : null;

  if (state.player.challengeModifiers?.aviationOnly && !activeAircraft) {
    return { success: false, message: 'Challenge Rule: Commercial passenger flights prohibited! Must fly using your private aircraft.' };
  }

  let isSpoofed = false;
  if (activeAircraft && aircraftState) {
    totalCost = calculateAircraftFlightCost(activeAircraft, state.player.ownedProperties, aircraftState);
    customsReduction = activeAircraft.customsReduction;
    flightDesc = `Private Aircraft (${activeAircraft.name})`;

    // Apply airframe wear
    applyFlightWear(state.player, activeAircraft.id);

    // Check transponder spoofing
    if (aircraftState.hasTransponderSpoofer && aircraftState.transponderSpoofsRemaining > 0) {
      aircraftState.transponderSpoofsRemaining--;
      isSpoofed = true;
      flightDesc += ` [ICAO Ghost Transponder Active • ${aircraftState.transponderSpoofsRemaining} left]`;
    }
  } else {
    const baseCost = flightCostOverride ?? targetCity.flightCost;
    const seatDetails = calculateSeatClassDetails(baseCost, seatClass);
    totalCost = seatDetails.finalCost;
    customsReduction = seatDetails.customsRiskReduction;
    flightDesc = `Commercial ${seatClass.toUpperCase().replace('_', ' ')} (${seatDetails.description})`;
  }

  if (state.player.cash < totalCost) {
    return { success: false, message: `You need $${totalCost.toLocaleString()} for ${flightDesc}` };
  }

  state.player.cash -= totalCost;
  const originCityId = state.player.currentCityId;
  const originHeat = getCityHeat(state.player, originCityId);
  const originName = CITY_MAP.get(originCityId)?.name ?? 'City';
  state.player.currentCityId = targetCityId;

  state.logs.unshift({
    day: state.player.currentDay,
    city: originName,
    type: 'travel',
    message: `Flew to ${targetCity.name} via ${flightDesc} for $${totalCost.toLocaleString()}.`,
    timestamp: Date.now(),
  });

  // Check airport customs & sniffer dogs
  const totalDrugs = getInventoryTotalUnits(state.player);
  const hasBaggageHandler = hasActiveOfficial(state.player, 'airport_baggage_handler');

  if (totalDrugs > 0) {
    if ((!activeAircraft && hasBaggageHandler) || isSpoofed) {
      state.logs.unshift({
        day: state.player.currentDay,
        city: targetCity.name,
        type: 'corruption',
        message: isSpoofed
          ? `🛰️ GHOST TRANSPONDER RADAR BYPASS: ICAO Hex spoof disguise routed your aircraft into private commercial freight airspace. Zero customs scrutiny in ${targetCity.name}!`
          : `🧳 BAGGAGE HANDLER BYPASS: Corrupt baggage handler shuttled your luggage through tarmac service tunnels in ${targetCity.name}. Customs checkpoints and sniffer dogs bypassed completely!`,
        timestamp: Date.now(),
      });
    } else {
      let maskedUnits = state.player.noScentCans * 100;
      if (aircraftState?.hasHiddenCompartment) {
        maskedUnits += 100; // Extra lead-lined concealed hold
      }
      const unmasked = Math.max(0, totalDrugs - maskedUnits);

      if (unmasked > 0) {
        // Base risk from target city + departure city heat penalty
        const heatPenalty = (originHeat / 100) * 0.35; // up to +35% risk
        const corporateBonus = calculateCustomsBonusFromBusinesses(state.player.ownedBusinesses);
        const consularBonus = getConsularCustomsReduction(state.player);
        const riskReduction = customsReduction + corporateBonus + consularBonus;
        const macroCustomsMult = getMacroCustomsMultiplier(targetCityId, state.player.activeMacroEvents);
        const effectiveCustomsRisk = Math.max(0.02, Math.min(0.95, (targetCity.dogRisk + heatPenalty) * (1 - riskReduction) * macroCustomsMult));

        const dogRoll = Math.random();
      if (dogRoll < effectiveCustomsRisk) {
        const isHighHeat = originHeat >= 60;
        state.player.activeEncounter = {
          id: `airport_${Date.now()}`,
          enemyId: isHighHeat ? 'federal_customs' : 'airport_security',
          enemyName: isHighHeat
            ? 'Federal Customs Interdiction Task Force'
            : 'Airport Security & Drug Dogs',
          count: isHighHeat ? 5 : 4,
          danger: isHighHeat ? 7 : 6,
          bribeCost: Math.max(1500, Math.round(state.player.cash * (isHighHeat ? 0.5 : 0.4))),
          canFlee: false,
          canBribe: true,
          status: 'active',
        };
        state.logs.unshift({
          day: state.player.currentDay,
          city: targetCity.name,
          type: 'combat',
          message: isHighHeat
            ? `🚨 CUSTOMS INTERCEPTION! Departure heat in ${originName} (${originHeat}%) triggered an armed Federal Customs search in ${targetCity.name}! Interdiction agents surround you!`
            : `ALARM! Airport sniffer dogs detected your unmasked contraband! Customs officers surround you!`,
          timestamp: Date.now(),
        });
      }
    }
  }

    // Consume 1 can of No-Scent during international flight
    if (state.player.noScentCans > 0) {
      state.player.noScentCans -= 1;
    }
  }

  // Check Syndicate Nemesis Ambush
  if (!state.player.activeEncounter && state.player.syndicateReputations) {
    for (const syndicate of SYNDICATES) {
      const rep = state.player.syndicateReputations[syndicate.id] ?? 0;
      if (rep <= -60 && Math.random() < 0.28) {
        state.player.activeEncounter = {
          id: `ambush_${Date.now()}`,
          enemyId: 'cartel_hit_squad',
          enemyName: `${syndicate.name} Death Squad`,
          count: 4,
          danger: 8,
          bribeCost: Math.max(8000, Math.round(state.player.cash * 0.55)),
          canFlee: true,
          canBribe: true,
          status: 'active',
        };
        state.logs.unshift({
          day: state.player.currentDay,
          city: targetCity.name,
          type: 'combat',
          message: `☠️ CARTEL HIT SQUAD! Your nemesis standing with ${syndicate.name} triggered an armed terminal ambush in ${targetCity.name}!`,
          timestamp: Date.now(),
        });
        break;
      }
    }
  }

  // Check Active Cartel Turf War Crossfire Ambush
  if (!state.player.activeEncounter && state.player.activeTurfWars && state.player.activeTurfWars.length > 0) {
    const activeWarInCity = state.player.activeTurfWars.find((w) => w.contestedCityIds.includes(targetCityId));
    if (activeWarInCity && Math.random() < (activeWarInCity.travelDangerBonus || 0.35)) {
      state.player.activeEncounter = {
        id: `turf_war_${Date.now()}`,
        enemyId: 'cartel_gunmen',
        enemyName: `${activeWarInCity.attackerName} vs. ${activeWarInCity.defenderName} Crossfire`,
        count: 4,
        danger: 7,
        bribeCost: Math.max(2500, Math.round(state.player.cash * 0.35)),
        canFlee: true,
        canBribe: true,
        status: 'active',
      };
      state.logs.unshift({
        day: state.player.currentDay,
        city: targetCity.name,
        type: 'combat',
        message: `⚔️ TURF WAR CROSSFIRE: Landing in contested ${targetCity.name}, you are ambushed by armed fighters from ${activeWarInCity.attackerName} and ${activeWarInCity.defenderName}!`,
        timestamp: Date.now(),
      });
    }
  }

  advanceDay(state, true);
  return { success: true, message: `Arrived in ${targetCity.name}.` };
}

export function healAtHospital(state: GameEngineState, targetHp: number): ActionResult {
  if (state.player.health >= targetHp) {
    return { success: false, message: 'You are already in good health' };
  }

  const hpToHeal = targetHp - state.player.health;
  const cost = Math.round(hpToHeal * 25 + Math.pow(100 - state.player.health, 1.3) * 5);

  if (state.player.cash < cost) {
    return { success: false, message: `Medical care costs $${cost.toLocaleString()}, but you only have $${state.player.cash.toLocaleString()}` };
  }

  state.player.cash -= cost;
  state.player.health = targetHp;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'system',
    message: `Underworld doctors patched you up to ${targetHp}% HP for $${cost.toLocaleString()}.`,
    timestamp: Date.now(),
  });

  return { success: true, message: 'Health restored' };
}

export function buyShellBusiness(state: GameEngineState, businessId: string): ActionResult {
  const business = SHELL_MAP.get(businessId);
  if (!business) return { success: false, message: 'Shell business not found' };
  if (!state.player.ownedBusinesses) state.player.ownedBusinesses = [];
  if (state.player.ownedBusinesses.includes(businessId)) {
    return { success: false, message: 'You already own this shell business' };
  }
  if (state.player.cash < business.purchaseCost) {
    return { success: false, message: `Insufficient cash. Need $${business.purchaseCost.toLocaleString()}` };
  }

  state.player.cash -= business.purchaseCost;
  state.player.ownedBusinesses.push(businessId);
  state.player.stats = state.player.stats || {};
  state.player.stats.businessesAcquiredCount = (state.player.stats.businessesAcquiredCount || 0) + 1;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'finance',
    message: `CORPORATE ACQUISITION: Acquired 100% equity in ${business.name} for $${business.purchaseCost.toLocaleString()} (+$${business.passiveDailyProfit.toLocaleString()}/day clean income)!`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Acquired ${business.name}!` };
}

export function buyCorporateUpgrade(state: GameEngineState, upgradeId: string): ActionResult {
  const upgrade = UPGRADE_MAP.get(upgradeId);
  if (!upgrade) return { success: false, message: 'Corporate upgrade not found' };
  if (!state.player.corporateUpgrades) state.player.corporateUpgrades = [];
  if (state.player.corporateUpgrades.includes(upgradeId)) {
    return { success: false, message: 'You have already retained this corporate upgrade' };
  }
  if (state.player.cash < upgrade.cost) {
    return { success: false, message: `Insufficient cash. Need $${upgrade.cost.toLocaleString()}` };
  }

  state.player.cash -= upgrade.cost;
  state.player.corporateUpgrades.push(upgradeId);

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'finance',
    message: `RETAINED COUNSEL: Activated ${upgrade.name} for $${upgrade.cost.toLocaleString()}.`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Retained ${upgrade.name}!` };
}

export function executeBusinessLaundering(
  state: GameEngineState,
  businessId: string,
  amount: number
): ActionResult {
  if (amount <= 0) return { success: false, message: 'Invalid laundering amount' };
  if (state.player.cash < amount) return { success: false, message: 'Not enough cash on hand' };

  const business = SHELL_MAP.get(businessId);
  if (!business) return { success: false, message: 'Business not found' };

  const effectiveCapacity = calculateEffectiveDailyCapacity(business, state.player.corporateUpgrades);
  const currentLaundered = state.player.launderedToday || 0;
  if (currentLaundered + amount > effectiveCapacity) {
    const remaining = Math.max(0, effectiveCapacity - currentLaundered);
    return { success: false, message: `Exceeds daily capacity. Remaining capacity today: $${remaining.toLocaleString()}` };
  }

  const effectiveFeeRate = calculateEffectiveFeeRate(business, state.player.corporateUpgrades);
  const feeCost = Math.round(amount * effectiveFeeRate);
  const cleanAmount = amount - feeCost;

  state.player.cash -= amount;
  state.player.bank += cleanAmount;
  state.player.launderedToday = currentLaundered + amount;
  state.player.stats = state.player.stats || {};
  state.player.stats.totalCleanMoneyLaundered = (state.player.stats.totalCleanMoneyLaundered || 0) + cleanAmount;

  // IRS / FinCEN Audit check
  const hasOffshoreLegal = state.player.corporateUpgrades?.includes('offshore_legal');
  const hasFincenAuditor = hasActiveOfficial(state.player, 'fincen_auditor');
  if (!hasOffshoreLegal && !hasFincenAuditor && business.auditRisk > 0 && Math.random() < business.auditRisk) {
    const penalty = Math.round(cleanAmount * 0.25);
    state.player.bank = Math.max(0, state.player.bank - penalty);
    state.logs.unshift({
      day: state.player.currentDay,
      city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
      type: 'event',
      message: `🚨 IRS AUDIT NOTICE: FinCEN flagged unusual cash flow at ${business.name}! Disgorgement fine of $${penalty.toLocaleString()} deducted from offshore bank.`,
      timestamp: Date.now(),
    });
  } else if (hasFincenAuditor && business.auditRisk > 0) {
    state.logs.unshift({
      day: state.player.currentDay,
      city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
      type: 'corruption',
      message: `🏛️ FINCEN AUDITOR SHIELD: Senior regulatory auditor quashed Suspicious Activity Reports (SARs) for ${business.name}. 100% audit immunity verified.`,
      timestamp: Date.now(),
    });
  }

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'finance',
    message: `FINTECH WIRE: Layered $${amount.toLocaleString()} through ${business.name} (Fee: ${Math.round(effectiveFeeRate * 100 * 10) / 10}%). Transferred $${cleanAmount.toLocaleString()} clean to Swiss Bank!`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Successfully laundered $${amount.toLocaleString()}!` };
}

export function acceptSyndicateContract(state: GameEngineState, contractId: string): ActionResult {
  if (!state.player.syndicateContracts) state.player.syndicateContracts = [];
  const contract = state.player.syndicateContracts.find((c) => c.id === contractId);
  if (!contract) return { success: false, message: 'Contract not found' };
  if (contract.status !== 'available') return { success: false, message: 'Contract already signed or expired' };

  contract.status = 'active';
  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'system',
    message: `SYNDICATE PACT: Accepted ${contract.title}! Deliver ${contract.unitsRequired} units to ${CITY_MAP.get(contract.destinationCityId)?.name ?? contract.destinationCityId} within ${contract.daysRemaining} days.`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Accepted contract: ${contract.title}` };
}

export function deliverSyndicateContract(state: GameEngineState, contractId: string): ActionResult {
  if (!state.player.syndicateContracts) state.player.syndicateContracts = [];
  const contract = state.player.syndicateContracts.find((c) => c.id === contractId);
  if (!contract) return { success: false, message: 'Contract not found' };
  if (contract.status !== 'active') return { success: false, message: 'Contract is not currently active' };

  if (state.player.currentCityId !== contract.destinationCityId) {
    const destName = CITY_MAP.get(contract.destinationCityId)?.name ?? contract.destinationCityId;
    return { success: false, message: `You must be in ${destName} to deliver this cargo` };
  }

  const inventoryItem = state.player.inventory[contract.drugId];
  if (!inventoryItem || inventoryItem.units < contract.unitsRequired) {
    const drugName = DRUG_MAP.get(contract.drugId)?.name ?? contract.drugId;
    return {
      success: false,
      message: `You need ${contract.unitsRequired} units of ${drugName} (you have ${inventoryItem?.units ?? 0})`,
    };
  }

  // Deduct units
  inventoryItem.units -= contract.unitsRequired;
  if (inventoryItem.units <= 0) {
    delete state.player.inventory[contract.drugId];
  }

  // Payout cash & rep
  state.player.cash += contract.payoutCash;
  if (!state.player.syndicateReputations) state.player.syndicateReputations = {};
  state.player.syndicateReputations[contract.syndicateId] = Math.min(
    100,
    (state.player.syndicateReputations[contract.syndicateId] || 0) + contract.repReward
  );

  contract.status = 'completed';
  state.player.stats = state.player.stats || {};
  state.player.stats.contractsCompletedCount = (state.player.stats.contractsCompletedCount || 0) + 1;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'finance',
    message: `CONTRACT DELIVERED: Successfully fulfilled ${contract.title}! Received $${contract.payoutCash.toLocaleString()} and +${contract.repReward} ${contract.syndicateId} cartel reputation!`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Delivered contract! Earned $${contract.payoutCash.toLocaleString()}` };
}

export function paySyndicateTributeAction(state: GameEngineState, syndicateId: SyndicateId): ActionResult {
  if (!state.player.syndicateReputations) state.player.syndicateReputations = {};
  const currentRep = state.player.syndicateReputations[syndicateId] ?? 0;
  if (currentRep >= 0) return { success: false, message: 'You are not in hostile standing with this syndicate' };

  const cost = calculatePeaceTributeCost(currentRep);
  if (state.player.cash < cost) {
    return { success: false, message: `Need $${cost.toLocaleString()} to pay tribute peace offering` };
  }

  state.player.cash -= cost;
  state.player.syndicateReputations[syndicateId] = 0;

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
    type: 'combat',
    message: `TRUCE PURCHASED: Delivered $${cost.toLocaleString()} cash tribute to ${syndicateId} elders. Hostilities ceased and reputation reset to Neutral (0).`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Peace restored with ${syndicateId}!` };
}

export function buyAircraft(state: GameEngineState, aircraftId: string): ActionResult {
  const aircraft = AIRCRAFT_MAP.get(aircraftId);
  if (!aircraft) return { success: false, message: 'Aircraft model not recognized' };

  if (!state.player.ownedAircraft) state.player.ownedAircraft = [];
  if (state.player.ownedAircraft.includes(aircraftId)) {
    return { success: false, message: 'You already own this aircraft in your fleet' };
  }

  if (state.player.cash < aircraft.price) {
    return { success: false, message: `Insufficient cash. Need $${aircraft.price.toLocaleString()} to purchase` };
  }

  state.player.cash -= aircraft.price;
  state.player.ownedAircraft.push(aircraftId);
  if (!state.player.selectedAircraftId) {
    state.player.selectedAircraftId = aircraftId;
  }

  state.logs.unshift({
    day: state.player.currentDay,
    city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'Hangar',
    type: 'finance',
    message: `AVIATION FLEET ACQUISITION: Acquired ${aircraft.name} (${aircraft.model}) for $${aircraft.price.toLocaleString()}! Stash hold +${aircraft.cargoBonus.toLocaleString()} units, -${Math.round(aircraft.customsReduction * 100)}% customs search risk.`,
    timestamp: Date.now(),
  });

  return { success: true, message: `Acquired ${aircraft.name}! Ready for sub-rosa flight operations.` };
}

export function selectActiveAircraft(state: GameEngineState, aircraftId: string | null): ActionResult {
  if (aircraftId !== null) {
    if (!state.player.ownedAircraft?.includes(aircraftId)) {
      return { success: false, message: 'You do not own this aircraft model' };
    }
  }

  state.player.selectedAircraftId = aircraftId;
  const name = aircraftId ? AIRCRAFT_MAP.get(aircraftId)?.name ?? 'Aircraft' : 'None (Commercial Airline)';
  return { success: true, message: `Active flight craft set to: ${name}` };
}



