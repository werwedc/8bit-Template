/**
 * Retro filter stack — "8-bit look with modern post-FX".
 *
 * TWO-PASS STRATEGY (critical for performance):
 *
 *   Pass 1 — AdvancedBloomFilter on viewport.world (low-res container)
 *     → bloom runs at 320×180 → pixelated, chunky glow. Applied BEFORE the RT blit.
 *
 *   Pass 2 — CRTFilter + RGBSplitFilter on viewport.filterLayer
 *     → CRT scanlines and chromatic aberration run at native screen resolution.
 *     → This is correct: scanlines should be screen-resolution-sharp, not pixelated.
 *
 * Call applyRetroFilters(viewport, preset) once in main.ts (already done).
 * Update the CRT time uniform every frame by calling updateFilters(dt).
 * Swap the active preset at runtime with applyRetroFilters(viewport, config).
 */

import { AdvancedBloomFilter, CRTFilter, RGBSplitFilter } from 'pixi-filters';
import type { Viewport } from './viewport';

export interface RetroFilterConfig {
  /** Bloom brightness threshold (0–1). Lower = more things glow. Default 0.5 */
  bloomThreshold?: number;
  /** Bloom strength. Default 0.8 */
  bloomScale?: number;
  /** CRT scanline visibility (0–1). Default 0.15 */
  crtLineContrast?: number;
  /** CRT vignette darkness (0–1). Default 0.3 */
  crtVignetting?: number;
  /** Screen curvature (0 = flat, higher = more curved). Default 2 */
  crtCurvature?: number;
  /** RGB chromatic split in pixels. 0 disables the pass. Default 2 */
  rgbSplitOffset?: number;
  /** Disable bloom (e.g. for perf testing or sharp pixel mode). Default false */
  noBloom?: boolean;
  /** Disable CRT (also disables RGB split). Default false */
  noCRT?: boolean;
}

let _crtFilter: CRTFilter | null = null;

/** Apply (or replace) the retro filter stack on a Viewport. Safe to call repeatedly. */
export function applyRetroFilters(viewport: Viewport, config: RetroFilterConfig = {}): void {
  // Reset — a previous call may have left filters attached.
  viewport.world.filters = [];
  viewport.filterLayer.filters = [];
  _crtFilter = null;

  // --- Pass 1: bloom on the world container (low-res) ---
  if (!config.noBloom) {
    const bloom = new AdvancedBloomFilter({
      threshold: config.bloomThreshold ?? 0.5,
      bloomScale: config.bloomScale ?? 0.8,
      brightness: 1,
      blur: 4,
      quality: 4,
    });
    viewport.world.filters = [bloom];
  }

  // --- Pass 2: CRT + RGB split on the upscaled RT sprite ---
  if (!config.noCRT) {
    _crtFilter = new CRTFilter({
      curvature: config.crtCurvature ?? 2,
      lineWidth: 1,
      lineContrast: config.crtLineContrast ?? 0.15,
      noise: 0.04,
      noiseSize: 1.5,
      vignetting: config.crtVignetting ?? 0.3,
      vignettingAlpha: 0.7,
      seed: Math.random(),
      time: 0,
    });

    const offset = config.rgbSplitOffset ?? 2;
    const stack: import('pixi.js').Filter[] = [_crtFilter];
    if (offset > 0) {
      stack.push(
        new RGBSplitFilter({
          red:   { x: -offset, y: 0 },
          green: { x: 0,       y: 0 },
          blue:  { x: offset,  y: 0 },
        }),
      );
    }
    viewport.filterLayer.filters = stack;
  }
}

/**
 * Backwards-compatible alias for the original API.
 * Equivalent to {@link applyRetroFilters}.
 */
export const enableRetroFilters = applyRetroFilters;

/**
 * Animate the CRT noise/scanline uniforms. Call every frame.
 * @param dt Delta time in seconds
 */
export function updateFilters(dt: number): void {
  if (_crtFilter) {
    _crtFilter.time += dt * 500;
    _crtFilter.seed = Math.random();
  }
}
