import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SoundEngine, SoundEffect, soundEngine, playSound } from '../audio';

describe('SoundEngine', () => {
  let engine: SoundEngine;

  const storageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, val: string) => storageMap.set(key, val),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear(),
  };

  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage);
    storageMap.clear();
    engine = new SoundEngine();
  });

  it('initializes with default volume and unmuted state', () => {
    expect(engine.getVolume()).toBeCloseTo(0.35);
    expect(engine.isMuted()).toBe(false);
  });

  it('clamps volume within [0, 1] range', () => {
    engine.setVolume(1.5);
    expect(engine.getVolume()).toBe(1);

    engine.setVolume(-0.5);
    expect(engine.getVolume()).toBe(0);

    engine.setVolume(0.75);
    expect(engine.getVolume()).toBe(0.75);
  });

  it('persists volume to localStorage', () => {
    engine.setVolume(0.6);
    expect(localStorage.getItem('druglord2_audio_volume')).toBe('0.6');

    // New instance loads from localStorage
    const newEngine = new SoundEngine();
    expect(newEngine.getVolume()).toBe(0.6);
  });

  it('toggles mute and persists state', () => {
    expect(engine.isMuted()).toBe(false);

    const muted = engine.toggleMute();
    expect(muted).toBe(true);
    expect(engine.isMuted()).toBe(true);
    expect(localStorage.getItem('druglord2_audio_muted')).toBe('true');

    engine.toggleMute();
    expect(engine.isMuted()).toBe(false);
    expect(localStorage.getItem('druglord2_audio_muted')).toBe('false');
  });

  it('notifies subscribers on volume and mute changes', () => {
    const listener = vi.fn();
    const unsub = engine.subscribe(listener);

    engine.setVolume(0.8);
    expect(listener).toHaveBeenCalledTimes(1);

    engine.setMuted(true);
    expect(listener).toHaveBeenCalledTimes(2);

    unsub();
    engine.setVolume(0.2);
    expect(listener).toHaveBeenCalledTimes(2); // No new invocation
  });

  it('safely handles play() when AudioContext is absent or in Node environment', () => {
    const effects: SoundEffect[] = [
      'buy',
      'sell',
      'travel',
      'police',
      'gunshot',
      'flee',
      'pager',
      'bribe',
      'heal',
      'bank',
      'vault',
      'courier',
      'victory',
      'defeat',
      'demotion',
      'click',
    ];

    for (const effect of effects) {
      expect(() => engine.play(effect)).not.toThrow();
    }
  });

  it('exports singleton soundEngine and playSound helper without errors', () => {
    expect(soundEngine).toBeDefined();
    expect(() => playSound('click')).not.toThrow();
  });

  it('runs synthesized audio graph when AudioContext is mocked', () => {
    const mockGainNode = {
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn().mockReturnThis(),
    };

    const mockOscillatorNode = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockFilterNode = {
      type: 'lowpass',
      frequency: {
        setValueAtTime: vi.fn(),
      },
      Q: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn().mockReturnThis(),
    };

    const mockBufferSourceNode = {
      buffer: null,
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockBuffer = {
      getChannelData: vi.fn().mockReturnValue(new Float32Array(1000)),
    };

    class MockAudioContext {
      currentTime = 0;
      sampleRate = 44100;
      state = 'running';
      destination = {};

      createGain = vi.fn().mockReturnValue(mockGainNode);
      createOscillator = vi.fn().mockReturnValue(mockOscillatorNode);
      createBiquadFilter = vi.fn().mockReturnValue(mockFilterNode);
      createBufferSource = vi.fn().mockReturnValue(mockBufferSourceNode);
      createBuffer = vi.fn().mockReturnValue(mockBuffer);
      resume = vi.fn().mockResolvedValue(undefined);
    }

    // Assign mock AudioContext
    vi.stubGlobal('AudioContext', MockAudioContext);

    const testEngine = new SoundEngine();
    testEngine.setVolume(0.5);

    const effects: SoundEffect[] = [
      'buy',
      'sell',
      'travel',
      'police',
      'gunshot',
      'flee',
      'pager',
      'bribe',
      'heal',
      'bank',
      'vault',
      'courier',
      'victory',
      'defeat',
      'demotion',
      'click',
    ];

    for (const effect of effects) {
      testEngine.play(effect);
    }

    expect(mockOscillatorNode.start).toHaveBeenCalled();
    expect(mockBufferSourceNode.start).toHaveBeenCalled();
  });
});
