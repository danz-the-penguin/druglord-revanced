import {
  LabType,
  LabRoom,
  PrecursorChemical,
  CookRecipe,
  ActiveCookBatch,
} from './productionTypes';
import { PlayerState } from './types';
import { CITY_MAP, DRUG_MAP, PROPERTY_MAP } from './constants';
import {
  GameEngineState,
  ActionResult,
  getCarryingCapacity,
  getInventoryTotalUnits,
  modifyCityHeat,
} from './game';
import { soundEngine } from '../utils/audio';

/**
 * Seaport Logistics Hubs offering deep maritime precursor discounts (30% off)
 */
export const SEAPORT_CITIES = new Set<string>([
  'amsterdam',
  'singapore',
  'hong_kong',
  'dubai',
  'los_angeles',
  'panama_city',
  'tokyo',
  'sydney',
  'rio_de_janeiro',
  'sao_paulo',
  'vancouver',
  'lagos',
]);

export function isSeaportCity(cityId: string): boolean {
  return SEAPORT_CITIES.has(cityId.toLowerCase());
}

/**
 * Precursor Chemical Catalog
 */
export const PRECURSORS: Record<string, PrecursorChemical> = {
  hydro_nutrients: {
    id: 'hydro_nutrients',
    name: 'Hydroponic Mineral Salts & Genetics',
    chemicalFormula: 'NPK-12-8-16',
    casNumber: '7778-77-0',
    basePrice: 15,
    seaportDiscount: 0.35,
    description: 'High-nitrogen concentrated mineral nutrient solution with feminized botanical genetics.',
    hazardRating: 'Low',
  },
  ephedrine: {
    id: 'ephedrine',
    name: 'Bulk Pseudoephedrine Crystals',
    chemicalFormula: 'C10H15NO',
    casNumber: '299-42-3',
    basePrice: 240,
    seaportDiscount: 0.30,
    description: 'Diverted pharmaceutical cold medicine precursor. The core alkaloid building block for central nervous stimulants.',
    hazardRating: 'Moderate',
  },
  acetic_anhydride: {
    id: 'acetic_anhydride',
    name: 'Industrial Acetic Anhydride',
    chemicalFormula: 'C4H6O3',
    casNumber: '108-24-7',
    basePrice: 320,
    seaportDiscount: 0.30,
    description: 'Schedule II industrial acetylating reagent in 55-gallon steel drums. Required for high-grade chemical synthesis.',
    hazardRating: 'High',
  },
  pill_binder: {
    id: 'pill_binder',
    name: 'Microcrystalline Pill Excipient & Dye',
    chemicalFormula: '(C6H10O5)n',
    casNumber: '9004-34-6',
    basePrice: 18,
    seaportDiscount: 0.35,
    description: 'Pharmaceutical pressing binder, magnesium stearate lubricant, and counterfeit brand stamp dyes.',
    hazardRating: 'Low',
  },
  ergot_solvents: {
    id: 'ergot_solvents',
    name: 'Ergot Alkaloid Culture & Reagents',
    chemicalFormula: 'C33H35N5O5',
    casNumber: '113-15-5',
    basePrice: 90,
    seaportDiscount: 0.30,
    description: 'Claviceps fungus extract and reagent-grade diethylamine solvents.',
    hazardRating: 'Moderate',
  },
  bio_precursor_z: {
    id: 'bio_precursor_z',
    name: 'Recombinant Peptide Precursor-Z',
    chemicalFormula: 'C32H48N6O4-Pre',
    casNumber: '94520-18-2',
    basePrice: 1150,
    seaportDiscount: 0.25,
    description: 'Cryogenically stabilized synthetic peptide broth. Clandestine military nootropic reactant.',
    hazardRating: 'Severe',
  },
};

/**
 * Modular Clandestine Laboratory Rooms
 */
export const LAB_ROOMS: Record<LabType, LabRoom> = {
  hydro_greenhouse: {
    id: 'hydro_greenhouse',
    name: 'Hydroponic Climate Greenhouse',
    codename: 'Greenhouse Alpha',
    cost: 75000,
    eligibleProperties: [
      'suburban_safehouse',
      'fortified_compound',
      'industrial_warehouse',
      'island_paradise',
      'private_hangar',
      'sovereign_airstrip_compound',
    ],
    description: 'Computer-controlled aeroponic grow bays with full-spectrum COB LED arrays and industrial charcoal HEPA scrubbers.',
    flavor: 'Generates pure organic harvest with zero street adulterants.',
    icon: 'Palmtree',
    outputSummary: 'Cultivates high-yield Pot & Psilocybin Mushrooms',
  },
  chemical_reflux: {
    id: 'chemical_reflux',
    name: 'Chemical Reflux Synthesis Lab',
    codename: 'Glassware Reactor',
    cost: 250000,
    eligibleProperties: [
      'fortified_compound',
      'industrial_warehouse',
      'island_paradise',
      'private_hangar',
      'sovereign_airstrip_compound',
    ],
    description: 'Borosilicate glassware reflux condensers, vacuum distillation manifolds, heating mantles, and acid-scrubbing fume hoods.',
    flavor: 'Industrial reduction yields high-purity methamphetamine and speed crystal.',
    icon: 'FlaskConical',
    outputSummary: 'Synthesizes Ice (Meth) & Speed Sulphate',
  },
  pill_press: {
    id: 'pill_press',
    name: 'Industrial Rotary Pill Press',
    codename: 'Tablet Die Matrix',
    cost: 160000,
    eligibleProperties: [
      'penthouse_suite',
      'fortified_compound',
      'industrial_warehouse',
      'island_paradise',
      'private_hangar',
      'sovereign_airstrip_compound',
    ],
    description: 'Heavy 16-station rotary punch tablet press with interchangeable cartel logo punches and high-precision electronic scale feeders.',
    flavor: 'Punches counterfeit pharmaceutical pills and designer party tablets at wholesale volume.',
    icon: 'Disc',
    outputSummary: 'Presses Counterfeit Ecstasy & Diverted Oxycodone',
  },
  bio_reactor: {
    id: 'bio_reactor',
    name: 'Cryogenic Bio-Reactor Facility',
    codename: 'Vortex Synthesizer',
    cost: 1250000,
    eligibleProperties: [
      'fortified_compound',
      'industrial_warehouse',
      'island_paradise',
      'private_hangar',
      'sovereign_airstrip_compound',
    ],
    description: 'Hermetically sealed bioreactor tanks, peristaltic dosing pumps, centrifuge cascades, and liquid nitrogen stabilization chambers.',
    flavor: 'Secret bio-synthesis facility engineering elite tactical compounds and lethal synthetic sedatives.',
    icon: 'Dna',
    outputSummary: 'Synthesizes Compound-Z (Super Soldier Serum) & Carfentanil',
  },
};

/**
 * Cook Recipes Catalog
 */
export const COOK_RECIPES: CookRecipe[] = [
  {
    id: 'recipe_pot',
    labType: 'hydro_greenhouse',
    name: 'High-Yield Aeroponic Pot Crop',
    outputDrugId: 'pot',
    outputUnits: 6,
    cookDays: 1,
    ingredients: [{ precursorId: 'hydro_nutrients', amount: 1 }],
    heatProduced: 1,
    description: 'Cures dense, high-THC indoor buds with rapid nitrogen flush.',
  },
  {
    id: 'recipe_mushrooms',
    labType: 'hydro_greenhouse',
    name: 'Psilocybin Spore Inoculation',
    outputDrugId: 'mushrooms',
    outputUnits: 4,
    cookDays: 1,
    ingredients: [{ precursorId: 'hydro_nutrients', amount: 2 }],
    heatProduced: 1,
    description: 'Sterilized grain spawn substrate yielding potent psychoactive fungi caps.',
  },
  {
    id: 'recipe_ice',
    labType: 'chemical_reflux',
    name: 'd-Methamphetamine "Ice" Shards',
    outputDrugId: 'ice',
    outputUnits: 3,
    cookDays: 2,
    ingredients: [
      { precursorId: 'ephedrine', amount: 2 },
      { precursorId: 'acetic_anhydride', amount: 1 },
    ],
    heatProduced: 5,
    description: 'Nagai reduction method yielding translucent 99%-pure crystal shards.',
  },
  {
    id: 'recipe_speed',
    labType: 'chemical_reflux',
    name: 'Amphetamine Sulphate "Speed" Powder',
    outputDrugId: 'speed',
    outputUnits: 5,
    cookDays: 1,
    ingredients: [{ precursorId: 'ephedrine', amount: 1 }],
    heatProduced: 2,
    description: 'Synthetic paste dried into potent central nervous stimulant powder.',
  },
  {
    id: 'recipe_ecstasy',
    labType: 'pill_press',
    name: 'Cartel-Stamped Party Ecstasy Tablets',
    outputDrugId: 'ecstasy',
    outputUnits: 8,
    cookDays: 1,
    ingredients: [
      { precursorId: 'pill_binder', amount: 1 },
      { precursorId: 'ergot_solvents', amount: 1 },
    ],
    heatProduced: 2,
    description: 'Clean pressed MDMA tablets with custom cartel insignia dies.',
  },
  {
    id: 'recipe_oxycodone',
    labType: 'pill_press',
    name: 'Counterfeit Diverted Oxycodone M-30s',
    outputDrugId: 'oxycodone',
    outputUnits: 4,
    cookDays: 1,
    ingredients: [
      { precursorId: 'pill_binder', amount: 2 },
      { precursorId: 'ephedrine', amount: 1 },
    ],
    heatProduced: 3,
    description: 'Precision-stamped pharmaceutical counterfeits with heavy street margins.',
  },
  {
    id: 'recipe_compound_z',
    labType: 'bio_reactor',
    name: 'Compound-Z (Black-Ops Combat Nootropic)',
    outputDrugId: 'super_soldier_serum',
    outputUnits: 1,
    cookDays: 3,
    ingredients: [
      { precursorId: 'bio_precursor_z', amount: 2 },
      { precursorId: 'acetic_anhydride', amount: 1 },
    ],
    heatProduced: 7,
    description: 'Military-grade neural combat stimulant synthesized in pressurized bioreactor.',
  },
  {
    id: 'recipe_carfentanil',
    labType: 'bio_reactor',
    name: 'Carfentanil Elephant Sedative Batch',
    outputDrugId: 'carfentanil',
    outputUnits: 2,
    cookDays: 2,
    ingredients: [
      { precursorId: 'bio_precursor_z', amount: 1 },
      { precursorId: 'ephedrine', amount: 1 },
    ],
    heatProduced: 6,
    description: 'Ultra-lethal synthetic opioid concentrate. Extreme value and high margins.',
  },
];

export const RECIPE_MAP = new Map<string, CookRecipe>(
  COOK_RECIPES.map((r) => [r.id, r])
);

/**
 * Maximum laboratory rooms per property tier
 */
export function getLabMaxSlots(propertyId: string): number {
  switch (propertyId) {
    case 'suburban_safehouse':
      return 1;
    case 'penthouse_suite':
      return 1;
    case 'fortified_compound':
      return 2;
    case 'industrial_warehouse':
      return 4;
    case 'island_paradise':
      return 4;
    case 'private_hangar':
      return 3;
    case 'sovereign_airstrip_compound':
      return 6;
    default:
      return 0;
  }
}

export function getLabAvailableSlots(player: PlayerState, propertyId: string): number {
  const max = getLabMaxSlots(propertyId);
  const current = player.installedLabs?.[propertyId]?.length || 0;
  return Math.max(0, max - current);
}

/**
 * Calculate dynamic precursor price based on seaport status
 */
export function getPrecursorPrice(precursorId: string, cityId: string): number {
  const precursor = PRECURSORS[precursorId];
  if (!precursor) return 100;
  const isPort = isSeaportCity(cityId);
  if (isPort) {
    return Math.round(precursor.basePrice * (1 - precursor.seaportDiscount));
  }
  return precursor.basePrice;
}

/**
 * Check if a player can build a specific lab module in a property
 */
export function canBuildLab(
  player: PlayerState,
  propertyId: string,
  labType: LabType
): { allowed: boolean; reason?: string } {
  if (!player.ownedProperties.includes(propertyId)) {
    return { allowed: false, reason: 'You do not own this property.' };
  }

  const lab = LAB_ROOMS[labType];
  if (!lab) {
    return { allowed: false, reason: 'Invalid lab room module.' };
  }

  if (!lab.eligibleProperties.includes(propertyId)) {
    return {
      allowed: false,
      reason: `This property does not have the infrastructure required for a ${lab.name}.`,
    };
  }

  const availableSlots = getLabAvailableSlots(player, propertyId);
  if (availableSlots <= 0) {
    return {
      allowed: false,
      reason: `All lab module slots (${getLabMaxSlots(propertyId)}) in this property are occupied.`,
    };
  }

  const installed = player.installedLabs?.[propertyId] || [];
  if (installed.includes(labType)) {
    return {
      allowed: false,
      reason: `This property already has an operational ${lab.name}.`,
    };
  }

  if (player.cash < lab.cost) {
    return {
      allowed: false,
      reason: `Insufficient liquid cash. Requires $${lab.cost.toLocaleString()}.`,
    };
  }

  return { allowed: true };
}

/**
 * Build a modular lab room inside an owned property
 */
export function buildLab(
  state: GameEngineState,
  propertyId: string,
  labType: LabType
): ActionResult {
  const check = canBuildLab(state.player, propertyId, labType);
  if (!check.allowed) {
    return { success: false, message: check.reason || 'Cannot build lab.' };
  }

  const lab = LAB_ROOMS[labType];
  const property = PROPERTY_MAP.get(propertyId);

  // Deduct cost
  state.player.cash -= lab.cost;

  // Install
  if (!state.player.installedLabs) {
    state.player.installedLabs = {};
  }
  if (!state.player.installedLabs[propertyId]) {
    state.player.installedLabs[propertyId] = [];
  }
  state.player.installedLabs[propertyId].push(labType);

  soundEngine.play('vault');

  const propName = property?.name ?? propertyId;
  const currentCity = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';

  state.logs.unshift({
    day: state.player.currentDay,
    city: currentCity,
    type: 'production',
    message: `🧪 LAB CONSTRUCTED: Installed [${lab.name}] inside ${propName} for $${lab.cost.toLocaleString()}. Modular cooking bay operational!`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Successfully constructed ${lab.name} in ${propName}!`,
  };
}

/**
 * Purchase precursor chemicals at a commercial seaport or chemical broker
 */
export function buyPrecursor(
  state: GameEngineState,
  precursorId: string,
  units: number,
  payFrom: 'cash' | 'bank' = 'cash'
): ActionResult {
  if (units <= 0) return { success: false, message: 'Invalid quantity.' };

  const precursor = PRECURSORS[precursorId];
  if (!precursor) return { success: false, message: 'Unknown chemical precursor.' };

  const unitPrice = getPrecursorPrice(precursorId, state.player.currentCityId);
  const totalCost = unitPrice * units;

  if (payFrom === 'cash') {
    if (state.player.cash < totalCost) {
      return { success: false, message: `Insufficient cash. Need $${totalCost.toLocaleString()}.` };
    }
    state.player.cash -= totalCost;
  } else {
    if (state.player.bank < totalCost) {
      return { success: false, message: `Insufficient bank funds. Need $${totalCost.toLocaleString()}.` };
    }
    state.player.bank -= totalCost;
  }

  // Precursor storage
  if (!state.player.precursorInventory) {
    state.player.precursorInventory = {};
  }
  state.player.precursorInventory[precursorId] =
    (state.player.precursorInventory[precursorId] || 0) + units;

  soundEngine.play('buy');

  const currentCity = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';
  const isPort = isSeaportCity(state.player.currentCityId);

  state.logs.unshift({
    day: state.player.currentDay,
    city: currentCity,
    type: 'production',
    message: `⚗️ PRECURSORS PURCHASED: Acquired ${units}x ${precursor.name} for $${totalCost.toLocaleString()} ($${unitPrice}/unit)${isPort ? ' [SEAPORT MARITIME DISCOUNT]' : ''}.`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Purchased ${units}x ${precursor.name} for $${totalCost.toLocaleString()}.`,
  };
}

/**
 * Verify whether player has ingredients and available lab to start a batch
 */
export function canStartCookBatch(
  player: PlayerState,
  propertyId: string,
  recipeId: string,
  batchCount = 1
): { allowed: boolean; reason?: string } {
  if (batchCount <= 0) return { allowed: false, reason: 'Invalid batch count.' };

  const recipe = RECIPE_MAP.get(recipeId);
  if (!recipe) return { allowed: false, reason: 'Unknown recipe.' };

  // Check if player owns property
  if (!player.ownedProperties.includes(propertyId)) {
    return { allowed: false, reason: 'You do not own this property.' };
  }

  // Check if property has matching lab installed
  const labs = player.installedLabs?.[propertyId] || [];
  if (!labs.includes(recipe.labType)) {
    const labName = LAB_ROOMS[recipe.labType]?.name ?? recipe.labType;
    return {
      allowed: false,
      reason: `This property does not have a ${labName} installed.`,
    };
  }

  // Check precursor inventory
  const inventory = player.precursorInventory || {};
  for (const ing of recipe.ingredients) {
    const needed = ing.amount * batchCount;
    const available = inventory[ing.precursorId] || 0;
    if (available < needed) {
      const precName = PRECURSORS[ing.precursorId]?.name ?? ing.precursorId;
      return {
        allowed: false,
        reason: `Missing precursor chemicals: Need ${needed}x ${precName} (you hold ${available}x).`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Start a clandestine production cook batch
 */
export function startCookBatch(
  state: GameEngineState,
  propertyId: string,
  recipeId: string,
  batchCount = 1
): ActionResult {
  const check = canStartCookBatch(state.player, propertyId, recipeId, batchCount);
  if (!check.allowed) {
    return { success: false, message: check.reason || 'Cannot start batch.' };
  }

  const recipe = RECIPE_MAP.get(recipeId)!;

  // Consume ingredients
  if (!state.player.precursorInventory) state.player.precursorInventory = {};
  for (const ing of recipe.ingredients) {
    const needed = ing.amount * batchCount;
    state.player.precursorInventory[ing.precursorId] -= needed;
    if (state.player.precursorInventory[ing.precursorId] <= 0) {
      delete state.player.precursorInventory[ing.precursorId];
    }
  }

  // Queue active cook batch
  const batchId = `cook_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const totalUnits = recipe.outputUnits * batchCount;

  const newBatch: ActiveCookBatch = {
    id: batchId,
    propertyId,
    labType: recipe.labType,
    recipeId: recipe.id,
    recipeName: recipe.name,
    outputDrugId: recipe.outputDrugId,
    outputUnits: totalUnits,
    daysRemaining: recipe.cookDays,
    totalDays: recipe.cookDays,
    status: 'cooking',
    startedAtDay: state.player.currentDay,
    batchCount,
  };

  if (!state.player.activeCookBatches) {
    state.player.activeCookBatches = [];
  }
  state.player.activeCookBatches.push(newBatch);

  // Slight heat generation in active city from chemical emissions
  if (recipe.heatProduced > 0) {
    modifyCityHeat(state, state.player.currentCityId, recipe.heatProduced * batchCount);
  }

  soundEngine.play('travel');

  const currentCity = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';
  const drugName = DRUG_MAP.get(recipe.outputDrugId)?.name ?? recipe.outputDrugId;

  state.logs.unshift({
    day: state.player.currentDay,
    city: currentCity,
    type: 'production',
    message: `🧪 BATCH COMMENCED: Initiated ${batchCount}x [${recipe.name}] cook in ${PROPERTY_MAP.get(propertyId)?.name}. Est. Output: ${totalUnits}x ${drugName} (Cook Time: ${recipe.cookDays} ${recipe.cookDays === 1 ? 'day' : 'days'}).`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Cook batch commenced! Ready in ${recipe.cookDays} ${recipe.cookDays === 1 ? 'day' : 'days'}.`,
  };
}

/**
 * Advance active cook batches during day rollover
 */
export function advanceCookBatches(state: GameEngineState): string[] {
  const notifications: string[] = [];
  const batches: ActiveCookBatch[] = state.player.activeCookBatches || [];

  for (const batch of batches) {
    if (batch.status === 'cooking') {
      batch.daysRemaining = Math.max(0, batch.daysRemaining - 1);
      if (batch.daysRemaining === 0) {
        batch.status = 'ready';
        const drugName = DRUG_MAP.get(batch.outputDrugId)?.name ?? batch.outputDrugId;
        const lab = LAB_ROOMS[batch.labType as LabType];
        const prop = PROPERTY_MAP.get(batch.propertyId);

        const msg = `✨ PRODUCTION READY: ${lab?.name ?? 'Lab'} in ${prop?.name ?? 'Property'} finished cooking ${batch.outputUnits}x ${drugName}! Ready to collect into stash or vault.`;
        notifications.push(msg);

        state.logs.unshift({
          day: state.player.currentDay,
          city: CITY_MAP.get(state.player.currentCityId)?.name ?? 'City',
          type: 'production',
          message: msg,
          timestamp: Date.now(),
        });
      }
    }
  }

  return notifications;
}

/**
 * Collect a finished cook batch into pocket stash or safehouse vault
 */
export function collectCookBatch(
  state: GameEngineState,
  batchId: string,
  destination: 'pocket' | 'vault' = 'pocket'
): ActionResult {
  const batches: ActiveCookBatch[] = state.player.activeCookBatches || [];
  const batch = batches.find((b: ActiveCookBatch) => b.id === batchId);

  if (!batch) {
    return { success: false, message: 'Batch not found.' };
  }

  if (batch.status !== 'ready') {
    return { success: false, message: 'This batch is still cooking.' };
  }

  const drug = DRUG_MAP.get(batch.outputDrugId);
  const drugName = drug?.name ?? batch.outputDrugId;

  if (destination === 'pocket') {
    const currentUnits = getInventoryTotalUnits(state.player);
    const capacity = getCarryingCapacity(state.player);
    if (currentUnits + batch.outputUnits > capacity) {
      return {
        success: false,
        message: `Stash capacity exceeded! Need ${batch.outputUnits} slots (only ${capacity - currentUnits} available). Store in Vault or expand coat.`,
      };
    }

    // Add to inventory with $0 cost basis (pure profit!)
    const existing = state.player.inventory[batch.outputDrugId];
    if (existing) {
      existing.units += batch.outputUnits;
    } else {
      state.player.inventory[batch.outputDrugId] = {
        drugId: batch.outputDrugId,
        units: batch.outputUnits,
        avgCost: 0,
      };
    }
  } else {
    // Deposit into safehouse vault in current city (or origin city)
    const cityId = state.player.currentCityId;
    if (!state.player.vaults) state.player.vaults = {};
    if (!state.player.vaults[cityId]) state.player.vaults[cityId] = {};
    state.player.vaults[cityId][batch.outputDrugId] =
      (state.player.vaults[cityId][batch.outputDrugId] || 0) + batch.outputUnits;
  }

  // Remove batch from active list
  state.player.activeCookBatches = batches.filter((b: ActiveCookBatch) => b.id !== batchId);

  soundEngine.play('vault');

  const currentCity = CITY_MAP.get(state.player.currentCityId)?.name ?? 'City';
  state.logs.unshift({
    day: state.player.currentDay,
    city: currentCity,
    type: 'production',
    message: `📦 BATCH COLLECTED: Collected ${batch.outputUnits}x ${drugName} into ${destination === 'pocket' ? 'personal stash' : 'safehouse vault'} (Cost Basis: $0 / Pure Wholesale Margin)!`,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: `Collected ${batch.outputUnits}x ${drugName} into ${destination === 'pocket' ? 'stash' : 'vault'}!`,
  };
}

/**
 * Cancel an in-progress cook batch (scraps batch with no precursor refund)
 */
export function cancelCookBatch(
  state: GameEngineState,
  batchId: string
): ActionResult {
  const batches: ActiveCookBatch[] = state.player.activeCookBatches || [];
  const batch = batches.find((b: ActiveCookBatch) => b.id === batchId);

  if (!batch) {
    return { success: false, message: 'Batch not found.' };
  }

  state.player.activeCookBatches = batches.filter((b: ActiveCookBatch) => b.id !== batchId);

  return {
    success: true,
    message: `Scrapped batch for ${batch.recipeName}. Chemical precursors were liquidated.`,
  };
}
