import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GAME, PALETTE } from '../config';
import { CellState, Orientation } from '../logic/types';
import type { BoardState } from '../logic/BoardState';
import { ShipVisual } from './ShipVisual';

export class GridRenderer extends Container {
    private boardState: BoardState;
    private showHiddenShips: boolean;

    private staticLayer: Container;
    private shipLayer: Container;
    private hitMissLayer: Graphics;
    private hoverLayer: Graphics;

    // Track visuals so we don't recreate them every frame
    private shipVisuals: Map<string, ShipVisual> = new Map();

    constructor(boardState: BoardState, showHiddenShips: boolean) {
        super();
        this.boardState = boardState;
        this.showHiddenShips = showHiddenShips;

        this.staticLayer = new Container();
        this.shipLayer = new Container();
        this.hitMissLayer = new Graphics();
        this.hoverLayer = new Graphics();

        this.addChild(this.staticLayer);
        this.addChild(this.shipLayer);
        this.addChild(this.hitMissLayer);
        this.addChild(this.hoverLayer);

        this.drawStaticGrid();
        this.renderState();
    }

    private drawStaticGrid() {
        const g = new Graphics();
        const TS = GAME.TILE_SIZE;
        const W = this.boardState.width * TS;
        const H = this.boardState.height * TS;

        g.rect(0, 0, W, H).fill({ color: PALETTE.water });

        for (let x = 0; x <= this.boardState.width; x++) {
            g.moveTo(x * TS, 0).lineTo(x * TS, H).stroke({ color: PALETTE.grid, width: 1 });
        }
        for (let y = 0; y <= this.boardState.height; y++) {
            g.moveTo(0, y * TS).lineTo(W, y * TS).stroke({ color: PALETTE.grid, width: 1 });
        }
        this.staticLayer.addChild(g);
        // Replace the labels section in drawStaticGrid() with this:

        // High-res text rendering trick: 
        // Render at size 32, scale down by 0.25 to get a crisp size 8.
        const baseFontSize = 32;
        const targetFontSize = 8;
        const scaleFactor = targetFontSize / baseFontSize;

        const labelStyle = new TextStyle({
            fontFamily: "'Overpass Mono', monospace", // <-- Change this line
            fontSize: baseFontSize,
            fill: PALETTE.fg,
            fontWeight: 'bold'
        });

        for (let x = 0; x < this.boardState.width; x++) {
            const letter = String.fromCharCode(65 + x);
            const text = new Text({ text: letter, style: labelStyle });
            text.scale.set(scaleFactor); // Scale it down for crispness
            text.anchor.set(0.5, 1);
            text.position.set(x * TS + TS / 2, -2);
            this.staticLayer.addChild(text);
        }

        for (let y = 0; y < this.boardState.height; y++) {
            const text = new Text({ text: (y + 1).toString(), style: labelStyle });
            text.scale.set(scaleFactor); // Scale it down for crispness
            text.anchor.set(1, 0.5);
            text.position.set(-2, y * TS + TS / 2);
            this.staticLayer.addChild(text);
        }

    }

    public setShowHiddenShips(show: boolean) {
        this.showHiddenShips = show;
        this.renderState();
    }

    public renderState() {
        const TS = GAME.TILE_SIZE;

        // 1. Sync Ships
        for (const ps of this.boardState.placedShips) {
            // Create visual if it doesn't exist
            if (!this.shipVisuals.has(ps.ship.id)) {
                const visual = new ShipVisual(ps.ship, ps.x, ps.y, ps.orientation);
                this.shipLayer.addChild(visual);
                this.shipVisuals.set(ps.ship.id, visual);
            }

            const visual = this.shipVisuals.get(ps.ship.id)!;
            visual.updateState(); // Triggers sinking animation if destroyed

            // Hide if it's the enemy board and the ship isn't sunk yet
            visual.visible = this.showHiddenShips || ps.ship.isSunk;
        }

        // 2. Draw Hits and Misses (Pegs)
        this.hitMissLayer.clear();
        for (let y = 0; y < this.boardState.height; y++) {
            const row = this.boardState.grid[y];
            if (!row) continue;

            for (let x = 0; x < this.boardState.width; x++) {
                const cell = row[x];
                const cx = x * TS + TS / 2;
                const cy = y * TS + TS / 2;
                const radius = TS * 0.3;

                if (cell === CellState.MISS) {
                    this.hitMissLayer.circle(cx, cy, radius).fill({ color: PALETTE.miss });
                } else if (cell === CellState.HIT) {
                    this.hitMissLayer.circle(cx, cy, radius).fill({ color: PALETTE.hit });
                }
            }
        }
    }

    public clearHover() {
        this.hoverLayer.clear();
    }

    public drawHoverTarget(x: number, y: number) {
        this.clearHover();
        if (x < 0 || x >= this.boardState.width || y < 0 || y >= this.boardState.height) return;

        const TS = GAME.TILE_SIZE;
        this.hoverLayer.rect(x * TS, y * TS, TS, TS).fill({ color: PALETTE.fg, alpha: 0.3 });
    }

    public drawGhostShip(x: number, y: number, length: number, orientation: Orientation, isValid: boolean) {
        this.clearHover();
        const TS = GAME.TILE_SIZE;

        const width = (orientation === Orientation.HORIZONTAL ? length : 1) * TS;
        const height = (orientation === Orientation.VERTICAL ? length : 1) * TS;

        this.hoverLayer.rect(x * TS, y * TS, width, height)
            .fill({ color: isValid ? PALETTE.valid : PALETTE.invalid, alpha: 0.6 });
    }

    public getGridCoords(localX: number, localY: number): { x: number, y: number } | null {
        const TS = GAME.TILE_SIZE;
        const x = Math.floor(localX / TS);
        const y = Math.floor(localY / TS);

        if (x < 0 || x >= this.boardState.width || y < 0 || y >= this.boardState.height) {
            return null;
        }
        return { x, y };
    }
}
