/**
 * Underworld Memory Mirror (Cheat Engine Compatibility Layer)
 * 
 * Allocates a fixed, non-relocatable 32-bit integer ArrayBuffer.
 * Cheat Engine can search for 4-byte exact values (Cash, Bank, Debt, Health, Day)
 * directly in the browser / desktop process memory.
 */

// Byte offsets in the 32-bit integer array
export const MEM_OFFSETS = {
  CASH: 0,           // 0x00
  BANK: 1,           // 0x04
  DEBT: 2,           // 0x08
  HEALTH: 3,         // 0x0C
  CURRENT_DAY: 4,    // 0x10
  MAX_DAYS: 5,       // 0x14
  GOD_MODE: 6,       // 0x18 (1 = active, 0 = off)
  EXTRA_CAPACITY: 7, // 0x1C
} as const;

export class MemoryMirror {
  // Allocate 1024 bytes (256 32-bit integers)
  private buffer: ArrayBuffer;
  public int32View: Int32Array;

  constructor() {
    this.buffer = new ArrayBuffer(1024);
    this.int32View = new Int32Array(this.buffer);

    // Make available on window for debugging/inspection
    if (typeof window !== 'undefined') {
      (window as unknown as { __DRUGLORD_MEM__: Int32Array }).__DRUGLORD_MEM__ = this.int32View;
    }
  }

  public syncFromState(state: {
    cash: number;
    bank: number;
    debt: number;
    health: number;
    currentDay: number;
    maxDays: number;
  }, godMode = 0, extraCapacity = 0): void {
    this.int32View[MEM_OFFSETS.CASH] = Math.round(state.cash);
    this.int32View[MEM_OFFSETS.BANK] = Math.round(state.bank);
    this.int32View[MEM_OFFSETS.DEBT] = Math.round(state.debt);
    this.int32View[MEM_OFFSETS.HEALTH] = Math.round(state.health);
    this.int32View[MEM_OFFSETS.CURRENT_DAY] = Math.round(state.currentDay);
    this.int32View[MEM_OFFSETS.MAX_DAYS] = Math.round(state.maxDays);
    this.int32View[MEM_OFFSETS.GOD_MODE] = godMode;
    this.int32View[MEM_OFFSETS.EXTRA_CAPACITY] = extraCapacity;
  }

  public readMemory() {
    return {
      cash: this.int32View[MEM_OFFSETS.CASH],
      bank: this.int32View[MEM_OFFSETS.BANK],
      debt: this.int32View[MEM_OFFSETS.DEBT],
      health: this.int32View[MEM_OFFSETS.HEALTH],
      currentDay: this.int32View[MEM_OFFSETS.CURRENT_DAY],
      maxDays: this.int32View[MEM_OFFSETS.MAX_DAYS],
      godMode: this.int32View[MEM_OFFSETS.GOD_MODE] === 1,
      extraCapacity: this.int32View[MEM_OFFSETS.EXTRA_CAPACITY],
    };
  }
}

export const memoryMirror = new MemoryMirror();
