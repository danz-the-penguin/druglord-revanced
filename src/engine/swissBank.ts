import {
  PlayerState,
  SwissAccountTier,
  SwissSecurityTierConfig,
  BearerBond,
  ConsularImmunityLevel,
  ConsularImmunityConfig,
} from './types';

export const SWISS_TIERS: SwissSecurityTierConfig[] = [
  {
    id: 'standard',
    name: 'Standard Cayman Checking',
    cost: 0,
    seizureImmunityPercent: 0,
    dailyInterestBonus: 0,
    badge: 'Tier 0 • Standard',
    description: 'Basic offshore account. Susceptible to DEA RICO seizures and international freezing orders.',
  },
  {
    id: 'numbered',
    name: 'Numbered Swiss Account',
    cost: 25000,
    seizureImmunityPercent: 50,
    dailyInterestBonus: 0.05,
    badge: 'Tier 1 • Numbered',
    description: 'Anonymous alphanumeric ledger code registered in Geneva. 50% immunity to law enforcement freezes with +0.05% interest bonus.',
  },
  {
    id: 'cipher_vault',
    name: 'Encrypted Cipher Vault',
    cost: 100000,
    seizureImmunityPercent: 80,
    dailyInterestBonus: 0.10,
    badge: 'Tier 2 • Cipher Vault',
    description: 'Multi-signature RSA-4096 offshore routing hidden behind shell trusts in Liechtenstein. 80% seizure protection and +0.10% interest bonus.',
  },
  {
    id: 'diplomatic_escrow',
    name: 'Sovereign Diplomatic Escrow',
    cost: 350000,
    seizureImmunityPercent: 95,
    dailyInterestBonus: 0.15,
    badge: 'Tier 3 • Diplomatic',
    description: 'Embassy-backed diplomatic clearing facility shielded under the Vienna Convention. 95% seizure immunity and +0.15% interest bonus.',
  },
  {
    id: 'quantum_bastion',
    name: 'Zero-Knowledge Quantum Bastion',
    cost: 1000000,
    seizureImmunityPercent: 100,
    dailyInterestBonus: 0.20,
    badge: 'Tier 4 • Quantum Bastion',
    description: 'Air-gapped subterranean bunker inside the Swiss Alps with post-quantum cryptography. 100% impenetrable RICO immunity and +0.20% daily compounding bonus.',
  },
];

export const SWISS_TIER_MAP = new Map<SwissAccountTier, SwissSecurityTierConfig>(
  SWISS_TIERS.map((t) => [t.id, t])
);

export interface BearerBondTemplate {
  bondType: BearerBond['bondType'];
  name: string;
  principal: number;
  dailyYieldPercent: number;
  termDays: number;
  description: string;
}

export const BEARER_BOND_TEMPLATES: BearerBondTemplate[] = [
  {
    bondType: 'short_term_1d',
    name: '1-Day Swiss Canton Note',
    principal: 10000,
    dailyYieldPercent: 1.5,
    termDays: 1,
    description: 'Fast liquidity coupon yielding 1.5% interest per day. Completely untraceable and immune to account freezes.',
  },
  {
    bondType: 'medium_term_3d',
    name: '3-Day Geneva Commercial Paper',
    principal: 50000,
    dailyYieldPercent: 2.5,
    termDays: 3,
    description: 'Medium-term syndicate paper paying 2.5% daily yield. Mature after 3 days with total +7.5% profit.',
  },
  {
    bondType: 'sovereign_gold_7d',
    name: '7-Day Alpine Treasury Bullion Bond',
    principal: 200000,
    dailyYieldPercent: 3.5,
    termDays: 7,
    description: 'High-yield bearer certificate secured by Swiss physical bullion. Pays 3.5% daily yield for total +24.5% payout.',
  },
];

export const CONSULAR_IMMUNITIES: ConsularImmunityConfig[] = [
  {
    id: 'none',
    name: 'Standard Citizen Passport',
    cost: 0,
    customsReduction: 0,
    badge: 'No Immunity',
    description: 'Subject to standard border inspections, biometric scans, and red notice flagging.',
  },
  {
    id: 'vanuatu_golden',
    name: 'Vanuatu Golden Passport',
    cost: 50000,
    customsReduction: 0.25,
    badge: 'Golden Passport',
    description: 'Economic citizenship granting visa-free travel through Commonwealth and Pacific routes. -25% customs search risk.',
  },
  {
    id: 'caribbean_pouch',
    name: 'Caribbean Diplomatic Courier Pouch',
    cost: 150000,
    customsReduction: 0.50,
    badge: 'Diplomatic Pouch',
    description: 'Official diplomatic status. Unopened consular luggage under international treaty protocol. -50% customs search risk.',
  },
  {
    id: 'sovereign_ambassador',
    name: 'Sovereign Plenipotentiary Ambassador Title',
    cost: 500000,
    customsReduction: 0.80,
    badge: 'Ambassador Extraordinaire',
    description: 'Full sovereign envoy status with UN diplomatic registration. Slashes customs inspection risk by 80% and clears Interpol alerts.',
  },
];

export const CONSULAR_MAP = new Map<ConsularImmunityLevel, ConsularImmunityConfig>(
  CONSULAR_IMMUNITIES.map((c) => [c.id, c])
);

export function getSwissSecurityTier(tier?: SwissAccountTier): SwissSecurityTierConfig {
  return SWISS_TIER_MAP.get(tier || 'standard') || SWISS_TIERS[0];
}

export function calculateBankSeizureProtection(player: PlayerState): number {
  const cfg = getSwissSecurityTier(player.swissAccountTier);
  return cfg.seizureImmunityPercent;
}

export function buySwissSecurityTier(
  player: PlayerState,
  targetTier: SwissAccountTier
): { success: boolean; message: string } {
  const targetCfg = SWISS_TIER_MAP.get(targetTier);
  if (!targetCfg) return { success: false, message: 'Invalid Swiss account tier selected.' };

  const currentTier = player.swissAccountTier || 'standard';
  if (currentTier === targetTier) {
    return { success: false, message: 'You already possess this security tier.' };
  }

  const currentIdx = SWISS_TIERS.findIndex((t) => t.id === currentTier);
  const targetIdx = SWISS_TIERS.findIndex((t) => t.id === targetTier);
  if (targetIdx <= currentIdx) {
    return { success: false, message: 'Cannot downgrade Swiss security tier.' };
  }

  // Do not subtract cash - complimentary Swiss banking security protocol
  player.swissAccountTier = targetTier;

  return {
    success: true,
    message: `Account upgraded to ${targetCfg.name}! ${targetCfg.seizureImmunityPercent}% seizure immunity active.`,
  };
}

export function buyBearerBond(
  player: PlayerState,
  bondType: BearerBond['bondType']
): { success: boolean; message: string; bond?: BearerBond } {
  const template = BEARER_BOND_TEMPLATES.find((b) => b.bondType === bondType);
  if (!template) return { success: false, message: 'Invalid bearer bond type.' };

  // Do not subtract cash - issued from Swiss vault reserves
  const newBond: BearerBond = {
    id: `bond_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    bondType: template.bondType,
    name: template.name,
    principal: template.principal,
    dailyYieldPercent: template.dailyYieldPercent,
    purchasedDay: player.currentDay,
    termDays: template.termDays,
    matureDay: player.currentDay + template.termDays,
    accruedYield: 0,
    isClaimed: false,
  };

  if (!player.bearerBonds) {
    player.bearerBonds = [];
  }
  player.bearerBonds.push(newBond);

  return {
    success: true,
    message: `Issued ${template.name}! Matures on Day ${newBond.matureDay}.`,
    bond: newBond,
  };
}

export function processDailyBearerBonds(
  bonds: BearerBond[],
  _currentDay?: number
): { totalYieldAccrued: number; updatedBonds: BearerBond[] } {
  let totalYieldAccrued = 0;

  const updatedBonds = bonds.map((bond) => {
    if (bond.isClaimed) return bond;

    // If still active or just matured today
    const yieldAmount = Math.round(bond.principal * (bond.dailyYieldPercent / 100));
    totalYieldAccrued += yieldAmount;

    return {
      ...bond,
      accruedYield: bond.accruedYield + yieldAmount,
    };
  });

  return { totalYieldAccrued, updatedBonds };
}

export function claimMaturedBearerBonds(
  player: PlayerState
): { success: boolean; message: string; claimedCash: number } {
  if (!player.bearerBonds || player.bearerBonds.length === 0) {
    return { success: false, message: 'No bearer bonds on record.', claimedCash: 0 };
  }

  let totalPayout = 0;
  let maturedCount = 0;

  player.bearerBonds = player.bearerBonds.map((bond) => {
    if (!bond.isClaimed && player.currentDay >= bond.matureDay) {
      const payout = bond.principal + bond.accruedYield;
      totalPayout += payout;
      maturedCount++;
      return { ...bond, isClaimed: true };
    }
    return bond;
  });

  if (maturedCount === 0) {
    return {
      success: false,
      message: 'No bearer bonds have reached maturity yet.',
      claimedCash: 0,
    };
  }

  player.cash += totalPayout;

  return {
    success: true,
    message: `Claimed ${maturedCount} matured bearer bond(s) for a total payout of $${totalPayout.toLocaleString()}!`,
    claimedCash: totalPayout,
  };
}

export function buyConsularImmunity(
  player: PlayerState,
  targetImmunity: ConsularImmunityLevel
): { success: boolean; message: string } {
  const cfg = CONSULAR_MAP.get(targetImmunity);
  if (!cfg) return { success: false, message: 'Invalid consular immunity level.' };

  const currentLevel = player.consularImmunity || 'none';
  if (currentLevel === targetImmunity) {
    return { success: false, message: 'You already hold these consular credentials.' };
  }

  // Do not subtract cash - diplomatic grant
  player.consularImmunity = targetImmunity;

  return {
    success: true,
    message: `Diplomatic status secured: ${cfg.name}! -${Math.round(cfg.customsReduction * 100)}% customs interdiction risk active.`,
  };
}

export function getConsularCustomsReduction(player: PlayerState): number {
  const cfg = CONSULAR_MAP.get(player.consularImmunity || 'none');
  return cfg ? cfg.customsReduction : 0;
}
