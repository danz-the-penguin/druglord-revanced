import { describe, it, expect } from 'vitest';
import { createInitialState, syncStateFromMemory, syncStateToMemory } from '../game';
import { executeCheat } from '../cheats';
import { memoryMirror, MEM_OFFSETS } from '../memoryBuffer';

describe('Cheats & Cheat Engine Memory Mirror', () => {
  it('modifies cash, bank, and days via command execution', () => {
    const state = createInitialState();

    const cashRes = executeCheat('cash +500000', state);
    expect(cashRes.success).toBe(true);
    expect(state.player.cash).toBe(501000);

    const bankRes = executeCheat('bank 2000000', state);
    expect(bankRes.success).toBe(true);
    expect(state.player.bank).toBe(2000000);

    const daysRes = executeCheat('days +45', state);
    expect(daysRes.success).toBe(true);
    expect(state.player.maxDays).toBe(75);

    const debtRes = executeCheat('clear_debt', state);
    expect(debtRes.success).toBe(true);
    expect(state.player.debt).toBe(0);

    const godRes = executeCheat('god', state);
    expect(godRes.success).toBe(true);
    expect(state.player.cheats.godMode).toBe(true);
  });

  it('reflects Cheat Engine external memory modifications directly into game state', () => {
    const state = createInitialState();
    syncStateToMemory(state);

    // Verify initial values match in memory buffer
    expect(memoryMirror.int32View[MEM_OFFSETS.CASH]).toBe(1000);
    expect(memoryMirror.int32View[MEM_OFFSETS.DEBT]).toBe(1000);

    // SIMULATE CHEAT ENGINE: User scans for 1000 and freezes/edits memory to 9,999,999
    memoryMirror.int32View[MEM_OFFSETS.CASH] = 9999999;
    memoryMirror.int32View[MEM_OFFSETS.DEBT] = 0;
    memoryMirror.int32View[MEM_OFFSETS.MAX_DAYS] = 500;
    memoryMirror.int32View[MEM_OFFSETS.GOD_MODE] = 1;

    // Trigger engine memory polling check
    const changed = syncStateFromMemory(state);
    expect(changed).toBe(true);

    // Verify state received the Cheat Engine memory modifications
    expect(state.player.cash).toBe(9999999);
    expect(state.player.debt).toBe(0);
    expect(state.player.maxDays).toBe(500);
    expect(state.player.cheats.godMode).toBe(true);
  });

  it('supports sfx palette inspection and playback via sfx cheat command', () => {
    const state = createInitialState();
    const listRes = executeCheat('sfx', state);
    expect(listRes.success).toBe(true);
    expect(listRes.message).toContain('Sound Synthesizer Palette');

    const playRes = executeCheat('sfx pager', state);
    expect(playRes.success).toBe(true);
    expect(playRes.message).toContain('Synthesized Web Audio SFX: "pager"');
  });
});
