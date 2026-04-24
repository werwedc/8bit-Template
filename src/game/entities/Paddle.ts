/**
 * Paddle entity — drawn once at construction, repositioned each frame.
 *
 * Pixi v8 pattern: Graphics commands are recorded on construction.
 * No need to clear/redraw each frame — just move the container.
 */

import { Graphics } from 'pixi.js';
import { Entity } from '../../core/entity';
import { GAME, RESOLUTION } from '../config';
import { clamp } from '../../core/physics';

export class Paddle extends Entity {
  /** Current logical y position (top-left of paddle). */
  y: number;

  readonly x: number;
  readonly w: number;
  readonly h: number;
  private readonly speed: number;

  constructor(
    x: number,
    startY: number,
    color: number,
    scale: number = 1
  ) {
    super();
    this.x = x;
    this.y = startY;
    this.w = GAME.paddleW * scale;
    this.h = GAME.paddleH * scale;
    this.speed = GAME.paddleSpeed * scale;

    const gfx = new Graphics();
    // Draw rounded rectangle for a slightly nicer retro look
    gfx.roundRect(0, 0, this.w, this.h, 1).fill({ color });
    this.view.addChild(gfx);
    this.view.position.set(x, startY);
  }

  /**
   * Move paddle based on directional input, clamped to viewport bounds.
   * @param dt    Delta time in seconds
   * @param up    Is the "up" action held this frame?
   * @param down  Is the "down" action held this frame?
   */
  update(dt: number, up: boolean, down: boolean): void {
    if (up) this.y -= this.speed * dt;
    if (down) this.y += this.speed * dt;

    this.y = clamp(this.y, 0, RESOLUTION.h - this.h);
    this.view.y = this.y;
  }

  /** Simple AABB for ball collision. */
  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}
