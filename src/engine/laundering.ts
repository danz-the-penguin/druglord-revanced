import { ShellBusiness, CorporateUpgrade, PlayerState } from './types';

export const SHELL_BUSINESSES: ShellBusiness[] = [
  {
    id: 'laundromat',
    name: 'Suburban Coin Laundromat & Dry Cleaners',
    tier: 1,
    purchaseCost: 35000,
    dailyCleanCapacity: 18000,
    feeRate: 0.08,
    passiveDailyProfit: 450,
    auditRisk: 0.02,
    heatShield: 1,
    customsBonus: 0,
    icon: '🧺',
    description: 'Cash-intensive neighborhood coin laundry. Classic cash front for street hustlers.',
  },
  {
    id: 'car_wash',
    name: 'Artisan Express Car Wash & Auto Spa',
    tier: 2,
    purchaseCost: 85000,
    dailyCleanCapacity: 45000,
    feeRate: 0.07,
    passiveDailyProfit: 1200,
    auditRisk: 0.03,
    heatShield: 2,
    customsBonus: 0,
    icon: '🚗',
    description: 'High-throughput conveyor car wash with automated coin bays and detailing bays.',
  },
  {
    id: 'underground_sportsbook',
    name: 'Underground Sportsbook & Billiards Hall',
    tier: 2,
    purchaseCost: 65000,
    dailyCleanCapacity: 35000,
    feeRate: 0.075,
    passiveDailyProfit: 950,
    auditRisk: 0.03,
    heatShield: 2,
    customsBonus: 0,
    icon: '🎱',
    description: 'Illegal parlay betting slips, backroom poker games, and gaming machines mix cash effortlessly.',
    specialPerk: 'Cash slip betting volume offsets audit paper trails',
  },
  {
    id: 'luxury_watch_boutique',
    name: 'Haute Horlogerie & Gray-Market Watch Boutique',
    tier: 2,
    purchaseCost: 125000,
    dailyCleanCapacity: 65000,
    feeRate: 0.068,
    passiveDailyProfit: 1600,
    auditRisk: 0.025,
    heatShield: 2,
    customsBonus: 0,
    icon: '⌚',
    description: 'High-value luxury timepieces (Patek, Rolex, AP) bought and resold with unrecorded cash premiums and inflated appraisal receipts.',
    specialPerk: 'High-density physical jewelry assets facilitate non-banking transfers',
  },
  {
    id: 'nightclub',
    name: 'Neon VIP Nightclub & Gentlemen’s Lounge',
    tier: 3,
    purchaseCost: 275000,
    dailyCleanCapacity: 140000,
    feeRate: 0.06,
    passiveDailyProfit: 3500,
    auditRisk: 0.05,
    heatShield: 3,
    customsBonus: 0,
    icon: '🍸',
    description: 'Bottle service, cash door covers, and private booths wash illicit earnings in booming nightlife.',
  },
  {
    id: 'scrap_metal_foundry',
    name: 'Industrial Scrap Metal & Recycling Foundry',
    tier: 3,
    purchaseCost: 175000,
    dailyCleanCapacity: 95000,
    feeRate: 0.065,
    passiveDailyProfit: 2400,
    auditRisk: 0.04,
    heatShield: 3,
    customsBonus: 0,
    icon: '🏗️',
    description: 'High-tonnage scrap metal processing. Fabricates weight-scale tickets and cash invoices for raw copper and steel.',
    specialPerk: 'Heavy industrial invoices absorb high single-transaction volumes',
  },
  {
    id: 'construction_contracting',
    name: 'Civic Heavy Construction & Earthmoving Corp',
    tier: 3,
    purchaseCost: 350000,
    dailyCleanCapacity: 190000,
    feeRate: 0.058,
    passiveDailyProfit: 4200,
    auditRisk: 0.035,
    heatShield: 3,
    customsBonus: 0,
    icon: '🚜',
    description: 'Government infrastructure contracts, overbilled cement pours, and phantom subcontractor invoices swallow seven-figure dirty cash infusions.',
    specialPerk: 'Municipal subcontracts provide ironclad civil commercial cover',
  },
  {
    id: 'private_jet_charter',
    name: 'Executive Jet Charter & FBO Ground Services',
    tier: 4,
    purchaseCost: 550000,
    dailyCleanCapacity: 350000,
    feeRate: 0.05,
    passiveDailyProfit: 6500,
    auditRisk: 0.03,
    heatShield: 4,
    customsBonus: 0.15,
    icon: '✈️',
    description: 'Private airfield hangar and VIP aviation charter. Grants -15% customs inspection risk on all private aviation routes.',
    specialPerk: '-15% Customs Search Risk & Private FBO Lounge Access',
  },
  {
    id: 'art_gallery',
    name: 'Contemporary Fine Art Gallery & Auction House',
    tier: 4,
    purchaseCost: 750000,
    dailyCleanCapacity: 500000,
    feeRate: 0.05,
    passiveDailyProfit: 8500,
    auditRisk: 0.03,
    heatShield: 4,
    customsBonus: 0,
    icon: '🎨',
    description: 'Subjective modern art appraisals and private dealer sales absorb six-figure cash infusions.',
  },
  {
    id: 'pharmaceutical_logistics',
    name: 'Biomedical Cold-Chain Logistics & Pharmacy Supply',
    tier: 4,
    purchaseCost: 950000,
    dailyCleanCapacity: 700000,
    feeRate: 0.045,
    passiveDailyProfit: 11000,
    auditRisk: 0.025,
    heatShield: 5,
    customsBonus: 0.20,
    icon: '💊',
    description: 'Licensed pharmaceutical distribution network. Provides medical precursor supply lines and grants -20% customs search risk.',
    specialPerk: '-20% Customs Risk & Precursor Cost Subsidies',
  },
  {
    id: 'import_export',
    name: 'Global Freight Logistics & Customs Brokerage',
    tier: 5,
    purchaseCost: 2000000,
    dailyCleanCapacity: 1800000,
    feeRate: 0.04,
    passiveDailyProfit: 22000,
    auditRisk: 0.04,
    heatShield: 5,
    customsBonus: 0.30,
    icon: '🚢',
    description: 'Bonded warehouse network and freight forwarder. Grants -30% customs risk on international flights.',
    specialPerk: '-30% Customs Search Risk at all International Airports',
  },
  {
    id: 'superyacht_brokerage',
    name: 'Monaco Superyacht Charter & Marine Leasing',
    tier: 5,
    purchaseCost: 3500000,
    dailyCleanCapacity: 3200000,
    feeRate: 0.035,
    passiveDailyProfit: 38000,
    auditRisk: 0.02,
    heatShield: 6,
    customsBonus: 0.10,
    icon: '🛥️',
    description: 'Offshore Mediterranean luxury vessel leasing entity operating under Cayman flag of convenience in international waters.',
    specialPerk: 'High-seas maritime leasing beyond IRS territorial reach',
  },
  {
    id: 'telecom_holding',
    name: 'Pan-Caribbean Fiber & Satellite Telecom Holding',
    tier: 5,
    purchaseCost: 4200000,
    dailyCleanCapacity: 3800000,
    feeRate: 0.032,
    passiveDailyProfit: 48000,
    auditRisk: 0.02,
    heatShield: 6,
    customsBonus: 0,
    icon: '📡',
    description: 'Offshore telecommunications provider routing satellite bandwidth billing and undersea fiber leases with sovereign tax-sheltered cash flow.',
    specialPerk: 'Stateless digital infrastructure shields multi-million wire velocity',
  },
  {
    id: 'panama_trust',
    name: 'Panama Private Holding Trust & Nominee LLC',
    tier: 6,
    purchaseCost: 5000000,
    dailyCleanCapacity: 4500000,
    feeRate: 0.03,
    passiveDailyProfit: 55000,
    auditRisk: 0.01,
    heatShield: 6,
    customsBonus: 0,
    icon: '🌴',
    description: 'Offshore bearer share holding entity protected by Panama legal secrecy and foreign nominee directors.',
  },
  {
    id: 'macau_junket',
    name: 'Macau VIP Casino Junket & Shadow Credit Trust',
    tier: 6,
    purchaseCost: 8500000,
    dailyCleanCapacity: 7500000,
    feeRate: 0.025,
    passiveDailyProfit: 85000,
    auditRisk: 0.01,
    heatShield: 7,
    customsBonus: 0,
    icon: '🎲',
    description: 'High-roller baccarat VIP salon issuing non-negotiable dead chips and offshore shadow credit lines across Asia-Pacific.',
    specialPerk: 'Cross-border VIP chip transfers without banking wire trails',
  },
  {
    id: 'crypto_farm',
    name: 'Decentralized ASIC Crypto Mining & Privacy Pool',
    tier: 7,
    purchaseCost: 14000000,
    dailyCleanCapacity: 15000000,
    feeRate: 0.02,
    passiveDailyProfit: 140000,
    auditRisk: 0,
    heatShield: 8,
    customsBonus: 0,
    icon: '⚡',
    description: 'Hydropower ASIC mining racks convert street cash into un-traceable on-chain privacy tokens and wire transfers.',
  },
  {
    id: 'sovereign_wealth_front',
    name: 'Liechtenstein Anstalt & Sovereign Private Equity Fund',
    tier: 7,
    purchaseCost: 22000000,
    dailyCleanCapacity: 28000000,
    feeRate: 0.015,
    passiveDailyProfit: 220000,
    auditRisk: 0,
    heatShield: 9,
    customsBonus: 0.25,
    icon: '🏰',
    description: 'Stateless dynastic trust structure. Fuses discretionary Liechtenstein family foundations with international private equity syndicates.',
    specialPerk: 'Dynastic asset insulation, -25% customs scrutiny, and 1.5% wash fee',
  },
  {
    id: 'swiss_bank_stake',
    name: 'Swiss Private Banking Subsidiary (Zurich)',
    tier: 8,
    purchaseCost: 35000000,
    dailyCleanCapacity: 50000000,
    feeRate: 0.01,
    passiveDailyProfit: 350000,
    auditRisk: 0,
    heatShield: 10,
    customsBonus: 0.20,
    icon: '🏛️',
    description: 'The absolute zenith of financial power: an equity stake in a private Swiss canton bank with sovereign clearing.',
    specialPerk: '1% Fee Rate & Immune to Audits',
  },
  {
    id: 'sovereign_gold_depository',
    name: 'Sovereign Gold Bullion Depository & Global Trust',
    tier: 8,
    purchaseCost: 65000000,
    dailyCleanCapacity: 80000000,
    feeRate: 0.008,
    passiveDailyProfit: 650000,
    auditRisk: 0,
    heatShield: 12,
    customsBonus: 0.25,
    icon: '🪙',
    description: 'Subterranean fortified gold depository housing LBMA-certified 99.99% pure physical bullion bars immune to sovereign seizures and court freezes.',
    specialPerk: 'Ultra-low 0.8% Fee & Physical Gold Bullion Backing',
  },
];

export const SHELL_MAP = new Map<string, ShellBusiness>(
  SHELL_BUSINESSES.map((b) => [b.id, b])
);

export const CORPORATE_UPGRADES: CorporateUpgrade[] = [
  {
    id: 'cpa_firm',
    name: 'Retained Forensic CPA Firm',
    cost: 45000,
    feeDiscount: 0.015,
    capacityMultiplier: 1.0,
    auditRiskReduction: 0.40,
    description: 'Aggressive corporate tax accountants optimize expense layering to reduce laundering fees by 1.5%.',
  },
  {
    id: 'offshore_legal',
    name: 'Offshore Retained Legal Defense Counsel',
    cost: 150000,
    feeDiscount: 0.01,
    capacityMultiplier: 1.0,
    auditRiskReduction: 0.75,
    description: 'Top-tier defense attorneys in Panama and Zurich shielding bank accounts from FinCEN seizures.',
  },
  {
    id: 'automated_smurfing',
    name: 'Automated High-Frequency Micro-Smurfing Network',
    cost: 350000,
    feeDiscount: 0,
    capacityMultiplier: 1.50,
    auditRiskReduction: 0.20,
    description: 'Decentralized fleet of mules and prepaid debit structuring increases daily washing capacity by +50%.',
  },
];

export const UPGRADE_MAP = new Map<string, CorporateUpgrade>(
  CORPORATE_UPGRADES.map((u) => [u.id, u])
);

export function calculateEffectiveFeeRate(
  business: ShellBusiness,
  ownedUpgrades: string[] = []
): number {
  let discount = 0;
  for (const upId of ownedUpgrades) {
    const up = UPGRADE_MAP.get(upId);
    if (up) discount += up.feeDiscount;
  }
  return Math.max(0.005, business.feeRate - discount);
}

export function calculateEffectiveDailyCapacity(
  business: ShellBusiness,
  ownedUpgrades: string[] = []
): number {
  let multiplier = 1.0;
  for (const upId of ownedUpgrades) {
    const up = UPGRADE_MAP.get(upId);
    if (up) multiplier *= up.capacityMultiplier;
  }
  return Math.round(business.dailyCleanCapacity * multiplier);
}

export function calculateTotalPassiveIncome(ownedBusinesses: string[] = []): number {
  let total = 0;
  for (const bId of ownedBusinesses) {
    const b = SHELL_MAP.get(bId);
    if (b) total += b.passiveDailyProfit;
  }
  return total;
}

export function calculateTotalHeatShield(ownedBusinesses: string[] = []): number {
  let total = 0;
  for (const bId of ownedBusinesses) {
    const b = SHELL_MAP.get(bId);
    if (b) total += b.heatShield;
  }
  return total;
}

export function calculateCustomsBonusFromBusinesses(ownedBusinesses: string[] = []): number {
  let highest = 0;
  for (const bId of ownedBusinesses) {
    const b = SHELL_MAP.get(bId);
    if (b && b.customsBonus) {
      highest = Math.max(highest, b.customsBonus);
    }
  }
  return highest;
}

/**
 * Underworld Stock Market & Incremental Share Mechanics
 */
export const TOTAL_SHARES_PER_BUSINESS = 10000;
export const CONTROLLING_STAKE_SHARES = 5000; // >50% (5,000 shares) grants corporate control
export const BROKERAGE_FEE_RATE = 0.025; // 2.5% transactional fee

/**
 * Calculate dynamic share price based on company base valuation and day volatility
 */
export function getBusinessSharePrice(business: ShellBusiness, currentDay = 1): number {
  const baseSharePrice = Math.max(1, Math.round(business.purchaseCost / TOTAL_SHARES_PER_BUSINESS));
  // Deterministic daily market volatility based on company name length and day number (±15%)
  const seed = (business.id.length * 19 + currentDay * 29 + business.tier * 7) % 100;
  const volatilityPct = ((seed - 50) / 50) * 0.15; // -15% to +15%
  return Math.max(1, Math.round(baseSharePrice * (1 + volatilityPct)));
}

/**
 * Returns number of shares held in a given shell enterprise (0 to 10,000)
 */
export function getBusinessSharesOwned(player: PlayerState, businessId: string): number {
  if (player.ownedBusinesses?.includes(businessId)) {
    return TOTAL_SHARES_PER_BUSINESS; // 100% equity
  }
  return player.businessShares?.[businessId] || 0;
}

/**
 * Checks if the player holds a majority controlling stake (>50% equity)
 */
export function hasControllingStake(player: PlayerState, businessId: string): boolean {
  return getBusinessSharesOwned(player, businessId) > CONTROLLING_STAKE_SHARES;
}

export interface ControllingSynergies {
  customsBonus: number;
  shippingDiscount: number;
  heatShield: number;
  precursorDiscount: number;
  bonusLaunderingCapacity: number;
  auditImmunity: boolean;
  wireFeeDiscount: number;
}

/**
 * Compute aggregate operational synergies granted by companies where player holds >50% control
 */
export function getControllingSynergies(player: PlayerState): ControllingSynergies {
  const synergies: ControllingSynergies = {
    customsBonus: 0,
    shippingDiscount: 0,
    heatShield: 0,
    precursorDiscount: 0,
    bonusLaunderingCapacity: 0,
    auditImmunity: false,
    wireFeeDiscount: 0,
  };

  for (const business of SHELL_BUSINESSES) {
    if (!hasControllingStake(player, business.id)) continue;

    // Heat Shield
    synergies.heatShield += business.heatShield;

    // Customs Bonus
    if (business.customsBonus) {
      synergies.customsBonus = Math.max(synergies.customsBonus, business.customsBonus);
    }

    // Specialized Sector Synergies
    switch (business.id) {
      case 'private_jet_charter':
        synergies.shippingDiscount = Math.max(synergies.shippingDiscount, 0.25);
        break;
      case 'import_export':
        synergies.shippingDiscount = Math.max(synergies.shippingDiscount, 0.35);
        synergies.precursorDiscount = Math.max(synergies.precursorDiscount, 0.15);
        break;
      case 'superyacht_brokerage':
        synergies.shippingDiscount = Math.max(synergies.shippingDiscount, 0.30);
        break;
      case 'scrap_metal_foundry':
        synergies.bonusLaunderingCapacity += 0.20;
        synergies.precursorDiscount = Math.max(synergies.precursorDiscount, 0.10);
        break;
      case 'crypto_farm':
        synergies.bonusLaunderingCapacity += 0.50;
        synergies.auditImmunity = true;
        break;
      case 'panama_trust':
      case 'swiss_bank_stake':
      case 'sovereign_gold_depository':
        synergies.auditImmunity = true;
        synergies.wireFeeDiscount = Math.max(synergies.wireFeeDiscount, 0.015);
        break;
      case 'macau_junket':
        synergies.wireFeeDiscount = Math.max(synergies.wireFeeDiscount, 0.01);
        break;
      case 'pharmaceutical_logistics':
        synergies.precursorDiscount = Math.max(synergies.precursorDiscount, 0.25);
        synergies.shippingDiscount = Math.max(synergies.shippingDiscount, 0.15);
        break;
      case 'telecom_holding':
        synergies.wireFeeDiscount = Math.max(synergies.wireFeeDiscount, 0.01);
        synergies.bonusLaunderingCapacity += 0.25;
        break;
      case 'sovereign_wealth_front':
        synergies.auditImmunity = true;
        synergies.bonusLaunderingCapacity += 0.40;
        synergies.wireFeeDiscount = Math.max(synergies.wireFeeDiscount, 0.02);
        break;
    }
  }

  return synergies;
}

/**
 * Calculates pro-rata passive clean dividend payout for all owned shares
 */
export function calculateTotalShareDividends(player: PlayerState): number {
  let total = 0;
  for (const b of SHELL_BUSINESSES) {
    const shares = getBusinessSharesOwned(player, b.id);
    if (shares > 0) {
      const shareRatio = shares / TOTAL_SHARES_PER_BUSINESS;
      total += Math.round(shareRatio * b.passiveDailyProfit);
    }
  }
  return total;
}

export const SHELL_SECTORS: Record<string, string> = {
  laundromat: 'Consumer Services',
  car_wash: 'Automotive Services',
  underground_sportsbook: 'Gaming & Wagering',
  luxury_watch_boutique: 'Luxury Goods',
  nightclub: 'Hospitality & Nightlife',
  scrap_metal_foundry: 'Industrial Materials',
  construction_contracting: 'Infrastructure',
  art_gallery: 'Fine Arts & Antiquities',
  pharmaceutical_logistics: 'Healthcare & Pharma',
  import_export: 'Maritime Logistics',
  private_jet_charter: 'Aviation Logistics',
  superyacht_brokerage: 'Maritime Luxury',
  telecom_holding: 'Telecommunications',
  panama_trust: 'Offshore Wealth',
  macau_junket: 'Hospitality & Gaming',
  crypto_farm: 'Digital Assets & FinTech',
  sovereign_wealth_front: 'Sovereign Finance',
  swiss_bank_stake: 'Private Banking',
  sovereign_gold_depository: 'Precious Metals',
};

export interface DiversificationRating {
  sectorCount: number;
  sectors: string[];
  rating: 'D' | 'C' | 'B' | 'A' | 'AAA';
  title: string;
  capacityMultiplier: number;
  heatReductionBonus: number;
}

export function calculateCorporateDiversification(player: PlayerState): DiversificationRating {
  const activeSectors = new Set<string>();

  for (const b of SHELL_BUSINESSES) {
    const shares = getBusinessSharesOwned(player, b.id);
    if (shares > 0) {
      const sector = SHELL_SECTORS[b.id] || 'Diversified';
      activeSectors.add(sector);
    }
  }

  const count = activeSectors.size;
  const sectors = Array.from(activeSectors);

  if (count >= 7) {
    return {
      sectorCount: count,
      sectors,
      rating: 'AAA',
      title: 'Global Conglomerate Syndicate',
      capacityMultiplier: 1.25,
      heatReductionBonus: 3,
    };
  } else if (count >= 5) {
    return {
      sectorCount: count,
      sectors,
      rating: 'A',
      title: 'Diversified Underworld Holding',
      capacityMultiplier: 1.15,
      heatReductionBonus: 2,
    };
  } else if (count >= 3) {
    return {
      sectorCount: count,
      sectors,
      rating: 'B',
      title: 'Multi-Sector Syndicate',
      capacityMultiplier: 1.08,
      heatReductionBonus: 1,
    };
  } else if (count >= 1) {
    return {
      sectorCount: count,
      sectors,
      rating: 'C',
      title: 'Focused Enterprise',
      capacityMultiplier: 1.0,
      heatReductionBonus: 0,
    };
  }

  return {
    sectorCount: 0,
    sectors: [],
    rating: 'D',
    title: 'Uncapitalized',
    capacityMultiplier: 1.0,
    heatReductionBonus: 0,
  };
}


