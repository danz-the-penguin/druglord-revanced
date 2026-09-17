import { PlayerState, GameLogEntry, MarketItem } from './types';
import { CITY_MAP, RANK_MAP, DRUGS } from './constants';
import { getTotalWealth } from './game';

export const SAVE_SCHEMA_VERSION = 1;
export const CURRENT_GAME_VERSION = '2.1.0';

export type SaveSlotId = 'autosave' | 'slot_1' | 'slot_2' | 'slot_3';

export const AVAILABLE_SAVE_SLOTS: { id: SaveSlotId; label: string; isAuto?: boolean }[] = [
  { id: 'autosave', label: 'Auto-Save', isAuto: true },
  { id: 'slot_1', label: 'Manual Slot 1' },
  { id: 'slot_2', label: 'Manual Slot 2' },
  { id: 'slot_3', label: 'Manual Slot 3' },
];

export interface SaveSlotMetadata {
  slotId: SaveSlotId;
  title: string;
  savedAt: number;
  gameVersion: string;
  playerDay: number;
  maxDays: number;
  currentCityId: string;
  currentCityName: string;
  rankId: string;
  rankName: string;
  cash: number;
  bank: number;
  debt: number;
  netWorth: number;
  inventoryCount: number;
}

export interface DrugLordSaveFile {
  app: 'druglord2';
  version: number;
  savedAt: number;
  checksum: string;
  metadata: SaveSlotMetadata;
  state: {
    player: PlayerState;
    market: Record<string, MarketItem>;
    logs: GameLogEntry[];
    priceHistory: Record<string, number[]>;
  };
}

/**
 * Deterministic 32-bit FNV-1a hash checksum for save state verification
 */
export function calculateChecksum(payloadStr: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < payloadStr.length; i++) {
    hash ^= payloadStr.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * UTF-8 safe Base64 encoder for Syndicate Code strings
 */
export function toBase64Unicode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binString = '';
  for (let i = 0; i < bytes.length; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString);
}

/**
 * UTF-8 safe Base64 decoder for Syndicate Code strings
 */
export function fromBase64Unicode(base64: string): string {
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Build clean slot metadata for quick listing & previewing
 */
export function buildSaveMetadata(
  state: {
    player: PlayerState;
    market: Record<string, MarketItem>;
    logs: GameLogEntry[];
  },
  slotId: SaveSlotId,
  customTitle?: string
): SaveSlotMetadata {
  const player = state.player;
  const cityName = CITY_MAP.get(player.currentCityId)?.name ?? 'Unknown City';
  const rank = RANK_MAP.get(player.currentRankId)?.name ?? 'Wannabe';
  const netWorth = getTotalWealth(player);
  const inventoryCount = Object.values(player.inventory || {}).reduce((sum, item) => sum + (item?.units ?? 0), 0);

  const defaultTitle = slotId === 'autosave'
    ? `Auto-Save (Day ${player.currentDay})`
    : customTitle || `${rank} in ${cityName} (Day ${player.currentDay})`;

  return {
    slotId,
    title: defaultTitle,
    savedAt: Date.now(),
    gameVersion: CURRENT_GAME_VERSION,
    playerDay: player.currentDay,
    maxDays: player.maxDays,
    currentCityId: player.currentCityId,
    currentCityName: cityName,
    rankId: player.currentRankId,
    rankName: rank,
    cash: player.cash,
    bank: player.bank,
    debt: player.debt,
    netWorth,
    inventoryCount,
  };
}

/**
 * Create a full structured save file from runtime state
 */
export function createSaveFile(
  state: {
    player: PlayerState;
    market: Record<string, MarketItem>;
    logs: GameLogEntry[];
    priceHistory: Record<string, number[]>;
  },
  slotId: SaveSlotId,
  customTitle?: string
): DrugLordSaveFile {
  const metadata = buildSaveMetadata(state, slotId, customTitle);
  const stateString = JSON.stringify(state);
  const checksum = calculateChecksum(stateString);

  return {
    app: 'druglord2',
    version: SAVE_SCHEMA_VERSION,
    savedAt: Date.now(),
    checksum,
    metadata,
    state: {
      player: JSON.parse(JSON.stringify(state.player)),
      market: JSON.parse(JSON.stringify(state.market)),
      logs: JSON.parse(JSON.stringify(state.logs)),
      priceHistory: JSON.parse(JSON.stringify(state.priceHistory || {})),
    },
  };
}

export function exportSaveToJson(saveFile: DrugLordSaveFile): string {
  return JSON.stringify(saveFile, null, 2);
}

export function exportSaveToSyndicateCode(saveFile: DrugLordSaveFile): string {
  const jsonStr = JSON.stringify(saveFile);
  return `DL2-${toBase64Unicode(jsonStr)}`;
}

export function generateSaveFilename(metadata: SaveSlotMetadata): string {
  const safeCity = metadata.currentCityName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `druglord2_day${metadata.playerDay}_${safeCity}_${metadata.savedAt}.json`;
}

/**
 * Validates and migrates an uploaded/pasted save string
 */
export function parseAndValidateSave(rawInput: string): { success: true; data: DrugLordSaveFile } | { success: false; error: string } {
  if (!rawInput || typeof rawInput !== 'string') {
    return { success: false, error: 'Empty save data provided' };
  }

  let cleaned = rawInput.trim();

  // If encoded with DL2- syndicate code prefix or is raw Base64
  if (cleaned.startsWith('DL2-')) {
    cleaned = cleaned.substring(4).trim();
    try {
      cleaned = fromBase64Unicode(cleaned);
    } catch {
      return { success: false, error: 'Invalid Syndicate Code: Failed to decode Base64 string.' };
    }
  } else if (!cleaned.startsWith('{') && !cleaned.endsWith('}')) {
    // Attempt decoding as raw base64 if not JSON brackets
    try {
      cleaned = fromBase64Unicode(cleaned);
    } catch {
      return { success: false, error: 'Unrecognized save format. Must be JSON or valid DL2- Syndicate Code.' };
    }
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    return { success: false, error: `Invalid JSON syntax: ${err.message}` };
  }

  // Basic structure check
  if (!parsed || typeof parsed !== 'object') {
    return { success: false, error: 'Save data is not a valid object.' };
  }

  // Handle case where state was passed directly or wrapped in DrugLordSaveFile
  let statePayload = parsed.state || (parsed.player ? parsed : null);
  if (!statePayload || !statePayload.player) {
    return { success: false, error: 'Missing player state in save file.' };
  }

  const p = statePayload.player;
  if (typeof p.cash !== 'number' || typeof p.debt !== 'number' || typeof p.currentDay !== 'number') {
    return { success: false, error: 'Corrupted player data: missing essential numeric attributes (cash, debt, day).' };
  }

  // Migrations and defaults for forward/backward compatibility
  p.inventory = p.inventory || {};
  p.weapons = p.weapons || {};
  p.ammo = p.ammo || {};
  p.vaults = p.vaults || {};
  p.ownedProperties = Array.isArray(p.ownedProperties) ? p.ownedProperties : [];
  p.cheats = p.cheats || { godMode: false, extraCapacity: 0 };
  p.maxHealth = p.maxHealth || 100;
  p.health = Math.min(p.maxHealth, Math.max(1, p.health ?? 100));
  p.currentCityId = p.currentCityId || 'new_york';
  p.currentRankId = p.currentRankId || 'wannabe';

  const market = statePayload.market || {};
  const logs = Array.isArray(statePayload.logs) ? statePayload.logs : [];
  let priceHistory = statePayload.priceHistory || {};

  // If price history is missing, synthesize baseline points
  if (Object.keys(priceHistory).length === 0) {
    for (const drug of DRUGS) {
      const cur = market[drug.id]?.price ?? drug.basePrice;
      priceHistory[drug.id] = [cur, cur, cur, cur, cur];
    }
  }

  const cleanState = {
    player: p,
    market,
    logs,
    priceHistory,
  };

  const metadata: SaveSlotMetadata = parsed.metadata || buildSaveMetadata(cleanState, 'slot_1');
  const checksum = calculateChecksum(JSON.stringify(cleanState));

  const validSaveFile: DrugLordSaveFile = {
    app: 'druglord2',
    version: parsed.version || SAVE_SCHEMA_VERSION,
    savedAt: parsed.savedAt || Date.now(),
    checksum,
    metadata,
    state: cleanState,
  };

  return { success: true, data: validSaveFile };
}

// ==========================================
// LocalStorage Persistence Helpers
// ==========================================

export function getSaveStorageKey(slotId: SaveSlotId): string {
  return `druglord2_save_${slotId}`;
}

export function saveToLocalStorage(slotId: SaveSlotId, saveFile: DrugLordSaveFile): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const key = getSaveStorageKey(slotId);
    saveFile.metadata.slotId = slotId;
    window.localStorage.setItem(key, JSON.stringify(saveFile));
    return true;
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    return false;
  }
}

export function loadFromLocalStorage(slotId: SaveSlotId): DrugLordSaveFile | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const key = getSaveStorageKey(slotId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const res = parseAndValidateSave(raw);
    return res.success ? res.data : null;
  } catch (err) {
    console.error('Failed to load from localStorage:', err);
    return null;
  }
}

export function listLocalSaveSlots(): (SaveSlotMetadata | null)[] {
  return AVAILABLE_SAVE_SLOTS.map((slot) => {
    const file = loadFromLocalStorage(slot.id);
    return file ? file.metadata : null;
  });
}

export function deleteLocalSaveSlot(slotId: SaveSlotId): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const key = getSaveStorageKey(slotId);
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error('Failed to delete save slot:', err);
    return false;
  }
}

export function clearAllLocalSaves(): void {
  for (const slot of AVAILABLE_SAVE_SLOTS) {
    deleteLocalSaveSlot(slot.id);
  }
}

export function downloadSaveJsonFile(saveFile: DrugLordSaveFile): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const jsonStr = exportSaveToJson(saveFile);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = generateSaveFilename(saveFile.metadata);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
