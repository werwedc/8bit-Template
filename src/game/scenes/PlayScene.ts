import { Graphics } from 'pixi.js';
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

  // Track pointer state for ghost ship drawing
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

    const gridWidth = GAME.BOARD_WIDTH * GAME.TILE_SIZE;
    const centerX = Math.floor((W - gridWidth) / 2);
    const centerY = Math.floor((H - GAME.BOARD_HEIGHT * GAME.TILE_SIZE) / 2);

    this.p1Grid.position.set(centerX, centerY);
    this.p2Grid.position.set(centerX, centerY);

    // Bind PixiJS native pointer events
    this.bindGridEvents(this.p1Grid, this.logic.p1Board);
    this.bindGridEvents(this.p2Grid, this.logic.p2Board);

    this.container.addChild(this.p1Grid);
    this.container.addChild(this.p2Grid);

    // Disable browser context menu on right click to allow for easy rotation
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
    grid.eventMode = 'static'; // Make interactive in PixiJS

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
      if (e.button === 0) { // Left click
        this.handleInteraction(grid, board);
      } else if (e.button === 2) { // Right click
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
      this.p1Grid.visible = false;
      this.p2Grid.visible = false;
      this.ctx.ui.show('pass-device');

      const nextPlayer = (this.logic.phase === TurnPhase.P2_PLACEMENT || this.logic.phase === TurnPhase.P2_TURN) ? "Player 2" : "Player 1";
      this.ctx.ui.setText('#pass-device-text', `${nextPlayer}'s Turn`);
      return;
    }

    switch (this.logic.phase) {
      case TurnPhase.P1_PLACEMENT:
        this.p1Grid.visible = true;
        this.p2Grid.visible = false;
        this.ctx.ui.show('placement-hud');
        this.ctx.ui.setText('#placement-text', 'Player 1: Place your ships');
        break;

      case TurnPhase.P2_PLACEMENT:
        this.p1Grid.visible = false;
        this.p2Grid.visible = true;
        this.ctx.ui.show('placement-hud');
        this.ctx.ui.setText('#placement-text', 'Player 2: Place your ships');
        break;

      case TurnPhase.P1_TURN:
        this.p2Grid['showHiddenShips'] = false;
        this.p2Grid.renderState();
        this.p1Grid.visible = false;
        this.p2Grid.visible = true;
        this.ctx.ui.show('combat-hud');
        this.ctx.ui.setText('#turn-indicator', 'Player 1');
        break;

      case TurnPhase.P2_TURN:
        this.p1Grid['showHiddenShips'] = false;
        this.p1Grid.renderState();
        this.p1Grid.visible = true;
        this.p2Grid.visible = false;
        this.ctx.ui.show('combat-hud');
        this.ctx.ui.setText('#turn-indicator', 'Player 2');
        break;

      case TurnPhase.GAME_OVER:
        this.p1Grid.visible = true;
        this.p1Grid.position.x = 20;
        this.p1Grid['showHiddenShips'] = true;
        this.p1Grid.renderState();

        this.p2Grid.visible = true;
        this.p2Grid.position.x = RESOLUTION.w - GAME.BOARD_WIDTH * GAME.TILE_SIZE - 20;
        this.p2Grid['showHiddenShips'] = true;
        this.p2Grid.renderState();

        this.ctx.ui.show('game-over');
        this.ctx.ui.setText('#gameover-text', `PLAYER ${this.logic.winner} WINS!`);
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

    // Spacebar to rotate
    if (!this.isPassingDevice && this.ctx.input.isPressed('Space')) {
      this.rotateShip();
    }
  }

  private updateHover() {
    this.p1Grid.clearHover();
    this.p2Grid.clearHover();

    if (!this.lastActiveGrid || !this.lastGridCoords || this.isPassingDevice || this.logic.phase === TurnPhase.GAME_OVER) return;

    const phase = this.logic.phase;
    const expectedGrid = (phase === TurnPhase.P1_PLACEMENT || phase === TurnPhase.P2_TURN) ? this.p1Grid : this.p2Grid;

    // Only draw hover on the board you are currently supposed to be interacting with
    if (this.lastActiveGrid !== expectedGrid) return;

    const board = (phase === TurnPhase.P1_PLACEMENT || phase === TurnPhase.P2_TURN) ? this.logic.p1Board : this.logic.p2Board;

    if (phase === TurnPhase.P1_PLACEMENT || phase === TurnPhase.P2_PLACEMENT) {
      const shipLength = GAME.SHIP_INVENTORY[this.currentShipIndex];
      if (shipLength === undefined) return; // Strict TS check

      const tempShip = new Ship('temp', shipLength);
      const isValid = board.canPlaceShip(tempShip, this.lastGridCoords.x, this.lastGridCoords.y, this.currentOrientation);
      this.lastActiveGrid.drawGhostShip(this.lastGridCoords.x, this.lastGridCoords.y, shipLength, this.currentOrientation, isValid);
    } else {
      this.lastActiveGrid.drawHoverTarget(this.lastGridCoords.x, this.lastGridCoords.y);
    }
  }

  private handleInteraction(grid: GridRenderer, board: BoardState) {
    if (!this.lastGridCoords || this.isPassingDevice || this.logic.phase === TurnPhase.GAME_OVER) return;

    const phase = this.logic.phase;
    const expectedGrid = (phase === TurnPhase.P1_PLACEMENT || phase === TurnPhase.P2_TURN) ? this.p1Grid : this.p2Grid;
    if (grid !== expectedGrid) return;

    if (phase === TurnPhase.P1_PLACEMENT || phase === TurnPhase.P2_PLACEMENT) {
      const shipLength = GAME.SHIP_INVENTORY[this.currentShipIndex];
      if (shipLength === undefined) return; // Strict TS check

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
          this.updateHover(); // Update ghost cursor immediately for the next ship
        }
      }
    } else {
      // Combat Phase
      // Replace the combat phase block in handleInteraction with this:
      const outcome = this.logic.fireShot(this.lastGridCoords.x, this.lastGridCoords.y);

      if (outcome.result !== ShotResult.INVALID) {
        grid.renderState();

        const msgEl = document.getElementById('combat-message');
        if (msgEl) {
          // If they hit and get another turn, tell them!
          const extraTurnText = (outcome.result === ShotResult.HIT || outcome.result === ShotResult.SUNK) ? ' - GO AGAIN!' : '';
          msgEl.innerText = outcome.result + extraTurnText;
          msgEl.style.display = 'block';
          msgEl.style.color = (outcome.result === ShotResult.HIT || outcome.result === ShotResult.SUNK) ? '#ff4d4d' : '#ffffff';
          setTimeout(() => { msgEl.style.display = 'none'; }, 1000);
        }

        if (this.logic.winner !== null) {
          this.updatePhaseVisuals();
        } else if (outcome.result === ShotResult.MISS) {
          // They missed, pass the device after a short delay
          setTimeout(() => {
            this.isPassingDevice = true;
            this.updatePhaseVisuals();
          }, 1000);
        } else {
          // They hit! They get to go again. Just clear the hover and wait for next click.
          this.updateHover();
        }
      }

    }
  }
}
