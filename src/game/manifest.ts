/**
 * Asset manifest — the single source of truth for all loadable assets.
 *
 * BootScene calls assets.loadManifest(ASSET_MANIFEST) with a progress callback.
 * After loading, retrieve assets by alias:
 *   assets.texture('player/idle_0.png')
 *   assets.spritesheet('player').animations['run']
 *   new BitmapText({ text: '...', style: { fontFamily: 'PressStart2P' } })
 *
 * ── Adding a new sprite (Aseprite workflow) ──────────────────────────────────
 *   1. Aseprite → File → Export Sprite Sheet → Format: JSON Hash
 *   2. Drop .json + .png into public/assets/sprites/
 *   3. Add an entry below, e.g.:
 *        { alias: 'player', src: '/assets/sprites/player.json' }
 *   4. Access in a scene: assets.spritesheet('player').animations['run']
 *
 * ── Adding a bitmap font ─────────────────────────────────────────────────────
 *   1. Export .fnt + .png with SnowB (https://snowb.org) or Hiero
 *   2. Drop both files into public/assets/fonts/
 *   3. Add entry: { alias: 'PressStart2P', src: '/assets/fonts/press-start-2p.fnt' }
 *   4. Use: new BitmapText({ text: 'SCORE', style: { fontFamily: 'PressStart2P', fontSize: 8 } })
 *
 * ── Adding audio ─────────────────────────────────────────────────────────────
 *   Audio is loaded by Howler (not Pixi Assets), so no manifest entry needed.
 *   Register sounds in BootScene via ctx.audio.register(name, { src: [...] }).
 */

import type { AssetManifestItem } from '../core/assets';

export const ASSET_MANIFEST: AssetManifestItem[] = [
  // ── Sprites ──────────────────────────────────────────────────────────────
  // Uncomment and add your Aseprite exports here:
  // { alias: 'ball',   src: '/assets/sprites/ball.json'   },
  // { alias: 'paddle', src: '/assets/sprites/paddle.json' },

  // ── Fonts ────────────────────────────────────────────────────────────────
  // Uncomment after dropping .fnt + .png into public/assets/fonts/:
  // { alias: 'PressStart2P', src: '/assets/fonts/press-start-2p.fnt' },
  // { alias: 'm5x7',         src: '/assets/fonts/m5x7.fnt'           },
];
