import type { UIManager } from '../core/ui';

export function registerUILayers(ui: UIManager): void {
  // Main Menu (Re-using existing structure)
  ui.addLayer(
    'main-menu',
    `<style>
      /* Hover effects */
      #play-btn:hover {
        background-color: #00ffff !important;
        color: #000000 !important;
        box-shadow: 0 0 25px rgba(0, 255, 255, 0.8) !important;
        font-weight: bold;
      }
      #settings-btn:hover {
        color: #00ffff !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
      }
    </style>
    
    <div style="
      position: absolute; 
      top: 0; left: 0; width: 100%; height: 100%; 
      background-color: #000; 
      background-image: 
        linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.95) 100%), 
        repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, #3a0cd2 2px, #3a0cd2 6px);
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      z-index: 10;">
      
      <!-- Hidden title for the engine's text setter -->
      <h1 id="menu-title" style="display: none;"></h1>

      <!-- Main Game Title Block -->
      <div style="text-align: center; margin-bottom: 90px; margin-top: -30px;">
        <div style="
          font-family: 'Orbitron', sans-serif; 
          font-size: 110px; 
          font-weight: 900; 
          color: #ffffff; 
          letter-spacing: 20px; 
          margin-right: -20px; 
          text-shadow: 0 4px 20px rgba(0,0,0,0.8); 
        ">BATTLESHIP</div>
        
        <div style="
          color: #888888; 
          font-size: 18px; 
          letter-spacing: 8px; 
          margin-top: 15px;
          margin-right: -8px;
        ">TACTICAL NAVAL COMBAT SIMULATOR</div>
      </div>
      
      <!-- 2-Player Mode Block (Card) -->
      <div style="display: flex; flex-direction: column; align-items: center; width: 320px;">
        
        <h2 style="
          color: #00ffff; 
          font-size: 28px; 
          letter-spacing: 10px; 
          margin: 0 0 12px 0; 
          text-shadow: 0 0 15px rgba(0,255,255,0.8), 0 0 5px rgba(0,255,255,0.4); 
          font-weight: 400;
          margin-right: -10px;
        ">2 PLAYER</h2>
        
        <div style="
          width: 100%; 
          height: 2px; 
          background-color: #00ffff; 
          box-shadow: 0 0 10px #00ffff; 
          margin-bottom: 30px;
        "></div>
        
        <p style="
          color: #e0e0e0; 
          font-size: 15px; 
          text-align: center; 
          line-height: 1.8; 
          margin: 0 0 40px 0;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
          Hot-seat multiplayer.<br>
          Pass the device!
        </p>
        
        <button class="menu-btn" id="play-btn" style="
          width: 100%;
          background: transparent;
          border: 2px solid #00ffff;
          border-radius: 0;
          color: #ffffff;
          padding: 14px 0; 
          font-size: 16px; 
          letter-spacing: 4px;
          box-shadow: inset 0 0 15px rgba(0,255,255,0.1), 0 0 15px rgba(0,255,255,0.2);
          cursor: pointer;
          transition: all 0.15s ease-out;">
          PLAY 2 PLAYER
        </button>
        
      </div>
      
      <!-- Settings Button -->
      <button class="menu-btn" id="settings-btn" style="
        margin-top: 50px;
        background: transparent;
        border: none;
        color: #666666;
        font-size: 13px;
        letter-spacing: 2px;
        text-decoration: underline;
        cursor: pointer;
        box-shadow: none;
        padding: 10px;
        transition: all 0.2s ease;">
        SETTINGS
      </button>
      
    </div>`,
  );
  ui.addLayer(
    'placement-hud',
    `
    <!-- Notice the added mask-image properties here -->
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; background-image: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(58,12,210,0.15) 2px, rgba(58,12,210,0.15) 6px); -webkit-mask-image: radial-gradient(ellipse 70% 80% at center, transparent 50%, black 100%); mask-image: radial-gradient(ellipse 70% 80% at center, transparent 50%, black 100%); z-index: 1;"></div>
    
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
    <!-- Added mask-image here too -->
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; background-image: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%), repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(58,12,210,0.15) 2px, rgba(58,12,210,0.15) 6px); -webkit-mask-image: radial-gradient(ellipse 70% 80% at center, transparent 50%, black 100%); mask-image: radial-gradient(ellipse 70% 80% at center, transparent 50%, black 100%); z-index: 1;"></div>
    
    <div style="position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; pointer-events: none; z-index: 10;">
      <div style="color: #00ffff; font-family: 'Orbitron', sans-serif; font-size: 16px; letter-spacing: 4px; text-shadow: 0 0 10px #00ffff; background: rgba(0,0,0,0.7); padding: 8px 16px; border: 1px solid #3a0cd2; box-shadow: 0 0 15px rgba(58,12,210,0.5);">
        LINK ACTIVE: <span id="turn-indicator" style="color: #ffffff;">PLAYER 1</span>
      </div>
    </div>
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

}
