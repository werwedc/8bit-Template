import { CellState, Orientation, ShotResult } from './types';
import type { Ship } from './Ship';

export interface PlacedShip {
    ship: Ship;
    x: number;
    y: number;
    orientation: Orientation;
}

export class BoardState {
    public width: number;
    public height: number;
    public grid: CellState[][];
    public placedShips: PlacedShip[] = [];

    constructor(width: number = 10, height: number = 10) {
        this.width = width;
        this.height = height;
        this.grid = Array.from({ length: height }, () =>
            Array(width).fill(CellState.WATER)
        );
    }

    public canPlaceShip(ship: Ship, startX: number, startY: number, orientation: Orientation): boolean {
        const coords = ship.getAbsoluteCoords(startX, startY, orientation);

        for (const point of coords) {
            // 1. Check bounds
            if (point.x < 0 || point.x >= this.width || point.y < 0 || point.y >= this.height) {
                return false;
            }

            // 2. Check overlap AND adjacency (no touching even with corners)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const checkX = point.x + dx;
                    const checkY = point.y + dy;
                    if (this.hasShipAt(checkX, checkY)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    public placeShip(ship: Ship, x: number, y: number, orientation: Orientation): boolean {
        if (!this.canPlaceShip(ship, x, y, orientation)) return false;

        this.placedShips.push({ ship, x, y, orientation });
        return true;
    }

    public hasShipAt(x: number, y: number): boolean {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;

        return this.placedShips.some(ps => {
            const coords = ps.ship.getAbsoluteCoords(ps.x, ps.y, ps.orientation);
            return coords.some(pt => pt.x === x && pt.y === y);
        });
    }

    public receiveShot(x: number, y: number): { result: ShotResult, shipSunk?: Ship } {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return { result: ShotResult.INVALID };

        const row = this.grid[y];
        if (!row) return { result: ShotResult.INVALID }; // Safe array access

        // Already guessed check
        if (row[x] !== CellState.WATER) return { result: ShotResult.INVALID };

        // Check if we hit a ship
        for (const ps of this.placedShips) {
            const coords = ps.ship.getAbsoluteCoords(ps.x, ps.y, ps.orientation);
            const hitIndex = coords.findIndex(pt => pt.x === x && pt.y === y);

            if (hitIndex !== -1) {
                row[x] = CellState.HIT;
                ps.ship.takeHit(ps.x, ps.y, ps.orientation, x, y);

                if (ps.ship.isSunk) {
                    return { result: ShotResult.SUNK, shipSunk: ps.ship };
                }
                return { result: ShotResult.HIT };
            }
        }

        // Missed
        row[x] = CellState.MISS;
        return { result: ShotResult.MISS };
    }

    public allShipsSunk(): boolean {
        if (this.placedShips.length === 0) return false;
        return this.placedShips.every(ps => ps.ship.isSunk);
    }
}
