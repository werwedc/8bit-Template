import { GameController } from './GameController';
import { Ship } from './Ship';
import type { BoardState } from './BoardState';

export function serializeGame(logic: GameController): string {
    return JSON.stringify(logic);
}

export function deserializeGame(data: string): GameController | null {
    try {
        const parsed = JSON.parse(data);
        const logic = new GameController(parsed.p1Board.width, parsed.p1Board.height);
        logic.phase = parsed.phase;
        logic.winner = parsed.winner;

        const hydrateBoard = (target: BoardState, source: any) => {
            target.grid = source.grid;
            target.placedShips = source.placedShips.map((ps: any) => {
                const ship = new Ship(ps.ship.id, ps.ship.shape.length);
                ship.hits = ps.ship.hits;
                return { ship, x: ps.x, y: ps.y, orientation: ps.orientation };
            });
        };

        hydrateBoard(logic.p1Board, parsed.p1Board);
        hydrateBoard(logic.p2Board, parsed.p2Board);
        return logic;
    } catch (e) {
        console.error("Failed to load save data", e);
        return null;
    }
}
