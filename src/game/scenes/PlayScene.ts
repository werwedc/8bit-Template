import { Graphics } from 'pixi.js';
import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';
import { ParticleSystem } from '../../core/particles';
import { Ball } from '../entities/Ball';
import { Paddle } from '../entities/Paddle';
import { GAME, PALETTE, RESOLUTION } from '../config';
import { MenuScene } from './MenuScene';
import { checkAABB } from '../../core/physics';

type GameState = 'playing' | 'countdown' | 'gameover';

export class PlayScene extends Scene {
  private p1!: Paddle;
  private p2!: Paddle;
  private ball!: Ball;
  private particles!: ParticleSystem;
  private bg!: Graphics;

  private p1score = 0;
  private p2score = 0;
  private state: GameState = 'playing';
  private countdown = 0;
  private winner = '';

  private W = 0;
  private H = 0;
  private scale = 1;

  constructor(private readonly ctx: AppContext) {
    super();
  }

  enter(): void {
    this.p1score = this.ctx.storage.load('current_match_p1', 0);
    this.p2score = this.ctx.storage.load('current_match_p2', 0);
    this.state = 'playing';
    this.winner = '';

    this.W = RESOLUTION.w;
    this.H = RESOLUTION.h;
    this.scale = this.ctx.viewport.logicalScale;

    this._buildLayout();
    this._spawnBall();

    this.ctx.ui.show('hud');
    this.ctx.ui.setText('#hud-score', `${this.p1score} : ${this.p2score}`);
  }

  exit(): void {
    this.container.removeChildren();
    if (this.particles) this.particles.destroy();
  }

  update(dt: number): void {
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

    const { input } = this.ctx;
    this.p1.update(dt, input.isDown('KeyW'), input.isDown('KeyS'));
    this.p2.update(dt, input.isDown('ArrowUp'), input.isDown('ArrowDown'));

    this.ball.move(dt);

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

    if (this._ballHitsPaddle(this.p1)) {
      this.ball.x = this.p1.x + this.p1.w + half + 1;
      this.ball.bounceOffPaddle(this.p1.y, this.p1.h);
      this._onPaddleHit(this.p1.x + this.p1.w, this.ball.y, PALETTE.p1);
    } else if (this._ballHitsPaddle(this.p2)) {
      this.ball.x = this.p2.x - half - 1;
      this.ball.bounceOffPaddle(this.p2.y, this.p2.h);
      this._onPaddleHit(this.p2.x, this.ball.y, PALETTE.p2);
    }

    if (this.ball.x + half < 0) {
      this.p2score++;
      this.ctx.storage.save('current_match_p2', this.p2score);
      this._onScore('P2');
    } else if (this.ball.x - half > this.W) {
      this.p1score++;
      this.ctx.storage.save('current_match_p1', this.p1score);
      this._onScore('P1');
    }

    this.ctx.ui.setText('#hud-score', `${this.p1score} : ${this.p2score}`);
  }

  private _buildLayout(): void {
    const { W, H, scale } = this;

    this.bg = new Graphics();
    this.bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    for (let y = 4 * scale; y < H; y += 9 * scale) {
      this.bg.rect(W / 2 - 1 * scale, y, 2 * scale, 5 * scale).fill({ color: PALETTE.dim });
    }
    this.container.addChild(this.bg);

    const margin = GAME.paddleMargin * scale;
    const pH = GAME.paddleH * scale;
    const pW = GAME.paddleW * scale;
    this.p1 = new Paddle(margin, H / 2 - pH / 2, PALETTE.p1, scale);
    this.p2 = new Paddle(W - margin - pW, H / 2 - pH / 2, PALETTE.p2, scale);
    this.container.addChild(this.p1.view, this.p2.view);

    this.particles = new ParticleSystem(256);
    this.container.addChild(this.particles.container);
  }

  private _spawnBall(): void {
    if (this.ball) {
      this.container.removeChild(this.ball.view);
      this.ball.destroy();
    }
    this.ball = new Ball(this.W / 2, this.H / 2, this.scale);
    this.container.addChildAt(this.ball.view, this.container.children.indexOf(this.particles.container));
  }

  private _ballHitsPaddle(paddle: Paddle): boolean {
    const size = this.ball.halfSize * 2;
    const b = paddle.bounds;
    return checkAABB(
      this.ball.x - this.ball.halfSize, this.ball.y - this.ball.halfSize, size, size,
      b.x, b.y, b.w, b.h
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

      this.ctx.storage.remove('current_match_p1');
      this.ctx.storage.remove('current_match_p2');

      if (who === 'P1') {
        const p1Wins = this.ctx.storage.load('p1_wins', 0);
        this.ctx.storage.save('p1_wins', p1Wins + 1);
      } else {
        const p2Wins = this.ctx.storage.load('p2_wins', 0);
        this.ctx.storage.save('p2_wins', p2Wins + 1);
      }

      this._showGameOver();
      return;
    }

    this.state = 'countdown';
    this.countdown = GAME.countdownMs / 1000;
  }

  private _showGameOver(): void {
    this.state = 'gameover';
    this.ctx.ui.show('game-over');
    this.ctx.ui.setText('#gameover-text', `${this.winner} WINS!`);
    this.ctx.ui.onClick('#restart-btn', () => {
      this.ctx.sceneManager.transitionTo(MenuScene);
    });
  }
}
