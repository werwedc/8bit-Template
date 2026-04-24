/**
 * Pixi v8 Application bootstrap.
 *
 * IMPORTANT: TextureSource.defaultOptions.scaleMode = 'nearest' MUST be set
 * before this function is called (done in main.ts) so every texture loaded
 * afterwards defaults to nearest-neighbour — the pixel-art requirement.
 *
 * Render-mode differences:
 *   'retro'      — resolution:1 + autoDensity:false prevents DPR scaling.
 *                  Never use devicePixelRatio for the RT pipeline — it would blur
 *                  the pixelated upscale. CSS image-rendering: pixelated handles crispness.
 *   'native'     — resolution:devicePixelRatio + autoDensity:true so the canvas
 *                  backing buffer matches the physical display pixels. The world
 *                  container is scaled fractionally by Viewport; no RT is used.
 *   'native-res' — same Pixi init as 'native' (DPR-aware, autoDensity). The
 *                  difference is upstream: RESOLUTION is pre-set to physical
 *                  device pixels so Viewport uses scale=1 (no fractional scaling).
 */

import { Application } from 'pixi.js';
import type { RenderMode } from './viewport';

export async function createPixiApp(renderMode: RenderMode = 'retro'): Promise<Application> {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

  const app = new Application();

  // Binary switch: the retro RT path wants resolution:1 / no DPR / snapped pixels.
  // Everything else ('native', 'native-res') wants DPR-aware rendering.
  const retroPath = renderMode === 'retro';

  await app.init({
    canvas,
    // Retro:     resolution:1   + autoDensity:false → no DPR scaling, RT pipeline is crisp
    // Non-retro: resolution:dpr + autoDensity:true  → canvas renders at full display resolution
    resolution: retroPath ? 1 : (window.devicePixelRatio ?? 1),
    autoDensity: !retroPath,
    antialias: false,
    // roundPixels in retro mode snaps sprites to whole logical pixels.
    // In non-retro modes fractional positions are intentional (sub-pixel accuracy).
    roundPixels: retroPath,
    backgroundColor: 0x000000,
    // Use the full window; Viewport handles letterboxing internally.
    width: window.innerWidth,
    height: window.innerHeight,
    resizeTo: window,
  });

  return app;
}
