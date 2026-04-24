/**
 * Universal Grid Manager
 * 
 * Provides mathematical translation (world <-> grid) and state management for
 * classic arcade grid-based games like Tetris, Pacman, Snake, and Arkanoid.
 */

export class GridManager<T> {
  public cols: number;
  public rows: number;
  public cellSize: number;
  public offsetX: number;
  public offsetY: number;
  private data: T[][];
  private defaultValue: T;

  constructor(cols: number, rows: number, cellSize: number, offsetX = 0, offsetY = 0, defaultValue: T) {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.defaultValue = defaultValue;

    // Initialize 2D array [col][row]
    this.data = new Array(cols).fill(null).map(() => new Array(rows).fill(defaultValue));
  }

  // =========================================
  // 1. Mathematical Translator
  // =========================================

  /**
   * Converts grid indices to world pixel coordinates.
   * @param anchor 'topleft' returns the corner (for drawing square blocks). 'center' returns the exact center point.
   */
  toWorld(col: number, row: number, anchor: 'topleft' | 'center' = 'topleft'): { x: number; y: number } {
    let x = this.offsetX + col * this.cellSize;
    let y = this.offsetY + row * this.cellSize;
    if (anchor === 'center') {
      x += this.cellSize / 2;
      y += this.cellSize / 2;
    }
    return { x, y };
  }

  /**
   * Converts any non-integer world pixel coordinate into the rigid grid indices (column and row).
   */
  toGrid(x: number, y: number): { col: number; row: number } {
    const col = Math.floor((x - this.offsetX) / this.cellSize);
    const row = Math.floor((y - this.offsetY) / this.cellSize);
    return { col, row };
  }

  /**
   * For smooth games (like Pacman): takes non-integer coordinates and returns the ideal pixel
   * coordinates of the closest cell's anchor point to "magnetize" the object to the grid.
   */
  snapToGrid(x: number, y: number, anchor: 'topleft' | 'center' = 'center'): { x: number; y: number } {
    const { col, row } = this.toGrid(x, y);
    return this.toWorld(col, row, anchor);
  }

  // =========================================
  // 2. Data Manager
  // =========================================

  /**
   * Write data to a specific cell. Safe against out-of-bounds.
   */
  set(col: number, row: number, value: T): void {
    if (this.isValid(col, row)) {
      this.data[col]![row] = value;
    }
  }

  /**
   * Get data from a specific cell. Returns undefined if out-of-bounds.
   */
  get(col: number, row: number): T | undefined {
    if (!this.isValid(col, row)) return undefined;
    return this.data[col]![row];
  }

  /**
   * Checks if the indices strictly fall within the boundaries of the grid.
   */
  isValid(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  /**
   * Passability check. If no custom condition is provided, it checks if the cell strictly equals the defaultValue.
   */
  isEmpty(col: number, row: number, emptyCondition?: (val: T) => boolean): boolean {
    if (!this.isValid(col, row)) return false; // Out of bounds is not empty (it's a wall)
    const val = this.get(col, row)!;
    return emptyCondition ? emptyCondition(val) : val === this.defaultValue;
  }

  // =========================================
  // 3. Navigator and Neighbor Analysis
  // =========================================

  /**
   * Returns an array of valid adjacent cells (Up, Down, Left, Right).
   */
  getNeighbors(col: number, row: number): { col: number; row: number; value: T }[] {
    const neighbors: { col: number; row: number; value: T }[] = [];
    const dirs = [
      { c: 0, r: -1 }, // Up
      { c: 0, r: 1 },  // Down
      { c: -1, r: 0 }, // Left
      { c: 1, r: 0 }   // Right
    ];

    for (const dir of dirs) {
      const nc = col + dir.c;
      const nr = row + dir.r;
      if (this.isValid(nc, nr)) {
        neighbors.push({ col: nc, row: nr, value: this.get(nc, nr)! });
      }
    }
    return neighbors;
  }

  /**
   * A "sight" function. Casts a ray from a cell in a specific direction until it hits a block or the edge.
   */
  getLineOfSight(
    startCol: number, 
    startRow: number, 
    dirCol: number, 
    dirRow: number, 
    maxDistance: number = Infinity,
    blockCondition?: (val: T) => boolean
  ): { col: number; row: number; value: T }[] {
    const sight: { col: number; row: number; value: T }[] = [];
    let c = startCol + dirCol;
    let r = startRow + dirRow;
    let dist = 1;

    while (this.isValid(c, r) && dist <= maxDistance) {
      const val = this.get(c, r)!;
      sight.push({ col: c, row: r, value: val });
      if (blockCondition && blockCondition(val)) {
        break;
      } else if (!blockCondition && val !== this.defaultValue) {
        break;
      }
      c += dirCol;
      r += dirRow;
      dist++;
    }

    return sight;
  }

  // =========================================
  // 4. Tetris Utilities (Mass Manipulations)
  // =========================================

  /**
   * Checks if an entire row matches the fullCondition (or is strictly not the defaultValue).
   */
  isRowFull(row: number, fullCondition?: (val: T) => boolean): boolean {
    if (row < 0 || row >= this.rows) return false;
    for (let col = 0; col < this.cols; col++) {
      const val = this.data[col]![row]!;
      const isFull = fullCondition ? fullCondition(val) : val !== this.defaultValue;
      if (!isFull) return false;
    }
    return true;
  }

  /**
   * Checks if an entire row is empty.
   */
  isRowEmpty(row: number, emptyCondition?: (val: T) => boolean): boolean {
    if (row < 0 || row >= this.rows) return false;
    for (let col = 0; col < this.cols; col++) {
      const val = this.data[col]![row]!;
      const isEmpty = emptyCondition ? emptyCondition(val) : val === this.defaultValue;
      if (!isEmpty) return false;
    }
    return true;
  }

  /**
   * Resets an entire row to the default value.
   */
  clearRow(row: number): void {
    if (row < 0 || row >= this.rows) return;
    for (let col = 0; col < this.cols; col++) {
      this.data[col]![row] = this.defaultValue;
    }
  }

  /**
   * Tetris magic: takes all rows ABOVE the cleared line (from endRow up to startRow)
   * and shifts their data down one cell. Assumes row 0 is the top of the grid.
   * @param endRow The bottom-most row to receive shifted data (e.g., the row just cleared).
   * @param startRow The top-most row to shift down (usually 0).
   */
  shiftRowsDown(endRow: number, startRow: number = 0): void {
    for (let row = endRow; row > startRow; row--) {
      for (let col = 0; col < this.cols; col++) {
        this.data[col]![row] = this.data[col]![row - 1]!;
      }
    }
    // The topmost shifted row becomes empty
    this.clearRow(startRow);
  }

  /**
   * Instantly fills the entire grid with a given value.
   */
  fill(value: T): void {
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        this.data[col]![row] = value;
      }
    }
  }

  /**
   * Fast rendering loop. Iterates through every valid cell in the grid.
   */
  forEach(callback: (col: number, row: number, value: T) => void): void {
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        callback(col, row, this.data[col]![row]!);
      }
    }
  }
}
