import { Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';
import { GAME, PALETTE, RESOLUTION } from '../config';
import { MenuScene } from './MenuScene';
import { GameController } from '../logic/GameController';
import { TurnPhase, Orientation, ShotResult } from '../logic/types';
import { Ship } from '../logic/Ship';
import { GridRenderer } from '../entities/GridRenderer';
import type { BoardState } from '../logic/BoardState';

export class PlayScene extends Scene {
  private logic!: GameController;

  private p1Grid!: GridRenderer;
  private p2Grid!: GridRenderer;

  private currentShipIndex: number = 0;
  private currentOrientation: Orientation = Orientation.HORIZONTAL;
  private isPassingDevice: boolean = false;

  private lastActiveGrid: GridRenderer | null = null;
  private lastGridCoords: { x: number; y: number } | null = null;

  constructor(private readonly ctx: AppContext) {
    super();
  }

  enter(): void {
    const W = RESOLUTION.w;
    const H = RESOLUTION.h;

    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    this.container.addChild(bg);

    this.logic = new GameController(GAME.BOARD_WIDTH, GAME.BOARD_HEIGHT);

    this.p1Grid = new GridRenderer(this.logic.p1Board, true);
    this.p2Grid = new GridRenderer(this.logic.p2Board, true);

    const gridW = GAME.BOARD_WIDTH * GAME.TILE_SIZE;
    const gridH = GAME.BOARD_HEIGHT * GAME.TILE_SIZE;
    const gap = 100;
    const totalW = gridW * 2 + gap;
    const startX = Math.floor((W - totalW) / 2);

    // 2. PUSH BOARDS DOWN SLIGHTLY
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
    // 3. MOVE LABELS HIGHER
    const p1Label = new Text({ text: 'PLAYER 1', style: labelStyle });
    p1Label.anchor.set(0.5, 1);
    p1Label.position.set(startX + gridW / 2, startY - 45); // Was -20
    const p2Label = new Text({ text: 'PLAYER 2', style: labelStyle });
    p2Label.anchor.set(0.5, 1);
    p2Label.position.set(startX + gridW + gap + gridW / 2, startY - 45); // Was -20

    this.container.addChild(p1Label);
    this.container.addChild(p2Label);
    this.container.addChild(this.p1Grid);
    this.container.addChild(this.p2Grid);

    this.bindGridEvents(this.p1Grid, this.logic.p1Board);
    this.bindGridEvents(this.p2Grid, this.logic.p2Board);

    document.addEventListener('contextmenu', this.preventContextMenu);

    this.setupUIBindings();
    this.updatePhaseVisuals();
  }

  exit(): void {
    document.removeEventListener('contextmenu', this.preventContextMenu);
    this.ctx.ui.hideAll();
    this.container.removeChildren();
  }

  private preventContextMenu = (e: Event) => {
    e.preventDefault();
  };

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
      if (e.button === 0) {
        this.handleInteraction(grid, board);
      } else if (e.button === 2) {
        this.rotateShip();
      }
    });
  }

  private setupUIBindings() {
    this.ctx.ui.hideAll();
    this.ctx.ui.onClick('#ready-btn', () => {
      this.isPassingDevice = false;
      this.updatePhaseVisuals();
    });
    this.ctx.ui.onClick('#restart-btn', () => {
      this.ctx.sceneManager.transitionTo(PlayScene, undefined, true);
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
        this.p1Grid.setShowHiddenShips(false);
        this.p2Grid.setShowHiddenShips(true);
        this.p1Grid.eventMode = 'static';
        this.p2Grid.eventMode = 'none';
        this.ctx.ui.show('combat-hud');
        this.ctx.ui.setText('#turn-indicator', 'PLAYER 2');
        break;

      case TurnPhase.GAME_OVER:
        this.p1Grid.setShowHiddenShips(true);
        this.p2Grid.setShowHiddenShips(true);
        this.p1Grid.eventMode = 'none';
        this.p2Grid.eventMode = 'none';
        this.ctx.ui.show('game-over');
        this.ctx.ui.setText('#gameover-text', `PLAYER ${this.logic.winner} VICTORIOUS`);
        break;
    }
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
        const realShip = new Ship(`ship_${board === this.logic.p1Board ? 'p1' : 'p2'}_${this.currentShipIndex}`, shipLength);
        board.placeShip(realShip, this.lastGridCoords.x, this.lastGridCoords.y, this.currentOrientation);
        grid.renderState();

        this.currentShipIndex++;

        if (this.currentShipIndex >= GAME.SHIP_INVENTORY.length) {
          this.currentShipIndex = 0;
          this.logic.finishPlacementPhase();
          this.isPassingDevice = true;
          this.updatePhaseVisuals();
        } else {
          this.updateHover();
        }
      }
    } else {
      const outcome = this.logic.fireShot(this.lastGridCoords.x, this.lastGridCoords.y);

      if (outcome.result !== ShotResult.INVALID) {
        grid.renderState();

        const msgEl = document.getElementById('combat-message');
        if (msgEl) {
          const extraTurnText = (outcome.result === ShotResult.HIT || outcome.result === ShotResult.SUNK) ? ' - CRITICAL HIT!' : '';
          msgEl.innerText = outcome.result + extraTurnText;
          msgEl.style.display = 'block';
          // Use Neon Pink for Hit/Sunk, Cyan for Miss
          msgEl.style.color = (outcome.result === ShotResult.HIT || outcome.result === ShotResult.SUNK) ? '#ff0055' : '#00ffff';
          msgEl.style.textShadow = `0 0 20px ${(outcome.result === ShotResult.HIT || outcome.result === ShotResult.SUNK) ? '#ff0055' : '#00ffff'}`;

          setTimeout(() => { msgEl.style.display = 'none'; }, 1000);
        }

        if (this.logic.winner !== null) {
          this.updatePhaseVisuals();
        } else if (outcome.result === ShotResult.MISS) {
          setTimeout(() => {
            this.isPassingDevice = true;
            this.updatePhaseVisuals();
          }, 1000);
        } else {
          this.updateHover();
        }
      }
    }
  }
}
