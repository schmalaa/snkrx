# SNKRX Web Port - Agent Instructions

Welcome to the SNKRX Web Port repository. If you are an AI agent analyzing or modifying this codebase, STRICTLY adhere to the following architectural guidelines to prevent breaking the engine or violating the project's design philosophy.

## 1. Core Architecture (React + Custom ECS)
This project is divided into two strict boundaries:
- **React UI Layer (`src/App.tsx`)**: Handles strictly out-of-game menus, overlays, the Shop phase, the Compendium, and the HUD (Health Bar). **Do not put 60fps game loop logic inside React.**
- **Game Engine Layer (`src/game/Arena.ts` & `src/core/`)**: A pure HTML5 Canvas Entity-Component-System (ECS) implementation. It runs an isolated `requestAnimationFrame` loop that drives all physics, collisions, rendering, and survival math. 

## 2. The Entity-Component-System (ECS)
If implementing new gameplay mechanics:
- **Do not use heavy inheritance**. Prefer composition.
- **Components (`core/Components.ts`)**: Plain data structures (e.g., `Transform`, `HealthComp`, `TargetComp`).
- **Nodes (`core/Node.ts`)**: Containers holding Components. Use `node.addComponent('Name', new Name())`.
- **Systems/Loops (`core/Systems.ts` & `Arena.ts`)**: Query nodes via `this.getNodesWith(['ComponentA', 'ComponentB'])` and mutate them in bulk during the `update(dt)` loop.

## 3. Data-Driven Content Pipeline
Adding new content does not require writing new UI/Rendering blocks.
- **Heroes & Classes**: Defined cleanly in `src/game/Data.ts` (`CHARACTER_DATA` and `CLASS_DATA`). To add a new hero, simply create a new generic entry. The Shop UI, Compendium UI, and Engine Spawner will automatically parse it.
- **Items/Relics**: Defined in `ITEM_DATA`. The Shop automatically rotates these.

## 4. Visuals and Rendering (Zero Sprites)
- **Procedural Geometry**: This game uses **NO image assets/sprites**. Every hero, enemy, projectile, and visual effect is drawn procedurally via vector math on the Canvas (or via SVGs in React).
- **Weapons**: Handled via `drawShape()` and internal rendering conditionals in `Arena.ts` based on the `weapon` string (e.g. `'sword'`, `'orb'`, `'lightning'`). Do not attempt to import `.png` files.
- **Juice**: Visual flair matters heavily. If you add a new weapon or collision, ensure it utilizes `CameraSystem.shake()` and triggers `HfxComp` (hit flashing) or emits particles via `spawnParticles`.

## 5. Difficulty and Scaling
- **Survival Mechanics**: The game relies on progressive dynamic spawning (`Arena.ts` -> `roundTimeLeft`). You must clear the timer to win the round.
- **Exponential Math**: Enemy scaling `(Health, Speed)` utilizes exponential compounding curves (`Math.pow(1.15, round)`). If adjusting difficulty, tune the exponential base, do not use flat addition.

## 6. TypeScript Compilation
- This project builds tightly via Vite. Avoid using Parameter Properties (`public`/`private` in constructors) if it violates erased-syntax pipelines. Ensure all variables are aggressively typed, and utilize exact node querying to bypass `any` fallbacks.
