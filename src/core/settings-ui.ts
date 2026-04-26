import type { AppContext } from './types';
import type { RenderMode } from './viewport';

export interface SettingsConfig {
  presets: string[];
  onPresetChange: (index: number) => void;
  onRenderModeChange: (mode: RenderMode) => void;
}

export class SettingsMenu {
  private el: HTMLDivElement;

  constructor(private ctx: AppContext, private config: SettingsConfig) {
    this.el = document.createElement('div');
    this.el.className = 'settings-modal-overlay';
    this.el.style.display = 'none';

    // Premium Glassmorphism UI
    this.el.innerHTML = `
      <div class="settings-modal glassmorphism">
        <div class="settings-header">
          <h2>SETTINGS</h2>
          <button class="settings-close" id="settings-close-btn">&times;</button>
        </div>
        
        <div class="settings-body">
          <div class="settings-row">
            <img src="/assets/ui/icons/volume-3.svg" class="settings-icon" id="icon-volume" />
            <label>Master Volume</label>
            <input type="range" id="settings-volume" min="0" max="1" step="0.05" value="1" />
          </div>

          <div class="settings-row">
            <img src="/assets/ui/icons/volume-x.svg" class="settings-icon" />
            <label>Mute Audio</label>
            <input type="checkbox" id="settings-mute" />
          </div>

          <div class="settings-row">
            <img src="/assets/ui/icons/resolution.svg" class="settings-icon" />
            <label>Resolution</label>
            <select id="settings-resolution">
              <option value="retro">Retro (Pixelated)</option>
              <option value="native">Native (Smooth)</option>
              <option value="native-res">Native-Res (1:1)</option>
            </select>
          </div>

          <div class="settings-row">
            <img src="/assets/ui/icons/graphics-quality-eye.svg" class="settings-icon" />
            <label>Graphics Quality</label>
            <select id="settings-graphics">
              ${config.presets.map((p, i) => `<option value="${i}">${p.toUpperCase()}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
    `;

    document.getElementById('game-ui')?.appendChild(this.el);
    this._bindEvents();
    this._loadState();
  }

  private _updateVolumeIcon(vol: number, muted: boolean): void {
    const volIcon = this.el.querySelector('#icon-volume') as HTMLImageElement;
    if (!volIcon) return;

    if (muted || vol === 0) {
      volIcon.src = '/assets/ui/icons/volume-x.svg';
    } else if (vol <= 0.33) {
      volIcon.src = '/assets/ui/icons/volume-1.svg';
    } else if (vol <= 0.66) {
      volIcon.src = '/assets/ui/icons/volume-2.svg';
    } else {
      volIcon.src = '/assets/ui/icons/volume-3.svg';
    }
  }

  private _bindEvents(): void {
    const q = (sel: string) => this.el.querySelector(sel) as HTMLElement;
    
    q('#settings-close-btn').addEventListener('click', () => this.hide());
    
    // Close on overlay click
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.hide();
    });

    const vol = q('#settings-volume') as HTMLInputElement;
    const mute = q('#settings-mute') as HTMLInputElement;

    vol.addEventListener('input', () => {
      const v = parseFloat(vol.value);
      this.ctx.audio.setGlobalVolume(v);
      this.ctx.storage.save('settings_volume', v);
      this._updateVolumeIcon(v, mute.checked);
    });

    mute.addEventListener('change', () => {
      const m = mute.checked;
      this.ctx.audio.mute(m);
      this.ctx.storage.save('settings_mute', m);
      this._updateVolumeIcon(parseFloat(vol.value), m);
    });

    const res = q('#settings-resolution') as HTMLSelectElement;
    res.addEventListener('change', () => {
      const mode = res.value as RenderMode;
      this.config.onRenderModeChange(mode);
      this.ctx.storage.save('settings_resolution', mode);
    });

    const gfx = q('#settings-graphics') as HTMLSelectElement;
    gfx.addEventListener('change', () => {
      const index = parseInt(gfx.value, 10);
      this.config.onPresetChange(index);
      this.ctx.storage.save('settings_graphics_index', index);
    });
  }

  private _loadState(): void {
    const q = (sel: string) => this.el.querySelector(sel) as any;
    
    // Load and apply Audio settings instantly
    const vol = this.ctx.storage.load('settings_volume', 1.0);
    q('#settings-volume').value = vol;
    this.ctx.audio.setGlobalVolume(vol);

    const mute = this.ctx.storage.load('settings_mute', false);
    q('#settings-mute').checked = mute;
    this.ctx.audio.mute(mute);

    // Sync the volume icon to the loaded state
    this._updateVolumeIcon(vol, mute);

    // RenderMode and Graphics presets are read via main.ts at startup,
    // so here we just initialize the UI to the correct dropdown values.
    const res = this.ctx.storage.load<RenderMode>('settings_resolution', this.ctx.viewport.renderMode);
    q('#settings-resolution').value = res;

    const gfx = this.ctx.storage.load('settings_graphics_index', 3); // 3 = full
    q('#settings-graphics').value = gfx.toString();
  }

  public show(): void {
    this.el.style.display = 'flex';
  }

  public hide(): void {
    this.el.style.display = 'none';
  }
}