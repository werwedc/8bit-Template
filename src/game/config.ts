/**
 * Game configuration — the first file participants edit.
 *
 * Everything game-specific lives here:
 *   - RESOLUTION: change to match your game's native pixel grid
 *   - PALETTE: color constants used across all scenes
 *   - GAME: tunable gameplay constants (tweak without touching entity code)
 *   - CONTROLS: action → key/button bindings (InputManager reads this)
 *
 * The core/ layer reads RESOLUTION and CONTROLS but nothing else.
 * All other config is game-specific and core/ never imports it.
 */

// ─── Render mode ─────────────────────────────────────────────────────────────
// 'retro'      — classic pipeline: render world into a low-res RenderTexture
//                (RESOLUTION below), then integer-upscale to fill the screen.
//                Bloom runs at low res → chunky glow. image-rendering: pixelated.
//                Perfect for the authentic CRT / old-console look.
//
// 'native'     — modern pipeline: skip the RT; scale the world container directly
//                to fill the screen using fractional scaling + devicePixelRatio.
//                Renders at full display resolution (like modern Pac-Man / Tetris —
//                retro art style, crisp at any DPI). Bloom runs at screen res.
//
// 'native-res' — true native resolution: RESOLUTION is overwritten with the
//                device's physical pixel dimensions (innerWidth × DPR,
//                innerHeight × DPR). The world renders 1:1 with the screen —
//                no RT, no scaling, no letterboxing. Works as a startup mode
//                AND in the F2 hot-swap cycle. Caveat: scenes that cache
//                RESOLUTION.w/h into module-level consts at load time won't
//                reflow on hot-swap until re-entered.
export const RENDER_MODE: 'retro' | 'native' | 'native-res' = 'native';

// ─── Resolution ─────────────────────────────────────────────────────────────
// The logical coordinate space for all game objects (both modes use this).
// In retro mode this is also the RT size that gets upscaled.
// In 'native-res' mode this object is overwritten at startup by the engine
// (see core/viewport.ts → matchDeviceResolution).
// Common retro resolutions:
//   NES: 256×240   GB: 160×144   SNES: 256×224   Common widescreen: 320×180
export const RESOLUTION: { w: number; h: number } = { w: 320, h: 180 };

// ─── Title ───────────────────────────────────────────────────────────────────
export const TITLE = '8-BIT PONG';

// ─── Colour palette ──────────────────────────────────────────────────────────
// Keep all hex values here so swapping the entire look is one diff.
export const PALETTE = {
  bg: 0x0a0a1a,       // deep navy background
  fg: 0xddeeff,       // soft white foreground / UI text
  accent: 0x00ffee,   // cyan — ball, highlights (blooms nicely)
  p1: 0x44ff88,       // player 1 paddle — green
  p2: 0xff4488,       // player 2 paddle — pink
  dim: 0x334455,      // dimmed center line
} as const;

// ─── Gameplay constants ───────────────────────────────────────────────────────
export const GAME = {
  paddleW: 4,
  paddleH: 28,
  paddleSpeed: 90,      // logical px/s
  paddleMargin: 14,     // distance from side edge
  ballSize: 5,
  ballInitialSpeed: 85, // logical px/s
  ballSpeedIncrease: 5, // added to speed on each paddle hit
  maxBallSpeed: 200,
  scoreToWin: 5,
  countdownMs: 800,     // pause after scoring before ball resets
} as const;

// ─── Retro filter presets ─────────────────────────────────────────────────────
// The retro filter stack (bloom + CRT scanlines + RGB chromatic split) is what
// gives the "old TV" look. It also softens the image — which can read as blur
// over sharp pixel art. Cycle presets at runtime with F1.
//
// Add or remove presets here; the cycle order is the array order below.
// Set `noBloom` and `noCRT` together for a perfectly sharp 8-bit look.
import type { RetroFilterConfig } from '../core/filters';

export const FILTER_PRESETS: { name: string; config: RetroFilterConfig }[] = [
  // Pure pixels — no post-FX. Use this if the CRT/bloom looks blurry.
  { name: 'sharp',   config: { noBloom: true,  noCRT: true } },
  // Light glow only — keeps pixels crisp, adds a tiny bit of pop.
  { name: 'minimal', config: { noCRT: true, bloomThreshold: 0.6, bloomScale: 0.5 } },
  // CRT scanlines without chromatic aberration — moderate softness.
  { name: 'crt',     config: { bloomThreshold: 0.5, bloomScale: 0.6, crtLineContrast: 0.12, crtVignetting: 0.25, rgbSplitOffset: 0 } },
  // The full retro look (default) — bloom + scanlines + chromatic aberration.
  { name: 'full',    config: { bloomThreshold: 0.45, bloomScale: 0.9, crtLineContrast: 0.14, crtVignetting: 0.28 } },
];

/** Index into FILTER_PRESETS used at startup. */
export const DEFAULT_FILTER_PRESET = 3; // 'full'

