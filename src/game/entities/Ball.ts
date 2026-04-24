/**
 * Ball entity — discrete grid version.
 */

import { Graphics } from 'pixi.js';
import { Entity } from '../../core/entity';
import { PALETTE } from '../config';
import { randomElement } from '../../core/physics';
import { GridManager } from '../../core/grid';

export class Ball extends Entity {
  public col: number;
  public row: number;
  public dirCol: number;
  public dirRow: number;
  
  private grid: GridManager<number>;

  constructor(grid: GridManager<number>, startCol: number, startRow: number) {
    super();
    this.grid = grid;
    this.col = startCol;
    this.row = startRow;

    // Randomize initial direction
    this.dirCol = randomElement([1, -1]);
    this.dirRow = randomElement([1, -1]);

    const gfx = new Graphics();
    // Fill exactly one cell
    gfx.rect(0, 0, this.grid.cellSize, this.grid.cellSize).fill({ color: PALETTE.accent });
    this.view.addChild(gfx);
    
    this.updatePosition();
  }

  public updatePosition(): void {
    const pos = this.grid.toWorld(this.col, this.row);
    this.view.position.set(pos.x, pos.y);
  }

  public get x(): number {
    return this.grid.toWorld(this.col, this.row).x + this.grid.cellSize / 2;
  }
  public get y(): number {
    return this.grid.toWorld(this.col, this.row).y + this.grid.cellSize / 2;
  }
}
