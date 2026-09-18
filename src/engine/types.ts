export interface Drug {
  id: string;
  name: string;
  scientificName?: string;
  chemicalFormula?: string;
  molecularWeight?: string;
  image?: string;
  minPrice: number;
  maxPrice: number;
  basePrice: number;
  volatility: number;
  description: string;
}

export interface Property {
  id: string;
  name: string;
  tier: number;
  price: number;
  storageUnits: number;
  heatReduction: number;
  image: string;
  description: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  region?: 'Americas' | 'Europe' | 'Asia-Pacific' | 'Middle East & Africa';
  flightCost: number;
  policeRisk: number;
  dogRisk: number;
  drugModifiers: Record<string, number>;
  description: string;
  specialty?: string;
}

export interface Weapon {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'utility';
  price: number;
  damage?: number;
  accuracy?: number;
  defense?: number;
  durability?: number;
  ammoRequired?: string | null;
  ammoCost?: number;
  aoe?: boolean;
  consumable?: boolean;
  maxHold?: number;
  maskUnits?: number;
  description: string;
}

export interface LoanShark {
  id: string;
  name: string;
  title?: string;
  syndicate?: string;
  turf?: string;
  interestRate: number;
  earlyFeeRate?: number;
  multiplier: number;
  maxLoan: number;
  repayDays: number;
  description: string;
  dangerRating?: 1 | 2 | 3 | 4 | 5;
  enforcementLore?: string;
  collectionMethods?: string[];
  collateralAccepted?: string[];
  warningQuote?: string;
}

export interface Shipper {
  id: string;
  name: string;
  costPercent: number;
  reliability: number;
  description: string;
}

export interface MarketIntelTip {
  id: string;
  cityId: string;
  cityName: string;
  drugId: string;
  drugName: string;
  eventType: 'surge_spike' | 'market_glut' | 'police_crackdown';
  targetDay: number;
  multiplier: number;
  cost: number;
  purchased: boolean;
  headline: string;
  source: string;
}

export interface Rank {
  id: string;
  name: string;
  cashRequired: number;
  capacity: number;
  container: string;
  bonusDays: number;
  description: string;
}

export interface MarketItem {
  drugId: string;
  price: number;
  availableUnits: number;
  surge?: 'high' | 'crash' | null;
  surgeReason?: string;
}

export interface PlayerInventoryItem {
  drugId: string;
  units: number;
  avgCost: number;
  fakeUnits?: number;
}

export interface ActiveEncounter {
  id: string;
  enemyId: string;
  enemyName: string;
  count: number;
  danger: number;
  bribeCost: number;
  canFlee: boolean;
  canBribe: boolean;
  status: 'active' | 'escaped' | 'won' | 'bribed' | 'surrendered' | 'dead';
}

export interface ActiveShipment {
  id: string;
  shipperId: string;
  originCityId: string;
  targetCityId: string;
  drugId: string;
  units: number;
  costPaid: number;
  daysRemaining: number;
  status: 'in_transit' | 'delivered' | 'lost' | 'seized';
}

export type GameDurationMode = 'classic' | 'quarter' | 'year' | 'endless';

export interface DurationModeConfig {
  id: GameDurationMode;
  label: string;
  days: number;
  isEndless: boolean;
  badge: string;
  desc: string;
}

export const DURATION_MODES: DurationModeConfig[] = [
  { id: 'classic', label: 'Classic Street Hustle', days: 30, isEndless: false, badge: '30 Days', desc: 'Fast-paced high-score sprint' },
  { id: 'quarter', label: 'Syndicate Quarter', days: 90, isEndless: false, badge: '90 Days', desc: 'Medium strategic market cycle' },
  { id: 'year', label: 'The Kingpin Year', days: 365, isEndless: false, badge: '365 Days', desc: 'Full year empire building' },
  { id: 'endless', label: 'Endless Sandbox', days: 999999, isEndless: true, badge: '∞ Endless', desc: 'No time limit • Retire whenever you choose' },
];

export interface PlayerStats {
  combatWins?: number;
  bribesCount?: number;
  surrendersCount?: number;
  totalTrades?: number;
  maxSingleBuyUnits?: number;
  citiesVisited?: string[];
  intelPurchasedCount?: number;
  couriersDispatchedCount?: number;
  contractsCompletedCount?: number;
  businessesAcquiredCount?: number;
  totalCleanMoneyLaundered?: number;
  fakeDrugsDiscovered?: number;
  fakeDrugsFlushed?: number;
  corruptOfficialsBribed?: number;
  ricoIndictmentsEvaded?: number;
  extraditionEscapesCount?: number;
}

export type SyndicateId = 'medellin' | 'golden_triangle' | 'synthetic_chem' | 'designer_ring' | 'balkan';

export interface Syndicate {
  id: SyndicateId;
  name: string;
  moniker: string;
  leader: string;
  headquarters: string;
  primaryCommodity: string;
  specialtyDrugs: string[];
  bannerColor: string;
  emblem: string;
  description: string;
}

export interface SyndicateContract {
  id: string;
  syndicateId: SyndicateId;
  title: string;
  drugId: string;
  unitsRequired: number;
  originCityId: string;
  destinationCityId: string;
  payoutCash: number;
  repReward: number;
  repPenalty: number;
  daysRemaining: number;
  status: 'available' | 'active' | 'completed' | 'failed';
}

export type SyndicateStandingTier = 'Nemesis' | 'Hostile' | 'Neutral' | 'Associate' | 'Allied Don';

export type FlightSeatClass = 'economy' | 'business' | 'private_narco';

export interface AirportInfo {
  cityId: string;
  iata: string;
  airportName: string;
  terminals: number;
  coordinates: { lat: number; lng: number };
  hubTier: 'mega_global' | 'major_regional' | 'specialized';
  directDestinations: string[];
}

export interface RealFlightSchedule {
  flightId: string;
  flightNumber: string;
  airline: string;
  originCityId: string;
  originIata: string;
  originAirport: string;
  destinationCityId: string;
  destinationIata: string;
  destinationAirport: string;
  destinationCityName: string;
  departureTime: string;
  durationMinutes: number;
  gate: string;
  terminal: string;
  status: 'On Time' | 'Boarding' | 'Gate Open' | 'Delayed' | 'Customs Alert';
  ticketCost: number;
  isDirect: boolean;
  transitCityId?: string;
  transitCityName?: string;
  policeAlertRisk: number;
}

export interface ShellBusiness {
  id: string;
  name: string;
  tier: number;
  purchaseCost: number;
  dailyCleanCapacity: number;
  feeRate: number;
  passiveDailyProfit: number;
  auditRisk: number;
  heatShield: number;
  customsBonus: number;
  icon: string;
  description: string;
  specialPerk?: string;
}

export interface CorporateUpgrade {
  id: string;
  name: string;
  cost: number;
  feeDiscount: number;
  capacityMultiplier: number;
  auditRiskReduction: number;
  description: string;
}

export type CombatDuelAction =
  | 'snap_fire'
  | 'aim_fire'
  | 'suppress'
  | 'take_cover'
  | 'use_flashbang'
  | 'use_smoke'
  | 'use_medkit'
  | 'flee'
  | 'bribe'
  | 'surrender';

export interface PlayerCombatConsumables {
  flashbangs: number;
  smokeGrenades: number;
  medkits: number;
}

export interface Aircraft {
  id: string;
  name: string;
  model: string;
  price: number;
  fuelCost: number;
  cargoBonus: number;
  customsReduction: number;
  icon: string;
  image: string;
  description: string;
}

export interface PlayerState {
  cash: number;
  bank: number;
  debt: number;
  loanSharkId: string | null;
  loanDaysLeft: number;
  health: number;
  maxHealth: number;
  currentCityId: string;
  currentDay: number;
  maxDays: number;
  isEndless?: boolean;
  gameDurationMode?: GameDurationMode;
  currentRankId: string;
  daysHoldingRankCash: number;
  daysInsolvent?: number;
  cleanIdentityRenewals?: number;
  inventory: Record<string, PlayerInventoryItem>;
  weapons: Record<string, number>;
  ammo: Record<string, number>;
  armor: { id: string; durability: number } | null;
  noScentCans: number;
  vaults: Record<string, Record<string, number>>;
  visitedVaultToday: boolean;
  shipments: ActiveShipment[];
  activeEncounter: ActiveEncounter | null;
  isGameOver: boolean;
  gameOverReason?: string;
  ownedProperties: string[];
  cityHeat?: Record<string, number>;
  activeIntel?: MarketIntelTip[];
  unlockedAchievements?: string[];
  syndicateReputations?: Record<string, number>;
  syndicateContracts?: SyndicateContract[];
  ownedBusinesses?: string[];
  corporateUpgrades?: string[];
  launderedToday?: number;
  combatConsumables?: PlayerCombatConsumables;
  ownedAircraft?: string[];
  selectedAircraftId?: string | null;
  installedLabs?: Record<string, import('./productionTypes').LabType[]>;
  activeCookBatches?: import('./productionTypes').ActiveCookBatch[];
  precursorInventory?: Record<string, number>;
  corruptOfficials?: Record<string, import('./corruptionTypes').CorruptOfficialState>;
  federalInformants?: import('./corruptionTypes').FederalInformant[];
  federalWiretaps?: import('./corruptionTypes').FederalWiretapTranscript[];
  ricoMeter?: number;
  isBankFrozen?: boolean;
  pendingRaidWarning?: import('./corruptionTypes').RaidWarning | null;
  activeTurfWars?: import('./turfWarTypes').ActiveTurfWar[];
  activeMacroEvents?: import('./turfWarTypes').ActiveMacroEvent[];
  activeChallengeId?: string;
  activeChallengeSeed?: string;
  challengeModifiers?: ChallengeModifiers;
  swissAccountTier?: SwissAccountTier;
  bearerBonds?: BearerBond[];
  consularImmunity?: ConsularImmunityLevel;
  safehouseUpgrades?: Record<string, SafehouseUpgradeId[]>;
  aircraftFleetState?: Record<string, AircraftState>;
  syndicateStrikeContracts?: SyndicateStrikeContract[];
  lastRacketCollectedDay?: number;
  stats?: PlayerStats;
  cheats: {
    godMode: boolean;
    extraCapacity: number;
  };
}

export type SwissAccountTier = 'standard' | 'numbered' | 'cipher_vault' | 'diplomatic_escrow' | 'quantum_bastion';

export interface SwissSecurityTierConfig {
  id: SwissAccountTier;
  name: string;
  cost: number;
  seizureImmunityPercent: number;
  dailyInterestBonus: number;
  badge: string;
  description: string;
}

export interface BearerBond {
  id: string;
  bondType: 'short_term_1d' | 'medium_term_3d' | 'sovereign_gold_7d';
  name: string;
  principal: number;
  dailyYieldPercent: number;
  purchasedDay: number;
  termDays: number;
  matureDay: number;
  accruedYield: number;
  isClaimed: boolean;
}

export type ConsularImmunityLevel = 'none' | 'vanuatu_golden' | 'caribbean_pouch' | 'sovereign_ambassador';

export interface ConsularImmunityConfig {
  id: ConsularImmunityLevel;
  name: string;
  cost: number;
  customsReduction: number;
  badge: string;
  description: string;
}

export type SafehouseUpgradeId =
  | 'steel_doors'
  | 'decoy_radio'
  | 'escape_tunnel'
  | 'chem_ventilation'
  | 'auto_turret';

export interface SafehouseUpgradeConfig {
  id: SafehouseUpgradeId;
  name: string;
  cost: number;
  icon: string;
  description: string;
  storageBonus: number;
  heatReductionBonus: number;
  raidDefenseBonus: number;
}

export interface AircraftState {
  wearPercent: number; // 0 (mint) to 100 (grounded / critical wear)
  hasAuxFuelTanks: boolean;
  hasHiddenCompartment: boolean;
  hasTransponderSpoofer: boolean;
  transponderSpoofsRemaining: number;
}

export interface SyndicateStrikeContract {
  id: string;
  syndicateId: SyndicateId;
  targetName: string;
  targetTitle: string;
  locationCityId: string;
  rewardCash: number;
  repReward: number;
  dangerLevel: 'medium' | 'high' | 'extreme';
  intelBrief: string;
  status: 'available' | 'completed' | 'failed';
}

export interface TerritoryInfluence {
  region: string;
  dominatingSyndicateId: SyndicateId;
  playerInfluence: number;
  syndicateInfluence: Record<SyndicateId, number>;
}

export interface ChallengeModifiers {
  weaponsBanned?: boolean;
  aviationOnly?: boolean;
  syntheticsOnly?: boolean;
  tripleAuditHeat?: boolean;
  fleeAgilityBonus?: number;
  syntheticMarginBonus?: number;
  bribeDiscount?: number;
}

export interface GameLogEntry {
  day: number;
  city: string;
  type: 'market' | 'finance' | 'travel' | 'combat' | 'event' | 'system' | 'cheat' | 'production' | 'corruption';
  message: string;
  timestamp: number;
}

