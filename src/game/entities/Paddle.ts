/**
 * Paddle entity — discrete grid version.
 */

import { Graphics } from 'pixi.js';
import { Entity } from '../../core/entity';
import { GridManager } from '../../core/grid';

export class Paddle extends Entity {
  public col: number;
  public row: number;
  public readonly h: number = 3; // Height in cells
  
  private grid: GridManager<number>;

  constructor(
    grid: GridManager<number>,
    col: number,
    startRow: number,
    color: number
  ) {
    super();
    this.grid = grid;
    this.col = col;
    this.row = startRow;

    const gfx = new Graphics();
    for (let i = 0; i < this.h; i++) {
      gfx.rect(0, i * this.grid.cellSize, this.grid.cellSize, this.grid.cellSize).fill({ color });
    }
    this.view.addChild(gfx);
    
    const pos = this.grid.toWorld(this.col, this.row);
    this.view.position.set(pos.x, pos.y);
  }

  /**
   * Move paddle up or down by cells.
   */
  public move(dir: number): void {
    const nextRow = this.row + dir;
    if (nextRow >= 0 && nextRow + this.h <= this.grid.rows) {
      this.row = nextRow;
      const pos = this.grid.toWorld(this.col, this.row);
      this.view.position.set(pos.x, pos.y);
    }
  }
}
