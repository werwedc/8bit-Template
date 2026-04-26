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
    const W = RESOLUTION.w;
    const H = RESOLUTION.h;
    const scale = this.ctx.viewport.logicalScale;

    const BAR_W = Math.floor(W * 0.6);
    const BAR_H = 4 * scale;
    const BAR_X = Math.floor((W - BAR_W) / 2);
    const BAR_Y = Math.floor(H * 0.6);

    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    this.container.addChild(bg);

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

    const outline = new Graphics();
    outline.rect(BAR_X - 1 * scale, BAR_Y - 1 * scale, BAR_W + 2 * scale, BAR_H + 2 * scale).stroke({ color: PALETTE.fg, width: 1 * scale });
    this.container.addChild(outline);

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
    await this.ctx.assets.loadManifest(ASSET_MANIFEST, onProgress);

    // ── SFX ──────────────────────────────────────────────
    this.ctx.audio.register('menu_select', { src: ['/assets/audio/audio effects retro/hud/menu select.wav'] });
    this.ctx.audio.register('hit', { src: ['/assets/audio/8bit Sound Pack/8bit Sound Pack/mp3/Bomb_Explosion.mp3'] });
    this.ctx.audio.register('sunk', { src: ['/assets/audio/death.mp3'] });
    this.ctx.audio.register('hover_cell', { src: ['/audio/beep.mp3'] });
    this.ctx.audio.register('place_ship', { src: ['/audio/hardDrop.ogg'] });

    // ── Background Music ──────────────────────────────────────────────
    this.ctx.audio.register('bgm_lobby', { src: ['/assets/audio/Lobby.mp3'], loop: true, volume: 0.5 });
    this.ctx.audio.register('bgm_game', { src: ['/assets/audio/BackgroundMusic.mp3'], loop: true, volume: 0.3 });

    onProgress(1);
    await new Promise((r) => setTimeout(r, 100));

    this.ctx.sceneManager.transitionTo(MenuScene);
  }
}