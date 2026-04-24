/**
 * Particle System — Modern Pixi v8 + GSAP implementation.
 *
 * This system uses a pool of Sprites for maximum performance and GSAP
 * for clean, flexible animations. It's fully compatible with Pixi v8's
 * rendering pipeline.
 */

import { Container, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';

export interface ParticleOptions {
  /** Number of particles to burst. Default 10 */
  count?: number;
  /** Particle color. Default 0xffffff */
  color?: number;
  /** Particle size. Default 2 */
  size?: number;
  /** Min/Max speed. Default [40, 100] */
  speed?: [number, number];
  /** Min/Max lifetime. Default [0.3, 0.6] */
  life?: [number, number];
  /** Spread angle in radians. Default 2π (full circle) */
  spread?: number;
  /** Direction angle in radians. Default 0 */
  direction?: number;
  /** Alpha fade-out? Default true */
  fade?: boolean;
}

export class ParticleSystem {
  private readonly pool: Sprite[] = [];
  private readonly active: Sprite[] = [];
  readonly container: Container = new Container();

  constructor(private readonly maxParticles = 256) {
    // Pre-fill the pool
    for (let i = 0; i < this.maxParticles; i++) {
      const p = new Sprite(Texture.WHITE);
      p.anchor.set(0.5);
      p.visible = false;
      this.pool.push(p);
      this.container.addChild(p);
    }
  }

  /** Burst particles from a point. */
  emit(x: number, y: number, options: ParticleOptions = {}): void {
    const {
      count = 10,
      color = 0xffffff,
      size = 2,
      speed = [40, 100],
      life = [0.3, 0.6],
      spread = Math.PI * 2,
      direction = 0,
      fade = true,
    } = options;

    for (let i = 0; i < count; i++) {
      const p = this.pool.pop();
      if (!p) break; // Pool exhausted

      this.active.push(p);

      // Reset particle state
      p.visible = true;
      p.position.set(x, y);
      p.width = p.height = size;
      p.tint = color;
      p.alpha = 1;

      // Calculate random velocity
      const s = gsap.utils.random(speed[0], speed[1]);
      const angle = direction + (Math.random() - 0.5) * spread;
      const vx = Math.cos(angle) * s;
      const vy = Math.sin(angle) * s;

      const duration = gsap.utils.random(life[0], life[1]);

      // Animate using GSAP
      gsap.to(p, {
        x: x + vx * duration,
        y: y + vy * duration,
        alpha: fade ? 0 : 1,
        duration,
        ease: 'power1.out',
        onComplete: () => {
          this._recycle(p);
        },
      });
    }
  }

  private _recycle(p: Sprite): void {
    p.visible = false;
    gsap.killTweensOf(p);
    const idx = this.active.indexOf(p);
    if (idx !== -1) {
      this.active.splice(idx, 1);
      this.pool.push(p);
    }
  }

  /** Clean up all active particles and tweens. */
  destroy(): void {
    for (const p of this.active) {
      gsap.killTweensOf(p);
    }
    this.container.destroy({ children: true });
    this.pool.length = 0;
    this.active.length = 0;
  }
}
