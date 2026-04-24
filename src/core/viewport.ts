/**
 * Viewport — handles both the classic retro pipeline and native-resolution mode,
 * and supports hot-swapping between them at runtime (F2 in the demo).
 *
 * ── Retro mode ───────────────────────────────────────────────────────────────
 *   world (Container) → RenderTexture (e.g. 320×180) → _rtSprite (integer-upscaled) → stage
 *
 *   All game objects live in `world`. Each frame, `render()` blits world into
 *   the low-res RT. Pixi's auto-render draws stage (_rtSprite) to the canvas.
 *   image-rendering: pixelated on the canvas keeps every pixel crisp.
 *
 * ── Native mode ──────────────────────────────────────────────────────────────
 *   world (Container) → _nativeContainer (fractional-scaled) → stage
 *
 *   No intermediate RenderTexture. The world container is scaled directly to
 *   fill the window. Pixi is initialised with devicePixelRatio so the canvas
 *   renders at full display resolution ("modern Pac-Man / Tetris" approach).
 *
 * ── Native-res mode ──────────────────────────────────────────────────────────
 *   world (Container) → _nativeContainer (scale 1/DPR, no offset) → stage
 *
 *   True native resolution: RESOLUTION is overwritten to the device's physical
 *   pixel dimensions (innerWidth × DPR, innerHeight × DPR) via matchDeviceResolution().
 *   The container is scaled by 1/DPR because Pixi's coordinate space is CSS
 *   pixels (autoDensity:true + resolution:DPR) — this maps the huge logical
 *   world onto the CSS-sized canvas so one logical pixel == one device pixel.
 *   No RT, no letterboxing.
 *
 *   Can be the startup mode OR hot-swapped at runtime (F2). On hot-swap,
 *   setRenderMode() mutates the shared Resolution object; swapping back to
 *   retro/native restores the original logical dimensions. Note that scenes
 *   which read RESOLUTION only at construction time (via module-level consts)
 *   won't reflow automatically — re-enter the scene to pick up new dimensions.
 *
 * ── Retro filter stack (applied in filters.ts) ──────────────────────────────
 *   - AdvancedBloomFilter on `world`       → chunky low-res glow (retro)
 *                                          → smooth screen-res glow (native)
 *   - CRTFilter + RGBSplitFilter on `filterLayer` → scanlines/aberration
 *
 * ── Hot-swap ─────────────────────────────────────────────────────────────────
 *   Both display paths are created upfront. setRenderMode() swaps which one
 *   is on stage and recalculates the scale. Call applyRetroFilters() afterwards
 *   so the filter stack moves to the new filterLayer.
 *
 * NOTE: Pixi's resolution/autoDensity are fixed at app init time, so the DPR
 * benefit of native mode only takes effect when the app is started in that mode.
 * The visual difference (integer vs fractional scale, pixelated vs auto CSS) is
 * still clearly visible when hot-swapping.
 */

import { Container, Rectangle, RenderTexture, Sprite } from 'pixi.js';
import type { Application } from 'pixi.js';

export type RenderMode = 'retro' | 'native' | 'native-res';

export interface Resolution {
  w: number;
  h: number;
}

/**
 * Overwrite a Resolution to match the device's physical pixel dimensions.
 * Call at startup BEFORE constructing Viewport and before any scene reads
 * RESOLUTION. Uses window.innerWidth/Height × devicePixelRatio so the game
 * world renders 1:1 with screen pixels.
 *
 * Mutates in place so every module that already imports the shared
 * RESOLUTION object sees the new values without any refactor.
 */
export function matchDeviceResolution(resolution: Resolution): void {
  const dpr = window.devicePixelRatio ?? 1;
  resolution.w = Math.max(1, Math.floor(window.innerWidth * dpr));
  resolution.h = Math.max(1, Math.floor(window.innerHeight * dpr));
}

export class Viewport {
  /** Add all game objects here — the logical game world. */
  readonly world: Container = new Container();

  // Both display paths created upfront so setRenderMode() can swap without
  // rebuilding anything. Only the active one is on app.stage at any time.
  private readonly _rtSprite: Sprite;
  private readonly _nativeContainer: Container;
  private readonly rt: RenderTexture;
  private _renderMode: RenderMode;

  // Snapshot of the logical dimensions as they were at construction time.
  // Used to restore `resolution` when hot-swapping OUT of 'native-res' (which
  // mutates `resolution` to the device's physical pixel size).
  private readonly _baseResolutionW: number;
  private readonly _baseResolutionH: number;

  constructor(
    private readonly app: Application,
    private readonly resolution: Resolution,
    renderMode: RenderMode = 'retro',
  ) {
    // Snapshot logical dimensions so we can restore them if the caller later
    // hot-swaps OUT of 'native-res' (which mutates `resolution` in place).
    // NOTE: if the caller started in 'native-res', main.ts has already called
    // matchDeviceResolution(RESOLUTION) — so here we snapshot the *current*
    // values, which means you cannot "go back" to 320×180 from a native-res
    // cold-start. That's intentional: the engine snapshots whatever the game
    // handed it as the logical design size.
    this._baseResolutionW = resolution.w;
    this._baseResolutionH = resolution.h;

    // ── Retro path: low-res RenderTexture → upscaled Sprite ──────────────────
    // The RT is sized from the base (retro/native) logical dimensions. Native-res
    // never uses this RT, so its huge device-pixel resolution wouldn't inflate it.
    this.rt = RenderTexture.create({ width: this._baseResolutionW, height: this._baseResolutionH });
    this._rtSprite = new Sprite(this.rt);
    this._rtSprite.roundPixels = true;

    // ── Native path: world wrapped in a plain scaled Container ───────────────
    this._nativeContainer = new Container();

    this._renderMode = renderMode;
    this._mountMode(renderMode);

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  /** The current render mode ('retro' | 'native' | 'native-res'). */
  get renderMode(): RenderMode {
    return this._renderMode;
  }

  /**
   * The active screen-space filter target. Changes when setRenderMode is called.
   * - Retro:      _rtSprite        (Sprite backed by the low-res RenderTexture)
   * - Native:     _nativeContainer (plain Container wrapping world, fractional-scaled)
   * - Native-res: _nativeContainer (same container, scale=1, no offset)
   * Apply CRT / RGB-split filters here; see filters.ts.
   */
  get filterLayer(): Container {
    // Both 'native' and 'native-res' use the _nativeContainer path.
    return this._renderMode === 'retro' ? this._rtSprite : this._nativeContainer;
  }

  /**
   * Hot-swap the render mode at runtime.
   *
   * Mode transitions that involve 'native-res' mutate the shared `resolution`
   * object:
   *   - Entering 'native-res'  → overwrite w/h with device physical pixels.
   *   - Leaving  'native-res'  → restore w/h to the original logical design size
   *                              (snapshotted at construction time).
   * Every module that imports the RESOLUTION object therefore sees the current
   * values without any refactor — but scenes that cached values into module-
   * level consts at load time won't reflow; re-enter the scene to pick them up.
   *
   * After calling this, re-apply the filter preset (applyRetroFilters) so the
   * filter stack is attached to the new filterLayer.
   */
  get logicalScale(): number {
    return Math.min(
      this.resolution.w / this._baseResolutionW,
      this.resolution.h / this._baseResolutionH
    );
  }

  setRenderMode(mode: RenderMode): void {
    if (mode === this._renderMode) return;

    const wasNativeRes = this._renderMode === 'native-res';
    const goingNativeRes = mode === 'native-res';

    if (goingNativeRes && !wasNativeRes) {
      // Entering native-res: stretch the logical space to match the device.
      matchDeviceResolution(this.resolution);
    } else if (wasNativeRes && !goingNativeRes) {
      // Leaving native-res: restore original logical design size.
      this.resolution.w = this._baseResolutionW;
      this.resolution.h = this._baseResolutionH;
    }

    this._renderMode = mode;
    this._mountMode(mode);
    this.handleResize();
  }

  /** Attach the correct display object to the stage and wire up world. */
  private _mountMode(mode: RenderMode): void {
    if (mode === 'retro') {
      // Leaving native(-res): detach native container, free world from it.
      this._nativeContainer.removeFromParent();
      this.world.removeFromParent(); // removes from _nativeContainer
      this.app.stage.addChild(this._rtSprite);
    } else {
      // 'native' and 'native-res' both use the native-container path.
      // Leaving retro: detach RT sprite, move world into native container.
      this._rtSprite.removeFromParent();
      this._nativeContainer.addChild(this.world);
      this.app.stage.addChild(this._nativeContainer);
    }
  }

  /** Scale the active display layer to fill the window. */
  private handleResize(): void {
    let scale: number;

    if (this._renderMode === 'retro') {
      // Integer scale — largest whole-number multiplier that fits the window.
      // Every logical pixel maps to an exact NxN block of screen pixels.
      scale = Math.max(
        1,
        Math.floor(
          Math.min(window.innerWidth / this.resolution.w, window.innerHeight / this.resolution.h),
        ),
      );
    } else if (this._renderMode === 'native-res') {
      // Logical resolution equals the device in *physical* pixels, but Pixi's
      // coordinate space is *CSS* pixels (autoDensity:true + resolution:DPR).
      // So we scale by 1/DPR: a world of innerWidth×DPR logical pixels maps
      // to innerWidth CSS pixels — filling the canvas exactly, with every
      // logical pixel rendering to one physical device pixel (true 1:1).
      const dpr = window.devicePixelRatio ?? 1;
      scale = 1 / dpr;
    } else {
      // Fractional scale — fills the screen while preserving aspect ratio.
      // Pixi renders at devicePixelRatio; the fractional scale is in CSS pixels.
      scale = Math.min(
        window.innerWidth / this.resolution.w,
        window.innerHeight / this.resolution.h,
      );
    }

    this.filterLayer.scale.set(scale);
    this.filterLayer.position.set(
      this._renderMode === 'native-res' ? 0 : (window.innerWidth - this.resolution.w * scale) / 2,
      this._renderMode === 'native-res' ? 0 : (window.innerHeight - this.resolution.h * scale) / 2,
    );

    // filterArea must be set explicitly in Pixi v8 — auto-detection is unreliable
    this.filterLayer.filterArea = new Rectangle(0, 0, window.innerWidth, window.innerHeight);
  }

  /**
   * Blit `world` into the low-res RenderTexture (retro mode only).
   * In native mode this is a no-op — Pixi auto-renders world via the stage.
   * Call this AFTER scene.update() so the screen shows the current frame.
   */
  render(): void {
    if (this._renderMode === 'retro') {
      this.app.renderer.render({
        container: this.world,
        target: this.rt,
        clear: true,
      });
    }
  }

  destroy(): void {
    this.rt.destroy(true);
  }
}
