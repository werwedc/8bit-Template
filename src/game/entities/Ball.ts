/**
 * Ball entity — discrete grid version.
 */

import { Entity } from '../../core/entity';
import { lerp, randomElement } from '../../core/physics';
import { GridManager } from '../../core/grid';
import { Animator, createFramesFromStrip } from '../../core/animation';

export class Ball extends Entity {
  public col: number;
  public row: number;
  public dirCol: number;
  public dirRow: number;
  public animator: Animator;
  
  private grid: GridManager<number>;

  constructor(grid: GridManager<number>, startCol: number, startRow: number) {
    super();
    this.grid = grid;
    this.col = startCol;
    this.row = startRow;

    // Randomize initial direction
    this.dirCol = randomElement([1, -1]);
    this.dirRow = randomElement([1, -1]);

    this.animator = new Animator();
    const frames = createFramesFromStrip('orb_rotate', 10, 10, 7);
    this.animator.add('idle', [frames[0]!], 1, false);
    this.animator.add('spin', frames, 0.15, false);
    
    this.animator.play('idle');
    this.animator.sprite.width = this.grid.cellSize;
    this.animator.sprite.height = this.grid.cellSize;
    
    this.view.addChild(this.animator.sprite);

    this.updatePosition();
  }

  public updatePosition(): void {
    const pos = this.grid.toWorld(this.col, this.row);
    this.view.position.set(pos.x, pos.y);
  }

  public update(dt: number): void {
    const target = this.grid.toWorld(this.col, this.row);
    this.view.x = lerp(this.view.x, target.x, 15 * dt);
    this.view.y = lerp(this.view.y, target.y, 15 * dt);
  }

  public get x(): number {
    // For particles we use the true visual X
    return this.view.x + this.grid.cellSize / 2;
  }
  public get y(): number {
    return this.view.y + this.grid.cellSize / 2;
  }
}
