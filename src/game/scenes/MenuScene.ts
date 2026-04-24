/**
 * MenuScene — title screen with flashing "PRESS ENTER" prompt.
 *
 * Demonstrates:
 *   - Multi-line Text with Pixi v8 TextStyle
 *   - Tween for title slide-in animation
 *   - Input.isPressed for one-shot navigation
 */

import { Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';
import { PALETTE, RESOLUTION, TITLE } from '../config';
import { PlayScene } from './PlayScene';

const TITLE_STYLE = {
  fontFamily: 'monospace',
  fontSize: 12,
  fill: PALETTE.accent,
  letterSpacing: 3,
  dropShadow: {
    color: PALETTE.p1,
    blur: 0,
    distance: 2,
    angle: Math.PI / 4,
  },
};

const PROMPT_STYLE = {
  fontFamily: 'monospace',
  fontSize: 7,
  fill: PALETTE.fg,
  letterSpacing: 2,
};

const CREDIT_STYLE = {
  fontFamily: 'monospace',
  fontSize: 5,
  fill: PALETTE.dim,
  letterSpacing: 1,
};

export class MenuScene extends Scene {
  private flashTimer = 0;
  private promptText!: Text;

  constructor(private readonly ctx: AppContext) {
    super();
  }

  enter(): void {
    // Read RESOLUTION fresh inside enter() so native-res mode (which mutates
    // RESOLUTION at startup / on F2 swap) picks up the current dimensions.
    const W = RESOLUTION.w;
    const H = RESOLUTION.h;
    const scale = this.ctx.viewport.logicalScale;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    this.container.addChild(bg);

    // Decorative center line (same as play field)
    const line = new Graphics();
    for (let y = 6 * scale; y < H - 6 * scale; y += 9 * scale) {
      line.rect(W / 2 - 1 * scale, y, 2 * scale, 5 * scale).fill({ color: PALETTE.dim });
    }
    this.container.addChild(line);

    // Title — starts above frame and tweens down
    const title = new Text({
      text: TITLE,
      style: {
        ...TITLE_STYLE,
        fontSize: (TITLE_STYLE.fontSize as number) * scale,
        letterSpacing: (TITLE_STYLE.letterSpacing as number) * scale,
        dropShadow: TITLE_STYLE.dropShadow ? {
          ...TITLE_STYLE.dropShadow,
          distance: TITLE_STYLE.dropShadow.distance * scale,
        } : undefined,
      }
    });
    title.anchor.set(0.5, 0.5);
    title.position.set(W / 2, H / 3 - 30 * scale);
    this.container.addChild(title);

    this.ctx.gsap.to(title, { y: H / 3, duration: 0.7, ease: 'power3.out' });

    // "PRESS ENTER" prompt
    this.promptText = new Text({
      text: 'PRESS ENTER',
      style: {
        ...PROMPT_STYLE,
        fontSize: (PROMPT_STYLE.fontSize as number) * scale,
        letterSpacing: (PROMPT_STYLE.letterSpacing as number) * scale,
      }
    });
    this.promptText.anchor.set(0.5, 0.5);
    this.promptText.position.set(W / 2, H * 0.65);
    this.container.addChild(this.promptText);

    // Controls hint
    const p1hint = new Text({
      text: 'P1: W/S',
      style: {
        ...CREDIT_STYLE,
        fontSize: (CREDIT_STYLE.fontSize as number) * scale,
        letterSpacing: (CREDIT_STYLE.letterSpacing as number) * scale,
      }
    });
    p1hint.anchor.set(0, 1);
    p1hint.position.set(10 * scale, H - 6 * scale);

    const p2hint = new Text({
      text: 'P2: ↑/↓',
      style: {
        ...CREDIT_STYLE,
        fontSize: (CREDIT_STYLE.fontSize as number) * scale,
        letterSpacing: (CREDIT_STYLE.letterSpacing as number) * scale,
      }
    });
    p2hint.anchor.set(1, 1);
    p2hint.position.set(W - 10 * scale, H - 6 * scale);

    this.container.addChild(p1hint, p2hint);

    // Play music if not already playing
    if (!this.ctx.audio.isPlaying('music')) {
      this.ctx.audio.play('music');
    }

    this.flashTimer = 0;
  }

  exit(): void {
    this.ctx.gsap.killTweensOf(this.container.children);
  }

  update(dt: number): void {
    this.flashTimer += dt;
    // Gentle sine pulse
    this.promptText.alpha = 0.5 + 0.5 * Math.sin(this.flashTimer * 3.5);

    if (this.ctx.input.isPressed('Enter')) {
      this.ctx.sceneManager.transitionTo(PlayScene, undefined, true); // noCache=true → fresh game each time
    }
  }
}
