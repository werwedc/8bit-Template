# Battleship: Omega Protocol

**A cyberpunk, browser-based take on Battleship—built by [AbstractTeamFactoryProvider](https://ucup.org.ua/standings?lang=en) during the five-hour UCUP 2026 Game Jam.**

[Play the live demo](https://battleships-eta.vercel.app/) · [About UCUP](https://ucup.org.ua/?lang=en)

Battleship: Omega Protocol turns the familiar naval strategy game into a neon tactical terminal. It pairs a polished 1080p presentation with configurable rules, a capable computer opponent, and local multiplayer—all delivered as a TypeScript web game.

## At a glance

- **Three ways to play:** challenge the computer, play two-player hot-seat mode, or create a custom Omega match.
- **Omega Protocol:** configure a board from 5×5 to 12×12, turn duration, and fleet composition—including corner and T-shaped ships.
- **Tactical opponent:** after a hit, the AI hunts along likely positions instead of continuing to fire at random.
- **Player-friendly flow:** one-click fleet deployment, protected pass-the-device screens, match resumption, and persistent statistics.
- **Clear game feedback:** animated hits and sunk ships, particles, camera shake, audio, and a cohesive CRT/neon interface.

## How to play

1. Pick a mode from the main menu.
2. Place your fleet manually, or select **Auto Deploy**. While placing, press <kbd>Space</kbd> or right-click to rotate a ship.
3. Click the opposing grid to fire. A hit or sunk ship earns another turn.
4. In two-player modes, pass the device when prompted—the game hides the board before the next player takes over.

## What this project demonstrates

The game was designed to balance game feel with a maintainable browser-game architecture:

- **Separated game rules and visuals.** `src/game/logic/` contains the board, ship, turn, save, and AI rules without PixiJS dependencies. Scene and entity layers turn that state into the playable experience.
- **Interactive 2D rendering.** PixiJS renders the grids and ships procedurally, while GSAP drives movement and sinking animations.
- **Polished UI state.** HTML/CSS overlays handle menus, settings, statistics, notifications, and the private hand-off screen for hot-seat matches.
- **Resilient custom matches.** Omega configuration validates fleet density before a match starts, and auto-deployment reports failure safely when a layout cannot be placed.

## Technology

| Area | Tools |
| --- | --- |
| Language | TypeScript |
| Rendering | PixiJS v8, `pixi-filters` |
| Tooling | Vite, Biome, Vitest |
| Animation & audio | GSAP, Howler.js |
| Deployment | Vercel |

## Project structure

```text
src/
├── core/           # Reusable engine systems: rendering, input, audio, UI, storage
└── game/
    ├── logic/      # Rules, board state, AI, saving, and automatic placement
    ├── entities/   # PixiJS grid and ship visuals
    └── scenes/     # Boot, menu, and gameplay flows
```

## Run locally

Requires Node.js 18 or later.

```bash
git clone https://github.com/werwedc/8bit-Template.git
cd 8bit-Template
npm ci
npm run dev
```

Vite will print the local URL, normally `http://localhost:5173`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the Vitest suite |
| `npm run lint` | Run Biome checks and apply its configured fixes |

## Game Jam context

This project was submitted to the **UCUP 2026 Game Jam**, where teams had five hours to create a computer game from scratch. It was made by **[AbstractTeamFactoryProvider](https://ucup.org.ua/standings?lang=en)** as a compact demonstration of rapid product design, TypeScript engineering, and real-time interactive development.

---

Built for the [University Cup / UCUP 2026](https://ucup.org.ua/?lang=en).
