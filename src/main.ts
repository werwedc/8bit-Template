/**
 * main.ts — entry point. ~30 lines of wiring; game logic stays in game/.
 *
 * Startup sequence:
 *   1. Set nearest-neighbour scaling BEFORE any texture loads
 *   2. If RENDER_MODE === 'native-res', overwrite RESOLUTION to device pixels
 *   3. Create Pixi Application (async in v8)
 *   4. Instantiate all core systems and wire into AppContext
 *   5. Apply retro filter stack
 *   6. Start the game loop (Pixi ticker)
 *   7. Hand off to BootScene
 *
 * Runtime hotkeys (bound below in the keydown handler):
 *   F1         cycle filter preset (FILTER_PRESETS in game/config.ts)
 *   F2         cycle render mode  (retro → native → native-res → retro …)
 *   Backtick   toggle DebugOverlay (FPS / scene / object count) — see core/debug.ts
 *
 * Game-layer tunables:
 *   game/config.ts → RENDER_MODE, RESOLUTION, PALETTE, GAME, FILTER_PRESETS
 */

import { TextureSource } from 'pixi.js';
import { createPixiApp } from './core/app';
import { Viewport, matchDeviceResolution } from './core/viewport';
import { InputManager } from './core/input';
import { AudioManager } from './core/audio';
import { AssetManager } from './core/assets';
import { SceneManager } from './core/scene';
import { DebugOverlay } from './core/debug';
import { UIManager } from './core/ui';
import { Camera } from './core/camera';
import { gsap } from 'gsap';
import { applyRetroFilters, updateFilters } from './core/filters';
import type { AppContext } from './core/types';
import {
  DEFAULT_FILTER_PRESET,
  FILTER_PRESETS,
  RENDER_MODE,
  RESOLUTION,
} from './game/config';
import { BootScene } from './game/scenes/BootScene';
import { registerUILayers } from './game/ui-layers';
import * as timer from './core/timer';

// ── Pixel-perfect layer 1: nearest-neighbour scaling BEFORE any Assets.load ──
// TextureSource.defaultOptions must be set before the Application initialises.
TextureSource.defaultOptions.scaleMode = 'nearest';

async function main(): Promise<void> {
  // ── Bootstrap ──────────────────────────────────────────────────────────────
  // 'native-res' overwrites RESOLUTION to the device's physical pixel size
  // BEFORE any scene or entity reads it. RESOLUTION is a shared mutable object,
  // so every import in the game layer sees the updated dimensions automatically.
  if (RENDER_MODE === 'native-res') {
    matchDeviceResolution(RESOLUTION);
  }

  const app = await createPixiApp(RENDER_MODE);

  // Set canvas image-rendering based on render mode.
  // 'pixelated' keeps the integer-upscaled RT crisp in retro mode.
  // 'auto' lets the browser use smooth scaling in native / native-res modes
  // (DPR-aware canvas; no integer upscale to preserve).
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  canvas.style.imageRendering = RENDER_MODE === 'retro' ? 'pixelated' : 'auto';
  canvas.addEventListener('click', () => window.focus());

  // Log WebGL context loss so the specific sizes at failure are visible in
  // devtools — Firefox in particular loses the context on big native-res
  // windows when the total filter/backbuffer budget exceeds its driver limit.
  canvas.addEventListener('webglcontextlost', (e) => {
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    const maxTex = gl?.getParameter(gl.MAX_TEXTURE_SIZE) ?? 'unknown';
    console.error('[webgl] context lost', {
      mode: RENDER_MODE,
      window: { w: window.innerWidth, h: window.innerHeight },
      dpr: window.devicePixelRatio,
      resolution: { w: RESOLUTION.w, h: RESOLUTION.h },
      maxTextureSize: maxTex,
      userAgent: navigator.userAgent,
    });
    e.preventDefault();
  });

  const viewport = new Viewport(app, RESOLUTION, RENDER_MODE);
  const camera = new Camera(viewport.world);
  const input = new InputManager();
  const audio = new AudioManager();
  const assets = new AssetManager();
  const debug = new DebugOverlay(app);
  const ui = new UIManager();

  window.focus();

  // Assemble the context passed to every Scene constructor.
  // sceneManager is assigned immediately after creation (two-step init).
  const ctx = { app, viewport, camera, input, audio, assets, gsap, debug, ui } as AppContext;
  const sceneManager = new SceneManager(ctx);
  ctx.sceneManager = sceneManager;
  registerUILayers(ui);

  // ── Retro filter stack (see core/filters.ts for tuning options) ────────────
  // Presets are defined in game/config.ts. Press F1 at runtime to cycle them
  // (handy if the bloom/CRT softness reads as blur over your pixel art).
  let presetIndex = DEFAULT_FILTER_PRESET % FILTER_PRESETS.length;
  const applyPreset = (i: number): void => {
    presetIndex = ((i % FILTER_PRESETS.length) + FILTER_PRESETS.length) % FILTER_PRESETS.length;
    const preset = FILTER_PRESETS[presetIndex]!;
    applyRetroFilters(viewport, preset.config);
    debug.setFilterPreset(preset.name);
  };
  applyPreset(presetIndex);
  debug.setRenderMode(viewport.renderMode);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'F1') {
      e.preventDefault();
      applyPreset(presetIndex + 1);
    }

    // F2 — cycle render modes: retro → native → native-res → retro …
    //   retro       RT + integer-upscale, pixelated canvas
    //   native      Direct world, fractional scale, DPR-aware canvas
    //   native-res  Direct world, scale=1/DPR; RESOLUTION is mutated to device pixels
    //
    // When swapping in/out of 'native-res' the logical coordinate space
    // actually changes size, so we re-enter the current scene. Scenes read
    // RESOLUTION inside enter() (see demo's Menu/Play/BootScene) and get
    // rebuilt with the new dimensions.
    if (e.code === 'F2') {
      e.preventDefault();
      const cycle: Array<'retro' | 'native' | 'native-res'> = ['retro', 'native', 'native-res'];
      const prevMode = viewport.renderMode;
      const newMode = cycle[(cycle.indexOf(prevMode) + 1) % cycle.length]!;
      const resolutionChanged = prevMode === 'native-res' || newMode === 'native-res';

      viewport.setRenderMode(newMode);
      // Update canvas image-rendering: pixelated for the RT upscale, auto otherwise
      canvas.style.imageRendering = newMode === 'retro' ? 'pixelated' : 'auto';
      // Re-apply filters — filterLayer changed, so the filter stack must move to the new target
      applyPreset(presetIndex);
      debug.setRenderMode(newMode);

      // Only re-enter the scene when the logical space actually changed size;
      // swapping retro↔native keeps the 320×180 layout so a rebuild would be wasted.
      if (resolutionChanged) sceneManager.reenter();
    }
  });

  // ── Main game loop ─────────────────────────────────────────────────────────
  // Order matters:
  //   1. scene.update  — game logic mutates world
  //   2. camera.update — applies screen-shake offset
  //   3. viewport.render — blits world container → RenderTexture
  //   4. updateFilters   — animates CRT noise/scanlines
  //   5. input.update    — snapshots prevKeys (MUST be last)
  //   → Pixi auto-renders app.stage (filterLayer / world) to canvas
  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;

    timer.update(dt);
    sceneManager.update(dt);
    camera.update(dt);
    viewport.render();
    updateFilters(dt);
    input.update();

    debug.update(viewport.world.children.length);
  });

  // ── Start ──────────────────────────────────────────────────────────────────
  sceneManager.transitionTo(BootScene);
}

main().catch(console.error);
