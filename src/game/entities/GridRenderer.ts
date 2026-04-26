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

        // Pass A: Draw Misses (Crosses) and Inactive (Dots) from Grid Data
        for (let y = 0; y < this.boardState.height; y++) {
            const row = this.boardState.grid[y];
            if (!row) continue;

            for (let x = 0; x < this.boardState.width; x++) {
                const cell = row[x];
                const cx = x * TS + TS / 2;
                const cy = y * TS + TS / 2;

                if (cell === CellState.MISS) {
                    // ── NEW: Crisp Cross for a Miss ──
                    const crossSize = TS * 0.25;
                    this.hitMissLayer.moveTo(cx - crossSize, cy - crossSize)
                        .lineTo(cx + crossSize, cy + crossSize)
                        .moveTo(cx + crossSize, cy - crossSize)
                        .lineTo(cx - crossSize, cy + crossSize)
                        .stroke({ color: PALETTE.miss, width: 4, cap: 'round' });
                } else if (cell === CellState.INACTIVE) {
                    // Small, crisp white dot to represent cleared water
                    const dotSize = 6;
                    this.hitMissLayer.rect(cx - dotSize / 2, cy - dotSize / 2, dotSize, dotSize)
                        .fill({ color: 0xffffff, alpha: 0.6 });
                }
                // Note: We skip CellState.HIT here, because we handle it in Pass B!
            }
        }

        // Pass B: Draw Joined Hits and Sunk States from Ship Data
        for (const ps of this.boardState.placedShips) {
            const ship = ps.ship;
            const coords = ship.getAbsoluteCoords(ps.x, ps.y, ps.orientation);

            // Math for 60% Area: sqrt(0.60) is approx 0.77 length.
            const hitSize = TS * 0.77;
            const margin = (TS - hitSize) / 2;

            if (ship.isSunk) {
                // ── NEW: Solid Red Rectangle spanning the entire sunk ship ──
                const w = ps.orientation === Orientation.HORIZONTAL ? (TS * ship.shape.length) - (margin * 2) : hitSize;
                const h = ps.orientation === Orientation.VERTICAL ? (TS * ship.shape.length) - (margin * 2) : hitSize;
                const startX = ps.x * TS + margin;
                const startY = ps.y * TS + margin;

                this.hitMissLayer.rect(startX, startY, w, h).fill({ color: 0xff1133 }); // Bright Red
            } else {
                // ── NEW: Yellow Squares, joined together if adjacent ──
                let currentStreak = 0;
                let streakStart = -1;

                // Loop one extra time (<= length) to trigger drawing the final streak
                for (let i = 0; i <= ship.hits.length; i++) {
                    if (i < ship.hits.length && ship.hits[i]) {
                        if (currentStreak === 0) streakStart = i; // Mark where hit streak begins
                        currentStreak++;
                    } else {
                        // The hit streak broke! Draw the rectangle for the streak we just calculated
                        if (currentStreak > 0) {
                            const startPt = coords[streakStart]!;

                            // Width/Height extends based on the length of the streak
                            const rectW = ps.orientation === Orientation.HORIZONTAL
                                ? (TS * currentStreak) - (margin * 2)
                                : hitSize;
                            const rectH = ps.orientation === Orientation.VERTICAL
                                ? (TS * currentStreak) - (margin * 2)
                                : hitSize;

                            const startX = startPt.x * TS + margin;
                            const startY = startPt.y * TS + margin;

                            this.hitMissLayer.rect(startX, startY, rectW, rectH).fill({ color: 0xffcc00 }); // Yellow

                            currentStreak = 0; // Reset streak
                        }
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