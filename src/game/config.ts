import type { RetroFilterConfig } from '../core/filters';

// ─── Render mode ─────────────────────────────────────────────────────────────
// 'retro'      — low-res RenderTexture, integer-upscaled. Classic chunky pixels.
// 'native'     — fractional scale + devicePixelRatio. Retro art, crisp on HiDPI.
// 'native-res' — RESOLUTION rewritten to device physical pixels. 1:1, no scaling.
export const RENDER_MODE: 'retro' | 'native' | 'native-res' = 'native';


// ─── Title ───────────────────────────────────────────────────────────────────
export const TITLE = 'BATTLESHIP';

// ─── Colour palette ──────────────────────────────────────────────────────────
export const PALETTE = {
  bg: 0x000000,      // Pure black background
  fg: 0x00ffff,      // Cyan text/labels
  accent: 0x3a0cd2,  // Dark Violet

  // Battleship specific colors
  water: 0x050010,   // Extremely dark violet/black for grid cells
  ship: 0x00ffff,    // Bright Cyan ships
  hit: 0xff0055,     // Neon Pink/Red for hits
  miss: 0x3a0cd2,    // Violet for misses (blends into the grid)
  valid: 0x00ff00,   // Neon Green for placement
  invalid: 0xff0055, // Neon Pink for bad placement
  grid: 0x3a0cd2     // Dark Violet grid lines
} as const;


// Replace your RESOLUTION and GAME exports with these:

// ─── Resolution ─────────────────────────────────────────────────────────────
// Upgraded to 1080p HD for crisp, modern neon UI rendering!
export const RESOLUTION: { w: number; h: number } = { w: 1920, h: 1080 };

// ─── Gameplay constants ──────────────────────────────────────────────────────
export const GAME = {
  BOARD_WIDTH: 10,
  BOARD_HEIGHT: 10,
  SHIP_INVENTORY: [4, 3, 3, 2, 2, 2, 1, 1, 1, 1],
  // Scaled up from 12px to 64px to fit the new 1080p resolution!
  TILE_SIZE: 64,
} as const;



// ─── Retro filter presets (F1 to cycle) ──────────────────────────────────────
export const FILTER_PRESETS: { name: string; config: RetroFilterConfig }[] = [
  { name: 'sharp', config: { noBloom: true, noCRT: true } },
  { name: 'minimal', config: { noCRT: true, bloomThreshold: 0.6, bloomScale: 0.5 } },
  { name: 'crt', config: { bloomThreshold: 0.5, bloomScale: 0.6, crtLineContrast: 0.12, crtVignetting: 0.25, rgbSplitOffset: 0 } },
  { name: 'full', config: { bloomThreshold: 0.45, bloomScale: 0.9, crtLineContrast: 0.14, crtVignetting: 0.28 } },
  { name: 'smooth-fx', config: { bloomThreshold: 0.35, bloomScale: 1.2, crtLineContrast: 0, crtVignetting: 0.35, rgbSplitOffset: 3, noCRT: true } },
];

export const DEFAULT_FILTER_PRESET = 4;
