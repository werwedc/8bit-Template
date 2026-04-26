import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { GAME, PALETTE } from '../config';
import { Orientation } from '../logic/types';
import type { Ship } from '../logic/Ship';

export class ShipVisual extends Container {
    public logicShip: Ship;
    private bodyGraphic: Graphics;
    private isSunk: boolean = false;
    private gridX: number;
    private gridY: number;
    private orientation: Orientation;

    constructor(ship: Ship, gridX: number, gridY: number, orientation: Orientation) {
        super();
        this.logicShip = ship;
        this.gridX = gridX;
        this.gridY = gridY;
        this.orientation = orientation;

        // We do NOT position the container at gridX/gridY anymore, 
        // because the individual blocks will handle their own absolute positioning
        this.position.set(0, 0);

        this.bodyGraphic = new Graphics();
        this.addChild(this.bodyGraphic);

        this.drawBody(PALETTE.ship);

        // Subtle idle bobbing animation using GSAP
        gsap.to(this.bodyGraphic, {
            y: 1.5,
            duration: 1.2 + Math.random() * 0.5,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
    }

    private drawBody(color: number) {
        this.bodyGraphic.clear();
        const TS = GAME.TILE_SIZE;

        // The visual gap from the edge of the grid cell
        const margin = 2;
        const innerSize = TS - (margin * 2);

        const coords = this.logicShip.getAbsoluteCoords(this.gridX, this.gridY, this.orientation);

        // 1. Draw the base blocks
        for (const pt of coords) {
            this.bodyGraphic.rect(pt.x * TS + margin, pt.y * TS + margin, innerSize, innerSize).fill({ color, alpha: 0.9 });
        }

        // 2. Draw "Bridges" to fuse adjacent blocks together seamlessly
        for (const pt of coords) {
            // Check if there is a block immediately to the Right
            if (coords.some(c => c.x === pt.x + 1 && c.y === pt.y)) {
                this.bodyGraphic.rect(pt.x * TS + TS - margin, pt.y * TS + margin, margin * 2, innerSize).fill({ color, alpha: 0.9 });
            }
            // Check if there is a block immediately Below
            if (coords.some(c => c.x === pt.x && c.y === pt.y + 1)) {
                this.bodyGraphic.rect(pt.x * TS + margin, pt.y * TS + TS - margin, innerSize, margin * 2).fill({ color, alpha: 0.9 });
            }
        }
    }



    public updateState() {
        // If the logic ship just sank and we haven't updated visually yet
        if (!this.isSunk && this.logicShip.isSunk) {
            this.isSunk = true;
            this.drawBody(PALETTE.hit); // Turn the entire custom shape red/sunk

            // Stop the gentle bobbing and sink it slightly
            gsap.killTweensOf(this.bodyGraphic);
            gsap.to(this.bodyGraphic, {
                y: 3,
                alpha: 0.5,
                duration: 0.5,
                ease: 'power2.in'
            });
        }
    }
}
