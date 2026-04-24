import type { UIManager } from '../core/ui';

export function registerUILayers(ui: UIManager): void {
  ui.addLayer(
    'main-menu',
    `<div class="menu-container">
      <h1 class="menu-title" id="menu-title"></h1>
      <button class="menu-btn" id="play-btn">PLAY</button>
      <div class="menu-controls">
        <span>P1: W / S</span>
        <span>P2: &uarr; / &darr;</span>
      </div>
      <button class="menu-btn" id="settings-btn" style="padding: 6px 20px; font-size: 14px;">SETTINGS</button>
      <div id="menu-score" style="margin-top: 20px; font-size: 0.8em; opacity: 0.7; text-align: center;"></div>
    </div>`,
  );

  ui.addLayer(
    'hud',
    '<div class="hud-score" id="hud-score">0 : 0</div>',
  );

  ui.addLayer(
    'game-over',
    `<div class="gameover-container">
      <div class="gameover-text" id="gameover-text"></div>
      <button class="menu-btn" id="restart-btn">BACK TO MENU</button>
    </div>`,
  );
}
