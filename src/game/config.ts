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
export const TITLE = 'MY GAME';

// ─── Colour palette ──────────────────────────────────────────────────────────
export const PALETTE = {
  bg: 0x0a0a1a,
  fg: 0xddeeff,
  accent: 0x00ffee,
} as const;

// ─── Gameplay constants ──────────────────────────────────────────────────────
// Add your game-specific tunables here.
export const GAME = {} as const;

// ─── Retro filter presets (F1 to cycle) ──────────────────────────────────────
export const FILTER_PRESETS: { name: string; config: RetroFilterConfig }[] = [
  { name: 'sharp',   config: { noBloom: true,  noCRT: true } },
  { name: 'minimal', config: { noCRT: true, bloomThreshold: 0.6, bloomScale: 0.5 } },
  { name: 'crt',     config: { bloomThreshold: 0.5, bloomScale: 0.6, crtLineContrast: 0.12, crtVignetting: 0.25, rgbSplitOffset: 0 } },
  { name: 'full',    config: { bloomThreshold: 0.45, bloomScale: 0.9, crtLineContrast: 0.14, crtVignetting: 0.28 } },
];

export const DEFAULT_FILTER_PRESET = 3;
