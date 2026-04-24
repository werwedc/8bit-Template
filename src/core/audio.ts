/**
 * AudioManager — thin Howler.js wrapper.
 *
 * Why Howler: pixi-sound v8 support is inconsistent; Howler handles
 * the browser autoplay-unlock policy automatically and supports
 * sound sprites for SFX atlases.
 *
 * Usage:
 *   audio.register('hit', { src: ['/assets/audio/hit.webm', '/assets/audio/hit.mp3'] });
 *   audio.play('hit');
 */

import { Howl, Howler } from 'howler';

export interface SoundDef {
  src: string[];
  loop?: boolean;
  volume?: number;
  /** Howler sprite map: { name: [offsetMs, durationMs] } */
  sprite?: Record<string, [number, number]>;
}

export class AudioManager {
  private readonly sounds = new Map<string, Howl>();
  private _globalVolume = 1;
  private _muted = false;

  /**
   * Register a sound. Howler starts loading it immediately.
   * Call from BootScene (or anywhere before play()).
   */
  register(name: string, def: SoundDef): void {
    this.sounds.set(
      name,
      new Howl({
        src: def.src,
        loop: def.loop ?? false,
        volume: def.volume ?? 1,
        sprite: def.sprite,
      }),
    );
  }

  /** Play a registered sound. Returns the Howler sound ID for fine-grained control. */
  play(name: string, sprite?: string): number | undefined {
    return this.sounds.get(name)?.play(sprite);
  }

  isPlaying(name: string): boolean {
    return this.sounds.get(name)?.playing() ?? false;
  }

  stop(name: string): void {
    this.sounds.get(name)?.stop();
  }

  stopAll(): void {
    Howler.stop();
  }

  setVolume(name: string, vol: number): void {
    this.sounds.get(name)?.volume(vol);
  }

  setGlobalVolume(vol: number): void {
    this._globalVolume = vol;
    Howler.volume(vol);
  }

  mute(val: boolean): void {
    this._muted = val;
    Howler.mute(val);
  }

  get muted(): boolean {
    return this._muted;
  }

  get globalVolume(): number {
    return this._globalVolume;
  }
}
