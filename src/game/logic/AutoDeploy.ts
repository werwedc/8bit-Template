import { Orientation } from './types';
import { Ship } from './Ship';
import type { BoardState } from './BoardState';

/**
 * Attempts to randomly place all remaining ships. 
 * If it gets stuck (due to strict adjacency rules), it rewinds and retries.
 */
export function autoDeployRemaining(board: BoardState, inventory: readonly number[], startIndex: number, playerId: string): boolean {
    // Backup the state before we start simulating
    const originalShips = [...board.placedShips];

    // Try up to 50 times to find a valid full-board configuration
    for (let retry = 0; retry < 50; retry++) {
        let currentAttemptSuccess = true;

        for (let i = startIndex; i < inventory.length; i++) {
            // TypeScript strict check handling
            const length = inventory[i];
            if (length === undefined) continue;

            const ship = new Ship(`ship_${playerId}_${i}`, length);
            const validPlacements = [];

            // Scan the board for every physically valid placement for this ship
            for (let x = 0; x < board.width; x++) {
                for (let y = 0; y < board.height; y++) {
                    if (board.canPlaceShip(ship, x, y, Orientation.HORIZONTAL)) {
                        validPlacements.push({ x, y, o: Orientation.HORIZONTAL });
                    }
                    if (board.canPlaceShip(ship, x, y, Orientation.VERTICAL)) {
                        validPlacements.push({ x, y, o: Orientation.VERTICAL });
                    }
                }
            }

            // If no spots are left, this layout is a dead-end
            if (validPlacements.length === 0) {
                currentAttemptSuccess = false;
                break;
            }

            // Pick a random valid spot and place it
            const choice = validPlacements[Math.floor(Math.random() * validPlacements.length)]!;
            board.placeShip(ship, choice.x, choice.y, choice.o);
        }

        if (currentAttemptSuccess) {
            return true; // We successfully placed everything!
        }

        // Dead-end reached. Rewind the board to its exact state before this function was called and retry.
        board.placedShips = [...originalShips];
    }

    return false; // Failed after 50 attempts (extremely rare)
}
