import { describe, it, expect } from 'vitest';
import { createInitialState } from '../game';
import {
  createSaveFile,
  exportSaveToJson,
  exportSaveToSyndicateCode,
  parseAndValidateSave,
  toBase64Unicode,
  fromBase64Unicode,
} from '../persistence';

describe('Underworld Persistence Engine', () => {
  it('correctly creates a structured save file with checksum and metadata', () => {
    const state = createInitialState();
    state.player.cash = 25000;
    state.player.debt = 5000;
    state.player.currentDay = 7;
    state.player.currentCityId = 'miami';

    const saveFile = createSaveFile(
      {
        player: state.player,
        market: state.market,
        logs: state.logs,
        priceHistory: { pot: [50, 60, 55] },
      },
      'slot_1',
      'Miami Vice Run'
    );

    expect(saveFile.app).toBe('druglord2');
    expect(saveFile.version).toBe(1);
    expect(saveFile.metadata.slotId).toBe('slot_1');
    expect(saveFile.metadata.title).toBe('Miami Vice Run');
    expect(saveFile.metadata.playerDay).toBe(7);
    expect(saveFile.metadata.cash).toBe(25000);
    expect(saveFile.metadata.debt).toBe(5000);
    expect(saveFile.metadata.currentCityId).toBe('miami');
    expect(saveFile.metadata.currentCityName).toBe('Miami');
    expect(saveFile.checksum).toBeDefined();
    expect(saveFile.checksum.length).toBe(8);
  });

  it('exports to JSON and re-imports losslessly', () => {
    const state = createInitialState();
    state.player.cash = 15000;
    state.player.inventory['cocaine'] = { drugId: 'cocaine', units: 10, avgCost: 22000 };

    const original = createSaveFile(
      {
        player: state.player,
        market: state.market,
        logs: state.logs,
        priceHistory: {},
      },
      'autosave'
    );

    const json = exportSaveToJson(original);
    expect(json).toContain('"app": "druglord2"');
    expect(json).toContain('"cocaine"');

    const result = parseAndValidateSave(json);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.cash).toBe(15000);
      expect(result.data.state.player.inventory['cocaine'].units).toBe(10);
      expect(result.data.state.player.inventory['cocaine'].avgCost).toBe(22000);
    }
  });

  it('exports to Base64 Syndicate Code and imports back accurately', () => {
    const state = createInitialState();
    state.player.cash = 99999;
    state.player.debt = 0;

    const original = createSaveFile(
      {
        player: state.player,
        market: state.market,
        logs: state.logs,
        priceHistory: {},
      },
      'slot_2',
      'Cartel Boss'
    );

    const syndicateCode = exportSaveToSyndicateCode(original);
    expect(syndicateCode.startsWith('DL2-')).toBe(true);

    const result = parseAndValidateSave(syndicateCode);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.title).toBe('Cartel Boss');
      expect(result.data.state.player.cash).toBe(99999);
      expect(result.data.state.player.debt).toBe(0);
    }
  });

  it('rejects corrupted or garbage save inputs with informative errors', () => {
    expect(parseAndValidateSave('').success).toBe(false);
    expect(parseAndValidateSave('DL2-not-valid-base64!').success).toBe(false);
    expect(parseAndValidateSave('{"foo": "bar"}').success).toBe(false);
    expect(parseAndValidateSave('{"state": {"player": {"cash": "not a number"}}}').success).toBe(false);
  });

  it('safely performs UTF-8 unicode encoding and decoding', () => {
    const testString = 'DrugLord2: Bogotá, Medellín, Zürich, 東京';
    const encoded = toBase64Unicode(testString);
    const decoded = fromBase64Unicode(encoded);
    expect(decoded).toBe(testString);
  });
});
