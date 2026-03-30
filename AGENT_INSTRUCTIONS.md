# Synapse Snake - Agent Instructions

Welcome to the Synapse Snake repository. If you are an AI agent analyzing or modifying this codebase, STRICTLY adhere to the following architectural guidelines to prevent breaking the engine or violating the project's design philosophy.

## 1. Core Architecture (React + Custom ECS)
This project is divided into two strict boundaries:
- **React UI Layer (`src/App.tsx`)**: Handles strictly out-of-game menus, overlays, the Armory phase, the Wiki, and the HUD (Health Bar). **Do not put 60fps game loop logic inside React.**
- **Game Engine Layer (`src/game/Arena.ts` & `src/core/`)**: A pure HTML5 Canvas Entity-Component-System (ECS) implementation. It runs an isolated `requestAnimationFrame` loop that drives all physics, collisions, rendering, and survival math. 

## 2. The Entity-Component-System (ECS)
If implementing new gameplay mechanics:
- **Do not use heavy inheritance**. Prefer composition.
- **Components (`core/Components.ts`)**: Plain data structures (e.g., `Transform`, `HealthComp`, `TargetComp`).
- **Nodes (`core/Node.ts`)**: Containers holding Components. Use `node.addComponent('Name', new Name())`.
- **Systems/Loops (`core/Systems.ts` & `Arena.ts`)**: Query nodes via `this.getNodesWith(['ComponentA', 'ComponentB'])` and mutate them in bulk during the `update(dt)` loop.

## 3. Data-Driven Content Pipeline
Adding new content does not require writing new UI/Rendering blocks.
- **Heroes & Classes**: Defined cleanly in `src/game/Data.ts` (`CHARACTER_DATA` and `CLASS_DATA`). To add a new hero, simply create a new generic entry. The Armory UI, Wiki UI, and Engine Spawner will automatically parse it.
- **Items/Relics**: Defined in `ITEM_DATA`. The Armory automatically rotates these.

## 4. Visuals and Rendering (Zero Sprites)
- **Procedural Geometry**: This game uses **NO image assets/sprites**. Every hero, enemy, projectile, and visual effect is drawn procedurally via vector math on the Canvas (or via SVGs in React).
- **Weapons**: Handled via `drawShape()` and internal rendering conditionals in `Arena.ts` based on the `weapon` string (e.g. `'sword'`, `'orb'`, `'lightning'`). Do not attempt to import `.png` files.
- **Juice**: Visual flair matters heavily. If you add a new weapon or collision, ensure it utilizes `CameraSystem.shake()` and triggers `HfxComp` (hit flashing) or emits particles via `spawnParticles`.

## 5. Difficulty, Economy, and Auto-Chess Scaling
- **Survival Mechanics**: The game relies on progressive dynamic spawning (`Arena.ts` -> `roundTimeLeft`).
- **Enemy Progression**: Enemies scale dynamically. Round 1+ spawns `basic` followers. Round 3+ introduces `fast` skittish units. Round 5+ produces high HP `tank` units. Round 7+ drops explosive `swarmer` packs. The Boss (Round 3+) and Super Boss (Star shape) scale exponentially.
- **Auto-Chess Economy**: Players start with a hard limit of **3 Max Snake Capacity** and **3 Gold**. Winning rounds nets heavily nerfed gold (`2 + round/4`). The player MUST dynamically purchase Capacity Upgrades inside "The Armory" to increase snake sizes. Do not arbitrarily remove `maxSnakeLength` limits.
- **Exponential Math**: Enemy scaling `(Health, Speed)` utilizes exponential compounding curves (`Math.pow(1.15, round)`). If adjusting difficulty, tune the exponential base, do not use flat addition.
- **Dev Mode**: A specialized environment allowing you to dictate the current round or spawn specific heroes at max rank to test interactions and mechanics quickly without needing a full playthrough.

## 6. TypeScript Compilation
- This project builds tightly via Vite. Avoid using Parameter Properties (`public`/`private` in constructors) if it violates erased-syntax pipelines. Ensure all variables are aggressively typed, and utilize exact node querying to bypass `any` fallbacks.

## 7. Authentication & Analytics
- **Clerk**: The `<App />` root strictly hides all gameplay loop logic until `<SignedIn>` validates an active session via `@clerk/clerk-react`. Keys are consumed from `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` strings.
- **Vercel**: App analytics are managed neutrally via the `@vercel/analytics` wrapping `<Analytics />` drop-in.

## 8. UI and Styling Rules
- **No Inline Styles**: The UI layout (`App.tsx`) was massively refactored to eliminate massive React `style={{}}` object declarations. Under no circumstances should you clutter the DOM with inline layout dictionaries.
- **Tokenized CSS**: Always use the global utility tokens defined in `index.css` (e.g., `.flex`, `.flex-col`, `.justify-between`, `.gap-4`, `.text-accent`, `.glass-panel`).
- **Compound Components**: For complex overlays (like the Armory/Shop or Modals), use BEM-structured classes mapped in `App.css` (e.g., `.armory-grid`, `.snake-capacity-panel`, `.tier-legend`).
