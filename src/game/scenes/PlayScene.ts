/**
 * PlayScene — Pong demo.
 *
 * Demonstrates every major template subsystem:
 *   ✓ Entities (Paddle, Ball)          ✓ Input (two-player local)
 *   ✓ Scene lifecycle (enter/exit)      ✓ Particles (on hit + score)
 *   ✓ Screen shake (on score)           ✓ Tweens (score pop)
 *   ✓ Pixel Graphics (bg, midline)      ✓ Text display (score, messages)
 *   ✓ Audio hooks (commented stubs)     ✓ Retro filters (inherited from viewport)
 *
 * Replace this entire scene to build your own game — or use it as a reference.
 */

import { Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';
import { ParticleSystem } from '../../core/particles';
import { Ball } from '../entities/Ball';
import { Paddle } from '../entities/Paddle';
import { GAME, PALETTE, RESOLUTION } from '../config';
import { MenuScene } from './MenuScene';

const SCORE_STYLE = {
  fontFamily: 'monospace',
  fontSize: 10,
  fill: PALETTE.fg,
  letterSpacing: 2,
};

const MSG_STYLE = {
  fontFamily: 'monospace',
  fontSize: 8,
  fill: PALETTE.accent,
  letterSpacing: 1,
};

type GameState = 'playing' | 'countdown' | 'gameover';

export class PlayScene extends Scene {
  private p1!: Paddle;
  private p2!: Paddle;
  private ball!: Ball;
  private particles!: ParticleSystem;
  private scoreText!: Text;
  private messageText!: Text;
  private bg!: Graphics;

  private p1score = 0;
  private p2score = 0;
  private state: GameState = 'playing';
  private countdown = 0;
  private winner = '';

  // Captured from RESOLUTION on every enter() so native-res mode (which
  // mutates RESOLUTION to device pixels at startup / F2 swap) is honoured.
  private W = 0;
  private H = 0;
  private scale = 1;

  constructor(private readonly ctx: AppContext) {
    super();
  }

  enter(): void {
    this.p1score = 0;
    this.p2score = 0;
    this.state = 'playing';
    this.winner = '';

    this.W = RESOLUTION.w;
    this.H = RESOLUTION.h;
    this.scale = this.ctx.viewport.logicalScale;

    this._buildLayout();
    this._spawnBall();
  }

  exit(): void {
    this.container.removeChildren();
    if (this.particles) this.particles.destroy();
  }

  update(dt: number): void {
    // Note: ParticleSystem updates are handled by GSAP internally now.

    if (this.state === 'gameover') {
      if (this.ctx.input.isPressed('Enter')) {
        this.ctx.sceneManager.transitionTo(MenuScene);
      }
      return;
    }

    if (this.state === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.state = 'playing';
        this._spawnBall();
      }
      return;
    }

    // ── Paddle input ───────────────────────────────────────────────────────
    const { input } = this.ctx;
    this.p1.update(dt, input.isDown('KeyW'), input.isDown('KeyS'));
    this.p2.update(dt, input.isDown('ArrowUp'), input.isDown('ArrowDown'));

    // ── Ball movement ──────────────────────────────────────────────────────
    this.ball.move(dt);

    // ── Wall collisions (top / bottom) ─────────────────────────────────────
    const half = this.ball.halfSize;
    if (this.ball.y - half <= 0) {
      this.ball.y = half;
      this.ball.bounceY();
      this._onWallBounce();
    } else if (this.ball.y + half >= this.H) {
      this.ball.y = this.H - half;
      this.ball.bounceY();
      this._onWallBounce();
    }

    // ── Paddle collisions ──────────────────────────────────────────────────
    if (this._ballHitsPaddle(this.p1)) {
      this.ball.x = this.p1.x + this.p1.w + half + 1;
      this.ball.bounceOffPaddle(this.p1.y, this.p1.h);
      this._onPaddleHit(this.p1.x + this.p1.w, this.ball.y, PALETTE.p1);
    } else if (this._ballHitsPaddle(this.p2)) {
      this.ball.x = this.p2.x - half - 1;
      this.ball.bounceOffPaddle(this.p2.y, this.p2.h);
      this._onPaddleHit(this.p2.x, this.ball.y, PALETTE.p2);
    }

    // ── Scoring ────────────────────────────────────────────────────────────
    if (this.ball.x + half < 0) {
      this.p2score++;
      this._onScore('P2');
    } else if (this.ball.x - half > this.W) {
      this.p1score++;
      this._onScore('P1');
    }

    // ── Update HUD ─────────────────────────────────────────────────────────
    this.scoreText.text = `${this.p1score}  ${this.p2score}`;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private _buildLayout(): void {
    const { W, H, scale } = this;

    // Background
    this.bg = new Graphics();
    this.bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    // Dashed center line
    for (let y = 4 * scale; y < H; y += 9 * scale) {
      this.bg.rect(W / 2 - 1 * scale, y, 2 * scale, 5 * scale).fill({ color: PALETTE.dim });
    }
    this.container.addChild(this.bg);

    // Paddles
    const margin = GAME.paddleMargin * scale;
    const pH = GAME.paddleH * scale;
    const pW = GAME.paddleW * scale;
    this.p1 = new Paddle(margin, H / 2 - pH / 2, PALETTE.p1, scale);
    this.p2 = new Paddle(W - margin - pW, H / 2 - pH / 2, PALETTE.p2, scale);
    this.container.addChild(this.p1.view, this.p2.view);

    // Particles (rendered above everything else)
    this.particles = new ParticleSystem(256);
    this.container.addChild(this.particles.container);

    // Score display
    this.scoreText = new Text({
      text: '0  0',
      style: {
        ...SCORE_STYLE,
        fontSize: (SCORE_STYLE.fontSize as number) * scale,
        letterSpacing: (SCORE_STYLE.letterSpacing as number) * scale,
      }
    });
    this.scoreText.anchor.set(0.5, 0);
    this.scoreText.position.set(W / 2, 5 * scale);
    this.container.addChild(this.scoreText);

    // Message text (shown on score / game over)
    this.messageText = new Text({
      text: '',
      style: {
        ...MSG_STYLE,
        fontSize: (MSG_STYLE.fontSize as number) * scale,
        letterSpacing: (MSG_STYLE.letterSpacing as number) * scale,
      }
    });
    this.messageText.anchor.set(0.5, 0.5);
    this.messageText.position.set(W / 2, H / 2 + 20 * scale);
    this.messageText.alpha = 0;
    this.container.addChild(this.messageText);
  }

  private _spawnBall(): void {
    // Remove old ball if any
    if (this.ball) {
      this.container.removeChild(this.ball.view);
      this.ball.destroy();
    }
    this.ball = new Ball(this.W / 2, this.H / 2, this.scale);
    // Insert ball BEFORE particles so particles render on top
    this.container.addChildAt(this.ball.view, this.container.children.indexOf(this.particles.container));
  }

  private _ballHitsPaddle(paddle: Paddle): boolean {
    const half = this.ball.halfSize;
    const b = paddle.bounds;
    return (
      this.ball.x + half > b.x &&
      this.ball.x - half < b.x + b.w &&
      this.ball.y + half > b.y &&
      this.ball.y - half < b.y + b.h
    );
  }

  private _onWallBounce(): void {
    this.particles.emit(this.ball.x, this.ball.y, {
      count: 4,
      color: PALETTE.accent,
      speed: [20 * this.scale, 40 * this.scale],
      life: [0.2, 0.3],
      size: 2 * this.scale,
    });
    this.ctx.audio.play('bounce');
  }

  private _onPaddleHit(hitX: number, hitY: number, color: number): void {
    this.particles.emit(hitX, hitY, {
      count: 12,
      color,
      speed: [40 * this.scale, 80 * this.scale],
      spread: Math.PI * 0.6,
      direction: hitX < this.W / 2 ? 0 : Math.PI,
      life: [0.3, 0.5],
      size: 2 * this.scale,
    });
    this.ctx.camera.shake(3 * this.scale, 3 * this.scale, 0, 0.12);
    this.ctx.audio.play('bounce');
  }

  private _onScore(who: string): void {
    this.container.removeChild(this.ball.view);
    this.ball.destroy();

    // Particles burst at centre
    this.particles.emit(this.W / 2, this.H / 2, {
      count: 24,
      color: who === 'P1' ? PALETTE.p1 : PALETTE.p2,
      speed: [60 * this.scale, 100 * this.scale],
      life: [0.5, 0.8],
      size: 3 * this.scale,
    });

    this.ctx.camera.shake(6 * this.scale, 6 * this.scale, 2, 0.25);
    this.ctx.audio.play('score');

    if (this.p1score >= GAME.scoreToWin || this.p2score >= GAME.scoreToWin) {
      this.winner = who;
      this._showGameOver();
      return;
    }

    // Flash score and reset
    this.messageText.text = `${who} SCORES!`;
    this.messageText.alpha = 1;
    this.ctx.gsap.to(this.messageText, { alpha: 0, duration: GAME.countdownMs / 1000 });

    this.state = 'countdown';
    this.countdown = GAME.countdownMs / 1000;
  }

  private _showGameOver(): void {
    this.state = 'gameover';
    this.messageText.text = `${this.winner} WINS!\nENTER to menu`;
    this.messageText.alpha = 1;
    // Gentle pulse
    this.ctx.gsap.to(this.scoreText, { y: 5 * this.scale, duration: 0 });
  }
}
