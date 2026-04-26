import { Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';
import { GAME, PALETTE, RESOLUTION } from '../config';
import { MenuScene } from './MenuScene';
import { GameController } from '../logic/GameController';
import { TurnPhase, Orientation, ShotResult, CellState } from '../logic/types';
import { Ship } from '../logic/Ship';
import { GridRenderer } from '../entities/GridRenderer';
import type { BoardState } from '../logic/BoardState';
import { serializeGame, deserializeGame } from '../logic/save';
import { ParticleSystem } from '../../core/particles';
import { autoDeployRemaining } from '../logic/AutoDeploy';
import { ComputerAI } from '../logic/ComputerAI';

export class PlayScene extends Scene {
  private logic!: GameController;
  private isVsCpu: boolean = false;

  private p1Grid!: GridRenderer;
  private p2Grid!: GridRenderer;
  private particles!: ParticleSystem;

  private currentShipIndex: number = 0;
  private currentOrientation: Orientation = Orientation.HORIZONTAL;
  private isPassingDevice: boolean = false;

  private lastActiveGrid: GridRenderer | null = null;
  private lastGridCoords: { x: number; y: number } | null = null;

  private timeLeft: number = GAME.TURN_TIME_LIMIT;
  private notificationTimer: ReturnType<typeof setTimeout> | null = null;
  private aiTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly ctx: AppContext) {
    super();
  }

  enter(data?: { resume: boolean, vsCpu?: boolean }): void {
    // Start Game Music (Teammate feature)
    this.ctx.audio.play('bgm_game');

    const W = RESOLUTION.w;
    const H = RESOLUTION.h;

    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    this.container.addChild(bg);

    // -- STORAGE LOAD --
    if (data?.resume) {
      const savedData = this.ctx.storage.load<string | null>('battleship_save', null);
      if (savedData) {
        const loaded = deserializeGame(savedData);
        if (loaded) {
          this.logic = loaded.logic;
          this.isVsCpu = loaded.isVsCpu;
          if (this.logic.phase === TurnPhase.P1_PLACEMENT) this.currentShipIndex = this.logic.p1Board.placedShips.length;
          if (this.logic.phase === TurnPhase.P2_PLACEMENT) this.currentShipIndex = this.logic.p2Board.placedShips.length;

          if (!this.isVsCpu) this.isPassingDevice = true;
        }
      }
    } else {
      this.logic = new GameController(GAME.BOARD_WIDTH, GAME.BOARD_HEIGHT);
      this.isVsCpu = data?.vsCpu ?? false;
      this.clearGameState();
    }

    this.p1Grid = new GridRenderer(this.logic.p1Board, true);
    this.p2Grid = new GridRenderer(this.logic.p2Board, true);

    const gridW = GAME.BOARD_WIDTH * GAME.TILE_SIZE;
    const gridH = GAME.BOARD_HEIGHT * GAME.TILE_SIZE;
    const gap = 100;
    const totalW = gridW * 2 + gap;
    const startX = Math.floor((W - totalW) / 2);
    const startY = Math.floor((H - gridH) / 2) + 30;

    this.p1Grid.position.set(startX, startY);
    this.p2Grid.position.set(startX + gridW + gap, startY);

    const labelStyle = new TextStyle({
      fontFamily: "'Orbitron', sans-serif", fontSize: 42, fill: PALETTE.fg, fontWeight: '900', letterSpacing: 6
    });

    const p1Label = new Text({ text: 'PLAYER 1', style: labelStyle });
    p1Label.anchor.set(0.5, 1);
    p1Label.position.set(startX + gridW / 2, startY - 45);

    const p2Label = new Text({ text: this.isVsCpu ? 'SYSTEM AI' : 'PLAYER 2', style: labelStyle });
    p2Label.anchor.set(0.5, 1);
    p2Label.position.set(startX + gridW + gap + gridW / 2, startY - 45);

    this.container.addChild(p1Label);
    this.container.addChild(p2Label);
    this.container.addChild(this.p1Grid);
    this.container.addChild(this.p2Grid);

    this.particles = new ParticleSystem(512);
    this.container.addChild(this.particles.container);

    this.bindGridEvents(this.p1Grid, this.logic.p1Board);
    this.bindGridEvents(this.p2Grid, this.logic.p2Board);

    document.addEventListener('contextmenu', this.preventContextMenu);

    this.setupUIBindings();

    // If we loaded into an AI turn, trigger it
    if (this.isVsCpu && this.logic.phase === TurnPhase.P2_TURN) {
      this.scheduleAITurn();
    }

    this.updatePhaseVisuals();
  }

  exit(): void {
    // Stop Game Music (Teammate feature)
    this.ctx.audio.stop('bgm_game');

    document.removeEventListener('contextmenu', this.preventContextMenu);
    this.particles.destroy();
    if (this.aiTimer) clearTimeout(this.aiTimer);
    if (this.notificationTimer) clearTimeout(this.notificationTimer);
    this.ctx.ui.hideAll();
    this.container.removeChildren();
  }

  private saveGameState() {
    this.ctx.storage.save('battleship_save', serializeGame(this.logic, this.isVsCpu));
  }

  private clearGameState() {
    this.ctx.storage.remove('battleship_save');
  }

  private trackMoveStat() {
    const moves = this.ctx.storage.load<number>('stats_total_moves', 0);
    this.ctx.storage.save('stats_total_moves', moves + 1);
  }

  private triggerGameOverStats() {
    this.clearGameState();
    const p1Wins = this.ctx.storage.load<number>('stats_p1_wins', 0) + (this.logic.winner === 1 ? 1 : 0);
    const p2Wins = this.ctx.storage.load<number>('stats_p2_wins', 0) + (this.logic.winner === 2 ? 1 : 0);
    const played = this.ctx.storage.load<number>('stats_games_played', 0) + 1;
    this.ctx.storage.save('stats_p1_wins', p1Wins);
    this.ctx.storage.save('stats_p2_wins', p2Wins);
    this.ctx.storage.save('stats_games_played', played);
  }

  private preventContextMenu = (e: Event) => e.preventDefault();

  private bindGridEvents(grid: GridRenderer, board: BoardState) {
    grid.on('pointermove', (e) => {
      const local = grid.toLocal(e.global);
      const newCoords = grid.getGridCoords(local.x, local.y);

      // Only trigger hover updates/sounds if we moved to a NEW cell (Teammate feature)
      if (!this.lastGridCoords || newCoords?.x !== this.lastGridCoords.x || newCoords?.y !== this.lastGridCoords.y) {
        this.lastGridCoords = newCoords;
        this.lastActiveGrid = grid;

        if (newCoords && (this.logic.phase === TurnPhase.P1_PLACEMENT || this.logic.phase === TurnPhase.P2_PLACEMENT)) {
          this.ctx.audio.play('hover_cell');
        }

        this.updateHover();
      }
    });

    grid.on('pointerleave', () => {
      this.lastGridCoords = null;
      if (this.lastActiveGrid === grid) this.lastActiveGrid = null;
      grid.clearHover();
    });

    grid.on('pointerdown', (e) => {
      if (e.button === 0) {
        this.handleInteraction(grid, board);
      } else if (e.button === 2) {
        this.rotateShip();
      }
    });
  }

  private setupUIBindings() {
    this.ctx.ui.hideAll();
    this.ctx.ui.onClick('#auto-deploy-btn', () => this.handleAutoDeploy());
    this.ctx.ui.onClick('#abort-btn-placement', () => this.ctx.sceneManager.transitionTo(MenuScene));
    this.ctx.ui.onClick('#abort-btn-combat', () => this.ctx.sceneManager.transitionTo(MenuScene));

    this.ctx.ui.onClick('#ready-btn', () => {
      this.isPassingDevice = false;
      this.timeLeft = GAME.TURN_TIME_LIMIT;
      this.updatePhaseVisuals();
    });

    this.ctx.ui.onClick('#restart-btn', () => {
      this.clearGameState();
      this.ctx.sceneManager.transitionTo(PlayScene, { resume: false, vsCpu: this.isVsCpu }, true);
    });

    this.ctx.ui.onClick('#menu-btn', () => this.ctx.sceneManager.transitionTo(MenuScene));

    // Add audio feedback to all in-game menu buttons (Teammate feature)
    const menuButtons = document.querySelectorAll('.menu-btn');
    menuButtons.forEach(btn => {
      btn.addEventListener('mouseenter', () => this.ctx.audio.play('menu_select'));
    });
  }

  private updatePhaseVisuals() {
    this.ctx.ui.hideAll();
    this.p1Grid.clearHover();
    this.p2Grid.clearHover();
    this.lastGridCoords = null;

    if (this.isPassingDevice && !this.isVsCpu) {
      this.p1Grid.setShowHiddenShips(false);
      this.p2Grid.setShowHiddenShips(false);
      this.p1Grid.eventMode = 'none';
      this.p2Grid.eventMode = 'none';

      this.ctx.ui.show('pass-device');
      const nextPlayer = (this.logic.phase === TurnPhase.P2_PLACEMENT || this.logic.phase === TurnPhase.P2_TURN) ? "PLAYER 2" : "PLAYER 1";
      this.ctx.ui.setText('#pass-device-text', `${nextPlayer} STANDBY`);
      return;
    }

    switch (this.logic.phase) {
      case TurnPhase.P1_PLACEMENT:
        this.p1Grid.setShowHiddenShips(true);
        this.p2Grid.setShowHiddenShips(false);
        this.p1Grid.eventMode = 'static';
        this.p2Grid.eventMode = 'none';
        this.ctx.ui.show('placement-hud');
        this.ctx.ui.setText('#placement-text', 'PLAYER 1: DEPLOY FLEET');
        break;

      case TurnPhase.P2_PLACEMENT:
        this.p1Grid.setShowHiddenShips(false);
        this.p2Grid.setShowHiddenShips(true);
        this.p1Grid.eventMode = 'none';
        this.p2Grid.eventMode = 'static';
        this.ctx.ui.show('placement-hud');
        this.ctx.ui.setText('#placement-text', 'PLAYER 2: DEPLOY FLEET');
        break;

      case TurnPhase.P1_TURN:
        this.p1Grid.setShowHiddenShips(true);
        this.p2Grid.setShowHiddenShips(false);
        this.p1Grid.eventMode = 'none';
        this.p2Grid.eventMode = 'static';
        this.ctx.ui.show('combat-hud');
        this.ctx.ui.setText('#turn-indicator', 'PLAYER 1');
        break;

      case TurnPhase.P2_TURN:
        if (this.isVsCpu) {
          this.p1Grid.setShowHiddenShips(true); this.p2Grid.setShowHiddenShips(false);
          this.p1Grid.eventMode = 'none'; this.p2Grid.eventMode = 'none';
          this.ctx.ui.show('combat-hud'); this.ctx.ui.setText('#turn-indicator', 'SYSTEM AI COMPUTING...');
        } else {
          this.p1Grid.setShowHiddenShips(false); this.p2Grid.setShowHiddenShips(true);
          this.p1Grid.eventMode = 'static'; this.p2Grid.eventMode = 'none';
          this.ctx.ui.show('combat-hud'); this.ctx.ui.setText('#turn-indicator', 'PLAYER 2');
        }
        break;

      case TurnPhase.GAME_OVER:
        this.triggerGameOverStats();
        this.p1Grid.setShowHiddenShips(true); this.p2Grid.setShowHiddenShips(true);
        this.p1Grid.eventMode = 'none'; this.p2Grid.eventMode = 'none';
        this.ctx.ui.show('game-over');
        const winText = this.isVsCpu && this.logic.winner === 2 ? 'SYSTEM AI VICTORIOUS' : `PLAYER ${this.logic.winner} VICTORIOUS`;
        this.ctx.ui.setText('#gameover-text', winText);
        break;
    }
    this.ctx.ui.show('notification-hud');
  }

  private showNotification(msg: string, isError: boolean = true) {
    const container = document.getElementById('notification-container');
    const textEl = document.getElementById('notification-message');
    if (!container || !textEl) return;

    textEl.innerText = msg;
    const color = isError ? '#ff0055' : '#00ffff';
    textEl.style.color = color;
    textEl.style.borderColor = color;
    textEl.style.boxShadow = `0 0 15px ${isError ? 'rgba(255,0,85,0.4)' : 'rgba(0,255,255,0.4)'}`;

    container.style.top = '20px';
    if (this.notificationTimer) clearTimeout(this.notificationTimer);
    this.notificationTimer = setTimeout(() => { container.style.top = '-100px'; }, 2500);
  }

  private rotateShip() {
    this.currentOrientation = this.currentOrientation === Orientation.HORIZONTAL
      ? Orientation.VERTICAL
      : Orientation.HORIZONTAL;
    this.updateHover();
  }

  update(dt: number): void {
    if (this.ctx.input.isPressed('Escape')) {
      this.ctx.sceneManager.transitionTo(MenuScene);
      return;
    }
    if (!this.isPassingDevice && this.ctx.input.isPressed('Space')) {
      this.rotateShip();
    }

    const isAiTurn = this.isVsCpu && this.logic.phase === TurnPhase.P2_TURN;

    if (!this.isPassingDevice && !isAiTurn && this.logic.phase !== TurnPhase.GAME_OVER) {
      this.timeLeft -= dt;
      const t = Math.max(0, Math.ceil(this.timeLeft));
      this.ctx.ui.setText('#timer-display', `${t}s`);

      const timerEl = document.getElementById('timer-display');
      if (timerEl) {
        if (t <= 5) {
          timerEl.style.color = '#ff0055'; timerEl.style.textShadow = '0 0 15px #ff0055';
        } else {
          timerEl.style.color = '#00ffff'; timerEl.style.textShadow = '0 0 15px #00ffff';
        }
      }

      if (this.timeLeft <= 0) {
        this.handleTimeout();
      }
    }
  }

  private handleTimeout() {
    const phase = this.logic.phase;
    if (phase === TurnPhase.P1_PLACEMENT || phase === TurnPhase.P2_PLACEMENT) {
      this.handleAutoDeploy();
    } else {
      const board = this.logic.getDefendingBoard();
      let x = 0, y = 0;
      do {
        x = Math.floor(Math.random() * board.width);
        y = Math.floor(Math.random() * board.height);
      } while (board.grid[y]![x] !== CellState.WATER);

      this.trackMoveStat();
      this.logic.fireShot(x, y);
      this.saveGameState();

      if (this.isVsCpu) {
        this.updatePhaseVisuals();
        this.scheduleAITurn();
      } else {
        this.isPassingDevice = true;
        this.updatePhaseVisuals();
      }
    }
  }

  private getExpectedGrid(): GridRenderer | null {
    switch (this.logic.phase) {
      case TurnPhase.P1_PLACEMENT: return this.p1Grid;
      case TurnPhase.P2_PLACEMENT: return this.p2Grid;
      case TurnPhase.P1_TURN: return this.p2Grid;
      case TurnPhase.P2_TURN: return this.p1Grid;
      default: return null;
    }
  }

  private updateHover() {
    this.p1Grid.clearHover();
    this.p2Grid.clearHover();

    if (!this.lastActiveGrid || !this.lastGridCoords || this.isPassingDevice || this.logic.phase === TurnPhase.GAME_OVER) return;

    const expectedGrid = this.getExpectedGrid();
    if (this.lastActiveGrid !== expectedGrid) return;

    const phase = this.logic.phase;
    const board = (phase === TurnPhase.P1_PLACEMENT || phase === TurnPhase.P2_TURN) ? this.logic.p1Board : this.logic.p2Board;

    if (phase === TurnPhase.P1_PLACEMENT || phase === TurnPhase.P2_PLACEMENT) {
      const shipLength = GAME.SHIP_INVENTORY[this.currentShipIndex];
      if (shipLength === undefined) return;

      const tempShip = new Ship('temp', shipLength);
      const isValid = board.canPlaceShip(tempShip, this.lastGridCoords.x, this.lastGridCoords.y, this.currentOrientation);
      this.lastActiveGrid.drawGhostShip(this.lastGridCoords.x, this.lastGridCoords.y, shipLength, this.currentOrientation, isValid);
    } else {
      this.lastActiveGrid.drawHoverTarget(this.lastGridCoords.x, this.lastGridCoords.y);
    }
  }

  private handleInteraction(grid: GridRenderer, board: BoardState) {
    if (!this.lastGridCoords || this.isPassingDevice || this.logic.phase === TurnPhase.GAME_OVER) return;

    const expectedGrid = this.getExpectedGrid();
    if (grid !== expectedGrid) return;

    const phase = this.logic.phase;

    if (phase === TurnPhase.P1_PLACEMENT || phase === TurnPhase.P2_PLACEMENT) {
      const shipLength = GAME.SHIP_INVENTORY[this.currentShipIndex];
      if (shipLength === undefined) return;

      const tempShip = new Ship('temp', shipLength);
      const isValid = board.canPlaceShip(tempShip, this.lastGridCoords.x, this.lastGridCoords.y, this.currentOrientation);

      if (isValid) {
        // Place Ship Audio (Teammate feature)
        this.ctx.audio.play('place_ship');

        const realShip = new Ship(`ship_${board === this.logic.p1Board ? 'p1' : 'p2'}_${this.currentShipIndex}`, shipLength);
        board.placeShip(realShip, this.lastGridCoords.x, this.lastGridCoords.y, this.currentOrientation);
        this.advancePlacementState();
      } else {
        this.showNotification('INVALID CLEARANCE: CANNOT DEPLOY HERE');
      }
    } else {
      this.executeShot(this.lastGridCoords.x, this.lastGridCoords.y, grid);
    }
  }

  private executeShot(x: number, y: number, targetGrid: GridRenderer) {
    const outcome = this.logic.fireShot(x, y);
    if (outcome.result === ShotResult.INVALID) {
      this.showNotification('INVALID TARGET: SECTOR ALREADY ENGAGED');
      return;
    }

    this.trackMoveStat();
    this.saveGameState();
    targetGrid.renderState();

    // Hit / Sunk Audio (Teammate feature)
    if (outcome.result === ShotResult.HIT) {
      this.ctx.audio.play('hit');
    } else if (outcome.result === ShotResult.SUNK) {
      this.ctx.audio.play('sunk');
    }

    if (outcome.result === ShotResult.HIT || outcome.result === ShotResult.SUNK) {
      const targetX = targetGrid.x + (x * GAME.TILE_SIZE) + (GAME.TILE_SIZE / 2);
      const targetY = targetGrid.y + (y * GAME.TILE_SIZE) + (GAME.TILE_SIZE / 2);

      this.particles.emit(targetX, targetY, { count: 30, size: 6, color: 0xff6600, speed: [80, 200], life: [0.3, 0.6], spread: Math.PI * 2, direction: 0, fade: true });
      this.particles.emit(targetX, targetY, { count: 40, size: 3, color: 0xffff00, speed: [150, 350], life: [0.2, 0.4], spread: Math.PI * 2, direction: 0, fade: true });
      this.ctx.camera.shake(5, 5, 0, 0.25);
    }

    const msgEl = document.getElementById('combat-message');
    if (msgEl) {
      const extraTurnText = (outcome.result === ShotResult.HIT || outcome.result === ShotResult.SUNK) ? ' - CRITICAL HIT!' : '';
      const prefix = (this.logic.phase === TurnPhase.P1_TURN && this.isVsCpu) ? 'SYSTEM AI ' : 'TARGET ';
      msgEl.innerText = prefix + outcome.result + extraTurnText;
      msgEl.style.display = 'block';
      msgEl.style.color = (outcome.result === ShotResult.HIT || outcome.result === ShotResult.SUNK) ? '#ff0055' : '#00ffff';
      msgEl.style.textShadow = `0 0 20px ${(outcome.result === ShotResult.HIT || outcome.result === ShotResult.SUNK) ? '#ff0055' : '#00ffff'}`;
      setTimeout(() => { msgEl.style.display = 'none'; }, 1000);
    }

    if (this.logic.winner !== null) {
      this.updatePhaseVisuals();
    } else if (outcome.result === ShotResult.MISS) {
      setTimeout(() => {
        if (this.isVsCpu) {
          this.timeLeft = GAME.TURN_TIME_LIMIT;
          this.updatePhaseVisuals();
          if (this.logic.phase === TurnPhase.P2_TURN) this.scheduleAITurn();
        } else {
          this.isPassingDevice = true;
          this.updatePhaseVisuals();
        }
      }, 1000);
    } else {
      this.timeLeft = GAME.TURN_TIME_LIMIT;
      this.updateHover();
      if (this.isVsCpu && this.logic.phase === TurnPhase.P2_TURN) this.scheduleAITurn();
    }
  }

  // --- AI LOGIC INTEGRATION ---
  private scheduleAITurn() {
    if (this.aiTimer) clearTimeout(this.aiTimer);
    // Add a 1.5s delay so the player can watch the AI "think" and shoot
    this.aiTimer = setTimeout(() => {
      if (this.logic.phase === TurnPhase.P2_TURN && this.logic.winner === null) {
        const move = ComputerAI.getNextMove(this.logic.p1Board);
        this.executeShot(move.x, move.y, this.p1Grid);
      }
    }, 1500);
  }

  private deployAIFleet() {
    autoDeployRemaining(this.logic.p2Board, GAME.SHIP_INVENTORY, 0, 'p2');
    this.logic.finishPlacementPhase();
    this.saveGameState();
    this.timeLeft = GAME.TURN_TIME_LIMIT;
    this.updatePhaseVisuals();
  }

  private handleAutoDeploy() {
    const phase = this.logic.phase;
    if (phase !== TurnPhase.P1_PLACEMENT && phase !== TurnPhase.P2_PLACEMENT) return;

    const board = phase === TurnPhase.P1_PLACEMENT ? this.logic.p1Board : this.logic.p2Board;
    const playerId = phase === TurnPhase.P1_PLACEMENT ? 'p1' : 'p2';

    const success = autoDeployRemaining(board, GAME.SHIP_INVENTORY, this.currentShipIndex, playerId);

    if (success) {
      this.getExpectedGrid()?.renderState();
      this.currentShipIndex = GAME.SHIP_INVENTORY.length; // Force advance
      this.advancePlacementState();
    } else {
      this.showNotification('DEPLOYMENT FAILED: GRID TOO CONGESTED', true);
    }
  }

  private advancePlacementState() {
    this.currentShipIndex++;
    this.getExpectedGrid()?.renderState();

    if (this.currentShipIndex >= GAME.SHIP_INVENTORY.length) {
      this.currentShipIndex = 0;
      this.logic.finishPlacementPhase();

      if (this.logic.phase === TurnPhase.P2_PLACEMENT && this.isVsCpu) {
        this.deployAIFleet(); // AI deploys instantly!
      } else {
        this.saveGameState();
        if (!this.isVsCpu) this.isPassingDevice = true;
        this.updatePhaseVisuals();
      }
    } else {
      this.timeLeft = GAME.TURN_TIME_LIMIT;
      this.updateHover();
    }
  }
}
