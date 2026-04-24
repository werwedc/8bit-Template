/**
 * AppContext — the single object passed to every Scene constructor.
 * Keeps core systems loosely coupled (no globals, no singletons).
 *
 * To add a new system: add a field here and wire it up in main.ts.
 */

import type { Application } from 'pixi.js';
import type { AudioManager } from './audio';
import type { AssetManager } from './assets';
import type { DebugOverlay } from './debug';
import type { InputManager } from './input';
import type { SceneManager } from './scene';
import type { UIManager } from './ui';
import type { Viewport } from './viewport';
import type { Camera } from './camera';
import type { StorageManager } from './storage';

export interface AppContext {
  app: Application;
  viewport: Viewport;
  input: InputManager;
  audio: AudioManager;
  assets: AssetManager;
  gsap: typeof import('gsap').gsap;
  camera: Camera;
  debug: DebugOverlay;
  ui: UIManager;
  storage: StorageManager;
  sceneManager: SceneManager;
}
