import { GameController } from './GameController';
import { Ship } from './Ship';
import type { BoardState } from './BoardState';

export interface SaveData {
    logic: GameController;
    isVsCpu: boolean;
}

export function serializeGame(logic: GameController, isVsCpu: boolean): string {
    return JSON.stringify({ logic, isVsCpu });
}

export function deserializeGame(data: string): SaveData | null {
    try {
        const parsed = JSON.parse(data);
        const logic = new GameController(parsed.logic.p1Board.width, parsed.logic.p1Board.height);
        logic.phase = parsed.logic.phase;
        logic.winner = parsed.logic.winner;

        const hydrateBoard = (target: BoardState, source: any) => {
            target.grid = source.grid;
            target.placedShips = source.placedShips.map((ps: any) => {
                const ship = new Ship(ps.ship.id, ps.ship.type || ps.ship.shape.length.toString());
                ship.hits = ps.ship.hits;
                return { ship, x: ps.x, y: ps.y, orientation: ps.orientation };
            });
        };

        hydrateBoard(logic.p1Board, parsed.logic.p1Board);
        hydrateBoard(logic.p2Board, parsed.logic.p2Board);
        return { logic, isVsCpu: parsed.isVsCpu };
    } catch (e) {
        console.error("Failed to load save data", e);
        return null;
    }
}
