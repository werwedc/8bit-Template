import type { UIManager } from '../core/ui';

export function registerUILayers(ui: UIManager): void {
  ui.addLayer(
    'main-menu',
    `<div class="menu-container">
      <h1 class="menu-title" id="menu-title"></h1>
      <button class="menu-btn" id="play-btn">PLAY</button>
      <button class="menu-btn" id="settings-btn" style="padding: 6px 20px; font-size: 14px;">SETTINGS</button>
    </div>`,
  );

  ui.addLayer(
    'hud',
    '<div class="hud-score" id="hud-score">0</div>',
  );

  ui.addLayer(
    'game-over',
    `<div class="gameover-container">
      <div class="gameover-text" id="gameover-text"></div>
      <button class="menu-btn" id="restart-btn">BACK TO MENU</button>
    </div>`,
  );
}
