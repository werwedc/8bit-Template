/**
 * InputManager tests — validate key-state timing contract.
 *
 * Contract:
 *   isDown()     — true every frame the key is physically held
 *   isPressed()  — true only on the FIRST frame after keydown
 *   isReleased() — true only on the FIRST frame after keyup
 *   update() must be called at the END of each frame to advance the state machine.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputManager } from './input';

// Gamepad API is not present in jsdom — stub it
vi.stubGlobal('navigator', {
  getGamepads: () => [],
});

function pressKey(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
}

function releaseKey(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
}

describe('InputManager', () => {
  let input: InputManager;

  beforeEach(() => {
    input = new InputManager();
    // Simulate one frame of no keys so prevKeys is clean
    input.update();
  });

  it('isDown is true while key is held', () => {
    pressKey('Space');
    expect(input.isDown('Space')).toBe(true);

    // Stays true across frame boundary
    input.update();
    expect(input.isDown('Space')).toBe(true);

    releaseKey('Space');
    expect(input.isDown('Space')).toBe(false);
  });

  it('isPressed is true only on the first frame after keydown', () => {
    pressKey('Space');

    // Before update(): key is down, prev was not → isPressed = true
    expect(input.isPressed('Space')).toBe(true);

    // After update(): prevKeys snapshots {Space} → no longer "just pressed"
    input.update();
    expect(input.isPressed('Space')).toBe(false);

    // Still down → isDown remains true
    expect(input.isDown('Space')).toBe(true);

    releaseKey('Space');
  });

  it('isReleased is true only on the first frame after keyup', () => {
    pressKey('Space');
    input.update(); // end of "first held" frame

    releaseKey('Space');
    // Before next update: key left keys → prev had it → isReleased = true
    expect(input.isReleased('Space')).toBe(true);

    input.update();
    expect(input.isReleased('Space')).toBe(false);
  });

  it('returns false for a key that was never pressed', () => {
    expect(input.isDown('KeyZ')).toBe(false);
    expect(input.isPressed('KeyZ')).toBe(false);
  });

  it('tracks multiple keys independently', () => {
    pressKey('KeyA');
    expect(input.isDown('KeyA')).toBe(true);
    expect(input.isDown('ArrowLeft')).toBe(false);

    releaseKey('KeyA');
    pressKey('ArrowLeft');
    expect(input.isDown('KeyA')).toBe(false);
    expect(input.isDown('ArrowLeft')).toBe(true);

    releaseKey('ArrowLeft');
    expect(input.isDown('ArrowLeft')).toBe(false);
  });
});
