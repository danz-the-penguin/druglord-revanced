import { ShellBusiness, CorporateUpgrade } from './types';

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
