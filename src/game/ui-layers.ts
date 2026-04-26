import type { UIManager } from '../core/ui';

export function registerUILayers(ui: UIManager): void {
  // Main Menu
  ui.addLayer(
    'main-menu',
    `<style>
      .mode-card { display: flex; flex-direction: column; align-items: center; width: 300px; background: rgba(5,0,16,0.5); border: 1px solid #3a0cd2; padding: 30px; box-shadow: 0 0 20px rgba(58,12,210,0.3); transition: transform 0.2s; }
      .mode-card:hover { transform: translateY(-5px); box-shadow: 0 5px 25px rgba(0,255,255,0.2); border-color: #00ffff; }
      .play-btn:hover { background-color: #00ffff !important; color: #000000 !important; box-shadow: 0 0 25px rgba(0, 255, 255, 0.8) !important; font-weight: bold; }
      #resume-btn:hover { background-color: rgba(58,12,210,0.8) !important; color: #ffffff !important; border-color: #00ffff !important; box-shadow: 0 0 15px rgba(0, 255, 255, 0.5) !important; }
      #stats-btn:hover { color: #00ffff !important; text-shadow: 0 0 8px rgba(0, 255, 255, 0.6); }
    </style>
    
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: transparent; background-image: linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.95) 100%), repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, #3a0cd2 2px, #3a0cd2 6px); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; pointer-events: auto;">
      
      <h1 id="menu-title" style="display: none;"></h1>

      <div style="text-align: center; margin-bottom: 60px; margin-top: -30px; pointer-events: none;">
        <div style="font-family: 'Orbitron', sans-serif; font-size: 110px; font-weight: 900; color: #ffffff; letter-spacing: 20px; margin-right: -20px; text-shadow: 0 4px 20px rgba(0,0,0,0.8);">BATTLESHIP</div>
        <div style="color: #888888; font-size: 18px; letter-spacing: 8px; margin-top: 15px; margin-right: -8px;">TACTICAL NAVAL COMBAT SIMULATOR</div>
      </div>
      
      <!-- Resume Button Wrapper (Hidden by default) -->
      <div id="resume-wrapper" style="display: none; width: 640px; margin-bottom: 30px;">
        <div id="menu-subtitle" style="color: #00ffff; font-family: 'Orbitron', sans-serif; font-size: 14px; text-align: center; letter-spacing: 4px; margin-bottom: 10px; text-shadow: 0 0 10px #00ffff;">ACTIVE LINK DETECTED</div>
        <button class="menu-btn" id="resume-btn" style="width: 100%; background: rgba(58,12,210,0.2); border: 1px solid #3a0cd2; color: #00ffff; padding: 12px 0; font-size: 14px; letter-spacing: 4px; box-shadow: inset 0 0 10px rgba(58,12,210,0.3); cursor: pointer; transition: all 0.15s ease-out;">
          > RESUME AWAITING ORDERS <
        </button>
      </div>

      <!-- Game Modes Container -->
      <div style="display: flex; gap: 40px; justify-content: center;">
        
        <!-- 1 Player Card -->
        <div class="mode-card">
          <h2 style="color: #00ffff; font-size: 24px; letter-spacing: 8px; margin: 0 0 12px 0; text-shadow: 0 0 15px rgba(0,255,255,0.8); font-weight: 400; margin-right: -8px;">1 PLAYER</h2>
          <div style="width: 100%; height: 2px; background-color: #00ffff; box-shadow: 0 0 10px #00ffff; margin-bottom: 25px;"></div>
          <p style="color: #e0e0e0; font-size: 14px; text-align: center; line-height: 1.8; margin: 0 0 30px 0;">Engage System AI.<br>Advanced tactical bot.</p>
          <button class="menu-btn play-btn" id="play-cpu-btn" style="width: 100%; background: transparent; border: 2px solid #00ffff; color: #ffffff; padding: 12px 0; font-size: 14px; letter-spacing: 4px; cursor: pointer; transition: all 0.15s;">DEPLOY VS AI</button>
        </div>

        <!-- 2 Player Card -->
        <div class="mode-card">
          <h2 style="color: #00ffff; font-size: 24px; letter-spacing: 8px; margin: 0 0 12px 0; text-shadow: 0 0 15px rgba(0,255,255,0.8); font-weight: 400; margin-right: -8px;">2 PLAYER</h2>
          <div style="width: 100%; height: 2px; background-color: #00ffff; box-shadow: 0 0 10px #00ffff; margin-bottom: 25px;"></div>
          <p style="color: #e0e0e0; font-size: 14px; text-align: center; line-height: 1.8; margin: 0 0 30px 0;">Hot-seat multiplayer.<br>Pass the device.</p>
          <button class="menu-btn play-btn" id="play-pvp-btn" style="width: 100%; background: transparent; border: 2px solid #00ffff; color: #ffffff; padding: 12px 0; font-size: 14px; letter-spacing: 4px; cursor: pointer; transition: all 0.15s;">DEPLOY VS HUMAN</button>
        </div>

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
        <!-- Left Action Buttons -->
    <div style="position: absolute; top: 20px; left: 40px; z-index: 10; pointer-events: auto; display: flex; flex-direction: column; gap: 15px;">
      <button class="menu-btn" id="abort-btn-placement" style="background: transparent; border: 1px solid #ff0055; color: #ff0055; padding: 8px 16px; font-family: 'Orbitron', sans-serif; font-size: 14px; letter-spacing: 2px; cursor: pointer; box-shadow: inset 0 0 10px rgba(255,0,85,0.2);">
        ABORT
      </button>
      <button class="menu-btn" id="auto-deploy-btn" style="background: transparent; border: 1px solid #00df85; color: #00df85; padding: 8px 16px; font-family: 'Orbitron', sans-serif; font-size: 14px; letter-spacing: 2px; cursor: pointer; box-shadow: inset 0 0 10px rgba(0,223,133,0.2);">
        AUTO DEPLOY
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
      <button class="menu-btn" id="abort-btn-combat" style="background: transparent; border: 1px solid #ff0055; color: #ff0055; padding: 8px 16px; font-family: 'Orbitron', sans-serif; font-size: 14px; letter-spacing: 2px; cursor: pointer; box-shadow: inset 0 0 10px rgba(255,0,85,0.2);">
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
    `<div class="settings-modal-overlay" style="display: flex; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 200; pointer-events: auto;">
      <div class="settings-modal glassmorphism" style="width: 500px; padding-bottom: 20px;">
        
        <div class="settings-header">
          <h2>COMBAT LOG</h2>
          <button class="settings-close" id="close-stats-btn">&times;</button>
        </div>
        
        <div class="settings-body" style="padding: 20px 40px; display: flex; flex-direction: column; gap: 30px;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(58,12,210,0.5); padding-bottom: 15px;">
            <div style="color: #888; font-size: 14px; letter-spacing: 2px;">PLAYER 1 VICTORIES</div>
            <div id="stat-p1" style="color: #fff; font-family: 'Orbitron', sans-serif; font-size: 36px; text-shadow: 0 0 10px rgba(255,255,255,0.5);">0</div>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(58,12,210,0.5); padding-bottom: 15px;">
            <div style="color: #888; font-size: 14px; letter-spacing: 2px;">PLAYER 2 VICTORIES</div>
            <div id="stat-p2" style="color: #fff; font-family: 'Orbitron', sans-serif; font-size: 36px; text-shadow: 0 0 10px rgba(255,255,255,0.5);">0</div>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(58,12,210,0.5); padding-bottom: 15px;">
            <div style="color: #888; font-size: 14px; letter-spacing: 2px;">TOTAL DEPLOYMENTS</div>
            <div id="stat-games" style="color: #00df85; font-family: 'Orbitron', sans-serif; font-size: 28px; text-shadow: 0 0 10px rgba(0,223,133,0.4);">0</div>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="color: #888; font-size: 14px; letter-spacing: 2px;">ORDNANCE EXPENDED</div>
            <div id="stat-moves" style="color: #00df85; font-family: 'Orbitron', sans-serif; font-size: 28px; text-shadow: 0 0 10px rgba(0,223,133,0.4);">0</div>
          </div>

        </div>
      </div>
    </div>`
  );
  // Universal Notification HUD (Slides down from the top)
  ui.addLayer(
    'notification-hud',
    `<div id="notification-container" style="
      position: absolute; 
      top: -100px; /* Hidden off-screen by default */
      left: 0; 
      width: 100%; 
      display: flex; 
      justify-content: center; 
      z-index: 1000; 
      pointer-events: none; 
      transition: top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
      
      <div id="notification-message" style="
        background: rgba(5,0,16,0.9); 
        border: 2px solid #ff0055; 
        color: #ff0055; 
        font-family: 'Orbitron', sans-serif; 
        font-size: 16px; 
        letter-spacing: 2px; 
        padding: 12px 30px; 
        box-shadow: 0 0 15px rgba(255,0,85,0.4); 
        text-transform: uppercase; 
        border-radius: 4px;">
        SYSTEM MESSAGE
      </div>
    </div>`
  );


}
