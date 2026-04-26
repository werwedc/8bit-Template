# 8-Bit Template — Complete Context Map

> **Purpose:** This document is a self-contained reference for building games on top of this template. It documents every system, its API, the wiring between systems, and the pitfalls to avoid. You should be able to build a full game without reading the source code.

---

## Table of Contents

1. [Current State — Ready to Build](#1-current-state--ready-to-build)
2. [Project Overview](#2-project-overview)
3. [Tech Stack & Scripts](#3-tech-stack--scripts)
4. [Architecture](#4-architecture)
5. [The AppContext Object](#5-the-appcontext-object)
6. [Core Systems Reference](#6-core-systems-reference)
   - [Scene System](#61-scene-system)
   - [Entity System](#62-entity-system)
   - [InputManager](#63-inputmanager)
   - [AudioManager](#64-audiomanager)
   - [AssetManager](#65-assetmanager)
   - [Viewport & Render Modes](#66-viewport--render-modes)
   - [Camera](#67-camera)
   - [ParticleSystem](#68-particlesystem)
   - [GridManager](#69-gridmanager)
   - [Animator (Animation State Machine)](#610-animator)
   - [Physics & Math Utilities](#611-physics--math-utilities)
   - [Timer System](#612-timer-system)
   - [EventBus](#613-eventbus)
   - [UIManager](#614-uimanager)
   - [StorageManager](#615-storagemanager)
   - [DebugOverlay](#616-debugoverlay)
   - [Retro Filters](#617-retro-filters)
   - [Settings Menu](#618-settings-menu)
7. [Critical Rules & Error Avoidance](#7-critical-rules--error-avoidance)
8. [Step-by-Step: Building a Game](#8-step-by-step-building-a-game)
9. [Rapid Development Cheatsheet](#9-rapid-development-cheatsheet)

---

## 1. Current State — Ready to Build

The demo game (Pong) has been **fully removed**. The project compiles and runs cleanly. What remains is:

### What's already working (don't touch)
- **`src/core/*`** — The entire engine: scene management, input, audio, assets, viewport, camera, particles, grid, animation, physics, timers, events, UI, storage, filters, debug overlay. All wired up and running.
- **`src/main.ts`** — Entry point. Bootstraps all systems, runs the game loop, handles F1/F2 hotkeys. Fully functional.
- **`index.html`** + **`src/style.css`** — Canvas + UI layer styling with glassmorphism settings modal.

### What's there as empty skeletons (your starting point)
- **`src/game/config.ts`** — Has `RESOLUTION` (320x180), `RENDER_MODE` ('retro'), `PALETTE` (bg/fg/accent only), empty `GAME` object, and the 4 filter presets. **Next:** Add your game-specific constants (speeds, sizes, scoring, etc.) and palette colors.
- **`src/game/manifest.ts`** — Empty asset array. **Next:** Add your sprite/font entries after dropping files into `public/assets/`.
- **`src/game/ui-layers.ts`** — Has three skeleton layers: `main-menu` (title + PLAY + SETTINGS buttons), `hud` (single score div), `game-over` (text + restart button). **Next:** Customize the HTML to match your game's UI needs.
- **`src/game/scenes/BootScene.ts`** — Loads assets, shows progress bar, transitions to MenuScene. Audio registration lines are commented out. **Next:** Uncomment and add your `audio.register()` calls.
- **`src/game/scenes/MenuScene.ts`** — Shows title + background, PLAY button transitions to PlayScene, Enter key also works. **Next:** Add your menu visuals, animations, or instructions.
- **`src/game/scenes/PlayScene.ts`** — Empty scene with a background fill and HUD shown. Escape returns to menu. **Next:** This is where your game goes — entities, logic, collisions, scoring.
- **`src/game/entities/`** — Directory exists but is empty. **Next:** Create your entity classes here (Player, Enemy, Bullet, etc.).

### What to do first
1. Decide your game → fill in `config.ts` (TITLE, PALETTE, GAME constants)
2. Drop sprites/audio into `public/assets/` → update `manifest.ts` and `BootScene.ts`
3. Create entity classes in `entities/`
4. Build your gameplay in `PlayScene.ts`
5. Customize `ui-layers.ts` for your HUD
6. `npm run dev` and iterate

---

## 2. Project Overview

A TypeScript game template built on **PixiJS v8** with retro 8-bit aesthetics. The engine (`src/core/`) is fully separated from game logic (`src/game/`), so you build anything on top — Tetris, platformer, shooter, puzzle, etc. The game layer is currently a clean skeleton ready to be filled in.

**Key features:** Scene management, grid-based or free-form movement, sprite animation state machine, particle system, CRT/bloom post-FX, keyboard + gamepad input, Howler.js audio, localStorage persistence, HTML-based UI overlay, global event bus.

---

## 3. Tech Stack & Scripts

| Package | Version | Role |
|---------|---------|------|
| pixi.js | ^8 | WebGL/WebGPU 2D renderer |
| pixi-filters | ^6 | CRT, bloom, chromatic aberration |
| howler.js | ^2.2 | Audio (auto-unlock, sprite support) |
| gsap | ^3.15 | Tweening & animation timing |
| Vite | ^5 | Dev server + bundler |
| TypeScript | ^5 | Type safety |
| Biome | ^1.8 | Lint + format |
| Vitest | ^1.6 | Unit tests |

```bash
npm run dev       # Vite dev server with HMR
npm run build     # TypeScript check + Vite production build → dist/
npm run preview   # Serve dist/ locally
npm run lint      # Biome check + auto-fix
npm test          # Vitest unit tests
```

---

## 4. Architecture

### Directory Structure

```
src/
  core/              ← Engine layer. NEVER imports from game/.
    app.ts           ← Pixi Application bootstrap
    viewport.ts      ← RenderTexture upscale / native scaling / letterbox
    scene.ts         ← Scene base class + SceneManager
    input.ts         ← Keyboard + Gamepad state tracker
    audio.ts         ← Howler.js wrapper
    assets.ts        ← Pixi Assets wrapper (Aseprite-aware)
    entity.ts        ← Component-bag base class
    animation.ts     ← Sprite animation state machine (Animator)
    particles.ts     ← Pooled sprite particle emitter (GSAP-powered)
    grid.ts          ← Universal grid manager (world↔grid math + data)
    physics.ts       ← Collision detection, vectors, math helpers, bouncing
    timer.ts         ← Game-loop-synced wait() / every() timers
    events.ts        ← Global pub/sub event bus
    camera.ts        ← Screen-shake effect
    ui.ts            ← HTML overlay UI layer manager
    storage.ts       ← localStorage wrapper with namespacing + throttle
    filters.ts       ← Two-pass retro filter stack (bloom + CRT + RGB split)
    settings-ui.ts   ← Glassmorphism settings modal (volume, graphics, resolution)
    debug.ts         ← FPS/scene/object-count overlay (backtick to toggle)
    types.ts         ← AppContext interface definition

  game/              ← YOUR game. All skeletons — ready to fill in.
    config.ts        ← RESOLUTION, PALETTE, GAME constants, FILTER_PRESETS
    manifest.ts      ← Asset list to preload (empty — add your entries)
    ui-layers.ts     ← Registers HTML UI layers (menu, HUD, game-over skeletons)
    scenes/
      BootScene.ts   ← Loads assets, shows progress bar, transitions to MenuScene
      MenuScene.ts   ← Title screen with PLAY button → PlayScene
      PlayScene.ts   ← Empty skeleton — your gameplay goes here
    entities/        ← Empty directory — create your entity classes here

  main.ts            ← Entry point: wires all systems, starts game loop
  style.css          ← Global CSS (canvas, UI layers, glassmorphism)

public/
  assets/
    audio/           ← .mp3 sound files
    sprites/         ← Sprite images and spritesheets
```

### The One Rule

**`core/` must NEVER import from `game/`.** Game code imports from core, not the other way around. This is what makes the template reusable.

### Main Game Loop Order (in `main.ts`)

Each frame, the ticker runs in this exact order:

```
1. timer.update(dt)        — advance game-loop-synced timers
2. sceneManager.update(dt) — runs the active scene's update(dt)
3. camera.update(dt)       — applies screen-shake offset to viewport.world
4. viewport.render()       — blits world → RenderTexture (retro mode only)
5. updateFilters(dt)       — animates CRT noise/scanlines
6. input.update()          — snapshots key state (MUST be last)
→ Pixi auto-renders app.stage to canvas
```

---

## 5. The AppContext Object

Every `Scene` constructor receives an `AppContext` — the single dependency injection point. No globals, no singletons.

```ts
interface AppContext {
  app: Application;           // Pixi Application instance
  viewport: Viewport;         // Render pipeline (retro/native/native-res)
  input: InputManager;        // Keyboard + gamepad polling
  audio: AudioManager;        // Howler.js sound playback
  assets: AssetManager;       // Pixi asset loading & retrieval
  gsap: typeof gsap;          // GSAP tweening library
  camera: Camera;             // Screen-shake effects
  debug: DebugOverlay;        // FPS/scene overlay
  ui: UIManager;              // HTML UI layer system
  storage: StorageManager;    // localStorage persistence
  events: EventBus;           // Global pub/sub messaging
  sceneManager: SceneManager; // Scene lifecycle & transitions
}
```

Access any system from within a scene via `this.ctx.<system>`.

---

## 6. Core Systems Reference

### 6.1 Scene System
**File:** `src/core/scene.ts`

Scenes are the backbone of all game structure. Each game state (boot, menu, play, game-over) is a Scene subclass.

#### Scene (abstract base class)

```ts
abstract class Scene {
  readonly container: Container;    // Add all display objects here

  abstract enter(data?: SceneData): void;   // Called when scene becomes active
  abstract exit(): void;                     // Called before leaving — clean up!
  abstract update(dt: number): void;         // Called every frame (dt in seconds)
  resize(w: number, h: number): void;        // Optional — override for reflow
}

type SceneData = Record<string, unknown>;    // Arbitrary data passed between scenes
```

#### SceneManager

```ts
class SceneManager {
  get currentSceneName(): string;
  get currentSceneClass(): (new (ctx: AppContext) => Scene) | null;

  // Navigate to a scene. Instantiates once and caches by default.
  transitionTo<T extends Scene>(
    SceneClass: new (ctx: AppContext) => T,
    data?: SceneData,
    noCache?: boolean     // true = always create a fresh instance
  ): void;

  // Tear down and re-enter the current scene with a fresh instance.
  reenter(): void;

  update(dt: number): void;     // Called by main loop — don't call manually
  resize(w: number, h: number): void;
}
```

**Usage from any scene:**
```ts
// Simple transition
this.ctx.sceneManager.transitionTo(PlayScene);

// With data
this.ctx.sceneManager.transitionTo(PlayScene, { difficulty: 'hard' });

// Force fresh instance (e.g., restart)
this.ctx.sceneManager.transitionTo(PlayScene, undefined, true);
```

**Lifecycle:** When transitioning, SceneManager calls `exit()` on the old scene, removes its container from the viewport, calls `ui.hideAll()`, then adds the new scene's container and calls `enter(data)`.

---

### 6.2 Entity System
**File:** `src/core/entity.ts`

A lightweight component-bag base class. Not a full ECS — just enough structure to prevent ad-hoc entity implementations.

```ts
class Entity {
  readonly view: Container;     // The display container. Add child sprites here.

  set<T>(key: string, component: T): this;        // Attach a component (chainable)
  get<T>(key: string): T;                          // Retrieve a component (throws if missing)
  has(key: string): boolean;                       // Check if component exists
  remove(key: string): this;                       // Detach a component (chainable)
  destroy(): void;                                 // Destroy view + clear all components
}
```

**Usage:**
```ts
class Player extends Entity {
  constructor() {
    super();
    this.set('velocity', { x: 0, y: 0 });
    this.set('health', 100);
    this.view.addChild(new Sprite(someTexture));
  }
}

// Reading
const vel = player.get<{ x: number; y: number }>('velocity');
vel.x += 10;

// Add to scene
scene.container.addChild(player.view);
```

---

### 6.3 InputManager
**File:** `src/core/input.ts`

Tracks keyboard and gamepad state. Query by `KeyboardEvent.code` or `GP_<buttonIndex>`.

```ts
class InputManager {
  isDown(code: string): boolean;       // True while held
  isPressed(code: string): boolean;    // True only on the first frame of a press
  isReleased(code: string): boolean;   // True only on the frame of release
  update(): void;                      // Called by main loop — don't call manually
}
```

**Key codes** follow the standard `KeyboardEvent.code` values:
- Letters: `KeyW`, `KeyA`, `KeyS`, `KeyD`
- Arrows: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`
- Special: `Space`, `Enter`, `Escape`, `ShiftLeft`, `ControlLeft`
- Gamepad: `GP_0` (A/Cross), `GP_1` (B/Circle), `GP_2` (X/Square), `GP_3` (Y/Triangle)

**Usage:**
```ts
update(dt: number): void {
  if (this.ctx.input.isDown('ArrowLeft'))  this.player.moveLeft(dt);
  if (this.ctx.input.isDown('ArrowRight')) this.player.moveRight(dt);
  if (this.ctx.input.isPressed('Space'))   this.player.jump();  // one-shot
}
```

Auto-prevents browser scroll on arrow keys and Space. Clears state on window blur.

---

### 6.4 AudioManager
**File:** `src/core/audio.ts`

Thin wrapper around Howler.js. Handles browser autoplay-unlock automatically.

```ts
class AudioManager {
  // Register a sound (Howler starts loading immediately)
  register(name: string, def: SoundDef): void;

  play(name: string, sprite?: string): number | undefined;  // Returns Howler sound ID
  stop(name: string): void;
  stopAll(): void;
  isPlaying(name: string): boolean;

  setVolume(name: string, vol: number): void;       // Per-sound volume
  setGlobalVolume(vol: number): void;                // Master volume (0–1)
  mute(val: boolean): void;                          // Global mute toggle

  get muted(): boolean;
  get globalVolume(): number;
}

interface SoundDef {
  src: string[];               // ['/assets/audio/hit.webm', '/assets/audio/hit.mp3']
  loop?: boolean;              // Default false
  volume?: number;             // Default 1
  sprite?: Record<string, [number, number]>;   // Howler sprite map: { name: [offsetMs, durationMs] }
}
```

**Registration** happens in `BootScene._load()`:
```ts
this.ctx.audio.register('jump', { src: ['/assets/audio/jump.mp3'] });
this.ctx.audio.register('music', { src: ['/assets/audio/bgm.mp3'], loop: true, volume: 0.5 });
```

**Playback** from any scene:
```ts
this.ctx.audio.play('jump');
this.ctx.audio.play('music');
this.ctx.audio.stop('music');
```

---

### 6.5 AssetManager
**File:** `src/core/assets.ts`

Typed wrapper around Pixi v8's `Assets` API. Supports Aseprite JSON Hash spritesheets and bitmap fonts.

```ts
class AssetManager {
  // Load a list of assets with optional progress callback (0–1)
  async loadManifest(items: AssetManifestItem[], onProgress?: (progress: number) => void): Promise<void>;

  texture(alias: string): Texture;           // Single texture or spritesheet frame
  spritesheet(alias: string): Spritesheet;   // Full spritesheet (Aseprite JSON Hash)
  get<T>(alias: string): T;                  // Generic getter
}

interface AssetManifestItem {
  alias: string;     // Shorthand name for retrieval
  src: string;       // Path relative to public/ (e.g. '/assets/sprites/player.json')
}
```

**Manifest** is defined in `src/game/manifest.ts`:
```ts
export const ASSET_MANIFEST: AssetManifestItem[] = [
  { alias: 'player', src: '/assets/sprites/player.json' },
  { alias: 'PressStart2P', src: '/assets/fonts/press-start-2p.fnt' },
];
```

**Aseprite workflow:**
1. In Aseprite: `File → Export Sprite Sheet → Format: JSON Hash`, export PNG alongside
2. Drop `.json` + `.png` into `public/assets/sprites/`
3. Add entry to `ASSET_MANIFEST`
4. Access: `assets.spritesheet('player').animations['run']`

**Bitmap font workflow:**
1. Export `.fnt` + `.png` atlas with [SnowB](https://snowb.org) or Hiero
2. Drop into `public/assets/fonts/`
3. Add to manifest
4. Use: `new BitmapText({ text: 'SCORE', style: { fontFamily: 'PressStart2P', fontSize: 8 } })`

---

### 6.6 Viewport & Render Modes
**File:** `src/core/viewport.ts`

Handles the rendering pipeline and screen scaling. Three modes available:

| Mode | Description |
|------|-------------|
| `retro` | World → RenderTexture (e.g. 320x180) → integer-upscaled Sprite. Chunky pixel-perfect. |
| `native` | World scaled fractionally to fill window. DPR-aware, smooth on HiDPI. |
| `native-res` | RESOLUTION overwritten to device physical pixels. 1:1 mapping, no scaling. |

```ts
type RenderMode = 'retro' | 'native' | 'native-res';

interface Resolution { w: number; h: number; }

// Overwrite resolution to device physical pixels (used internally)
function matchDeviceResolution(resolution: Resolution): void;

class Viewport {
  readonly world: Container;       // Add all game objects here

  get renderMode(): RenderMode;
  get filterLayer(): Container;    // Where CRT/bloom filters are applied
  get logicalScale(): number;      // Scale factor relative to base resolution

  setRenderMode(mode: RenderMode): void;   // Hot-swap at runtime
  render(): void;                           // Called by main loop (retro mode only)
  destroy(): void;
}
```

**Default render mode** is set in `src/game/config.ts`:
```ts
export const RENDER_MODE: 'retro' | 'native' | 'native-res' = 'native';
```

**Resolution** is set in `src/game/config.ts`:
```ts
export const RESOLUTION: { w: number; h: number } = { w: 320, h: 180 };
```

Common retro resolutions: NES `256x240`, Game Boy `160x144`, SNES `256x224`, Widescreen `320x180`.

**Scaling in scenes:** When the render mode is `native-res`, the logical coordinate space grows to the device's physical pixel dimensions. To make scenes work across all modes, use the `logicalScale` multiplier:
```ts
const scale = this.ctx.viewport.logicalScale;
const fontSize = 8 * scale;
const barHeight = 4 * scale;
```
In `retro` and `native` mode, `logicalScale` is `1`. In `native-res`, it equals `devicePixelRatio` (e.g. `2` on a Retina display).

---

### 6.7 Camera
**File:** `src/core/camera.ts`

Screen-shake effect. Operates on the `viewport.world` container.

```ts
class Camera {
  // Shake the screen with exponential decay
  shake(
    intensityX: number,    // Horizontal shake amplitude (pixels)
    intensityY: number,    // Vertical shake amplitude (pixels)
    intensityRot: number,  // Rotational shake amplitude (degrees)
    duration: number       // Duration in seconds
  ): void;

  update(dt: number): void;  // Called by main loop — don't call manually
}
```

**Usage:**
```ts
this.ctx.camera.shake(6, 6, 2, 0.25);   // Big explosion shake
this.ctx.camera.shake(3, 3, 0, 0.12);   // Small hit feedback
```

---

### 6.8 ParticleSystem
**File:** `src/core/particles.ts`

Pooled sprite particle emitter powered by GSAP. Pre-allocates sprites for zero-allocation bursts.

```ts
class ParticleSystem {
  readonly container: Container;   // Add this to your scene's container

  constructor(maxParticles?: number);   // Default 256

  // Burst particles from a point
  emit(x: number, y: number, options?: ParticleOptions): void;

  destroy(): void;
}

interface ParticleOptions {
  count?: number;                  // Number of particles. Default 10
  color?: number;                  // Tint color. Default 0xffffff
  size?: number;                   // Pixel size. Default 2
  speed?: [number, number];        // Min/max speed. Default [40, 100]
  life?: [number, number];         // Min/max lifetime in seconds. Default [0.3, 0.6]
  spread?: number;                 // Spread angle in radians. Default 2π (full circle)
  direction?: number;              // Direction angle in radians. Default 0
  fade?: boolean;                  // Alpha fade-out. Default true
}
```

**Usage:**
```ts
// Create once in enter()
this.particles = new ParticleSystem(256);
this.container.addChild(this.particles.container);

// Burst on events
this.particles.emit(x, y, {
  count: 12,
  color: 0xff4488,
  speed: [40, 80],
  spread: Math.PI * 0.6,
  direction: Math.PI,
  life: [0.3, 0.5],
  size: 2,
});

// Clean up in exit()
this.particles.destroy();
```

---

### 6.9 GridManager
**File:** `src/core/grid.ts`

Universal grid for tile-based or discrete-movement games (Tetris, Snake, Pac-Man, Arkanoid, etc.). Provides world↔grid coordinate translation and a typed 2D data array.

```ts
class GridManager<T> {
  cols: number;
  rows: number;
  cellSize: number;
  offsetX: number;
  offsetY: number;

  constructor(
    cols: number,
    rows: number,
    cellSize: number,       // Pixel size of each cell
    offsetX?: number,       // Grid origin X offset. Default 0
    offsetY?: number,       // Grid origin Y offset. Default 0
    defaultValue: T         // Value for empty cells
  );

  // ── Coordinate Translation ──
  toWorld(col: number, row: number, anchor?: 'topleft' | 'center'): { x: number; y: number };
  toGrid(x: number, y: number): { col: number; row: number };
  snapToGrid(x: number, y: number, anchor?: 'topleft' | 'center'): { x: number; y: number };

  // ── Data Access ──
  set(col: number, row: number, value: T): void;
  get(col: number, row: number): T | undefined;
  isValid(col: number, row: number): boolean;
  isEmpty(col: number, row: number, emptyCondition?: (val: T) => boolean): boolean;

  // ── Neighbor Analysis ──
  getNeighbors(col: number, row: number): { col: number; row: number; value: T }[];
  getLineOfSight(
    startCol: number, startRow: number,
    dirCol: number, dirRow: number,
    maxDistance?: number,
    blockCondition?: (val: T) => boolean
  ): { col: number; row: number; value: T }[];

  // ── Row Operations (Tetris-style) ──
  isRowFull(row: number, fullCondition?: (val: T) => boolean): boolean;
  isRowEmpty(row: number, emptyCondition?: (val: T) => boolean): boolean;
  clearRow(row: number): void;
  shiftRowsDown(endRow: number, startRow?: number): void;

  // ── Bulk Operations ──
  fill(value: T): void;
  forEach(callback: (col: number, row: number, value: T) => void): void;
}
```

**Usage:**
```ts
// A 10x20 Tetris grid, 16px cells
const grid = new GridManager<number>(10, 20, 16, 0, 0, 0);

// Place a block
grid.set(5, 0, 1);

// Convert grid → pixel position
const { x, y } = grid.toWorld(5, 0);

// Check collisions
if (!grid.isEmpty(nextCol, nextRow)) { /* blocked */ }

// Tetris line clear
if (grid.isRowFull(19)) {
  grid.clearRow(19);
  grid.shiftRowsDown(19, 0);
}

// Pac-Man pathfinding
const neighbors = grid.getNeighbors(ghostCol, ghostRow)
  .filter(n => grid.isEmpty(n.col, n.row));
```

---

### 6.10 Animator
**File:** `src/core/animation.ts`

Sprite animation state machine with a locking mechanism for one-shot animations.

```ts
class Animator {
  sprite: AnimatedSprite;       // Add this to your Entity's view
  get isLocked(): boolean;      // True during playOnce()

  // Register an animation state
  add(
    name: string,
    source: AnimationSource,    // Texture[] or { sheet: Spritesheet; animation: string }
    speed?: number,             // Playback speed. Default 1
    loop?: boolean              // Loop? Default true
  ): void;

  play(name: string): void;     // Play continuously (ignored if locked)
  playOnce(name: string, onComplete?: () => void): void;  // Play once, lock until done
  unlock(): void;               // Force unlock (cancel one-shot early)
  destroy(): void;
}

// Helper: create Texture[] from numbered frames (e.g. player_run_1.png to _6.png)
function createFrames(baseName: string, start: number, end: number, padZero?: number): Texture[];

// Helper: create Texture[] from a horizontal sprite strip PNG
function createFramesFromStrip(
  textureAlias: string,
  frameWidth: number,
  frameHeight: number,
  frameCount: number
): Texture[];
```

**Usage:**
```ts
const animator = new Animator();

// From individual frames
animator.add('run', createFrames('player_run_', 1, 6), 0.15);

// From a sprite strip
const frames = createFramesFromStrip('orb_rotate', 10, 10, 7);
animator.add('idle', [frames[0]!], 1, false);
animator.add('spin', frames, 0.15, false);

// From Aseprite spritesheet
const sheet = ctx.assets.spritesheet('player');
animator.add('walk', { sheet, animation: 'walk' }, 0.12);

// In update loop
animator.play('run');    // Continuously — safe to call every frame

// One-shot (locks the state machine until done)
animator.playOnce('attack', () => {
  animator.play('idle');  // Resumes after attack finishes
});

// Add to entity
entity.view.addChild(animator.sprite);
```

---

### 6.11 Physics & Math Utilities
**File:** `src/core/physics.ts`

Standalone pure functions — no classes, no state.

#### Collision Detection

```ts
// AABB rectangle overlap
function checkAABB(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean;

// Circle-circle intersection
function checkCircleIntersection(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number
): boolean;

// Point inside rectangle
function isPointInRect(
  px: number, py: number,
  rx: number, ry: number, rw: number, rh: number
): boolean;
```

#### Spatial Math

```ts
function getDistance(x1: number, y1: number, x2: number, y2: number): number;
function normalizeVector(vx: number, vy: number): { x: number; y: number };
function getAngle(x1: number, y1: number, x2: number, y2: number): number;  // radians
function degToRad(degrees: number): number;
function radToDeg(radians: number): number;
```

#### Math Helpers

```ts
function clamp(value: number, min: number, max: number): number;
function lerp(start: number, end: number, t: number): number;
function randomFloat(min: number, max: number): number;
function randomInt(min: number, max: number): number;      // inclusive on both ends
function randomElement<T>(arr: T[]): T;
```

#### Bouncing Logic

```ts
// Reflect velocity on wall hit
function reflectVector(
  vx: number, vy: number,
  isHorizontalWall: boolean,   // top/bottom → invert Y
  isVerticalWall: boolean      // left/right → invert X
): { x: number; y: number };

// Reflect + clamp position within bounds
function reflectOffBounds(
  x: number, y: number, vx: number, vy: number,
  width: number, height: number,          // object size
  boundsWidth: number, boundsHeight: number,
  bounciness?: number                     // Default 1
): { x: number; y: number; vx: number; vy: number };
```

---

### 6.12 Timer System
**File:** `src/core/timer.ts`

Game-loop-synced timers. Pauses when the game pauses. **Not** wall-clock time.

```ts
// Execute callback once after `duration` seconds
function wait(duration: number, callback: () => void): number;   // returns timer ID

// Execute callback every `duration` seconds
function every(duration: number, callback: () => void): number;  // returns timer ID

// Cancel a specific timer
function clearTimer(id: number): void;

// Cancel all timers
function clearAll(): void;

// Advance all timers — called by main loop, don't call manually
function update(dt: number): void;
```

**Usage:**
```ts
import * as timer from '../../core/timer';

// Spawn enemies every 3 seconds
const spawnTimer = timer.every(3, () => this.spawnEnemy());

// Countdown before round starts
timer.wait(1.5, () => { this.state = 'playing'; });

// Clean up in exit()
timer.clearTimer(spawnTimer);
// or timer.clearAll();
```

---

### 6.13 EventBus
**File:** `src/core/events.ts`

Global pub/sub for decoupled communication between systems. Avoids tight coupling (e.g. gameplay code doesn't need to call `audio.play()` directly).

```ts
class EventBus {
  on(event: string, listener: (...args: any[]) => void): void;
  once(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
  clear(event?: string): void;    // No args = wipe ALL listeners
}
```

**Usage:**
```ts
// In scene enter() — subscribe
this.ctx.events.on('ENEMY_KILLED', (x: number, y: number, points: number) => {
  this.score += points;
  this.particles.emit(x, y, { count: 8, color: 0xff0000 });
  this.ctx.audio.play('explosion');
});

// In game logic — emit
this.ctx.events.emit('ENEMY_KILLED', enemy.x, enemy.y, 100);

// In scene exit() — CRITICAL: clean up to prevent memory leaks!
this.ctx.events.clear('ENEMY_KILLED');
```

**Built-in events** emitted by SceneManager:
- `SCENE_EXIT` — `(sceneName: string)` — fired before a scene's `exit()` is called
- `SCENE_START` — `(sceneName: string, data?: SceneData)` — fired after a scene's `enter()` completes

---

### 6.14 UIManager
**File:** `src/core/ui.ts`

Manages HTML overlay layers for menus, HUD, and game-over screens. HTML elements sit on top of the canvas.

```ts
class UIManager {
  addLayer(id: string, html?: string): HTMLDivElement;  // Create a named UI layer
  getLayer(id: string): HTMLDivElement | undefined;
  show(id: string): void;           // Set display: flex
  hide(id: string): void;           // Remove display style
  hideAll(): void;                   // Called automatically on scene transition

  setText(selector: string, text: string): void;   // Set textContent by CSS selector
  onClick(selector: string, handler: () => void): void;  // Bind click handler
  on(selector: string, event: string, handler: EventListener): void;  // Any event
  removeAllListeners(): void;

  query<T extends Element>(selector: string): T | null;   // querySelector within UI root
  destroy(): void;
}
```

**Defining UI layers** (in `src/game/ui-layers.ts`):
```ts
export function registerUILayers(ui: UIManager): void {
  ui.addLayer('main-menu', `
    <h1 id="menu-title">MY GAME</h1>
    <button class="menu-btn" id="play-btn">PLAY</button>
  `);

  ui.addLayer('hud', '<div id="hud-score">0</div>');

  ui.addLayer('game-over', `
    <div id="gameover-text"></div>
    <button class="menu-btn" id="restart-btn">RESTART</button>
  `);
}
```

**Using in scenes:**
```ts
// Show a layer
this.ctx.ui.show('hud');

// Update text
this.ctx.ui.setText('#hud-score', `Score: ${this.score}`);

// Bind button clicks
this.ctx.ui.onClick('#play-btn', () => {
  this.ctx.sceneManager.transitionTo(PlayScene, undefined, true);
});
```

**Styling:** UI layers are styled via `src/style.css`. Each layer gets the CSS class `ui-layer`.

---

### 6.15 StorageManager
**File:** `src/core/storage.ts`

Crash-proof, namespaced localStorage wrapper. Auto-serializes JSON.

```ts
class StorageManager {
  constructor(prefix: string);   // Namespace prefix (e.g. 'mygame_')

  save(key: string, data: any): void;           // JSON.stringify + store
  load<T>(key: string, defaultValue: T): T;     // Parse or return default
  remove(key: string): void;                     // Delete one key
  wipe(): void;                                  // Delete ALL keys with this prefix

  // Rate-limited save — at most once per delayMs (default 1000ms)
  throttledSave(key: string, data: any, delayMs?: number): void;
}
```

**Usage:**
```ts
// Save high score
this.ctx.storage.save('highscore', 9999);

// Load with fallback
const best = this.ctx.storage.load('highscore', 0);

// Throttled auto-save for rapidly changing state
this.ctx.storage.throttledSave('player_pos', { x: player.x, y: player.y }, 500);

// Reset all saved data
this.ctx.storage.wipe();
```

The StorageManager is initialized in `main.ts` with the prefix `'gamejam_'`. Change this prefix in `main.ts` to namespace your game's saves.

---

### 6.16 DebugOverlay
**File:** `src/core/debug.ts`

Press **backtick (`)** to toggle. Shows FPS, delta time, current scene name, object count, active filter preset, and render mode.

```ts
class DebugOverlay {
  toggle(): void;
  setScene(name: string): void;           // Called automatically by SceneManager
  setFilterPreset(name: string): void;
  setRenderMode(mode: string): void;
  update(entityCount?: number): void;     // Called by main loop
}
```

---

### 6.17 Retro Filters
**File:** `src/core/filters.ts`

Two-pass post-processing stack: bloom on the world (low-res), CRT + RGB split on the screen (high-res).

```ts
interface RetroFilterConfig {
  bloomThreshold?: number;    // 0–1, lower = more glow. Default 0.5
  bloomScale?: number;        // Bloom strength. Default 0.8
  crtLineContrast?: number;   // Scanline visibility 0–1. Default 0.15
  crtVignetting?: number;     // Edge darkening 0–1. Default 0.3
  crtCurvature?: number;      // Screen curve. Default 2
  rgbSplitOffset?: number;    // Chromatic aberration in px. Default 2, 0 disables
  noBloom?: boolean;          // Disable bloom. Default false
  noCRT?: boolean;            // Disable CRT + RGB split. Default false
}

// Apply or replace the filter stack
function applyRetroFilters(viewport: Viewport, config?: RetroFilterConfig): void;

// Animate CRT noise per frame — called by main loop
function updateFilters(dt: number): void;
```

**Presets** are defined in `src/game/config.ts`:
```ts
export const FILTER_PRESETS: { name: string; config: RetroFilterConfig }[] = [
  { name: 'sharp',   config: { noBloom: true,  noCRT: true } },
  { name: 'minimal', config: { noCRT: true, bloomThreshold: 0.6, bloomScale: 0.5 } },
  { name: 'crt',     config: { bloomThreshold: 0.5, bloomScale: 0.6, crtLineContrast: 0.12, rgbSplitOffset: 0 } },
  { name: 'full',    config: { bloomThreshold: 0.45, bloomScale: 0.9, crtLineContrast: 0.14 } },
];
```

**Runtime hotkeys:**
- **F1** — cycle filter preset (sharp → minimal → crt → full)
- **F2** — cycle render mode (retro → native → native-res)

---

### 6.18 Settings Menu
**File:** `src/core/settings-ui.ts`

Glassmorphism modal for in-game settings. Controls master volume, mute, render mode, and graphics quality. Persists choices via StorageManager.

```ts
class SettingsMenu {
  constructor(ctx: AppContext, config: SettingsConfig);
  show(): void;
  hide(): void;
}

interface SettingsConfig {
  presets: string[];
  onPresetChange: (index: number) => void;
  onRenderModeChange: (mode: RenderMode) => void;
}
```

Already wired in `main.ts`. To open it from a UI button:
```ts
ui.onClick('#settings-btn', () => settingsMenu.show());
```

---

## 7. Critical Rules & Error Avoidance

### Rule 1: Dynamic UI & Storage Synchronization

When using `StorageManager` to track game state (like scores), **always update the UI layer immediately when the value changes.** Retrieving scores only inside `scene.enter()` is a common pitfall that causes "ghost scores" — the StorageManager updates correctly but the UI shows `0:0`.

```ts
// WRONG — only reads on enter, UI never updates
enter(): void {
  this.score = this.ctx.storage.load('score', 0);
  this.ctx.ui.setText('#score', `${this.score}`);
}

// CORRECT — update UI every time the score changes
private addScore(points: number): void {
  this.score += points;
  this.ctx.storage.save('score', this.score);
  this.ctx.ui.setText('#score', `${this.score}`);  // <- update UI immediately!
}
```

### Rule 2: Never Overwrite RESOLUTION Before Viewport

The `native-res` render mode works by overwriting the global `RESOLUTION` object. **Never manually call `matchDeviceResolution(RESOLUTION)` or overwrite `RESOLUTION.w`/`RESOLUTION.h` before instantiating `Viewport`.**

If you do, the Viewport snapshots the huge device dimensions as its base logical size, permanently breaking the scaling math. Always:
1. Create `Viewport` with your constant `RENDER_MODE` (or `'retro'`)
2. Then call `viewport.setRenderMode('native-res')` to hot-swap safely

This is already handled correctly in `main.ts`. Don't change the initialization order.

### Rule 3: Read RESOLUTION Inside enter(), Not at Module Scope

In `native-res` mode, `RESOLUTION` is mutated at runtime. If you cache it in a module-level constant:
```ts
// WRONG — captures 320x180 at import time, never updates
const W = RESOLUTION.w;
```

Instead, read it fresh inside `enter()`:
```ts
// CORRECT — gets the current value on each scene entry
enter(): void {
  const W = RESOLUTION.w;
  const H = RESOLUTION.h;
}
```

### Rule 4: Clean Up EventBus Listeners in exit()

Every `events.on()` call in `enter()` must have a matching `events.clear()` in `exit()`. Otherwise listeners stack up across scene transitions and cause memory leaks + duplicate side effects.

```ts
enter(): void {
  this.ctx.events.on('ENEMY_KILLED', this.onEnemyKilled);
}

exit(): void {
  this.ctx.events.clear('ENEMY_KILLED');
}
```

### Rule 5: Clean Up Timers in exit()

Same as events — `timer.every()` and `timer.wait()` keep running across scene transitions unless explicitly cleared.

```ts
exit(): void {
  timer.clearTimer(this.spawnTimerId);
  // or timer.clearAll() if you own all active timers
}
```

### Rule 6: core/ Never Imports from game/

This is the architectural contract. All game-specific code stays in `src/game/`. The engine (`src/core/`) is game-agnostic and must never reference anything in `game/`. If you need to add a new core system, add it to `core/` and wire it into `AppContext` in `types.ts` and `main.ts`.

### Rule 7: Set TextureSource.defaultOptions.scaleMode Before Any Texture Load

Already done in `main.ts` line 1 of bootstrap. Don't move or remove:
```ts
TextureSource.defaultOptions.scaleMode = 'nearest';
```
This ensures all textures use nearest-neighbor filtering (pixel-art requirement). If set after any asset loads, those assets will use bilinear and look blurry.

---

## 8. Step-by-Step: Building a Game

The demo has been removed. The game layer is clean skeletons. This walks through filling them in, using a hypothetical Space Invaders as an example.

### Step 1: Define Your Config

Edit `src/game/config.ts`:

```ts
export const RENDER_MODE: 'retro' | 'native' | 'native-res' = 'retro';
export const RESOLUTION = { w: 256, h: 224 };   // NES resolution
export const TITLE = 'SPACE INVADERS';

export const PALETTE = {
  bg: 0x000000,
  fg: 0xffffff,
  accent: 0x00ff00,
  enemy: 0xff0000,
  bullet: 0xffff00,
} as const;

export const GAME = {
  playerSpeed: 80,
  bulletSpeed: 150,
  enemyRows: 5,
  enemyCols: 8,
  enemyDropSpeed: 8,
} as const;
```

### Step 2: Prepare Assets

1. Create/export your sprites (Aseprite recommended)
2. Drop files into `public/assets/sprites/`
3. Drop audio into `public/assets/audio/`
4. Edit `src/game/manifest.ts`:

```ts
export const ASSET_MANIFEST: AssetManifestItem[] = [
  { alias: 'player_ship', src: '/assets/sprites/player_ship.json' },
  { alias: 'invader', src: '/assets/sprites/invader.json' },
  { alias: 'bullet', src: '/assets/sprites/bullet.png' },
];
```

### Step 3: Register Audio in BootScene

Edit `src/game/scenes/BootScene.ts` inside `_load()`:

```ts
this.ctx.audio.register('shoot', { src: ['/assets/audio/shoot.mp3'] });
this.ctx.audio.register('explosion', { src: ['/assets/audio/explosion.mp3'] });
this.ctx.audio.register('music', { src: ['/assets/audio/invaders_bgm.mp3'], loop: true, volume: 0.4 });
```

### Step 4: Define UI Layers

Edit `src/game/ui-layers.ts`:

```ts
export function registerUILayers(ui: UIManager): void {
  ui.addLayer('main-menu', `
    <div class="menu-container">
      <h1 class="menu-title" id="menu-title"></h1>
      <button class="menu-btn" id="play-btn">START</button>
      <button class="menu-btn" id="settings-btn">SETTINGS</button>
    </div>
  `);

  ui.addLayer('hud', `
    <div class="hud-score" id="hud-score">SCORE: 0</div>
    <div class="hud-lives" id="hud-lives">LIVES: 3</div>
  `);

  ui.addLayer('game-over', `
    <div class="gameover-container">
      <div class="gameover-text" id="gameover-text">GAME OVER</div>
      <div id="final-score"></div>
      <button class="menu-btn" id="restart-btn">RETRY</button>
    </div>
  `);
}
```

### Step 5: Create Entities

Create `src/game/entities/Player.ts`:

```ts
import { Entity } from '../../core/entity';
import { Sprite, Texture } from 'pixi.js';

export class Player extends Entity {
  constructor(texture: Texture) {
    super();
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    this.view.addChild(sprite);
    this.set('speed', 80);
  }
}
```

Create `src/game/entities/Invader.ts`, `Bullet.ts`, etc. in the same pattern.

### Step 6: Create Your PlayScene

Create `src/game/scenes/PlayScene.ts`:

```ts
import { Graphics } from 'pixi.js';
import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';
import { GAME, PALETTE, RESOLUTION } from '../config';
import { Player } from '../entities/Player';
import { ParticleSystem } from '../../core/particles';
import * as timer from '../../core/timer';
import { MenuScene } from './MenuScene';

export class PlayScene extends Scene {
  private player!: Player;
  private particles!: ParticleSystem;
  private score = 0;
  private lives = 3;

  constructor(private readonly ctx: AppContext) { super(); }

  enter(): void {
    const W = RESOLUTION.w;
    const H = RESOLUTION.h;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    this.container.addChild(bg);

    // Player
    const tex = this.ctx.assets.texture('player_ship');
    this.player = new Player(tex);
    this.player.view.position.set(W / 2, H - 20);
    this.container.addChild(this.player.view);

    // Particles
    this.particles = new ParticleSystem(256);
    this.container.addChild(this.particles.container);

    // HUD
    this.ctx.ui.show('hud');
    this.ctx.ui.setText('#hud-score', `SCORE: ${this.score}`);
    this.ctx.ui.setText('#hud-lives', `LIVES: ${this.lives}`);

    // Events
    this.ctx.events.on('ENEMY_KILLED', (x: number, y: number) => {
      this.score += 100;
      this.ctx.ui.setText('#hud-score', `SCORE: ${this.score}`);
      this.particles.emit(x, y, { count: 8, color: PALETTE.enemy });
      this.ctx.audio.play('explosion');
    });

    // Music
    this.ctx.audio.play('music');
  }

  exit(): void {
    this.particles.destroy();
    this.ctx.events.clear('ENEMY_KILLED');
    this.ctx.audio.stop('music');
  }

  update(dt: number): void {
    const { input } = this.ctx;
    const speed = this.player.get<number>('speed');

    if (input.isDown('ArrowLeft'))  this.player.view.x -= speed * dt;
    if (input.isDown('ArrowRight')) this.player.view.x += speed * dt;
    if (input.isPressed('Space'))   this.shoot();
  }

  private shoot(): void {
    this.ctx.audio.play('shoot');
    // ... create bullet entity, add to container
  }
}
```

### Step 7: Wire Scene Flow

In your `MenuScene`, transition to your new `PlayScene`:
```ts
this.ctx.ui.onClick('#play-btn', () => {
  this.ctx.sceneManager.transitionTo(PlayScene, undefined, true);
});
```

### Step 8: Style Your UI

Edit `src/style.css` to match your game's aesthetic. The UI layers use standard CSS — flexbox, positioning, fonts, colors, etc.

### Step 9: Run and Iterate

```bash
npm run dev
```

Press **backtick** for debug overlay, **F1** for filter cycling, **F2** for render mode cycling.

---

## 9. Rapid Development Cheatsheet

### Minimal Scene Template
```ts
import { Graphics } from 'pixi.js';
import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';
import { PALETTE, RESOLUTION } from '../config';

export class MyScene extends Scene {
  constructor(private readonly ctx: AppContext) { super(); }

  enter(): void {
    const W = RESOLUTION.w;
    const H = RESOLUTION.h;
    const scale = this.ctx.viewport.logicalScale;

    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill({ color: PALETTE.bg });
    this.container.addChild(bg);
  }

  exit(): void {
    // Clean up events, timers, particles
  }

  update(dt: number): void {
    // Game logic here. dt is in seconds.
  }
}
```

### Minimal Entity Template
```ts
import { Entity } from '../../core/entity';
import { Sprite, Texture } from 'pixi.js';

export class MyEntity extends Entity {
  constructor(texture: Texture, x: number, y: number) {
    super();
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    this.view.addChild(sprite);
    this.view.position.set(x, y);
  }
}
```

### Common Patterns

**Grid-based movement:**
```ts
const grid = new GridManager<number>(cols, rows, cellSize, 0, 0, 0);
// Move on grid, render with lerp
update(dt: number): void {
  const target = this.grid.toWorld(this.col, this.row);
  this.view.x = lerp(this.view.x, target.x, 10 * dt);
  this.view.y = lerp(this.view.y, target.y, 10 * dt);
}
```

**Free-form movement with bounds:**
```ts
update(dt: number): void {
  this.x += this.vx * dt;
  this.y += this.vy * dt;
  const result = reflectOffBounds(this.x, this.y, this.vx, this.vy, w, h, boundsW, boundsH);
  Object.assign(this, result);
}
```

**Timed spawning:**
```ts
import * as timer from '../../core/timer';
const id = timer.every(2, () => this.spawnEnemy());
// Clean up: timer.clearTimer(id);
```

**GSAP tweening (available via ctx.gsap):**
```ts
this.ctx.gsap.to(sprite, { alpha: 0, y: sprite.y - 20, duration: 0.5, onComplete: () => sprite.destroy() });
```

**Scoring with immediate UI sync:**
```ts
this.score += points;
this.ctx.storage.save('score', this.score);
this.ctx.ui.setText('#hud-score', `SCORE: ${this.score}`);
```

### Files to Fill In (all currently skeletons)

| File | Status | What to add |
|------|--------|-------------|
| `src/game/config.ts` | Has defaults | Your TITLE, PALETTE colors, GAME constants |
| `src/game/manifest.ts` | Empty array | Your asset entries after dropping files into `public/assets/` |
| `src/game/ui-layers.ts` | Generic skeleton | Customize HTML for your menus, HUD, overlays |
| `src/game/scenes/BootScene.ts` | Working, audio commented out | Uncomment and add your `audio.register()` calls |
| `src/game/scenes/MenuScene.ts` | Working skeleton | Add your menu visuals, instructions |
| `src/game/scenes/PlayScene.ts` | Empty (bg + Escape key only) | Your entire gameplay |
| `src/game/entities/` | Empty directory | Create your entity classes (Player.ts, Enemy.ts, etc.) |
| `src/style.css` | Has base styles | Adjust UI styling to match your game |
| `public/assets/` | Has leftover demo files | Drop your sprites, audio, fonts here |

### Files You Should NOT Edit

| File | Why |
|------|-----|
| `src/core/*` | Engine layer — game-agnostic, fully working |
| `src/main.ts` | Wiring is correct. Only edit to add a new core system to AppContext. |
| `index.html` | Just a canvas + script tag. Nothing to change. |

### Runtime Debug Keys

| Key | Action |
|-----|--------|
| `` ` `` (backtick) | Toggle debug overlay (FPS, scene, object count) |
| `F1` | Cycle filter preset (sharp → minimal → crt → full) |
| `F2` | Cycle render mode (retro → native → native-res) |

## 10. Battleship Architecture & Implementation

The game logic is strictly decoupled from the PixiJS rendering layer. This ensures that features like Networked Multiplayer, AI opponents, and custom rule sets can be added later without rewriting the visual layer or input handling.

### Core Logic (`src/game/logic/`)
Pure TypeScript classes with zero knowledge of PixiJS, canvas, or screen coordinates.

*   **`Ship.ts`**: Defines a ship via an array of relative coordinates (`Point[]`). By default, it generates a straight line, but this structure naturally supports custom shapes (T-shapes, L-shapes, or blocks). It tracks its own hits and calculates absolute coordinates based on a starting grid position and `Orientation`.
*   **`BoardState.ts`**: Manages the grid.
    *   `canPlaceShip()` handles the core Battleship placement rules: bounds checking, overlap checking, and strict adjacency checking (ships cannot touch even diagonally).
    *   `receiveShot()` processes coordinates and returns `ShotResult` (HIT, MISS, SUNK, INVALID).
*   **`GameController.ts`**: The state machine. Manages the `TurnPhase` (Placement -> Combat) and the active `BoardState`. 
    *   **Rule Enforcement:** Handles the logic that a player gets an *extra turn* upon scoring a HIT or SUNK. Transitions to `GAME_OVER` when a board is wiped.

### Visual Layer (`src/game/entities/`)
PixiJS classes that read from the Core Logic to render the state.

*   **`ShipVisual.ts`**: A Pixi `Container` representing a physical ship. Hooked up with `gsap` for idle bobbing and sinking animations.
*   **`GridRenderer.ts`**: Renders the background, grid lines, coordinates, ships, and hit/miss pegs. 
    *   **Interactions:** Handles PixiJS native pointer events (`pointermove`, `pointerdown`, `pointerleave`) on a `static` event mode.
    *   **Ghost Cursors:** Draws valid (green) or invalid (red) highlights during placement based on `BoardState.canPlaceShip()`.
    *   **Text Rendering:** To keep text crisp in low-res "native" modes, it renders labels at a large font size (32px) and scales the text object down using `.scale.set()`.
    *   **Visibility Toggle:** Uses a `showHiddenShips` boolean to instantly hide/reveal ships based on whose turn it is.

### Integration (`src/game/scenes/PlayScene.ts`)
The glue tying logic and visuals together.
*   Initializes the `GameController` and two `GridRenderer`s.
*   Manages the hot-seat multiplayer view, intercepting turns with a `pass-device` HTML UI overlay to prevent players from seeing each other's boards.
*   Captures right-click and spacebar inputs for ship rotation.
*   Passes grid coordinates clicked by the user into the `GameController`, then forces a visual update on the active `GridRenderer`.
