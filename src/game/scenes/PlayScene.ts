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

export class PlayScene extends Scene {
  private logic!: GameController;
  private p1Grid!: GridRenderer;
  private p2Grid!: GridRenderer;
  private particles!: ParticleSystem;

  private currentShipIndex: number = 0;
  private currentOrientation: Orientation = Orientation.HORIZONTAL;
  private isPassingDevice: boolean = false;
  private lastActiveGrid: GridRenderer | null = null;
  private lastGridCoords: { x: number; y: number } | null = null;

  private timeLeft: number = GAME.TURN_TIME_LIMIT;

  constructor(private readonly ctx: AppContext) { super(); }

  // Accept transition data!
  enter(data?: { resume: boolean }): void {
    const W = RESOLUTION.w;
    const H = RESOLUTION.h;
    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    this.container.addChild(bg);

    this.logic = new GameController(GAME.BOARD_WIDTH, GAME.BOARD_HEIGHT);

    // -- STORAGE LOAD --
    if (data?.resume) {
      const savedData = this.ctx.storage.load<string | null>('battleship_save', null);
      if (savedData) {
        const loaded = deserializeGame(savedData);
        if (loaded) {
          this.logic = loaded;
          if (this.logic.phase === TurnPhase.P1_PLACEMENT) this.currentShipIndex = this.logic.p1Board.placedShips.length;
          if (this.logic.phase === TurnPhase.P2_PLACEMENT) this.currentShipIndex = this.logic.p2Board.placedShips.length;
          this.isPassingDevice = true; // Lock screen on load
        }
      }
    } else {
      // Starting new game, wipe the old save!
      this.clearGameState();
    }

    this.p1Grid = new GridRenderer(this.logic.p1Board, true);
    this.p2Grid = new GridRenderer(this.logic.p2Board, true);

    const gridW = GAME.BOARD_WIDTH * GAME.TILE_SIZE;
    const gridH = GAME.BOARD_HEIGHT * GAME.TILE_SIZE;
    const gap = 100;
    const totalW = gridW * 2 + gap;
    const startX = Math.floor((W - totalW) / 2);

    // Position boards
    const startY = Math.floor((H - gridH) / 2) + 30;

    this.p1Grid.position.set(startX, startY);
    this.p2Grid.position.set(startX + gridW + gap, startY);

    const labelStyle = new TextStyle({
      fontFamily: "'Orbitron', sans-serif",
      fontSize: 42,
      fill: PALETTE.fg,
      fontWeight: '900',
      letterSpacing: 6
    });

    // Position labels
    const p1Label = new Text({ text: 'PLAYER 1', style: labelStyle });
    p1Label.anchor.set(0.5, 1);
    p1Label.position.set(startX + gridW / 2, startY - 45);

    const p2Label = new Text({ text: 'PLAYER 2', style: labelStyle });
    p2Label.anchor.set(0.5, 1);
    p2Label.position.set(startX + gridW + gap + gridW / 2, startY - 45);

    this.container.addChild(p1Label);
    this.container.addChild(p2Label);
    this.container.addChild(this.p1Grid);
    this.container.addChild(this.p2Grid);

    // Initialize Particle System and add it ON TOP of the grids
    this.particles = new ParticleSystem(512);
    this.container.addChild(this.particles.container);

    this.bindGridEvents(this.p1Grid, this.logic.p1Board);
    this.bindGridEvents(this.p2Grid, this.logic.p2Board);
    document.addEventListener('contextmenu', this.preventContextMenu);

    this.setupUIBindings();
    this.updatePhaseVisuals();
  }

  exit(): void {
    document.removeEventListener('contextmenu', this.preventContextMenu);
    this.particles.destroy(); // Clean up particles to prevent memory leaks
    this.ctx.ui.hideAll();
    this.container.removeChildren();
  }

  // CORRECT STORAGE API implementations
  private saveGameState() {
    this.ctx.storage.save('battleship_save', serializeGame(this.logic));
  }

  private clearGameState() {
    this.ctx.storage.remove('battleship_save');
  }

  private trackMoveStat() {
    const moves = this.ctx.storage.load<number>('stats_total_moves', 0);
    this.ctx.storage.save('stats_total_moves', moves + 1);
  }

  private triggerGameOverStats() {
    this.clearGameState(); // Delete save
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
      this.lastGridCoords = grid.getGridCoords(local.x, local.y);
      this.lastActiveGrid = grid;
      this.updateHover();
    });
    grid.on('pointerleave', () => {
      this.lastGridCoords = null;
      if (this.lastActiveGrid === grid) this.lastActiveGrid = null;
      grid.clearHover();
    });
    grid.on('pointerdown', (e) => {
      if (e.button === 0) this.handleInteraction(grid, board);
      else if (e.button === 2) this.rotateShip();
    });
  }

  private setupUIBindings() {
    this.ctx.ui.hideAll();
    this.ctx.ui.onClick('#abort-btn', () => {
      this.ctx.sceneManager.transitionTo(MenuScene);
    });
    this.ctx.ui.onClick('#ready-btn', () => {
      this.isPassingDevice = false;
      this.timeLeft = GAME.TURN_TIME_LIMIT; // Reset timer
      this.updatePhaseVisuals();
    });
    this.ctx.ui.onClick('#restart-btn', () => {
      this.clearGameState();
      this.ctx.sceneManager.transitionTo(PlayScene, { resume: false }, true);
    });
    this.ctx.ui.onClick('#menu-btn', () => {
      this.ctx.sceneManager.transitionTo(MenuScene);
    });
  }

  private updatePhaseVisuals() {
    this.ctx.ui.hideAll();
    this.p1Grid.clearHover();
    this.p2Grid.clearHover();
    this.lastGridCoords = null;

    if (this.isPassingDevice) {
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
        this.p1Grid.setShowHiddenShips(true); this.p2Grid.setShowHiddenShips(false);
        this.p1Grid.eventMode = 'static'; this.p2Grid.eventMode = 'none';
        this.ctx.ui.show('placement-hud'); this.ctx.ui.setText('#placement-text', 'PLAYER 1: DEPLOY FLEET');
        break;
      case TurnPhase.P2_PLACEMENT:
        this.p1Grid.setShowHiddenShips(false); this.p2Grid.setShowHiddenShips(true);
        this.p1Grid.eventMode = 'none'; this.p2Grid.eventMode = 'static';
        this.ctx.ui.show('placement-hud'); this.ctx.ui.setText('#placement-text', 'PLAYER 2: DEPLOY FLEET');
        break;
      case TurnPhase.P1_TURN:
        this.p1Grid.setShowHiddenShips(true); this.p2Grid.setShowHiddenShips(false);
        this.p1Grid.eventMode = 'none'; this.p2Grid.eventMode = 'static';
        this.ctx.ui.show('combat-hud'); this.ctx.ui.setText('#turn-indicator', 'PLAYER 1');
        break;
      case TurnPhase.P2_TURN:
        this.p1Grid.setShowHiddenShips(false); this.p2Grid.setShowHiddenShips(true);
        this.p1Grid.eventMode = 'static'; this.p2Grid.eventMode = 'none';
        this.ctx.ui.show('combat-hud'); this.ctx.ui.setText('#turn-indicator', 'PLAYER 2');
        break;
      case TurnPhase.GAME_OVER:
        this.triggerGameOverStats();
        this.p1Grid.setShowHiddenShips(true); this.p2Grid.setShowHiddenShips(true);
        this.p1Grid.eventMode = 'none'; this.p2Grid.eventMode = 'none';
        this.ctx.ui.show('game-over'); this.ctx.ui.setText('#gameover-text', `PLAYER ${this.logic.winner} VICTORIOUS`);
        break;
    }
  }

  private rotateShip() {
    this.currentOrientation = this.currentOrientation === Orientation.HORIZONTAL ? Orientation.VERTICAL : Orientation.HORIZONTAL;
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

    if (!this.isPassingDevice && this.logic.phase !== TurnPhase.GAME_OVER) {
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
      const board = (phase === TurnPhase.P1_PLACEMENT) ? this.logic.p1Board : this.logic.p2Board;
      const shipLength = GAME.SHIP_INVENTORY[this.currentShipIndex]!;
      const tempShip = new Ship('temp', shipLength);

      let placed = false;
      for (let y = 0; y < board.height && !placed; y++) {
        for (let x = 0; x < board.width && !placed; x++) {
          if (board.canPlaceShip(tempShip, x, y, Orientation.HORIZONTAL)) {
            const realShip = new Ship(`ship_${board === this.logic.p1Board ? 'p1' : 'p2'}_${this.currentShipIndex}`, shipLength);
            board.placeShip(realShip, x, y, Orientation.HORIZONTAL);
            placed = true;
          }
        }
      }
      this.advancePlacementState();
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

      this.isPassingDevice = true;
      this.updatePhaseVisuals();
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
    if (grid !== this.getExpectedGrid()) return;

    const phase = this.logic.phase;

    if (phase === TurnPhase.P1_PLACEMENT || phase === TurnPhase.P2_PLACEMENT) {
      const shipLength = GAME.SHIP_INVENTORY[this.currentShipIndex];
      if (shipLength === undefined) return;

      const tempShip = new Ship('temp', shipLength);
      const isValid = board.canPlaceShip(tempShip, this.lastGridCoords.x, this.lastGridCoords.y, this.currentOrientation);

      if (isValid) {
        const realShip = new Ship(`ship_${board === this.logic.p1Board ? 'p1' : 'p2'}_${this.currentShipIndex}`, shipLength);
        board.placeShip(realShip, this.lastGridCoords.x, this.lastGridCoords.y, this.currentOrientation);
        this.advancePlacementState();
      }
    } else {
      const outcome = this.logic.fireShot(this.lastGridCoords.x, this.lastGridCoords.y);
      if (outcome.result !== ShotResult.INVALID) {
        this.trackMoveStat();
        this.saveGameState();

        // 1. MUST RENDER FIRST SO THE HIT PEG APPEARS UNDER THE EXPLOSION
        grid.renderState();

        // 2. TRIGGER THE EXPLOSION ON HIT OR SUNK
        if (outcome.result === ShotResult.HIT || outcome.result === ShotResult.SUNK) {
          // Calculate exact world coordinates for the center of the targeted grid cell
          const targetX = grid.x + (this.lastGridCoords.x * GAME.TILE_SIZE) + (GAME.TILE_SIZE / 2);
          const targetY = grid.y + (this.lastGridCoords.y * GAME.TILE_SIZE) + (GAME.TILE_SIZE / 2);

          // Deep Orange Explosion Core (Massive & Chunky)
          this.particles.emit(targetX, targetY, {
            count: 30,
            size: 6,
            color: 0xff6600,
            speed: [80, 200],
            life: [0.3, 0.6],
            spread: Math.PI * 2,
            direction: 0,
            fade: true
          });

          // Bright Yellow Sparks (Fast & Wide)
          this.particles.emit(targetX, targetY, {
            count: 40,
            size: 3,
            color: 0xffff00,
            speed: [150, 350],
            life: [0.2, 0.4],
            spread: Math.PI * 2,
            direction: 0,
            fade: true
          });

          // Add screen shake for impact weight
          this.ctx.camera.shake(5, 5, 0, 0.25);
        }

        const msgEl = document.getElementById('combat-message');
        if (msgEl) {
          const extraTurnText = (outcome.result === ShotResult.HIT || outcome.result === ShotResult.SUNK) ? ' - CRITICAL HIT!' : '';
          msgEl.innerText = outcome.result + extraTurnText;
          msgEl.style.display = 'block';
          msgEl.style.color = (outcome.result === ShotResult.HIT || outcome.result === ShotResult.SUNK) ? '#ff0055' : '#00ffff';
          msgEl.style.textShadow = `0 0 20px ${(outcome.result === ShotResult.HIT || outcome.result === ShotResult.SUNK) ? '#ff0055' : '#00ffff'}`;
          setTimeout(() => { msgEl.style.display = 'none'; }, 1000);
        }

        if (this.logic.winner !== null) {
          this.updatePhaseVisuals();
        } else if (outcome.result === ShotResult.MISS) {
          setTimeout(() => { this.isPassingDevice = true; this.updatePhaseVisuals(); }, 1000);
        } else {
          this.timeLeft = GAME.TURN_TIME_LIMIT;
          this.updateHover();
        }
      }
    }
  }

  private advancePlacementState() {
    this.currentShipIndex++;
    this.getExpectedGrid()?.renderState();

    if (this.currentShipIndex >= GAME.SHIP_INVENTORY.length) {
      this.currentShipIndex = 0;
      this.logic.finishPlacementPhase();
      this.saveGameState();
      this.isPassingDevice = true;
      this.updatePhaseVisuals();
    } else {
      this.timeLeft = GAME.TURN_TIME_LIMIT;
      this.updateHover();
    }
  }
}
