import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GAME, PALETTE } from '../config';
import { CellState, Orientation } from '../logic/types';
import type { BoardState } from '../logic/BoardState';
import { ShipVisual } from './ShipVisual';
import { Ship } from '../logic/Ship';

export class GridRenderer extends Container {
    private boardState: BoardState;
    private showHiddenShips: boolean;

    private staticLayer: Container;
    private shipLayer: Container;
    private hitMissLayer: Graphics;
    private hoverLayer: Graphics;

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
            g.moveTo(x * TS, 0).lineTo(x * TS, H).stroke({ color: PALETTE.grid, width: 2 });
        }
        for (let y = 0; y <= this.boardState.height; y++) {
            g.moveTo(0, y * TS).lineTo(W, y * TS).stroke({ color: PALETTE.grid, width: 2 });
        }
        this.staticLayer.addChild(g);

        const labelStyle = new TextStyle({
            fontFamily: "'Overpass Mono', monospace",
            fontSize: 22,
            fill: 0x00aacc,
            fontWeight: 'normal',
            letterSpacing: 2
        });

        for (let x = 0; x < this.boardState.width; x++) {
            const letter = String.fromCharCode(65 + x);
            const text = new Text({ text: letter, style: labelStyle });
            text.anchor.set(0.5, 1);
            text.position.set(x * TS + TS / 2, -12);
            this.staticLayer.addChild(text);
        }

        for (let y = 0; y < this.boardState.height; y++) {
            const text = new Text({ text: (y + 1).toString(), style: labelStyle });
            text.anchor.set(1, 0.5);
            text.position.set(-12, y * TS + TS / 2);
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
            if (!this.shipVisuals.has(ps.ship.id)) {
                const visual = new ShipVisual(ps.ship, ps.x, ps.y, ps.orientation);
                this.shipLayer.addChild(visual);
                this.shipVisuals.set(ps.ship.id, visual);
            }

            const visual = this.shipVisuals.get(ps.ship.id)!;
            visual.updateState();
            visual.visible = this.showHiddenShips || ps.ship.isSunk;
        }

        // 2. Draw Hits, Misses, Sunk, and Inactive Cells
        this.hitMissLayer.clear();

        // --- NEW: Calculate Impossible Zones for the White Dots ---
        const impossibleCoords = new Set<string>();
        for (const ps of this.boardState.placedShips) {
            const coords = ps.ship.getAbsoluteCoords(ps.x, ps.y, ps.orientation);

            if (ps.ship.isSunk) {
                // If sunk, all 8 surrounding cells are impossible
                coords.forEach(c => {
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            impossibleCoords.add(`${c.x + dx},${c.y + dy}`);
                        }
                    }
                });
            } else {
                // If just damaged, only the 4 DIAGONAL cells are strictly impossible
                coords.forEach((c, i) => {
                    if (ps.ship.hits[i]) {
                        impossibleCoords.add(`${c.x - 1},${c.y - 1}`);
                        impossibleCoords.add(`${c.x + 1},${c.y - 1}`);
                        impossibleCoords.add(`${c.x - 1},${c.y + 1}`);
                        impossibleCoords.add(`${c.x + 1},${c.y + 1}`);
                    }
                });
            }
        }

        // Pass A: Draw Misses (Crosses) and Inactive Zones (White Dots)
        for (let y = 0; y < this.boardState.height; y++) {
            const row = this.boardState.grid[y];
            if (!row) continue;

            for (let x = 0; x < this.boardState.width; x++) {
                const cell = row[x];
                const cx = x * TS + TS / 2;
                const cy = y * TS + TS / 2;

                if (cell === CellState.MISS) {
                    const crossSize = TS * 0.25;
                    this.hitMissLayer.moveTo(cx - crossSize, cy - crossSize)
                        .lineTo(cx + crossSize, cy + crossSize)
                        .moveTo(cx + crossSize, cy - crossSize)
                        .lineTo(cx - crossSize, cy + crossSize)
                        .stroke({ color: PALETTE.miss, width: 4, cap: 'round' });
                }
                // Draw a dot if this cell is known to be empty, hasn't been guessed yet, and doesn't contain a sunk ship part
                else if (cell === CellState.WATER && impossibleCoords.has(`${x},${y}`)) {
                    const dotSize = 6;
                    this.hitMissLayer.rect(cx - dotSize / 2, cy - dotSize / 2, dotSize, dotSize)
                        .fill({ color: 0xffffff, alpha: 0.6 });
                }
            }
        }

        // Pass B: Draw Hits on Ships (with bridging for Tetris shapes)
        for (const ps of this.boardState.placedShips) {
            const ship = ps.ship;
            const coords = ship.getAbsoluteCoords(ps.x, ps.y, ps.orientation);

            const hitSize = TS * 0.77;
            const margin = (TS - hitSize) / 2;

            for (let i = 0; i < coords.length; i++) {
                if (ship.hits[i]) {
                    const pt = coords[i]!;
                    const color = ship.isSunk ? 0xff1133 : 0xffcc00;

                    this.hitMissLayer.rect(pt.x * TS + margin, pt.y * TS + margin, hitSize, hitSize).fill({ color });

                    const rightIdx = coords.findIndex(c => c.x === pt.x + 1 && c.y === pt.y);
                    if (rightIdx !== -1 && ship.hits[rightIdx]) {
                        this.hitMissLayer.rect(pt.x * TS + TS - margin, pt.y * TS + margin, margin * 2, hitSize).fill({ color });
                    }

                    const bottomIdx = coords.findIndex(c => c.x === pt.x && c.y === pt.y + 1);
                    if (bottomIdx !== -1 && ship.hits[bottomIdx]) {
                        this.hitMissLayer.rect(pt.x * TS + margin, pt.y * TS + TS - margin, hitSize, margin * 2).fill({ color });
                    }
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

    public drawGhostShip(x: number, y: number, shipType: string, orientation: Orientation, isValid: boolean) {
        this.clearHover();
        const TS = GAME.TILE_SIZE;

        // Use the logic class to perfectly calculate the rotated coordinates!
        const tempShip = new Ship('ghost', shipType);
        const coords = tempShip.getAbsoluteCoords(x, y, orientation);

        for (const pt of coords) {
            // Only draw if it's within board bounds
            if (pt.x >= 0 && pt.x < this.boardState.width && pt.y >= 0 && pt.y < this.boardState.height) {
                this.hoverLayer.rect(pt.x * TS, pt.y * TS, TS, TS)
                    .fill({ color: isValid ? PALETTE.valid : PALETTE.invalid, alpha: 0.6 });
            }
        }
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
