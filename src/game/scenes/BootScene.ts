/**
 * BootScene — loads all assets then hands off to MenuScene.
 *
 * Participants: add assets to ASSET_MANIFEST in game/manifest.ts.
 * To register audio sounds, add calls to ctx.audio.register() below.
 *
 * Displays a progress bar so the user sees something before the game starts.
 */

import { Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';
import { ASSET_MANIFEST } from '../manifest';
import { PALETTE, RESOLUTION } from '../config';
import { MenuScene } from './MenuScene';

export class BootScene extends Scene {
  constructor(private readonly ctx: AppContext) {
    super();
  }

  enter(): void {
    // Read RESOLUTION fresh inside enter() — native-res mode mutates these
    // at startup (and on F2 swap) to match the device. Reading at module
    // scope would cache the original 320×180 and freeze the layout there.
    const W = RESOLUTION.w;
    const H = RESOLUTION.h;
    const scale = this.ctx.viewport.logicalScale;

    const BAR_W = Math.floor(W * 0.6);
    const BAR_H = 4 * scale;
    const BAR_X = Math.floor((W - BAR_W) / 2);
    const BAR_Y = Math.floor(H * 0.6);

    // Background fill
    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    this.container.addChild(bg);

    // "LOADING" label
    const label = new Text({
      text: 'LOADING',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 8 * scale,
        fill: `#${PALETTE.fg.toString(16).padStart(6, '0')}`,
        letterSpacing: 2 * scale,
      }),
    });
    label.anchor.set(0.5, 1);
    label.position.set(W / 2, BAR_Y - 6 * scale);
    this.container.addChild(label);

    // Progress bar outline
    const outline = new Graphics();
    outline.rect(BAR_X - 1 * scale, BAR_Y - 1 * scale, BAR_W + 2 * scale, BAR_H + 2 * scale).stroke({ color: PALETTE.fg, width: 1 * scale });
    this.container.addChild(outline);

    // Progress bar fill (starts at 0 width)
    const fill = new Graphics();
    this.container.addChild(fill);

    void this._load((progress) => {
      fill.clear();
      fill.rect(BAR_X, BAR_Y, Math.floor(BAR_W * progress), BAR_H).fill({ color: PALETTE.accent });
    });
  }

  exit(): void {}
  update(): void {}

  private async _load(onProgress: (p: number) => void): Promise<void> {
    // Pixi Assets
    await this.ctx.assets.loadManifest(ASSET_MANIFEST, onProgress);

    // Register Howler sounds here
    this.ctx.audio.register('bounce', { src: ['/assets/audio/beep.mp3'] });
    this.ctx.audio.register('score', { src: ['/assets/audio/death.mp3'] });
    this.ctx.audio.register('music', { src: ['/assets/audio/Lobby.mp3'], loop: true, volume: 0.5 });

    // Ensure bar reaches 100% visually before we cut to menu
    onProgress(1);
    await new Promise((r) => setTimeout(r, 100));

    this.ctx.sceneManager.transitionTo(MenuScene);
  }
}
