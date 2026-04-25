import { Graphics } from 'pixi.js';
import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';
import { PALETTE, RESOLUTION } from '../config';
import { MenuScene } from './MenuScene';

export class PlayScene extends Scene {
  constructor(private readonly ctx: AppContext) {
    super();
  }

  enter(): void {
    const W = RESOLUTION.w;
    const H = RESOLUTION.h;

    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    this.container.addChild(bg);

    this.ctx.ui.show('hud');
  }

  exit(): void {
    this.container.removeChildren();
  }

  update(dt: number): void {
    if (this.ctx.input.isPressed('Escape')) {
      this.ctx.sceneManager.transitionTo(MenuScene);
    }
  }
}
