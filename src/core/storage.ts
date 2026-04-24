/**
 * Local Storage Wrapper.
 * 
 * Provides crash-proof, auto-serializing, and namespaced access to localStorage.
 * Handles complex objects seamlessly and supports throttled writing for high-frequency saves.
 */

export class StorageManager {
  private prefix: string;
  private lastSave = new Map<string, number>();
  private pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  /**
   * Universal save method. Accepts a string key and any JSON-serializable data.
   */
  save(key: string, data: any): void {
    try {
      const fullKey = this.prefix + key;
      const serialized = JSON.stringify(data);
      localStorage.setItem(fullKey, serialized);
    } catch (e) {
      console.warn(`[Storage] Failed to save key "${key}":`, e);
    }
  }

  /**
   * Loads data by key. 
   * If the data is missing or corrupted, returns the provided defaultValue.
   */
  load<T>(key: string, defaultValue: T): T {
    try {
      const fullKey = this.prefix + key;
      const serialized = localStorage.getItem(fullKey);
      
      if (serialized === null) {
        return defaultValue;
      }
      
      return JSON.parse(serialized) as T;
    } catch (e) {
      console.warn(`[Storage] Failed to load key "${key}", falling back to default:`, e);
      return defaultValue;
    }
  }

  /**
   * Point-wise delete (e.g., reset current level progress if the player dies).
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (e) {
      console.warn(`[Storage] Failed to remove key "${key}":`, e);
    }
  }

  /**
   * Reset progress. Deletes ALL keys belonging to this game matching the prefix.
   */
  wipe(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix)) {
          keysToRemove.push(k);
        }
      }
      
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch (e) {
      console.warn(`[Storage] Failed to wipe storage:`, e);
    }
  }

  /**
   * Throttled auto-save. Limits write rate to at most once every `delayMs`.
   * Guarantees the latest data is eventually written.
   */
  throttledSave(key: string, data: any, delayMs: number = 1000): void {
    const now = Date.now();
    const last = this.lastSave.get(key) || 0;
    const timeSinceLast = now - last;

    // Clear any existing pending save for this key
    if (this.pendingSaves.has(key)) {
      clearTimeout(this.pendingSaves.get(key));
      this.pendingSaves.delete(key);
    }

    if (timeSinceLast >= delayMs) {
      // Enough time has passed, save immediately
      this.save(key, data);
      this.lastSave.set(key, now);
    } else {
      // Schedule a save for when the delay is up
      const delayRemaining = delayMs - timeSinceLast;
      const timerId = setTimeout(() => {
        this.save(key, data);
        this.lastSave.set(key, Date.now());
        this.pendingSaves.delete(key);
      }, delayRemaining);
      this.pendingSaves.set(key, timerId);
    }
  }
}
