/**
 * AssetManager — typed wrapper around Pixi v8's Assets API.
 *
 * Aseprite workflow (no CLI required):
 *   1. In Aseprite: File → Export Sprite Sheet → Format: JSON Hash, export PNG.
 *   2. Drop the .json + .png pair into public/assets/sprites/.
 *   3. Add an entry to ASSET_MANIFEST in game/manifest.ts.
 *   4. Assets.load() auto-detects the .json as a Spritesheet.
 *   5. Access frames: AssetManager.texture('sprite_name/frameName.png')
 *      Access animations: AssetManager.spritesheet('alias').animations['tagName']
 *
 * Bitmap font workflow:
 *   1. Export with SnowB BMFont or Hiero → produces .fnt (XML) + .png atlas.
 *   2. Drop in public/assets/fonts/, add to ASSET_MANIFEST.
 *   3. Use: new BitmapText({ text: '...', style: { fontFamily: 'MyFont', fontSize: 8 } })
 */

import { Assets, Texture } from 'pixi.js';
import type { Spritesheet } from 'pixi.js';

export interface AssetManifestItem {
  /** Shorthand alias used to retrieve the asset later */
  alias: string;
  /** Path relative to public/ (e.g. '/assets/sprites/player.json') */
  src: string;
}

export class AssetManager {
  /**
   * Load a list of assets. Shows progress via onProgress callback.
   * Safe to call multiple times — Pixi caches already-loaded assets.
   */
  async loadManifest(
    items: AssetManifestItem[],
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    if (items.length === 0) return;

    await Assets.load(
      items.map((i) => ({ alias: i.alias, src: i.src })),
      onProgress,
    );
  }

  /** Retrieve a single Texture (frame from a spritesheet, or standalone PNG). */
  texture(alias: string): Texture {
    return Assets.get<Texture>(alias);
  }

  /** Retrieve a loaded Spritesheet (from an Aseprite JSON Hash export). */
  spritesheet(alias: string): Spritesheet {
    return Assets.get<Spritesheet>(alias);
  }

  /** Generic getter — use when the asset type is known at call site. */
  get<T>(alias: string): T {
    return Assets.get<T>(alias);
  }
}
