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

    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    this.container.addChild(bg);

    this.ctx.ui.show('main-menu');
    this.ctx.ui.setText('#menu-title', TITLE);

    this.ctx.ui.onClick('#play-btn', () => {
      this.ctx.sceneManager.transitionTo(PlayScene, undefined, true);
    });
  }

  exit(): void {}

  update(_dt: number): void {
    if (this.ctx.input.isPressed('Enter')) {
      this.ctx.sceneManager.transitionTo(PlayScene, undefined, true);
    }
  }
}
