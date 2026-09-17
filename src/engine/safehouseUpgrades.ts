import { PlayerState, SafehouseUpgradeId, SafehouseUpgradeConfig } from './types';

export const SAFEHOUSE_UPGRADES: SafehouseUpgradeConfig[] = [
  {
    id: 'steel_doors',
    name: 'Reinforced Steel Vault Doors',
    cost: 15000,
    icon: '🛡️',
    description: 'Bank-grade steel blast doors with biometric locks. Expands property stash vault by +250 units and provides +50% raid defense.',
    storageBonus: 250,
    heatReductionBonus: 0,
    raidDefenseBonus: 0.50,
  },
  {
    id: 'decoy_radio',
    name: 'Decoy Radio Transmitters',
    cost: 25000,
    icon: '📻',
    description: 'Phony encrypted emergency channels and spoofed cellular antennas to divert DEA wiretaps. Reduces local city heat accumulation by -35%.',
    storageBonus: 0,
    heatReductionBonus: 0.35,
    raidDefenseBonus: 0,
  },
  {
    id: 'escape_tunnel',
    name: 'Subterranean Escape Tunnels',
    cost: 45000,
    icon: '🕳️',
    description: 'Concealed blast-hatch leading to the city stormwater system. Guarantees 100% escape success if safehouse is raided by tactical teams.',
    storageBonus: 0,
    heatReductionBonus: 0,
    raidDefenseBonus: 1.0,
  },
  {
    id: 'chem_ventilation',
    name: 'Chemical Air-Scrubbing Ventilation',
    cost: 35000,
    icon: '💨',
    description: 'Activated carbon HEPA exhaust filtration. Masks chemical odors and completely eliminates laboratory toxic backfires and explosions.',
    storageBonus: 0,
    heatReductionBonus: 0.20,
    raidDefenseBonus: 0,
  },
  {
    id: 'auto_turret',
    name: 'Automated Defense Turrets',
    cost: 60000,
    icon: '🤖',
    description: 'Ceiling-mounted motion tracking machine guns. Inflicts massive counter-fire on attackers, granting +35% defense during turf ambushes.',
    storageBonus: 0,
    heatReductionBonus: 0,
    raidDefenseBonus: 0.35,
  },
];

export const SAFEHOUSE_UPGRADE_MAP = new Map<SafehouseUpgradeId, SafehouseUpgradeConfig>(
  SAFEHOUSE_UPGRADES.map((u) => [u.id, u])
);

export function getPropertyUpgrades(player: PlayerState, propertyId: string): SafehouseUpgradeId[] {
  return player.safehouseUpgrades?.[propertyId] || [];
}

export function hasPropertyUpgrade(
  player: PlayerState,
  propertyId: string,
  upgradeId: SafehouseUpgradeId
): boolean {
  const current = getPropertyUpgrades(player, propertyId);
  return current.includes(upgradeId);
}

export function buyPropertyUpgrade(
  player: PlayerState,
  propertyId: string,
  upgradeId: SafehouseUpgradeId
): { success: boolean; message: string } {
  if (!player.ownedProperties || !player.ownedProperties.includes(propertyId)) {
    return { success: false, message: 'You must own this property before installing upgrades.' };
  }

  const cfg = SAFEHOUSE_UPGRADE_MAP.get(upgradeId);
  if (!cfg) return { success: false, message: 'Invalid upgrade selected.' };

  if (hasPropertyUpgrade(player, propertyId, upgradeId)) {
    return { success: false, message: `${cfg.name} is already installed on this estate.` };
  }

  if (player.cash < cfg.cost) {
    return {
      success: false,
      message: `Insufficient cash to purchase ${cfg.name} ($${cfg.cost.toLocaleString()} required).`,
    };
  }

  player.cash -= cfg.cost;
  if (!player.safehouseUpgrades) {
    player.safehouseUpgrades = {};
  }
  if (!player.safehouseUpgrades[propertyId]) {
    player.safehouseUpgrades[propertyId] = [];
  }
  player.safehouseUpgrades[propertyId].push(upgradeId);

  return {
    success: true,
    message: `Installed ${cfg.name} on safehouse for $${cfg.cost.toLocaleString()}!`,
  };
}

export function calculateTotalPropertyStorageBonus(player: PlayerState): number {
  if (!player.safehouseUpgrades) return 0;
  let bonus = 0;
  for (const propId of Object.keys(player.safehouseUpgrades)) {
    const list = player.safehouseUpgrades[propId];
    for (const upId of list) {
      const cfg = SAFEHOUSE_UPGRADE_MAP.get(upId);
      if (cfg) bonus += cfg.storageBonus;
    }
  }
  return bonus;
}

export function calculatePropertyRaidDefense(player: PlayerState, propertyId?: string): number {
  if (!player.safehouseUpgrades) return 0;
  let defense = 0;
  const props = propertyId ? [propertyId] : Object.keys(player.safehouseUpgrades);
  for (const prop of props) {
    const list = player.safehouseUpgrades[prop] || [];
    for (const upId of list) {
      const cfg = SAFEHOUSE_UPGRADE_MAP.get(upId);
      if (cfg) defense += cfg.raidDefenseBonus;
    }
  }
  return Math.min(1.0, defense);
}
