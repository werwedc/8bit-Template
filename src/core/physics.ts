/**
 * ==========================================
 * 1. COLLISION DETECTION
 * ==========================================
 */

/**
 * Axis-Aligned Bounding Box (AABB) Collision
 * Checks if two rectangular areas overlap.
 */
export function checkAABB(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean {
  return (
    x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2
  );
}

/**
 * Circle Intersection
 * Checks if two circles overlap by comparing squared distance and squared sum of radii.
 */
export function checkCircleIntersection(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = r1 + r2;
  return distanceSquared <= radiusSum * radiusSum;
}

/**
 * Point Inside Rectangle
 * Checks if a 2D point is inside a given rectangular area.
 */
export function isPointInRect(
  px: number, py: number,
  rx: number, ry: number, rw: number, rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * ==========================================
 * 2. SPATIAL MATH (VECTORS & MOVEMENT)
 * ==========================================
 */

/**
 * Distance Between Points
 * Calculates the Euclidean distance between two 2D points.
 */
export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Vector Normalization
 * Squeezes the length of a vector to exactly 1, preserving its angle.
 * Returns {x, y}. If the vector has 0 length, returns {x: 0, y: 0}.
 */
export function normalizeVector(vx: number, vy: number): { x: number; y: number } {
  const length = Math.sqrt(vx * vx + vy * vy);
  if (length === 0) return { x: 0, y: 0 };
  return { x: vx / length, y: vy / length };
}

/**
 * Find Angle
 * Returns the angle in radians from point 1 to point 2.
 */
export function getAngle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Degrees to Radians
 * Helper to convert degrees to radians (useful for rotation math).
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Radians to Degrees
 * Helper to convert radians to degrees.
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * ==========================================
 * 3. MATH HELPERS
 * ==========================================
 */

/**
 * Clamp
 * Restricts a number to be within a minimum and maximum range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear Interpolation (Lerp)
 * Smoothly transitions from the 'start' value to the 'end' value by 't' (0 to 1).
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Float Random
 * Returns a random floating-point number between min (inclusive) and max (exclusive).
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Integer Random
 * Returns a strictly integer number between min (inclusive) and max (inclusive).
 */
export function randomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Array Random Element
 * Returns a random item from a given array.
 */
export function randomElement<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error('Cannot get random element from empty array');
  return arr[randomInt(0, arr.length - 1)] as T;
}

/**
 * ==========================================
 * 4. BOUNCING LOGIC
 * ==========================================
 */

/**
 * Vector Reflection
 * Inverts the relevant axis of the velocity vector upon hitting a plane.
 * @param isHorizontalWall Pass true if the object hit a top/bottom wall (invert Y).
 * @param isVerticalWall Pass true if the object hit a left/right wall (invert X).
 */
export function reflectVector(vx: number, vy: number, isHorizontalWall: boolean, isVerticalWall: boolean): { x: number; y: number } {
  return {
    x: isVerticalWall ? -vx : vx,
    y: isHorizontalWall ? -vy : vy
  };
}

/**
 * Bounding Box Reflection
 * Simple helper to check bounds and reflect a moving object and keep it within bounds.
 * Modifies object position to prevent getting stuck inside walls.
 * Returns the new position and velocity.
 */
export function reflectOffBounds(
  x: number, y: number, vx: number, vy: number,
  width: number, height: number,
  boundsWidth: number, boundsHeight: number,
  bounciness: number = 1
): { x: number, y: number, vx: number, vy: number } {
  let newVx = vx;
  let newVy = vy;
  let newX = x;
  let newY = y;

  if (x <= 0) {
    newX = 0;
    newVx = Math.abs(vx) * bounciness;
  } else if (x + width >= boundsWidth) {
    newX = boundsWidth - width;
    newVx = -Math.abs(vx) * bounciness;
  }

  if (y <= 0) {
    newY = 0;
    newVy = Math.abs(vy) * bounciness;
  } else if (y + height >= boundsHeight) {
    newY = boundsHeight - height;
    newVy = -Math.abs(vy) * bounciness;
  }

  return { x: newX, y: newY, vx: newVx, vy: newVy };
}
