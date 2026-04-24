# 8-bit Hackathon Template

> PixiJS v8 · pixi-filters · TypeScript · Vite  
> _Retro 8-bit aesthetics with modern post-FX (CRT · bloom · chromatic aberration)_

## Quick start

```bash
git clone <this-repo> my-game
cd my-game
npm install
npm run dev          # opens http://localhost:3000 — playable Pong demo
```

**Demo controls:** W/S = P1 · ↑/↓ = P2 · Enter = start  
**Debug overlay:** press `` ` `` (backtick)  
**Cycle retro filter preset:** press `F1` (sharp ↔ minimal ↔ crt ↔ full)  
**Cycle render mode:** press `F2` (retro → native → native-res → retro …)

Render modes (set default in `src/game/config.ts → RENDER_MODE`):
- **retro**      — world renders into a 320×180 RenderTexture, integer-upscaled to fill the window. Classic chunky pixels.
- **native**     — world rendered directly at `devicePixelRatio`; fractional-scaled to fill the window. Retro art, crisp on HiDPI.
- **native-res** — `RESOLUTION` is rewritten at startup (or on F2 swap) to the device's physical pixels (`innerWidth × DPR`, `innerHeight × DPR`). World renders 1:1 with the screen — no scaling, no letterboxing.

---

## Architecture at a glance

```
src/
  core/          ← engine-agnostic, never imports from game/
    app.ts       ← Pixi Application bootstrap (pixel-perfect options)
    viewport.ts  ← low-res RenderTexture + integer upscale + screen shake
    scene.ts     ← Scene base class + SceneManager
    input.ts     ← action-mapped keyboard + Gamepad API
    audio.ts     ← Howler.js wrapper
    assets.ts    ← Pixi Assets wrapper (Aseprite-aware)
    filters.ts   ← two-pass retro filter stack (bloom + CRT + RGB split)
    entity.ts    ← component-bag base class
    particles.ts ← pooled one-shot emitter
    tween.ts     ← property tweener + easing library
    debug.ts     ← FPS / scene / object-count overlay (backtick)
    types.ts     ← AppContext interface

  game/          ← your game; the part you edit/replace
    config.ts    ← RESOLUTION, PALETTE, GAME constants, CONTROLS map
    manifest.ts  ← list of assets to preload (sprites, fonts)
    scenes/      ← BootScene → MenuScene → PlayScene
    entities/    ← Paddle, Ball
```

**Rule:** `core/` must never import from `game/`. This contract is what makes the template reusable across any game.

---

## How to add a new scene

1. Create `src/game/scenes/MyScene.ts`:
```typescript
import { Scene } from '../../core/scene';
import type { AppContext } from '../../core/types';

export class MyScene extends Scene {
  constructor(private ctx: AppContext) { super(); }

  enter(): void {
    // add display objects to this.container
  }
  exit(): void { /* clean up listeners / intervals */ }
  update(dt: number): void { /* dt = seconds since last frame */ }
}
```
2. Navigate to it from any other scene:
```typescript
this.ctx.sceneManager.transitionTo(MyScene, { optionalData: 42 });
```

That's it — no registration, no factory, no boilerplate.

---

## How to add a sprite (Aseprite workflow)

1. In Aseprite: **File → Export Sprite Sheet** → Format: `JSON Hash`, export PNG alongside.
2. Drop `mysprite.json` + `mysprite.png` into `public/assets/sprites/`.
3. In `src/game/manifest.ts` add:
   ```typescript
   { alias: 'mysprite', src: '/assets/sprites/mysprite.json' },
   ```
4. In a scene (after BootScene has loaded assets):
   ```typescript
   const sheet = this.ctx.assets.spritesheet('mysprite');
   const anim = new AnimatedSprite(sheet.animations['run']!);
   anim.animationSpeed = 0.15;
   anim.play();
   this.container.addChild(anim);
   ```

For a single frame (no animation):
```typescript
const tex = this.ctx.assets.texture('mysprite/frame_0.png');
const sprite = new Sprite(tex);
```

---

## How to add a bitmap font

1. Generate `.fnt` + `.png` atlas with [SnowB BMFont](https://snowb.org) or [Hiero](https://libgdx.com/wiki/tools/hiero).
2. Drop both files in `public/assets/fonts/`.
3. Add to manifest:
   ```typescript
   { alias: 'PressStart2P', src: '/assets/fonts/press-start-2p.fnt' },
   ```
4. Use in a scene:
   ```typescript
   const t = new BitmapText({ text: 'SCORE: 0', style: { fontFamily: 'PressStart2P', fontSize: 8 } });
   ```

Free pixel fonts: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) · [m5x7](https://managore.itch.io/m5x7) · [Kenney Pixel](https://www.kenney.nl/assets/kenney-fonts)

---

## How to add a sound

In `src/game/scenes/BootScene.ts`, inside `_load()`:
```typescript
this.ctx.audio.register('jump', {
  src: ['/assets/audio/jump.webm', '/assets/audio/jump.mp3'],
});
```

Play from any scene:
```typescript
this.ctx.audio.play('jump');
```

Supported formats: WebM (preferred) + MP3 fallback. Convert with [FFmpeg](https://ffmpeg.org) or [Cloudconvert](https://cloudconvert.com).

---

## Changing the game resolution

Edit `src/game/config.ts`:
```typescript
export const RESOLUTION = { w: 160, h: 144 } as const; // Game Boy
// or
export const RESOLUTION = { w: 256, h: 240 } as const; // NES
// or
export const RESOLUTION = { w: 384, h: 216 } as const; // custom widescreen
```

The viewport auto-calculates the largest integer scale that fits the window. `core/` reads RESOLUTION but never hardcodes it.

---

## Tuning the retro filter stack

The bloom + CRT + chromatic-aberration passes give the "old TV" look — but
they also soften the image, which can read as **blur over sharp pixel art**.
Press **F1** at runtime to cycle between presets:

| Preset | Effect |
|--------|--------|
| `sharp`   | No post-FX — pure crisp 8-bit pixels |
| `minimal` | Subtle bloom only, no CRT, no aberration |
| `crt`     | Scanlines + light bloom, no chromatic split |
| `full`    | Everything (default) |

Presets live in `src/game/config.ts` — edit `FILTER_PRESETS` to add your own
or change `DEFAULT_FILTER_PRESET` to start in a different one. Per-preset
options accepted by `applyRetroFilters(viewport, { ... })`:

| Option | Default | Effect |
|--------|---------|--------|
| `bloomThreshold` | `0.5` | Lower = more elements glow |
| `bloomScale` | `0.8` | Bloom brightness/strength |
| `crtLineContrast` | `0.15` | Scanline visibility |
| `crtVignetting` | `0.3` | Edge darkening |
| `crtCurvature` | `2` | Screen curve amount |
| `rgbSplitOffset` | `2` | Chromatic aberration (px); `0` skips the pass |
| `noBloom` | `false` | Disable bloom pass |
| `noCRT` | `false` | Disable CRT + RGB pass |

---

## Useful DX helpers

```typescript
// Screen shake (viewport.ts)
ctx.viewport.shake(intensity, durationSec);
// e.g. ctx.viewport.shake(5, 0.2);

// Tween (tween.ts)
ctx.tweens.tween(sprite, { alpha: 0, y: sprite.y - 10 }, 0.5, Ease.easeOutQuad, () => sprite.destroy());

// Particle burst (particles.ts)
particles.emit(x, y, { count: 12, color: 0xff4488, speed: 80, life: 0.4 });

// Input isPressed (one-shot, not held)
if (ctx.input.isPressed('jump')) { /* fires once per keydown */ }
```

---

## Scripts

```bash
npm run dev       # Vite dev server with HMR
npm run build     # TypeScript check + Vite production build → dist/
npm run preview   # Serve dist/ locally
npm run lint      # Biome check + auto-fix
npm test          # Vitest unit tests
```

---

## Stack

| Package | Version | Role |
|---------|---------|------|
| [pixi.js](https://pixijs.com) | ^8 | WebGL/WebGPU 2D renderer |
| [pixi-filters](https://github.com/pixijs/filters) | ^6 | CRT, bloom, chromatic aberration |
| [howler.js](https://howlerjs.com) | ^2.2 | Audio (auto-unlock, sprite support) |
| [Vite](https://vitejs.dev) | ^5 | Dev server + bundler |
| [TypeScript](https://www.typescriptlang.org) | ^5 | Type safety |
| [Biome](https://biomejs.dev) | ^1.8 | Lint + format (single tool) |
| [Vitest](https://vitest.dev) | ^1.6 | Unit tests |
