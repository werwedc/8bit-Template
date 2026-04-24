/**
 * Ball entity — bright-coloured square that triggers the bloom filter glow.
 */

import { Graphics } from 'pixi.js';
import { Entity } from '../../core/entity';
import { GAME, PALETTE } from '../config';
import { randomElement, randomFloat } from '../../core/physics';

export class Ball extends Entity {
  vx: number;
  vy: number;
  private _speed: number;
  private _scale: number;

  constructor(startX: number, startY: number, scale: number = 1) {
    super();
    this._scale = scale;

    this._speed = GAME.ballInitialSpeed * scale;
    // Randomise initial horizontal direction; slight random vertical angle
    this.vx = this._speed * randomElement([1, -1]);
    this.vy = this._speed * randomFloat(-0.2, 0.2); // ±20% Y component

    const size = GAME.ballSize * scale;
    const gfx = new Graphics();
    // Draw centred so view.position is the ball's centre
    gfx.rect(-size / 2, -size / 2, size, size).fill({ color: PALETTE.accent });

    this.view.addChild(gfx);
    this.view.position.set(startX, startY);
  }

  get x(): number { return this.view.x; }
  set x(v: number) { this.view.x = v; }
  get y(): number { return this.view.y; }
  set y(v: number) { this.view.y = v; }

  /** Advance position by velocity × dt. */
  move(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  /** Bounce off the horizontal axis (top/bottom walls). */
  bounceY(): void {
    this.vy *= -1;
  }

  /** Bounce off a paddle, optionally shifting the Y velocity based on hit position. */
  bounceOffPaddle(paddleY: number, paddleH: number): void {
    this.vx *= -1;
    // Slightly increase speed on each paddle hit, up to the cap
    const speed = Math.min(Math.sqrt(this.vx ** 2 + this.vy ** 2) + (GAME.ballSpeedIncrease * this._scale), GAME.maxBallSpeed * this._scale);
    // Adjust Y angle based on where on the paddle the ball hit
    const relativeHit = (this.y - paddleY - paddleH / 2) / (paddleH / 2); // -1..1
    const angle = relativeHit * (Math.PI / 4); // max ±45°
    const dir = this.vx > 0 ? 1 : -1;
    this.vx = Math.cos(angle) * speed * dir;
    this.vy = Math.sin(angle) * speed;

    this._speed = speed;
  }

  get halfSize(): number {
    return (GAME.ballSize * this._scale) / 2;
  }
}
