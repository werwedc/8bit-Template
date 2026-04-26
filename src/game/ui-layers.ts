import type { UIManager } from '../core/ui';

export function registerUILayers(ui: UIManager): void {
  // Main Menu
  ui.addLayer(
    'main-menu',
    `<style>
      /* Hover effects */
      #new-game-btn:hover {
        background-color: #00ffff !important;
        color: #000000 !important;
        box-shadow: 0 0 25px rgba(0, 255, 255, 0.8) !important;
        font-weight: bold;
      }
      #resume-btn:hover {
        background-color: rgba(58,12,210,0.8) !important;
        color: #ffffff !important;
        border-color: #00ffff !important;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.5) !important;
      }
      #stats-btn:hover {
        color: #00ffff !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
      }
    </style>
    
    <div style="
      position: absolute; 
      top: 0; left: 0; width: 100%; height: 100%; 
      background-color: transparent; 
      background-image: 
        linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.95) 100%), 
        repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, #3a0cd2 2px, #3a0cd2 6px);
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      z-index: 10;
      pointer-events: auto;">
      
      <h1 id="menu-title" style="display: none;"></h1>

      <div style="text-align: center; margin-bottom: 90px; margin-top: -30px; pointer-events: none;">
        <div style="font-family: 'Orbitron', sans-serif; font-size: 110px; font-weight: 900; color: #ffffff; letter-spacing: 20px; margin-right: -20px; text-shadow: 0 4px 20px rgba(0,0,0,0.8);">BATTLESHIP</div>
        <div style="color: #888888; font-size: 18px; letter-spacing: 8px; margin-top: 15px; margin-right: -8px;">TACTICAL NAVAL COMBAT SIMULATOR</div>
      </div>
      
      <div style="display: flex; flex-direction: column; align-items: center; width: 320px;">
        <h2 style="color: #00ffff; font-size: 28px; letter-spacing: 10px; margin: 0 0 12px 0; text-shadow: 0 0 15px rgba(0,255,255,0.8), 0 0 5px rgba(0,255,255,0.4); font-weight: 400; margin-right: -10px;">2 PLAYER</h2>
        <div style="width: 100%; height: 2px; background-color: #00ffff; box-shadow: 0 0 10px #00ffff; margin-bottom: 30px;"></div>
        
                <p id="menu-subtitle" style="
          color: #e0e0e0; 
          font-size: 15px; 
          text-align: center; 
          line-height: 1.8; 
          margin: 0 0 40px 0;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
          white-space: pre-wrap;"> <!-- ADDED: Allows \n to break lines -->

        Hot-seat multiplayer.<br>Pass the device!</p>
        
        <!-- sleek Resume Button (Hidden by default) -->
        <button class="menu-btn" id="resume-btn" style="display: none; width: 100%; background: rgba(58,12,210,0.2); border: 1px solid #3a0cd2; border-radius: 0; color: #00ffff; padding: 10px 0; font-size: 13px; letter-spacing: 4px; box-shadow: inset 0 0 10px rgba(58,12,210,0.3); cursor: pointer; transition: all 0.15s ease-out; pointer-events: auto; margin-bottom: 15px;">
          > RESUME ACTIVE LINK <
        </button>

        <!-- Big Primary New Game Button -->
        <button class="menu-btn" id="new-game-btn" style="width: 100%; background: transparent; border: 2px solid #00ffff; border-radius: 0; color: #ffffff; padding: 14px 0; font-size: 16px; letter-spacing: 4px; box-shadow: inset 0 0 15px rgba(0,255,255,0.1), 0 0 15px rgba(0,255,255,0.2); cursor: pointer; transition: all 0.15s ease-out; pointer-events: auto;">
          DEPLOY NEW FLEET
        </button>
      </div>
      
          <div style="display: flex; gap: 30px; margin-top: 50px; pointer-events: auto;">
        <button class="menu-btn" id="settings-btn" style="background: transparent; border: none; color: #666666; font-size: 13px; letter-spacing: 2px; text-decoration: underline; cursor: pointer;">SETTINGS</button>
        <button class="menu-btn" id="stats-btn" style="background: transparent; border: none; color: #666666; font-size: 13px; letter-spacing: 2px; text-decoration: underline; cursor: pointer;">STATISTICS</button>
      </div>
    </div>`

  );

  ui.addLayer(
    'placement-hud',
    `
    <!-- Mask Image Layer -->
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; background-image: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(58,12,210,0.15) 2px, rgba(58,12,210,0.15) 6px); -webkit-mask-image: radial-gradient(ellipse 70% 80% at center, transparent 50%, black 100%); mask-image: radial-gradient(ellipse 70% 80% at center, transparent 50%, black 100%); z-index: 1;"></div>
        <!-- Abort to Menu Button -->
    <div style="position: absolute; top: 20px; left: 40px; z-index: 10; pointer-events: auto;">
      <button class="menu-btn" id="abort-btn" style="background: transparent; border: 1px solid #ff0055; color: #ff0055; padding: 8px 16px; font-family: 'Orbitron', sans-serif; font-size: 14px; letter-spacing: 2px; cursor: pointer; box-shadow: inset 0 0 10px rgba(255,0,85,0.2);">
        ABORT
      </button>
    </div>

    <!-- Timer -->
    <div style="position: absolute; top: 20px; right: 40px; text-align: right; z-index: 10; pointer-events: none;">
      <div style="color: #00ffff; font-family: 'Orbitron', sans-serif; font-size: 32px; text-shadow: 0 0 15px #00ffff;" id="timer-display">30s</div>
      <div style="color: #3a0cd2; font-size: 12px; letter-spacing: 2px;">TIME REMAINING</div>
    </div>

    <!-- Text Prompts -->
    <div style="position: absolute; bottom: 15px; width: 100%; text-align: center; pointer-events: none; z-index: 10;">
      <div id="placement-text" style="color: #00ffff; font-family: 'Orbitron', sans-serif; font-size: 16px; letter-spacing: 4px; margin-bottom: 8px; text-shadow: 0 0 10px #00ffff;">
        PLAYER 1: DEPLOY FLEET
      </div>
      <div style="color: #3a0cd2; font-size: 12px; text-shadow: 0 0 5px #3a0cd2;">
        SPACE / Right-Click to Rotate
      </div>
    </div>`
  );

  ui.addLayer(
    'combat-hud',
    `
    <!-- Mask Image Layer -->
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; background-image: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(58,12,210,0.15) 2px, rgba(58,12,210,0.15) 6px); -webkit-mask-image: radial-gradient(ellipse 70% 80% at center, transparent 50%, black 100%); mask-image: radial-gradient(ellipse 70% 80% at center, transparent 50%, black 100%); z-index: 1;"></div>
        <!-- Abort to Menu Button -->
    <div style="position: absolute; top: 20px; left: 40px; z-index: 10; pointer-events: auto;">
      <button class="menu-btn" id="abort-btn" style="background: transparent; border: 1px solid #ff0055; color: #ff0055; padding: 8px 16px; font-family: 'Orbitron', sans-serif; font-size: 14px; letter-spacing: 2px; cursor: pointer; box-shadow: inset 0 0 10px rgba(255,0,85,0.2);">
        ABORT
      </button>
    </div>

    <!-- Timer -->
    <div style="position: absolute; top: 20px; right: 40px; text-align: right; z-index: 10; pointer-events: none;">
      <div style="color: #00ffff; font-family: 'Orbitron', sans-serif; font-size: 32px; text-shadow: 0 0 15px #00ffff;" id="timer-display">30s</div>
      <div style="color: #3a0cd2; font-size: 12px; letter-spacing: 2px;">TIME REMAINING</div>
    </div>

    <!-- Top Indicator -->
    <div style="position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; pointer-events: none; z-index: 10;">
      <div style="color: #00ffff; font-family: 'Orbitron', sans-serif; font-size: 16px; letter-spacing: 4px; text-shadow: 0 0 10px #00ffff; background: rgba(0,0,0,0.7); padding: 8px 16px; border: 1px solid #3a0cd2; box-shadow: 0 0 15px rgba(58,12,210,0.5);">
        LINK ACTIVE: <span id="turn-indicator" style="color: #ffffff;">PLAYER 1</span>
      </div>
    </div>

    <!-- Hit/Miss Message -->
    <div id="combat-message" style="position: absolute; top: 45%; width: 100%; text-align: center; color: #ff0055; font-family: 'Orbitron', sans-serif; font-weight: 900; font-size: 36px; letter-spacing: 8px; text-shadow: 0 0 20px #ff0055; display: none; pointer-events: none; z-index: 10;">
      TARGET HIT!
    </div>`
  );

  ui.addLayer(
    'pass-device',
    `
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: #000; background-image: linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.95) 100%), repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, #3a0cd2 2px, #3a0cd2 6px); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 100; pointer-events: auto;">
      <h2 id="pass-device-text" style="color: #00ffff; font-family: 'Orbitron', sans-serif; font-size: 32px; letter-spacing: 8px; text-shadow: 0 0 15px #00ffff; text-align: center; margin-bottom: 15px;">
        PLAYER 2 STANDBY
      </h2>
      <p style="color: #888888; font-size: 14px; margin-bottom: 40px; letter-spacing: 2px;">SECURE DEVICE TRANSFER</p>
      <button class="menu-btn" id="ready-btn" style="background: transparent; border: 2px solid #00ffff; border-radius: 0; color: #ffffff; padding: 12px 30px; font-size: 16px; letter-spacing: 4px; box-shadow: inset 0 0 15px rgba(0,255,255,0.1), 0 0 15px rgba(0,255,255,0.2); cursor: pointer;">
        ENGAGE
      </button>
    </div>`
  );

  ui.addLayer(
    'game-over',
    `
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.8); background-image: repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(58,12,210,0.3) 2px, rgba(58,12,210,0.3) 6px); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 100; pointer-events: auto;">
      <h2 id="gameover-text" style="color: #ff0055; font-family: 'Orbitron', sans-serif; font-size: 48px; letter-spacing: 8px; text-shadow: 0 0 20px #ff0055; text-align: center; margin-bottom: 40px;">
      </h2>
      <button class="menu-btn" id="restart-btn" style="width: 250px; background: transparent; border: 2px solid #00ffff; border-radius: 0; color: #ffffff; padding: 14px 0; font-size: 16px; letter-spacing: 4px; box-shadow: inset 0 0 15px rgba(0,255,255,0.1), 0 0 15px rgba(0,255,255,0.2); cursor: pointer; margin-bottom: 20px;">
        REDEPLOY
      </button>
      <button class="menu-btn" id="menu-btn" style="background: transparent; border: none; color: #888888; font-size: 14px; letter-spacing: 2px; text-decoration: underline; cursor: pointer;">
        DISCONNECT
      </button>
    </div>`
  );

  // New Statistics Modal Layer
  ui.addLayer(
    'stats-modal',
    `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 200; pointer-events: auto;">
      <div style="border: 2px solid #3a0cd2; background: rgba(5,0,16,0.85); padding: 40px 60px; text-align: center; box-shadow: 0 0 30px rgba(58,12,210,0.5);">
        
        <h2 style="color: #00ffff; font-family: 'Orbitron', sans-serif; font-size: 32px; letter-spacing: 8px; margin-bottom: 40px; text-shadow: 0 0 10px #00ffff;">GLOBAL COMBAT STATS</h2>
        
        <div style="display: flex; gap: 60px; justify-content: center; margin-bottom: 40px;">
          <div style="text-align: center;">
            <div style="color: #888; font-size: 12px; letter-spacing: 2px; margin-bottom: 5px;">PLAYER 1 WINS</div>
            <div id="stat-p1" style="color: #fff; font-family: 'Orbitron', sans-serif; font-size: 48px;">0</div>
          </div>
          <div style="text-align: center;">
            <div style="color: #888; font-size: 12px; letter-spacing: 2px; margin-bottom: 5px;">PLAYER 2 WINS</div>
            <div id="stat-p2" style="color: #fff; font-family: 'Orbitron', sans-serif; font-size: 48px;">0</div>
          </div>
        </div>
        
        <div style="display: flex; justify-content: center; gap: 60px; margin-bottom: 50px;">
          <div style="text-align: center;">
            <div style="color: #888; font-size: 12px; letter-spacing: 2px; margin-bottom: 5px;">MATCHES DEPLOYED</div>
            <div id="stat-games" style="color: #00df85; font-family: 'Orbitron', sans-serif; font-size: 24px;">0</div>
          </div>
          <div style="text-align: center;">
            <div style="color: #888; font-size: 12px; letter-spacing: 2px; margin-bottom: 5px;">TOTAL ORDNANCE FIRED</div>
            <div id="stat-moves" style="color: #00df85; font-family: 'Orbitron', sans-serif; font-size: 24px;">0</div>
          </div>
        </div>
        
        <button class="menu-btn" id="close-stats-btn" style="background: transparent; border: 1px solid #00ffff; color: #fff; padding: 10px 40px; font-size: 14px; letter-spacing: 4px; cursor: pointer;">RETURN</button>
      </div>
    </div>`
  );

}
