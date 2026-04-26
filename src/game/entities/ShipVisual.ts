import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { GAME, PALETTE } from '../config';
import { Orientation } from '../logic/types';
import type { Ship } from '../logic/Ship';

export class ShipVisual extends Container {
    public logicShip: Ship;
    private bodyGraphic: Graphics;
    private isSunk: boolean = false;
    private w: number;
    private h: number;

    constructor(ship: Ship, gridX: number, gridY: number, orientation: Orientation) {
        super();
        this.logicShip = ship;

        const TS = GAME.TILE_SIZE;
        const coords = ship.getAbsoluteCoords(gridX, gridY, orientation);

        this.w = (orientation === Orientation.HORIZONTAL ? coords.length : 1) * TS;
        this.h = (orientation === Orientation.VERTICAL ? coords.length : 1) * TS;

        // Position the container at the grid cell
        this.position.set(gridX * TS, gridY * TS);

        this.bodyGraphic = new Graphics();
        this.addChild(this.bodyGraphic);
        this.drawBody(PALETTE.ship);

        // Add a gentle idle bobbing animation using GSAP
        gsap.to(this.bodyGraphic, {
            y: 1.5,
            duration: 1.2 + Math.random() * 0.5, // Randomize slightly so ships don't sync perfectly
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
    }

    private drawBody(color: number) {
        this.bodyGraphic.clear();
        // Draw slightly smaller than the grid cells so you can see grid lines
        this.bodyGraphic.rect(1, 1, this.w - 2, this.h - 2).fill({ color, alpha: 0.9 });
    }

    public updateState() {
        // If the logic ship just sank and we haven't updated visually yet
        if (!this.isSunk && this.logicShip.isSunk) {
            this.isSunk = true;
            this.drawBody(PALETTE.hit); // Turn it red/sunk

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
