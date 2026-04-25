/**
 * Global Event Bus
 * 
 * Provides decoupled communication between isolated game systems.
 * Example: `PlayScene` emits 'PADDLE_HIT', and the Audio system listens 
 * to it instead of the scene calling `audio.play()` directly.
 */

type Listener = (...args: any[]) => void;

export class EventBus {
  private events = new Map<string, Set<Listener>>();

  /**
   * Listen for an event.
   */
  on(event: string, listener: Listener): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
  }

  /**
   * Listen for an event exactly once.
   */
  once(event: string, listener: Listener): void {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      listener(...args);
    };
    this.on(event, wrapper);
  }

  /**
   * Remove a specific listener.
   */
  off(event: string, listener: Listener): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event, calling all registered listeners with the provided arguments.
   */
  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      // Create a shallow copy before iterating to prevent issues 
      // if a listener removes itself during execution (like `once`)
      for (const listener of Array.from(listeners)) {
        listener(...args);
      }
    }
  }

  /**
   * Clear all listeners for a specific event, or wipe all events entirely.
   * VERY IMPORTANT to call in Scene.exit() to prevent memory leaks!
   */
  clear(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}
