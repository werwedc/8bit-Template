import type { UIManager } from '../core/ui';

export function registerUILayers(ui: UIManager): void {
  // Main Menu (Re-using existing structure)
  ui.addLayer(
    'main-menu',
    `<div class="menu-container">
      <h1 class="menu-title" id="menu-title"></h1>
      <button class="menu-btn" id="play-btn">PLAY</button>
      <button class="menu-btn" id="settings-btn" style="padding: 6px 20px; font-size: 14px;">SETTINGS</button>
    </div>`,
  );

  // Ship Placement HUD
  ui.addLayer(
    'placement-hud',
    `<div style="position: absolute; bottom: 10px; width: 100%; text-align: center; pointer-events: none;">
      <div id="placement-text" style="color: white; font-size: 12px; margin-bottom: 5px; text-shadow: 1px 1px 0 #000;">
        Player 1: Place your ships
      </div>
      <div style="color: #a5a5af; font-size: 10px; text-shadow: 1px 1px 0 #000;">
        SPACE / Right-Click to Rotate
      </div>
    </div>`,
  );

  // Combat Phase HUD
  ui.addLayer(
    'combat-hud',
    `<div style="position: absolute; top: 10px; width: 100%; display: flex; justify-content: center; pointer-events: none;">
      <div style="color: white; font-size: 12px; text-shadow: 1px 1px 0 #000; background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px;">
        Turn: <span id="turn-indicator" style="color: #4dff4d;">Player 1</span>
      </div>
    </div>
    <div id="combat-message" style="position: absolute; top: 40%; width: 100%; text-align: center; color: white; font-size: 18px; text-shadow: 2px 2px 0 #000; display: none; pointer-events: none;">
      HIT!
    </div>`,
  );

  // Pass Device Screen (Covers the boards to prevent cheating in hot-seat)
  ui.addLayer(
    'pass-device',
    `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #0f380f; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 100;">
      <h2 id="pass-device-text" style="color: #8bac0f; text-align: center; margin-bottom: 10px; font-family: monospace; font-size: 20px;">Player 2's Turn</h2>
      <p style="color: #306230; font-size: 12px; margin-bottom: 20px; font-family: monospace;">Pass the device, then click ready!</p>
      <button class="menu-btn" id="ready-btn">READY</button>
    </div>`,
  );

  // Game Over Screen
  ui.addLayer(
    'game-over',
    `<div class="gameover-container">
      <div class="gameover-text" id="gameover-text" style="color: #ff4d4d; margin-bottom: 20px;"></div>
      <button class="menu-btn" id="restart-btn">PLAY AGAIN</button>
      <button class="menu-btn" id="menu-btn" style="margin-top: 10px;">MAIN MENU</button>
    </div>`,
  );
}
