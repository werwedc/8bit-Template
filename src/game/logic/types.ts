export enum CellState {
    WATER = 0,
    MISS = 1,
    HIT = 2,
}

export enum Orientation {
    HORIZONTAL = 'HORIZONTAL',
    VERTICAL = 'VERTICAL',
}

export enum TurnPhase {
    P1_PLACEMENT = 'P1_PLACEMENT',
    P2_PLACEMENT = 'P2_PLACEMENT',
    P1_TURN = 'P1_TURN',
    P2_TURN = 'P2_TURN',
    GAME_OVER = 'GAME_OVER',
}

export enum ShotResult {
    MISS = 'MISS',
    HIT = 'HIT',
    SUNK = 'SUNK',
    INVALID = 'INVALID', // Off-board or already guessed
}

export interface Point {
    x: number;
    y: number;
}
