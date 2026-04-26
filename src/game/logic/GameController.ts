import { TurnPhase, ShotResult } from './types';
import { BoardState } from './BoardState';
import type { Ship } from './Ship';

export class GameController {
    public phase: TurnPhase;
    public p1Board: BoardState;
    public p2Board: BoardState;

    // Track which player won (1 or 2)
    public winner: number | null = null;

    constructor(boardWidth: number = 10, boardHeight: number = 10) {
        this.p1Board = new BoardState(boardWidth, boardHeight);
        this.p2Board = new BoardState(boardWidth, boardHeight);
        this.phase = TurnPhase.P1_PLACEMENT;
    }

    // Helper to get the active board being attacked during a turn
    public getDefendingBoard(): BoardState {
        return this.phase === TurnPhase.P1_TURN ? this.p2Board : this.p1Board;
    }

    public finishPlacementPhase() {
        if (this.phase === TurnPhase.P1_PLACEMENT) {
            this.phase = TurnPhase.P2_PLACEMENT;
        } else if (this.phase === TurnPhase.P2_PLACEMENT) {
            this.phase = TurnPhase.P1_TURN;
        }
    }

    // Replace your fireShot method in GameController.ts with this:
    public fireShot(x: number, y: number): { result: ShotResult, shipSunk?: Ship } {
        if (this.phase !== TurnPhase.P1_TURN && this.phase !== TurnPhase.P2_TURN) {
            return { result: ShotResult.INVALID };
        }

        const targetBoard = this.getDefendingBoard();
        const outcome = targetBoard.receiveShot(x, y);

        if (outcome.result !== ShotResult.INVALID) {
            if (targetBoard.allShipsSunk()) {
                this.winner = this.phase === TurnPhase.P1_TURN ? 1 : 2;
                this.phase = TurnPhase.GAME_OVER;
            } else if (outcome.result === ShotResult.MISS) {
                // ONLY switch turns on a MISS
                this.phase = this.phase === TurnPhase.P1_TURN ? TurnPhase.P2_TURN : TurnPhase.P1_TURN;
            }
            // If it's a HIT or SUNK, the phase stays the same (player gets another turn)
        }

        return outcome;
    }

}
