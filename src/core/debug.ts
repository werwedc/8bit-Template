/**
 * DebugOverlay — press backtick (`) to toggle.
 *
 * Renders as a CSS overlay so it works before bitmap fonts are loaded
 * and shows up regardless of the game's current render state.
 *
 * Displays: FPS | Scene name | Entity/object count (caller-supplied)
 *
 * Usage:
 *   const debug = new DebugOverlay(app);
 *   // In game loop:
 *   debug.update('PlayScene', entityCount);
 */

import type { Application } from 'pixi.js';

export class DebugOverlay {
  private readonly el: HTMLDivElement;
  private readonly fxEl: HTMLDivElement;
  private _visible = false;
  private _scene = '';
  private _filterPreset = '';
  private _renderMode = '';

  constructor(private readonly app: Application) {
    this.el = document.createElement('div');
    this.el.style.cssText = [
      'position:fixed',
      'top:4px',
      'left:4px',
      'font:11px/1.4 monospace',
      'color:#0f0',
      'background:rgba(0,0,0,0.65)',
      'padding:4px 6px',
      'border-radius:2px',
      'pointer-events:none',
      'display:none',
      'z-index:9999',
      'white-space:pre',
    ].join(';');
    document.body.appendChild(this.el);

    this.fxEl = document.createElement('div');
    this.fxEl.style.cssText = [
      'position:fixed',
      'bottom:6px',
      'right:8px',
      'font:10px/1 monospace',
      'color:#aaa',
      'background:rgba(0,0,0,0.5)',
      'padding:3px 5px',
      'border-radius:2px',
      'pointer-events:none',
      'z-index:9999',
    ].join(';');
    document.body.appendChild(this.fxEl);
    this._updateFxLabel();

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Backquote') this.toggle();
    });
  }

  toggle(): void {
    this._visible = !this._visible;
    this.el.style.display = this._visible ? 'block' : 'none';
  }

  /** Called by SceneManager automatically on transition. */
  setScene(name: string): void {
    this._scene = name;
  }

  /** Show the active retro filter preset (cycled with F1). */
  setFilterPreset(name: string): void {
    this._filterPreset = name;
    this._updateFxLabel();
  }

  /** Show the active render mode (toggled with F2). */
  setRenderMode(mode: string): void {
    this._renderMode = mode;
    this._updateFxLabel();
  }

  private _updateFxLabel(): void {
    const fx = this._filterPreset || '';
    const mode = this._renderMode || '';
    this.fxEl.textContent = fx ? `FX: ${fx}${mode ? ' | ' + mode : ''}` : '';
  }

  /** Call once per frame from the main loop. entityCount is optional context. */
  update(entityCount = 0): void {
    if (!this._visible) return;
    const fps = Math.round(this.app.ticker.FPS);
    const dt = (this.app.ticker.deltaMS).toFixed(1);
    const fx = this._filterPreset ? `\nFX: ${this._filterPreset} (F1 to cycle)` : '';
    const mode = this._renderMode ? `\nMode: ${this._renderMode} (F2 to toggle)` : '';
    this.el.textContent =
      `FPS: ${fps} (${dt}ms)\nScene: ${this._scene}\nObjects: ${entityCount}${fx}${mode}`;
  }
}
