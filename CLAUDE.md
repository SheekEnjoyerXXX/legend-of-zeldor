# Legend of Zeldor - Project Guidelines

## Tech Stack
- TypeScript (strict mode) with Phaser 3 for game engine
- Vite for dev server and bundling
- 2D pixel art top-down adventure game
- All game UI handled by Phaser's scene system (not React — Phaser manages canvas rendering)

## Code Style
- Type safety is top priority — use strict TypeScript, explicit types, no `any`
- Derive state where possible instead of duplicating or syncing
- Avoid unnecessary abstractions — keep code simple and direct
- Modular file structure: scenes/, entities/, systems/, data/
- Comments only where logic isn't self-evident

## Conventions
- Use `const` by default, `let` only when mutation is needed
- Explicit return types on public methods
- Interfaces over type aliases for object shapes
- Enums or const objects for fixed value sets
