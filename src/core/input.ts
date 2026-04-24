/**
 * InputManager — minimal keyboard + Gamepad state tracker.
 *
 * Usage:
 *   const input = new InputManager();
 *   // in game loop, AFTER scene.update():
 *   input.update();
 *
 * Query by raw KeyboardEvent.code or 'GP_<buttonIndex>':
 *   input.isDown('ArrowUp')   // held this frame
 *   input.isPressed('Space')  // just pressed this frame
 *   input.isReleased('KeyW')  // just released this frame
 *   input.isDown('GP_0')      // gamepad A / Cross held
 *
 * Timing contract:
 *   input.update() is called at the END of each tick (after scene logic).
 *   This makes prevKeys = end-of-this-frame state.
 *   isPressed() checks keys.has(code) && !prevKeys.has(code), so returns true
 *   exactly on the tick when a key transitions from up→down.
 */

export class InputManager {
  private readonly keys = new Set<string>();
  private readonly prevKeys = new Set<string>();
  private readonly gpPrevButtons = new Map<number, boolean[]>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      // Prevent scroll on game-relevant keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.prevKeys.clear();
    });
  }

  /**
   * Snapshot and poll. Call this at the END of each game-loop tick,
   * after all scene.update() calls have read isPressed / isReleased.
   */
  update(): void {
    // Snapshot current keyboard state for next frame's isPressed detection
    this.prevKeys.clear();
    for (const k of this.keys) this.prevKeys.add(k);

    // Snapshot gamepad buttons (Gamepad API is polling-only — events are unreliable)
    for (const pad of navigator.getGamepads()) {
      if (!pad) continue;
      this.gpPrevButtons.set(pad.index, pad.buttons.map((b) => b.pressed));
    }
  }

  /** True while the key/button is held down. */
  isDown(code: string): boolean {
    return this._keyDown(code) || this._gpDown(code);
  }

  /** True only on the first tick the key/button transitions down. */
  isPressed(code: string): boolean {
    return this._keyPressed(code) || this._gpPressed(code);
  }

  /** True only on the tick the key/button is released. */
  isReleased(code: string): boolean {
    return this._keyReleased(code);
  }

  private _keyDown(code: string): boolean {
    return this.keys.has(code);
  }

  private _keyPressed(code: string): boolean {
    return this.keys.has(code) && !this.prevKeys.has(code);
  }

  private _keyReleased(code: string): boolean {
    return !this.keys.has(code) && this.prevKeys.has(code);
  }

  private _gpDown(binding: string): boolean {
    if (!binding.startsWith('GP_')) return false;
    const btnIdx = parseInt(binding.slice(3));
    for (const pad of navigator.getGamepads()) {
      if (pad?.buttons[btnIdx]?.pressed) return true;
    }
    return false;
  }

  private _gpPressed(binding: string): boolean {
    if (!binding.startsWith('GP_')) return false;
    const btnIdx = parseInt(binding.slice(3));
    for (const pad of navigator.getGamepads()) {
      if (!pad) continue;
      const prev = this.gpPrevButtons.get(pad.index)?.[btnIdx] ?? false;
      if (pad.buttons[btnIdx]?.pressed && !prev) return true;
    }
    return false;
  }
}
