/**
 * Sprite Animation State Machine
 *
 * Provides an easy wrapper over PixiJS AnimatedSprite that solves the
 * "Update Loop Conflict" by introducing a locking mechanism for one-off
 * animations like 'attack' or 'die'.
 */

import { AnimatedSprite, Texture, Rectangle } from 'pixi.js';
import type { Spritesheet } from 'pixi.js';

export interface AnimationDef {
  textures: Texture[];
  speed: number;
  loop: boolean;
}

export type AnimationSource = Texture[] | { sheet: Spritesheet; animation: string };

export class Animator {
  public sprite: AnimatedSprite;
  private states = new Map<string, AnimationDef>();
  private currentState: string | null = null;
  
  /** 
   * If locked is true, play() calls are ignored. 
   * This ensures playOnce() animations aren't interrupted by standard update loop calls.
   */
  private locked = false;

  constructor() {
    this.sprite = new AnimatedSprite([Texture.EMPTY]);
  }

  /**
   * Register a new animation state.
   * @param name Name of the state (e.g. 'run')
   * @param source Either an array of Textures, or an Aseprite `{ sheet, animation }` tag reference.
   * @param speed Playback speed multiplier (default 1)
   * @param loop Does it loop? (default true)
   */
  add(name: string, source: AnimationSource, speed: number = 1, loop: boolean = true): void {
    let textures: Texture[];

    if (Array.isArray(source)) {
      textures = source;
    } else {
      textures = source.sheet.animations[source.animation] ?? [];
      if (!textures || textures.length === 0) {
        console.warn(`Animator: Aseprite animation tag '${source.animation}' not found or empty.`);
        textures = [Texture.EMPTY];
      }
    }

    this.states.set(name, { textures, speed, loop });
  }

  /**
   * Play a continuous animation state.
   * If the animator is locked (via playOnce), this call is safely ignored.
   * If already playing the requested state, does nothing.
   */
  play(name: string): void {
    if (this.locked) return;
    if (this.currentState === name && this.sprite.playing) return;

    const def = this.states.get(name);
    if (!def) {
      console.warn(`Animator: State '${name}' not found.`);
      return;
    }

    this.sprite.textures = def.textures;
    this.sprite.animationSpeed = def.speed;
    this.sprite.loop = def.loop;
    this.sprite.gotoAndPlay(0);
    this.currentState = name;
  }

  /**
   * Play an animation once, locking the state machine until it completes.
   * Perfect for 'attack', 'hit', or 'death' states.
   * @param name The state to play
   * @param onComplete Optional callback fired when the animation hits the last frame
   */
  playOnce(name: string, onComplete?: () => void): void {
    const def = this.states.get(name);
    if (!def) {
      console.warn(`Animator: State '${name}' not found.`);
      return;
    }

    this.locked = true;
    this.sprite.textures = def.textures;
    this.sprite.animationSpeed = def.speed;
    this.sprite.loop = false;
    
    // In PixiJS v8, onComplete fires when a non-looping animation finishes
    this.sprite.onComplete = () => {
      this.locked = false;
      this.sprite.onComplete = undefined; // Clean up listener
      if (onComplete) onComplete();
    };

    this.sprite.gotoAndPlay(0);
    this.currentState = name;
  }

  /**
   * Force unlock the animator (useful if cancelling an attack early via dodge roll etc)
   */
  unlock(): void {
    this.locked = false;
    this.sprite.onComplete = undefined;
  }
  
  /**
   * Check if the animator is currently busy playing a one-off animation
   */
  get isLocked(): boolean {
    return this.locked;
  }

  destroy(): void {
    this.sprite.destroy();
    this.states.clear();
  }
}

/**
 * Helper to generate an array of Textures for numbered sprite sequences.
 * Example: createFrames('player_run_', 1, 6) -> loads player_run_1.png to player_run_6.png.
 */
export function createFrames(baseName: string, start: number, end: number, padZero: number = 0): Texture[] {
  const frames: Texture[] = [];
  for (let i = start; i <= end; i++) {
    const num = padZero > 0 ? i.toString().padStart(padZero, '0') : i.toString();
    // Assuming the assets have been loaded via Assets.load and are cached
    frames.push(Texture.from(`${baseName}${num}.png`));
  }
  return frames;
}

/**
 * Helper to generate an array of Textures from a single horizontal sprite strip PNG.
 * @param textureAlias The alias/URL of the loaded strip image
 * @param frameWidth Width of a single frame
 * @param frameHeight Height of a single frame
 * @param frameCount Number of frames in the strip
 */
export function createFramesFromStrip(textureAlias: string, frameWidth: number, frameHeight: number, frameCount: number): Texture[] {
  const baseTex = Texture.from(textureAlias);
  const frames: Texture[] = [];
  for (let i = 0; i < frameCount; i++) {
    const frame = new Rectangle(i * frameWidth, 0, frameWidth, frameHeight);
    frames.push(new Texture({ source: baseTex.source, frame }));
  }
  return frames;
}
