import { CellState } from './types';
import type { BoardState } from './BoardState';

export class ComputerAI {
    /** Returns the optimal {x, y} coordinates to strike on the given board */
    static getNextMove(board: BoardState): { x: number, y: number } {
        // Cells we know are empty (either bordering a sunk ship, or diagonal to a known hit)
        const impossibleCoords = new Set<string>();
        const huntTargets: { x: number, y: number }[] = [];

        const addIfValid = (nx: number, ny: number) => {
            if (nx >= 0 && nx < board.width && ny >= 0 && ny < board.height) {
                if (board.grid[ny]![nx] === CellState.WATER && !impossibleCoords.has(`${nx},${ny}`)) {
                    huntTargets.push({ x: nx, y: ny });
                }
            }
        };

        // 1. Identify guaranteed empty cells and gather active hits
        for (const ps of board.placedShips) {
            const coords = ps.ship.getAbsoluteCoords(ps.x, ps.y, ps.orientation);

            if (ps.ship.isSunk) {
                // SUNK: Mark all 8 neighbors as impossible (ships cannot touch at all)
                coords.forEach(c => {
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            impossibleCoords.add(`${c.x + dx},${c.y + dy}`);
                        }
                    }
                });
            } else {
                // DAMAGED: Gather hits
                const activeHits: { x: number, y: number }[] = [];
                coords.forEach((c, i) => {
                    if (ps.ship.hits[i]) activeHits.push(c);
                });

                if (activeHits.length > 0) {
                    // A hit guarantees its 4 DIAGONAL neighbors are empty water! 
                    // (Ships only span orthogonal lines, and another ship can't touch it diagonally)
                    activeHits.forEach(hit => {
                        impossibleCoords.add(`${hit.x - 1},${hit.y - 1}`); // Top-Left
                        impossibleCoords.add(`${hit.x + 1},${hit.y - 1}`); // Top-Right
                        impossibleCoords.add(`${hit.x - 1},${hit.y + 1}`); // Bottom-Left
                        impossibleCoords.add(`${hit.x + 1},${hit.y + 1}`); // Bottom-Right
                    });

                    // SMART HUNTING LOGIC
                    if (activeHits.length === 1) {
                        // 1 hit: Check orthogonal neighbors
                        const hit = activeHits[0]!;
                        addIfValid(hit.x, hit.y - 1);
                        addIfValid(hit.x, hit.y + 1);
                        addIfValid(hit.x - 1, hit.y);
                        addIfValid(hit.x + 1, hit.y);
                    } else {
                        // Multiple hits: Determine Axis and strike the ends
                        const isHorizontal = activeHits[0]!.y === activeHits[1]!.y;

                        if (isHorizontal) {
                            activeHits.sort((a, b) => a.x - b.x);
                            const leftEdge = activeHits[0]!;
                            const rightEdge = activeHits[activeHits.length - 1]!;
                            addIfValid(leftEdge.x - 1, leftEdge.y);
                            addIfValid(rightEdge.x + 1, rightEdge.y);
                        } else {
                            activeHits.sort((a, b) => a.y - b.y);
                            const topEdge = activeHits[0]!;
                            const bottomEdge = activeHits[activeHits.length - 1]!;
                            addIfValid(topEdge.x, topEdge.y - 1);
                            addIfValid(bottomEdge.x, bottomEdge.y + 1);
                        }
                    }
                }
            }
        }

        // 2. If hunting, execute!
        if (huntTargets.length > 0) {
            return huntTargets[Math.floor(Math.random() * huntTargets.length)]!;
        }

        // 3. SEARCH MODE: Pick a random valid tile
        const validRandom: { x: number, y: number }[] = [];
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y]![x] === CellState.WATER && !impossibleCoords.has(`${x},${y}`)) {
                    validRandom.push({ x, y });
                }
            }
        }

        if (validRandom.length > 0) {
            return validRandom[Math.floor(Math.random() * validRandom.length)]!;
        }

        // 4. FAILSAFE
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y]![x] === CellState.WATER) return { x, y };
            }
        }

        return { x: 0, y: 0 };
    }
}
