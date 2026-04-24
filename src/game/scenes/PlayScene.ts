import { Graphics } from 'pixi.js';
import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';
import { ParticleSystem } from '../../core/particles';
import { Ball } from '../entities/Ball';
import { Paddle } from '../entities/Paddle';
import { GAME, PALETTE, RESOLUTION } from '../config';
import { MenuScene } from './MenuScene';
import { GridManager } from '../../core/grid';
import * as timer from '../../core/timer';

type GameState = 'playing' | 'countdown' | 'gameover';

export class PlayScene extends Scene {
  private p1!: Paddle;
  private p2!: Paddle;
  private ball!: Ball;
  private particles!: ParticleSystem;
  private bg!: Graphics;
  private grid!: GridManager<number>;

  private p1score = 0;
  private p2score = 0;
  private state: GameState = 'playing';
  private countdown = 0;
  private winner = '';

  private gameTickTimer!: number;
  private scale = 1;

  constructor(private readonly ctx: AppContext) {
    super();
  }

  enter(): void {
    this.p1score = this.ctx.storage.load('current_match_p1', 0);
    this.p2score = this.ctx.storage.load('current_match_p2', 0);
    this.state = 'playing';
    this.winner = '';
    this.scale = this.ctx.viewport.logicalScale;

    // Initialize 32x18 discrete grid. cellSize = 10 logical px * scale
    this.grid = new GridManager<number>(32, 18, 10 * this.scale, 0, 0, 0);

    this._buildLayout();
    this._spawnBall();

    this.ctx.ui.show('hud');
    this.ctx.ui.setText('#hud-score', `${this.p1score} : ${this.p2score}`);

    // Tick the discrete game loop every 50ms (20 Hz logic)
    this.gameTickTimer = timer.every(0.05, () => this._tick());
  }

  exit(): void {
    timer.clearTimer(this.gameTickTimer);
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
  }

  private _tick(): void {
    if (this.state !== 'playing') return;

    // 1. Move Paddles
    const { input } = this.ctx;
    if (input.isDown('KeyW')) this.p1.move(-1);
    else if (input.isDown('KeyS')) this.p1.move(1);

    if (input.isDown('ArrowUp')) this.p2.move(-1);
    else if (input.isDown('ArrowDown')) this.p2.move(1);

    // 2. Write objects to Grid
    this.grid.fill(0); // Clear grid
    for (let i = 0; i < this.p1.h; i++) {
      this.grid.set(this.p1.col, this.p1.row + i, 1);
    }
    for (let i = 0; i < this.p2.h; i++) {
      this.grid.set(this.p2.col, this.p2.row + i, 2);
    }

    // 3. Move Ball & Check Collisions via the Grid!
    let nextCol = this.ball.col + this.ball.dirCol;
    let nextRow = this.ball.row + this.ball.dirRow;

    // Bounce top/bottom boundaries
    if (nextRow < 0 || nextRow >= this.grid.rows) {
      this.ball.dirRow *= -1;
      nextRow = this.ball.row + this.ball.dirRow;
      this._onWallBounce();
    }

    // Check paddle collision using purely the GridManager state
    const targetCell = this.grid.get(nextCol, this.ball.row); // Check horizontally
    if (targetCell === 1 || targetCell === 2) {
      this.ball.dirCol *= -1;
      nextCol = this.ball.col + this.ball.dirCol;
      const color = targetCell === 1 ? PALETTE.p1 : PALETTE.p2;
      this._onPaddleHit(this.ball.x, this.ball.y, color);
    }

    this.ball.col = nextCol;
    this.ball.row = nextRow;
    this.ball.updatePosition();

    // 4. Score Logic
    if (this.ball.col < 0) {
      this.p2score++;
      this.ctx.storage.save('current_match_p2', this.p2score);
      this.ctx.ui.setText('#hud-score', `${this.p1score} : ${this.p2score}`);
      this._onScore('P2');
    } else if (this.ball.col >= this.grid.cols) {
      this.p1score++;
      this.ctx.storage.save('current_match_p1', this.p1score);
      this.ctx.ui.setText('#hud-score', `${this.p1score} : ${this.p2score}`);
      this._onScore('P1');
    }
  }

  private _buildLayout(): void {
    const W = RESOLUTION.w * this.scale;
    const H = RESOLUTION.h * this.scale;

    this.bg = new Graphics();
    this.bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    for (let y = 4 * this.scale; y < H; y += 9 * this.scale) {
      this.bg.rect(W / 2 - 1 * this.scale, y, 2 * this.scale, 5 * this.scale).fill({ color: PALETTE.dim });
    }
    this.container.addChild(this.bg);

    // Paddle 1 at col 1, Paddle 2 at col 30 (grid is 32 cols)
    this.p1 = new Paddle(this.grid, 1, 7, PALETTE.p1);
    this.p2 = new Paddle(this.grid, 30, 7, PALETTE.p2);
    this.container.addChild(this.p1.view, this.p2.view);

    this.particles = new ParticleSystem(256);
    this.container.addChild(this.particles.container);
  }

  private _spawnBall(): void {
    if (this.ball) {
      this.container.removeChild(this.ball.view);
      this.ball.destroy();
    }
    this.ball = new Ball(this.grid, Math.floor(this.grid.cols / 2), Math.floor(this.grid.rows / 2));
    this.container.addChildAt(this.ball.view, this.container.children.indexOf(this.particles.container));
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
      direction: hitX < (RESOLUTION.w * this.scale) / 2 ? 0 : Math.PI,
      life: [0.3, 0.5],
      size: 2 * this.scale,
    });
    this.ctx.camera.shake(3 * this.scale, 3 * this.scale, 0, 0.12);
    this.ctx.audio.play('bounce');
  }

  private _onScore(who: string): void {
    this.container.removeChild(this.ball.view);
    this.ball.destroy();

    this.particles.emit((RESOLUTION.w * this.scale) / 2, (RESOLUTION.h * this.scale) / 2, {
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
