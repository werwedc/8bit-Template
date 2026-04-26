import { CellState } from './types';
import type { BoardState } from './BoardState';

export class ComputerAI {
    /** Returns the optimal {x, y} coordinates to strike on the given board */
    static getNextMove(board: BoardState): { x: number, y: number } {
        const sunkCoords = new Set<string>();
        const huntTargets: { x: number, y: number }[] = [];

        // Helper to safely add targets if they are on the board and strictly unguessed
        const addIfValid = (nx: number, ny: number) => {
            if (nx >= 0 && nx < board.width && ny >= 0 && ny < board.height) {
                if (board.grid[ny]![nx] === CellState.WATER && !sunkCoords.has(`${nx},${ny}`)) {
                    huntTargets.push({ x: nx, y: ny });
                }
            }
        };

        // 1. Identify sunken cells to avoid, and gather active hits for hunting
        for (const ps of board.placedShips) {
            const coords = ps.ship.getAbsoluteCoords(ps.x, ps.y, ps.orientation);

            if (ps.ship.isSunk) {
                // If sunk, add all its coordinates AND their 8 neighbors to the "avoid" set
                coords.forEach(c => {
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            sunkCoords.add(`${c.x + dx},${c.y + dy}`);
                        }
                    }
                });
            } else {
                // Ship is NOT sunk. Gather any hits it has taken.
                const activeHits: { x: number, y: number }[] = [];
                coords.forEach((c, i) => {
                    if (ps.ship.hits[i]) activeHits.push(c);
                });

                // SMART HUNTING LOGIC
                if (activeHits.length > 0) {
                    if (activeHits.length === 1) {
                        // Only 1 hit. We don't know orientation yet, check all 4 sides.
                        const hit = activeHits[0]!;
                        addIfValid(hit.x, hit.y - 1); // Up
                        addIfValid(hit.x, hit.y + 1); // Down
                        addIfValid(hit.x - 1, hit.y); // Left
                        addIfValid(hit.x + 1, hit.y); // Right
                    } else {
                        // Multiple hits! Determine the axis.
                        const isHorizontal = activeHits[0]!.y === activeHits[1]!.y;

                        if (isHorizontal) {
                            // Sort left to right
                            activeHits.sort((a, b) => a.x - b.x);
                            const leftEdge = activeHits[0]!;
                            const rightEdge = activeHits[activeHits.length - 1]!;

                            // Only target the immediate left and right ends
                            addIfValid(leftEdge.x - 1, leftEdge.y);
                            addIfValid(rightEdge.x + 1, rightEdge.y);
                        } else {
                            // Sort top to bottom
                            activeHits.sort((a, b) => a.y - b.y);
                            const topEdge = activeHits[0]!;
                            const bottomEdge = activeHits[activeHits.length - 1]!;

                            // Only target the immediate top and bottom ends
                            addIfValid(topEdge.x, topEdge.y - 1);
                            addIfValid(bottomEdge.x, bottomEdge.y + 1);
                        }
                    }
                }
            }
        }

        // 2. If we found any valid hunt targets, pick one randomly and strike!
        if (huntTargets.length > 0) {
            return huntTargets[Math.floor(Math.random() * huntTargets.length)]!;
        }

        // 3. SEARCH MODE: Pick a random valid tile that doesn't border a sunken ship
        const validRandom: { x: number, y: number }[] = [];
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y]![x] === CellState.WATER && !sunkCoords.has(`${x},${y}`)) {
                    validRandom.push({ x, y });
                }
            }
        }

        if (validRandom.length > 0) {
            return validRandom[Math.floor(Math.random() * validRandom.length)]!;
        }

        // 4. FAILSAFE: If the board is extremely full, just find any remaining water
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y]![x] === CellState.WATER) return { x, y };
            }
        }

        return { x: 0, y: 0 };
    }
}
