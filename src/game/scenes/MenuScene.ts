import { Graphics } from 'pixi.js';
import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';
import { PALETTE, RESOLUTION, TITLE } from '../config';
import { PlayScene } from './PlayScene';

export class MenuScene extends Scene {
  constructor(private readonly ctx: AppContext) {
    super();
  }

  enter(): void {
    const W = RESOLUTION.w;
    const H = RESOLUTION.h;
    const scale = this.ctx.viewport.logicalScale;

    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    this.container.addChild(bg);

    const line = new Graphics();
    for (let y = 6 * scale; y < H - 6 * scale; y += 9 * scale) {
      line.rect(W / 2 - 1 * scale, y, 2 * scale, 5 * scale).fill({ color: PALETTE.dim });
    }
    this.container.addChild(line);

    this.ctx.ui.show('main-menu');
    this.ctx.ui.setText('#menu-title', TITLE);
    
    const p1Wins = this.ctx.storage.load('p1_wins', 0);
    const p2Wins = this.ctx.storage.load('p2_wins', 0);
    this.ctx.ui.setText('#menu-score', `TOTAL WINS - P1: ${p1Wins}  |  P2: ${p2Wins}`);

    this.ctx.ui.onClick('#play-btn', () => {
      this.ctx.sceneManager.transitionTo(PlayScene, undefined, true);
    });

    if (!this.ctx.audio.isPlaying('music')) {
      this.ctx.audio.play('music');
    }
  }

  exit(): void {}

  update(_dt: number): void {
    if (this.ctx.input.isPressed('Enter')) {
      this.ctx.sceneManager.transitionTo(PlayScene, undefined, true);
    }
  }
}
