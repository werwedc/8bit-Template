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
    // Omega Setup Logic
    this.ctx.ui.onClick('#play-omega-btn', () => {
      this.ctx.ui.show('omega-modal');
    });

    this.ctx.ui.onClick('#omg-cancel-btn', () => {
      this.ctx.ui.hide('omega-modal');
    });

    const updateOmegaValidation = () => {
      const w = parseInt((document.getElementById('omg-w') as HTMLInputElement).value);
      const h = parseInt((document.getElementById('omg-h') as HTMLInputElement).value);
      const t = parseInt((document.getElementById('omg-t') as HTMLInputElement).value);

      document.getElementById('omg-w-val')!.innerText = w.toString();
      document.getElementById('omg-h-val')!.innerText = h.toString();
      document.getElementById('omg-t-val')!.innerText = t.toString();

      // Calculate required space. A block needs roughly 2.5 tiles of mathematical space due to "no touch" rules.
      const blocks =
        parseInt((document.getElementById('omg-s4') as HTMLInputElement).value) * 4 +
        parseInt((document.getElementById('omg-s3') as HTMLInputElement).value) * 3 +
        parseInt((document.getElementById('omg-s2') as HTMLInputElement).value) * 2 +
        parseInt((document.getElementById('omg-s1') as HTMLInputElement).value) * 1 +
        parseInt((document.getElementById('omg-l3') as HTMLInputElement).value) * 3 +
        parseInt((document.getElementById('omg-t4') as HTMLInputElement).value) * 4;

      const isValid = (blocks * 2.5) <= (w * h) && blocks > 0;
      const btn = document.getElementById('omg-launch-btn') as HTMLButtonElement;

      if (isValid) {
        document.getElementById('omg-error')!.innerText = '';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      } else {
        document.getElementById('omg-error')!.innerText = blocks === 0 ? 'FLEET CANNOT BE EMPTY' : 'GRID DENSITY CRITICAL: INCREASE SIZE OR REDUCE FLEET';
        btn.style.opacity = '0.5';
        btn.style.pointerEvents = 'none';
      }
    };

    // Bind sliders and inputs to validation check
    ['omg-w', 'omg-h', 'omg-t', 'omg-s4', 'omg-s3', 'omg-s2', 'omg-s1', 'omg-l3', 'omg-t4'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', updateOmegaValidation);
    });

    this.ctx.ui.onClick('#omg-launch-btn', () => {
      const inv: string[] = [];
      const add = (id: string, type: string) => {
        const count = parseInt((document.getElementById(id) as HTMLInputElement).value);
        for (let i = 0; i < count; i++) inv.push(type);
      };
      add('omg-s4', '4'); add('omg-s3', '3'); add('omg-s2', '2'); add('omg-s1', '1');
      add('omg-l3', 'L3'); add('omg-t4', 'T4');

      const config = {
        w: parseInt((document.getElementById('omg-w') as HTMLInputElement).value),
        h: parseInt((document.getElementById('omg-h') as HTMLInputElement).value),
        time: parseInt((document.getElementById('omg-t') as HTMLInputElement).value),
        inventory: inv
      };

      this.ctx.ui.hide('omega-modal');
      this.ctx.sceneManager.transitionTo(PlayScene, { resume: false, vsCpu: false, customConfig: config }, true);
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
