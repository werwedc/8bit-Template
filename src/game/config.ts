import type { RetroFilterConfig } from '../core/filters';

// ─── Render mode ─────────────────────────────────────────────────────────────
// 'retro'      — low-res RenderTexture, integer-upscaled. Classic chunky pixels.
// 'native'     — fractional scale + devicePixelRatio. Retro art, crisp on HiDPI.
// 'native-res' — RESOLUTION rewritten to device physical pixels. 1:1, no scaling.
export const RENDER_MODE: 'retro' | 'native' | 'native-res' = 'retro';

// ─── Resolution ─────────────────────────────────────────────────────────────
// The logical coordinate space for all game objects.
// Common: NES 256×240 | GB 160×144 | SNES 256×224 | Widescreen 320×180
export const RESOLUTION: { w: number; h: number } = { w: 320, h: 180 };

// ─── Title ───────────────────────────────────────────────────────────────────
export const TITLE = 'BATTLESHIP';

// ─── Colour palette ──────────────────────────────────────────────────────────
export const PALETTE = {
  bg: 0x0f380f,      // Dark green (Game Boy style)
  fg: 0x8bac0f,      // Light green
  accent: 0x306230,  // Medium green

  // Battleship specific colors
  water: 0x1e3d59,
  ship: 0xa5a5af,
  hit: 0xff4d4d,     // Red
  miss: 0xffffff,    // White
  valid: 0x4dff4d,   // Green for valid placement
  invalid: 0xff4d4d, // Red for invalid placement
  grid: 0x444444     // Subtle grid lines
} as const;

// ─── Gameplay constants ──────────────────────────────────────────────────────
export const GAME = {
  BOARD_WIDTH: 10,
  BOARD_HEIGHT: 10,
  // 1x 4-length, 2x 3-length, 3x 2-length, 4x 1-length
  SHIP_INVENTORY: [4, 3, 3, 2, 2, 2, 1, 1, 1, 1],
  TILE_SIZE: 12,      // 12x12 pixels per tile. Fits two 10x10 boards nicely on 320x180
} as const;


// ─── Retro filter presets (F1 to cycle) ──────────────────────────────────────
export const FILTER_PRESETS: { name: string; config: RetroFilterConfig }[] = [
  { name: 'sharp', config: { noBloom: true, noCRT: true } },
  { name: 'minimal', config: { noCRT: true, bloomThreshold: 0.6, bloomScale: 0.5 } },
  { name: 'crt', config: { bloomThreshold: 0.5, bloomScale: 0.6, crtLineContrast: 0.12, crtVignetting: 0.25, rgbSplitOffset: 0 } },
  { name: 'full', config: { bloomThreshold: 0.45, bloomScale: 0.9, crtLineContrast: 0.14, crtVignetting: 0.28 } },
];

export const DEFAULT_FILTER_PRESET = 3;
