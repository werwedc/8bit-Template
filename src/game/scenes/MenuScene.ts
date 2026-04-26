import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';
import { TITLE } from '../config';
import { PlayScene } from './PlayScene';

export class MenuScene extends Scene {
  constructor(private readonly ctx: AppContext) {
    super();
  }

  enter(): void {
    // We leave the canvas blank and let the HTML UI layer handle the high-res background!
    this.ctx.ui.show('main-menu');
    this.ctx.ui.setText('#menu-title', TITLE);

    this.ctx.ui.onClick('#play-btn', () => {
      this.ctx.sceneManager.transitionTo(PlayScene, undefined, true);
    });
  }

  exit(): void {
    this.ctx.ui.hideAll();
  }

  update(_dt: number): void {
    if (this.ctx.input.isPressed('Enter')) {
      this.ctx.sceneManager.transitionTo(PlayScene, undefined, true);
    }
  }
}
