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
  | 'bomb'
  | 'heavy_shot'
  | 'silencer'
  | 'wiretap'
  | 'reload'
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
        case 'bomb':
          this.playBomb();
          break;
        case 'heavy_shot':
          this.playHeavyShot();
          break;
        case 'silencer':
          this.playSilencer();
          break;
        case 'wiretap':
          this.playWiretap();
          break;
        case 'reload':
          this.playReload();
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
   * Gunshot Muzzle Blast (Punchy multi-stage acoustic crack, muzzle pop & metallic slide)
   */
  private playGunshot(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1. High-velocity supersonic air crack (Bandpass noise)
    const crackSize = Math.floor(this.ctx.sampleRate * 0.12);
    const crackBuffer = this.ctx.createBuffer(1, crackSize, this.ctx.sampleRate);
    const crackData = crackBuffer.getChannelData(0);
    for (let i = 0; i < crackSize; i++) {
      crackData[i] = Math.random() * 2 - 1;
    }

    const crackSource = this.ctx.createBufferSource();
    crackSource.buffer = crackBuffer;

    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(2400, now);
    crackFilter.Q.setValueAtTime(2.2, now);

    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(0.7, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    crackSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.masterGain);

    crackSource.start(now);
    crackSource.stop(now + 0.12);

    // 2. Heavy muzzle blast punch (Lowpass explosion)
    const blastSize = Math.floor(this.ctx.sampleRate * 0.22);
    const blastBuffer = this.ctx.createBuffer(1, blastSize, this.ctx.sampleRate);
    const blastData = blastBuffer.getChannelData(0);
    for (let i = 0; i < blastSize; i++) {
      blastData[i] = Math.random() * 2 - 1;
    }

    const blastSource = this.ctx.createBufferSource();
    blastSource.buffer = blastBuffer;

    const blastFilter = this.ctx.createBiquadFilter();
    blastFilter.type = 'lowpass';
    blastFilter.frequency.setValueAtTime(900, now);
    blastFilter.frequency.exponentialRampToValueAtTime(120, now + 0.2);

    const blastGain = this.ctx.createGain();
    blastGain.gain.setValueAtTime(0.65, now);
    blastGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    blastSource.connect(blastFilter);
    blastFilter.connect(blastGain);
    blastGain.connect(this.masterGain);

    blastSource.start(now);
    blastSource.stop(now + 0.23);

    // 3. Sub-bass concussive chamber thump (160Hz -> 30Hz drop)
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(160, now);
    thump.frequency.exponentialRampToValueAtTime(30, now + 0.16);
    thumpGain.gain.setValueAtTime(0.75, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    thump.connect(thumpGain);
    thumpGain.connect(this.masterGain);

    thump.start(now);
    thump.stop(now + 0.19);
  }

  /**
   * Concussive Bomb / Explosion (Massive sub-bass blast wave, debris noise sweep & shockwave rumble)
   */
  private playBomb(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1. Concussive Sub-bass Shockwave (Heavy 120Hz -> 22Hz plunge)
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(130, now);
    sub.frequency.exponentialRampToValueAtTime(22, now + 0.65);

    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.72);

    // 2. Secondary Earthquake Rumble (Sub modulation)
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(55, now);
    rumble.frequency.exponentialRampToValueAtTime(28, now + 0.85);

    rumbleGain.gain.setValueAtTime(0.5, now + 0.05);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.88);

    rumble.connect(rumbleGain);
    rumbleGain.connect(this.masterGain);
    rumble.start(now + 0.02);
    rumble.stop(now + 0.9);

    // 3. Dense Debris & Explosive Noise Envelope
    const noiseSize = Math.floor(this.ctx.sampleRate * 0.85);
    const noiseBuffer = this.ctx.createBuffer(1, noiseSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(2800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(110, now + 0.75);
    noiseFilter.Q.setValueAtTime(3.2, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.85);
  }

  /**
   * Heavy Caliber Gunshot (.50 BMG / 12-Gauge Shotgun Cannon Blast)
   */
  private playHeavyShot(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Heavy concussive sub
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(210, now);
    sub.frequency.exponentialRampToValueAtTime(38, now + 0.32);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(450, now);

    subGain.gain.setValueAtTime(0.85, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    sub.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.38);

    // Booming muzzle noise
    const noiseSize = Math.floor(this.ctx.sampleRate * 0.4);
    const noiseBuffer = this.ctx.createBuffer(1, noiseSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1400, now);
    noiseFilter.Q.setValueAtTime(1.8, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.4);
  }

  /**
   * Silenced / Suppressed Gunshot (Subsonic Whisper & Slide Click)
   */
  private playSilencer(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Suppressed pop
    const noiseSize = Math.floor(this.ctx.sampleRate * 0.08);
    const noiseBuffer = this.ctx.createBuffer(1, noiseSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1800, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.08);

    // Mechanical slide ping
    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(3200, now + 0.02);
    pingGain.gain.setValueAtTime(0.12, now + 0.02);
    pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    ping.connect(pingGain);
    pingGain.connect(this.masterGain);
    ping.start(now + 0.02);
    ping.stop(now + 0.07);
  }

  /**
   * Federal Wiretap & Surveillance Radio Intercept (Squelch, dual-tone carrier & chirp)
   */
  private playWiretap(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Radio static burst
    const staticSize = Math.floor(this.ctx.sampleRate * 0.06);
    const staticBuffer = this.ctx.createBuffer(1, staticSize, this.ctx.sampleRate);
    const staticData = staticBuffer.getChannelData(0);
    for (let i = 0; i < staticSize; i++) {
      staticData[i] = Math.random() * 2 - 1;
    }

    const staticSource = this.ctx.createBufferSource();
    staticSource.buffer = staticBuffer;

    const staticFilter = this.ctx.createBiquadFilter();
    staticFilter.type = 'bandpass';
    staticFilter.frequency.setValueAtTime(1900, now);
    staticFilter.Q.setValueAtTime(2.5, now);

    const staticGain = this.ctx.createGain();
    staticGain.gain.setValueAtTime(0.25, now);
    staticGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    staticSource.connect(staticFilter);
    staticFilter.connect(staticGain);
    staticGain.connect(this.masterGain);
    staticSource.start(now);
    staticSource.stop(now + 0.06);

    // Dual-tone telemetry intercept beep (DTMF 1209Hz & 697Hz)
    [1209, 697].forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.06);
      gain.gain.setValueAtTime(0.15, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + 0.06);
      osc.stop(now + 0.18);
    });

    // Ascending decryption ping sequence
    [2400, 2800, 3200].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + 0.18 + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
    });
  }

  /**
   * Tactical Weapon Reload (Mag slap & slide rack lock)
   */
  private playReload(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Mag insert snap
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(420, now);
    osc1.frequency.exponentialRampToValueAtTime(180, now + 0.06);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Slide rack back
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(950, now + 0.12);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.2);

    // Chamber lock forward
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1400, now + 0.24);
    gain3.gain.setValueAtTime(0.35, now + 0.24);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc3.connect(gain3);
    gain3.connect(this.masterGain);
    osc3.start(now + 0.24);
    osc3.stop(now + 0.34);
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
