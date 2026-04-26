import { Graphics } from 'pixi.js';
import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';
import { RESOLUTION } from '../config';
import { PlayScene } from './PlayScene';

interface RadarDot { x: number; y: number; angle: number; brightness: number; }

export class MenuScene extends Scene {
  private radarGfx!: Graphics;
  private radarAngle: number = 0;
  private dots: RadarDot[] = [];
  private cx: number = RESOLUTION.w / 2;
  private cy: number = RESOLUTION.h / 2;
  private maxRadius: number = RESOLUTION.w;

  constructor(private readonly ctx: AppContext) { super(); }

  enter(): void {
    // Start Lobby Music
    this.ctx.audio.play('bgm_lobby');

    this.radarGfx = new Graphics();
    this.container.addChild(this.radarGfx);
    this.generateDots();

    this.ctx.ui.show('main-menu');

    const savedDataStr = this.ctx.storage.load<string | null>('battleship_save', null);
    if (savedDataStr) {
      const resumeWrapper = document.getElementById('resume-wrapper');
      if (resumeWrapper) resumeWrapper.style.display = 'block';
    }

    // CPU Mode
    this.ctx.ui.onClick('#play-cpu-btn', () => {
      this.ctx.sceneManager.transitionTo(PlayScene, { resume: false, vsCpu: true }, true);
    });

    // PVP Mode
    this.ctx.ui.onClick('#play-pvp-btn', () => {
      this.ctx.sceneManager.transitionTo(PlayScene, { resume: false, vsCpu: false }, true);
    });

    // Resume uses data from storage directly inside PlayScene
    this.ctx.ui.onClick('#resume-btn', () => {
      this.ctx.sceneManager.transitionTo(PlayScene, { resume: true }, true);
    });

    this.ctx.ui.onClick('#stats-btn', () => {
      this.ctx.ui.show('stats-modal');
      this.ctx.ui.setText('#stat-p1', this.ctx.storage.load<number>('stats_p1_wins', 0).toString());
      this.ctx.ui.setText('#stat-p2', this.ctx.storage.load<number>('stats_p2_wins', 0).toString());
      this.ctx.ui.setText('#stat-games', this.ctx.storage.load<number>('stats_games_played', 0).toString());
      this.ctx.ui.setText('#stat-moves', this.ctx.storage.load<number>('stats_total_moves', 0).toString());
    });

    this.ctx.ui.onClick('#close-stats-btn', () => {
      this.ctx.ui.hide('stats-modal');
    });

    // Add audio feedback to menu buttons ON CLICK
    const menuButtons = document.querySelectorAll('.menu-btn');
    menuButtons.forEach(btn => {
      btn.addEventListener('click', () => this.ctx.audio.play('menu_select'));
    });
  }

  private generateDots() {
    this.dots = [];
    for (let i = 0; i < 15; i++) {
      const isLeft = Math.random() > 0.5;
      const x = isLeft ? 10 + Math.random() * 70 : (RESOLUTION.w - 80) + Math.random() * 70;
      const y = 10 + Math.random() * (RESOLUTION.h - 20);
      let angle = Math.atan2(y - this.cy, x - this.cx);
      if (angle < 0) angle += Math.PI * 2;
      this.dots.push({ x, y, angle, brightness: 0 });
    }
  }

  exit(): void {
    // Stop Lobby Music before transitioning
    this.ctx.audio.stop('bgm_lobby');
    this.container.removeChildren();
    this.ctx.ui.hideAll();
  }

  update(dt: number): void {
    const sweepSpeed = 1.0 * dt;
    this.radarAngle = (this.radarAngle + sweepSpeed) % (Math.PI * 2);

    for (const dot of this.dots) {
      let diff = Math.abs(this.radarAngle - dot.angle);
      if (diff > Math.PI) diff = (Math.PI * 2) - diff;
      if (diff < 0.05) dot.brightness = 1.0;
      else dot.brightness = Math.max(0, dot.brightness - 0.5 * dt);
    }
    this.drawRadar();
  }

  private drawRadar() {
    const g = this.radarGfx;
    g.clear();
    g.circle(this.cx, this.cy, 50).stroke({ color: 0x00ffff, alpha: 0.1, width: 2 });
    g.circle(this.cx, this.cy, 150).stroke({ color: 0x00ffff, alpha: 0.05, width: 2 });
    g.circle(this.cx, this.cy, 300).stroke({ color: 0x00ffff, alpha: 0.05, width: 2 });

    const endX = this.cx + Math.cos(this.radarAngle) * this.maxRadius;
    const endY = this.cy + Math.sin(this.radarAngle) * this.maxRadius;
    g.moveTo(this.cx, this.cy).lineTo(endX, endY).stroke({ color: 0x00ffff, alpha: 0.3, width: 2 });

    for (const dot of this.dots) {
      if (dot.brightness > 0) g.circle(dot.x, dot.y, 4).fill({ color: 0xff0055, alpha: dot.brightness });
    }
  }
}