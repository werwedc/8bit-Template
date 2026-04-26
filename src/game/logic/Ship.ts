import { Orientation, type Point } from './types';

export const SHIP_SHAPES: Record<string, Point[]> = {
    '1': [{ x: 0, y: 0 }],
    '2': [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    '3': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    '4': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
    'L3': [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }],              // Corner (3 blocks)
    'T4': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }], // T-Shape (4 blocks)
};

export class Ship {
    public id: string;
    public type: string;
    public shape: Point[];
    public hits: boolean[];

    constructor(id: string, type: string | number) {
        this.id = id;
        this.type = type.toString();
        this.shape = SHIP_SHAPES[this.type] || SHIP_SHAPES['1']!;
        this.hits = new Array(this.shape.length).fill(false);
    }

    public get isSunk(): boolean {
        return this.hits.every(hit => hit);
    }

    public getAbsoluteCoords(startX: number, startY: number, orientation: Orientation): Point[] {
        // 1. Apply 90-degree matrix rotation based on the orientation
        const rotated = this.shape.map(pt => {
            switch (orientation) {
                case Orientation.UP: return { x: pt.x, y: pt.y };
                case Orientation.RIGHT: return { x: -pt.y, y: pt.x };
                case Orientation.DOWN: return { x: -pt.x, y: -pt.y };
                case Orientation.LEFT: return { x: pt.y, y: -pt.x };
                default: return { x: pt.x, y: pt.y };
            }
        });

        // 2. Find the bounding box minimums so we can shift it back to local (0,0)
        const minX = Math.min(...rotated.map(pt => pt.x));
        const minY = Math.min(...rotated.map(pt => pt.y));

        // 3. Shift the shape into positive space, then add the board placement offsets
        return rotated.map(pt => ({
            x: startX + (pt.x - minX),
            y: startY + (pt.y - minY)
        }));
    }


    public takeHit(startX: number, startY: number, orientation: Orientation, targetX: number, targetY: number): boolean {
        const coords = this.getAbsoluteCoords(startX, startY, orientation);
        for (let i = 0; i < coords.length; i++) {
            const pt = coords[i];
            if (!pt) continue;

            if (pt.x === targetX && pt.y === targetY) {
                if (!this.hits[i]) {
                    this.hits[i] = true;
                    return true;
                }
                return false;
            }
        }
        return false;
    }
}
