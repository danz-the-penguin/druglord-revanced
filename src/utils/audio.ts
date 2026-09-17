/**
 * Drug Lord: ReVanced — Underworld Fintech Edition
 * Retro Web Audio Synthesizer & Sound FX Engine
 *
 * 100% Zero-dependency native Web Audio API synthesizer.
 * Synthesizes retro 90s sound effects with oscillators, filters, noise buffers, and gain envelopes.
 */

export type SoundEffect =
  | 'buy'
  | 'sell'
  | 'travel'
  | 'police'
  | 'gunshot'
  | 'flee'
  | 'pager'
  | 'bribe'
  | 'heal'
  | 'bank'
  | 'vault'
  | 'courier'
  | 'victory'
  | 'defeat'
  | 'demotion'
  | 'click';

const STORAGE_KEY_VOLUME = 'druglord2_audio_volume';
const STORAGE_KEY_MUTED = 'druglord2_audio_muted';

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.35;
  private muted: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof localStorage !== 'undefined') {
      try {
        const savedVol = localStorage.getItem(STORAGE_KEY_VOLUME);
        if (savedVol !== null) {
          const parsed = parseFloat(savedVol);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.volume = parsed;
          }
        }
        const savedMuted = localStorage.getItem(STORAGE_KEY_MUTED);
        if (savedMuted !== null) {
          this.muted = savedMuted === 'true';
        }
      } catch {
        // LocalStorage access might be restricted in some iframe sandboxes
      }
    }
  }

  /**
   * Lazy initializes the AudioContext upon first user interaction
   */
  public initContext(): boolean {
    const globalScope =
      typeof window !== 'undefined'
        ? (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        : typeof globalThis !== 'undefined'
        ? (globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        : null;
    if (!globalScope) return false;

    if (!this.ctx) {
      const AudioContextClass = globalScope.AudioContext || globalScope.webkitAudioContext;
      if (!AudioContextClass) return false;

      try {
        const audioCtx = new AudioContextClass();
        this.ctx = audioCtx;
        this.masterGain = audioCtx.createGain();
        this.updateGain();
        this.masterGain.connect(audioCtx.destination);
      } catch {
        return false;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return true;
  }

  private updateGain(): void {
    if (!this.masterGain || !this.ctx) return;
    const effectiveVol = this.muted ? 0 : Math.max(0, Math.min(1, this.volume));
    try {
      this.masterGain.gain.setValueAtTime(effectiveVol, this.ctx.currentTime);
    } catch {
      this.masterGain.gain.value = effectiveVol;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    this.updateGain();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_VOLUME, this.volume.toString());
      } catch {}
    }
    this.notifyListeners();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.updateGain();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_MUTED, this.muted.toString());
      } catch {}
    }
    this.notifyListeners();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch {}
    });
  }

  /**
   * Primary method to trigger a synthesized sound effect
   */
  public play(effect: SoundEffect): void {
    if (this.muted) return;
    if (!this.initContext() || !this.ctx || !this.masterGain) return;

    try {
      switch (effect) {
        case 'buy':
          this.playBuy();
          break;
        case 'sell':
          this.playSell();
          break;
        case 'travel':
          this.playTravel();
          break;
        case 'police':
          this.playPolice();
          break;
        case 'gunshot':
          this.playGunshot();
          break;
        case 'flee':
          this.playFlee();
          break;
        case 'pager':
          this.playPager();
          break;
        case 'bribe':
          this.playBribe();
          break;
        case 'heal':
          this.playHeal();
          break;
        case 'bank':
          this.playBank();
          break;
        case 'vault':
          this.playVault();
          break;
        case 'courier':
          this.playCourier();
          break;
        case 'victory':
          this.playVictory();
          break;
        case 'defeat':
          this.playDefeat();
          break;
        case 'demotion':
          this.playDemotion();
          break;
        case 'click':
          this.playClick();
          break;
      }
    } catch {
      // Audio playback failed safely without disrupting game state
    }
  }

  /**
   * Cash Register Ding (Ascending dual chime with metallic shimmer)
   */
  private playBuy(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Tone 1: B5
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.1);

    // Tone 2: E6 (High bell ping)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.51, now + 0.05);
    gain2.gain.setValueAtTime(0.35, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.42);

    // High shimmer harmonic: E7
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(2637.02, now + 0.05);
    gain3.gain.setValueAtTime(0.12, now + 0.05);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc3.connect(gain3);
    gain3.connect(this.masterGain);
    osc3.start(now + 0.05);
    osc3.stop(now + 0.25);
  }

  /**
   * Coin Clatter / Sell Payout (3 rapid metallic clinks)
   */
  private playSell(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const frequencies = [1760, 2217, 2637];

    frequencies.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  /**
   * Airport Departure Chime (Classic 2-tone Ding-Dong)
   */
  private playTravel(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Tone 1: F5 (698.46 Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(698.46, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.38);

    // Tone 2: A4 (440 Hz)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440, now + 0.26);
    gain2.gain.setValueAtTime(0.001, now + 0.26);
    gain2.gain.linearRampToValueAtTime(0.32, now + 0.28);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.26);
    osc2.stop(now + 0.8);
  }

  /**
   * Police Siren Sweep (High-low alternating alarm sweep)
   */
  private playPolice(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.setValueAtTime(0.2, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

    // 2 high-low cycles
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.15);
    osc.frequency.linearRampToValueAtTime(650, now + 0.3);
    osc.frequency.linearRampToValueAtTime(950, now + 0.45);
    osc.frequency.linearRampToValueAtTime(650, now + 0.58);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  /**
   * Gunshot Muzzle Blast (Filtered noise blast + low sub-bass thump)
   */
  private playGunshot(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Noise blast
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(1.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.15);

    // Sub-bass thump
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(120, now);
    thump.frequency.exponentialRampToValueAtTime(35, now + 0.12);
    thumpGain.gain.setValueAtTime(0.5, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    thump.connect(thumpGain);
    thumpGain.connect(this.masterGain);

    thump.start(now);
    thump.stop(now + 0.14);
  }

  /**
   * Flee / Escape Swoosh (Rapid descending glissando)
   */
  private playFlee(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1300, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.28);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * 90s Motorola Pager / Wiretap Alert (3 high-pitch rhythmic beeps)
   */
  private playPager(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const beeps = [1800, 2200, 2600];

    beeps.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.setValueAtTime(0.12, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.07);
    });
  }

  /**
   * Under-the-table Bribe (Subtle cash slide & chime)
   */
  private playBribe(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, now + 0.05);
    gain.gain.setValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now + 0.05);
    osc.stop(now + 0.28);
  }

  /**
   * Hospital Recovery / Heart Monitor Chime
   */
  private playHeal(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.12);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1046.5, now + 0.08);
    gain2.gain.setValueAtTime(0.25, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.38);
  }

  /**
   * Offshore Bank Transfer / Wire Tone
   */
  private playBank(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.14);
    });
  }

  /**
   * Safehouse Vault Lock Bolt Clank
   */
  private playVault(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Bolt strike 1
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(320, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Heavy bolt strike 2
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(180, now + 0.06);
    gain2.gain.setValueAtTime(0.35, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.25);
  }

  /**
   * Courier Radio Dispatch Chirp
   */
  private playCourier(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2400, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.05);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2800, now + 0.06);
    gain2.gain.setValueAtTime(0.2, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.16);
  }

  /**
   * Victory & Syndicate Triumph Fanfare
   */
  private playVictory(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (idx === 3 ? 0.45 : 0.18));
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + (idx === 3 ? 0.5 : 0.2));
    });
  }

  /**
   * Defeat & Flatline Sound
   */
  private playDefeat(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.45);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.55);
  }

  /**
   * Dynamic Demotion Warning Warble
   */
  private playDemotion(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.25);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Tactile Interface Click
   */
  private playClick(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.02);
  }
}

// Global Singleton Instance
export const soundEngine = new SoundEngine();

// Quick helper
export const playSound = (effect: SoundEffect): void => {
  soundEngine.play(effect);
};
