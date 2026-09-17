export interface Drug {
  id: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  basePrice: number;
  volatility: number;
  description: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  flightCost: number;
  policeRisk: number;
  dogRisk: number;
  drugModifiers: Record<string, number>;
  description: string;
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
  interestRate: number;
  multiplier: number;
  maxLoan: number;
  repayDays: number;
  description: string;
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
  currentRankId: string;
  daysHoldingRankCash: number;
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
  cheats: {
    godMode: boolean;
    extraCapacity: number;
  };
}

export interface GameLogEntry {
  day: number;
  city: string;
  type: 'market' | 'finance' | 'travel' | 'combat' | 'event' | 'system' | 'cheat';
  message: string;
  timestamp: number;
}
