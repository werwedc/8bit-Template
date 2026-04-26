import { Orientation, type Point } from './types';

export class Ship {
    public id: string;
    public shape: Point[]; // Relative coordinates, e.g., [{x:0, y:0}, {x:1, y:0}]
    public hits: boolean[];

    constructor(id: string, length: number) {
        this.id = id;
        this.shape = [];
        this.hits = [];

        // For now, we generate a straight line. 
        for (let i = 0; i < length; i++) {
            this.shape.push({ x: i, y: 0 });
            this.hits.push(false);
        }
    }

    public get isSunk(): boolean {
        return this.hits.every(hit => hit);
    }

    // Returns the absolute coordinates of this ship given a starting position and orientation
    public getAbsoluteCoords(startX: number, startY: number, orientation: Orientation): Point[] {
        return this.shape.map(pt => {
            if (orientation === Orientation.HORIZONTAL) {
                return { x: startX + pt.x, y: startY + pt.y };
            } else {
                // Swap x and y for vertical rotation
                return { x: startX + pt.y, y: startY + pt.x };
            }
        });
    }

    // Marks a hit at a specific absolute coordinate. Returns true if it was a new hit.
    public takeHit(startX: number, startY: number, orientation: Orientation, targetX: number, targetY: number): boolean {
        const coords = this.getAbsoluteCoords(startX, startY, orientation);
        for (let i = 0; i < coords.length; i++) {
            const pt = coords[i];
            if (!pt) continue; // Satisfies 'Object is possibly undefined' strict check

            if (pt.x === targetX && pt.y === targetY) {
                // Safe because this.hits was initialized to match the shape array length
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
