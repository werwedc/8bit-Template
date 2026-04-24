/**
 * Game Timer System.
 * 
 * Provides `wait` and `every` functionality bound to the main game loop's delta time (`dt`),
 * rather than real-world wall clock time like `setTimeout`. This ensures timers pause when the 
 * game pauses and run exactly in sync with the frame rate.
 */

export type TimerCallback = () => void;

interface Timer {
  id: number;
  time: number;
  duration: number;
  callback: TimerCallback;
  isInterval: boolean;
  active: boolean;
}

const timers: Timer[] = [];
let nextId = 1;

/**
 * Wait for a specific duration (in seconds), then execute the callback once.
 * @returns The timer ID.
 */
export function wait(duration: number, callback: TimerCallback): number {
  const id = nextId++;
  timers.push({
    id,
    time: 0,
    duration,
    callback,
    isInterval: false,
    active: true,
  });
  return id;
}

/**
 * Execute the callback repeatedly every 'duration' seconds.
 * @returns The timer ID.
 */
export function every(duration: number, callback: TimerCallback): number {
  const id = nextId++;
  timers.push({
    id,
    time: 0,
    duration,
    callback,
    isInterval: true,
    active: true,
  });
  return id;
}

/**
 * Clear a specific timer by its ID.
 */
export function clearTimer(id: number): void {
  const index = timers.findIndex((t) => t.id === id);
  if (index !== -1) {
    timers[index]!.active = false;
  }
}

/**
 * Clear all currently active timers.
 */
export function clearAll(): void {
  timers.length = 0;
}

/**
 * Update all timers. MUST be called every frame in the main game loop.
 * @param dt Delta time in seconds.
 */
export function update(dt: number): void {
  // Clone array so callbacks that add new timers don't cause infinite loops 
  // or issues during iteration.
  const timersToProcess = [...timers];

  for (const timer of timersToProcess) {
    if (!timer.active) continue;

    timer.time += dt;
    if (timer.time >= timer.duration) {
      timer.callback();

      // If callback didn't clear this timer
      if (timer.active) {
        if (timer.isInterval) {
          // Keep remainder to maintain exact intervals without drift
          timer.time -= timer.duration;
        } else {
          timer.active = false;
        }
      }
    }
  }

  // Clean up inactive timers from the main array
  for (let i = timers.length - 1; i >= 0; i--) {
    if (!timers[i]!.active) {
      timers.splice(i, 1);
    }
  }
}
