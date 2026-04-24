/**
 * Scene system — the backbone of all game structure.
 *
 * Participants create game states by extending Scene and adding their
 * display objects to `this.container`. SceneManager handles lifecycle.
 *
 * Minimal Scene interface:
 *   enter(data?)  — called once when scene becomes active; set up display objects here
 *   exit()        — called before leaving; clean up listeners, intervals, etc.
 *   update(dt)    — called every frame with delta time in seconds
 *   resize(w, h)  — called on window resize (optional to override)
 *
 * To navigate between scenes from inside any scene:
 *   this.ctx.sceneManager.transitionTo(NextScene, optionalData);
 */

import { Container } from 'pixi.js';
import type { AppContext } from './types';

// Arbitrary data passed between scenes (e.g. score, difficulty level)
export type SceneData = Record<string, unknown>;

export abstract class Scene {
  /** All display objects for this scene. Added to / removed from viewport.world automatically. */
  readonly container: Container = new Container();

  abstract enter(data?: SceneData): void;
  abstract exit(): void;
  abstract update(dt: number): void;

  // Optional — override if the scene needs to reflow on resize
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resize(_w: number, _h: number): void {}
}

export class SceneManager {
  private current: Scene | null = null;
  private currentClass: (new (ctx: AppContext) => Scene) | null = null;
  /** Cache scene instances — avoids re-running enter() setup for re-visited scenes
   * unless you explicitly want that. Override by deleting from cache before transition. */
  private readonly cache = new Map<new (ctx: AppContext) => Scene, Scene>();
  private _currentName = '';

  constructor(private readonly ctx: AppContext) {}

  get currentSceneName(): string {
    return this._currentName;
  }

  /**
   * The constructor of the currently-active scene (or null if none).
   * Handy for re-entering the scene after a render-mode swap when display
   * objects were laid out against the previous RESOLUTION.
   */
  get currentSceneClass(): (new (ctx: AppContext) => Scene) | null {
    return this.currentClass;
  }

  /**
   * Tear down and re-enter the current scene with a fresh instance.
   * Used by F2 hot-swap into 'native-res' so scenes re-read RESOLUTION
   * in their enter() method. No-op if no scene is active.
   */
  reenter(): void {
    if (this.currentClass) this.transitionTo(this.currentClass, undefined, true);
  }

  /**
   * Transition to a scene class. Instantiates once and caches.
   * @param SceneClass  The scene class (not an instance — SceneManager owns instances)
   * @param data        Optional data forwarded to the scene's enter() method
   * @param noCache     If true, re-instantiates even if cached (useful for restartable scenes)
   */
  transitionTo<T extends Scene>(
    SceneClass: new (ctx: AppContext) => T,
    data?: SceneData,
    noCache = false,
  ): void {
    // Tear down current scene
    if (this.current) {
      this.current.exit();
      this.ctx.viewport.world.removeChild(this.current.container);
    }

    // Get or create scene instance
    if (noCache) this.cache.delete(SceneClass);
    let scene = this.cache.get(SceneClass) as T | undefined;
    if (!scene) {
      scene = new SceneClass(this.ctx);
      this.cache.set(SceneClass, scene);
    }

    this.ctx.viewport.world.addChild(scene.container);
    scene.enter(data);

    this.current = scene;
    this.currentClass = SceneClass;
    this._currentName = SceneClass.name;
    this.ctx.debug.setScene(SceneClass.name);
  }

  update(dt: number): void {
    this.current?.update(dt);
  }

  resize(w: number, h: number): void {
    this.current?.resize(w, h);
  }
}
