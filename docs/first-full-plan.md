       Badger Sprawl Runner — Complete Architecture and Implementation Plan

       1. Tech Stack Decision

       Choice: C — Vite + TypeScript + Biome + pnpm workspaces

       Justification:

       The game has been explicitly designed from the start for eventual monorepo extraction (docs/own-project-extraction.md). The minigame engine already has a
       TypeScript interface written in its design doc (MINIGAMES.md — MiniGameSpec). The project has 50+ enemy types, 7 RPG stats, 5 skill trees, 6 minigame kinds, 4
       companion AI modes, and 4 ending variants. Naming every cross-cutting contract precisely in plain JS over hundreds of files is a maintenance liability that type
        errors will catch for free. Specific reasons to choose C over A or B:

       - pnpm workspaces are required to satisfy the extraction plan. A/B have no clean package boundary story. Getting package boundaries wrong mid-project means a
       painful restructure later.
       - TypeScript pays off exactly at this scale: physics constants, entity component interfaces, minigame specs, item tags, stat derivations, and dialogue flags are
        all well-typed static shapes. The MiniGameSpec interface in MINIGAMES.md is already written in TypeScript — the docs are asking for it.
       - Vite replaces the Python http.server with proper HMR, module graph resolution, and a dev build that is still served as vanilla JS to the browser. The build
       output is still a static bundle that works offline. No lock-in.
       - Biome replaces ESLint + Prettier as a single fast tool. Zero config overhead over what ESLint would add.
       - Why not plain ES modules (A): 300 files of raw imports without types or bundling collapses under the weight of this feature set. Module specifiers in browsers
        require exact paths; refactoring is painful. No HMR means reload on every tweak to a physics constant.
       - Why not Vite-only no-TS (B): The minigame engine needs to be extractable as a standalone library. Untyped JS libraries are hard to consume. The stat
       derivation formulas (derived_stats in GAME_LOGIC.md) and the hitbox/hurtbox overlay system have enough exact numeric contracts that untyped interfaces
       accumulate invisible bugs.

       The TypeScript target is ES2022 with moduleResolution: bundler. All packages are "type": "module". Output stays browser-first, no node runtime required.
       Canvas2D only, no WebGL.

       ---
       2. Complete Directory Structure

       badger-sprawl-runner/
       │
       ├── pnpm-workspace.yaml              # declares apps/* and packages/*
       ├── package.json                     # root — scripts: dev, build, test, lint
       ├── tsconfig.base.json               # shared TS config extended by all packages
       ├── biome.json                       # single linter/formatter config for all packages
       ├── .gitignore
       ├── bridge.yml                       # existing artifact metadata, unchanged
       │
       ├── data/                            # EXISTING — data-driven JSON manifests
       │   ├── game-manifest.json           # title, worlds, coreItems, minigameKinds
       │   ├── items.json                   # 15+ items with id/slot/rarity/tags/effect
       │   ├── progression.json             # currencies, boons, shopActions
       │   └── sprites.json                 # sprite sheet contracts and animation metadata
       │
       ├── assets/                          # Production art (currently empty, contract defined)
       │   └── sprites/                     # PNG sprite sheets referenced by data/sprites.json
       │
       ├── docs/                            # Design docs, unchanged
       │   └── own-project-extraction.md
       │
       ├── apps/
       │   └── runner/                      # The browser game application
       │       ├── package.json             # name: @badger/runner, depends on all packages
       │       ├── tsconfig.json            # extends ../../tsconfig.base.json
       │       ├── vite.config.ts           # Vite config: base, assetsDir, publicDir
       │       ├── index.html               # Shell (migrated from root)
       │       └── src/
       │           ├── main.ts              # Entry: initialise engine, load manifests, start loop
       │           ├── game.css             # Migrated from src/game.css
       │           │
       │           ├── engine/              # Game loop and cross-cutting infrastructure
       │           │   ├── GameLoop.ts      # Fixed-step + RAF accumulator loop
       │           │   ├── SceneManager.ts  # Named scene registry and transition bus
       │           │   ├── EventBus.ts      # Typed pub/sub used by all systems
       │           │   ├── SaveManager.ts   # localStorage save/load with schema version
       │           │   ├── ReplayRecorder.ts # Input frame recording for debug/determinism
       │           │   └── DebugFlags.ts    # Global debug flag set (hitbox, hurtbox, framedata)
       │           │
       │           ├── scenes/              # One file per named scene
       │           │   ├── TitleScene.ts
       │           │   ├── ProfileSelectScene.ts
       │           │   ├── ColonyHubScene.ts
       │           │   ├── DialogueScene.ts
       │           │   ├── ShopScene.ts
       │           │   ├── SkillTreeScene.ts
       │           │   ├── MissionBriefingScene.ts
       │           │   ├── StageRunScene.ts      # Main gameplay scene — hosts all systems
       │           │   ├── ResultsScene.ts
       │           │   ├── TrainingScene.ts      # training_dummy mode
       │           │   ├── HordeScene.ts
       │           │   ├── VsCpuScene.ts
       │           │   └── EpilogueScene.ts
       │           │
       │           ├── systems/             # Game systems run each tick by StageRunScene
       │           │   ├── InputSystem.ts   # Keyboard + gamepad → ActionMap
       │           │   ├── PhysicsSystem.ts # Gravity, platforms, coyote, jump buffer
       │           │   ├── CombatSystem.ts  # Hitboxes, hurtboxes, parry windows, damage
       │           │   ├── EnemySystem.ts   # Enemy state machines, AI step
       │           │   ├── ItemSystem.ts    # Active/passive item tick, cooldowns
       │           │   ├── HackSystem.ts    # Matrix powers, environment targets, combat hacks
       │           │   ├── CompanionSystem.ts # AI mode dispatch, command meter, trust
       │           │   ├── BeatSystem.ts    # BPM clock, downbeat events, dub shield sync
       │           │   ├── CameraSystem.ts  # Smooth follow, lookahead, screen shake
       │           │   ├── DialogueSystem.ts # RPG box state, typewriter, choices, flags
       │           │   ├── WaveDirector.ts  # Horde mode: spawn budget, telegraph, rounds
       │           │   └── DebugOverlaySystem.ts # Hitbox/hurtbox/frame data canvas overlay
       │           │
       │           ├── actors/              # Concrete entity definitions (compose from ECS)
       │           │   ├── MossBadger.ts    # Player actor: all verb implementations
       │           │   ├── EnemyFactory.ts  # Loads enemy def from manifest, creates entity
       │           │   ├── CompanionActor.ts # Base companion with mode dispatch
       │           │   ├── companions/
       │           │   │   ├── RookNull.ts
       │           │   │   ├── NayaRoot.ts
       │           │   │   ├── SisterVersion.ts
       │           │   │   └── Lio.ts
       │           │   └── enemies/         # One file per enemy class (thin wrappers over EnemyFactory)
       │           │       ├── sprawl.ts    # Toll rat, Scooter Bailiff, Cable Crawler, …
       │           │       ├── arcology.ts
       │           │       ├── mirror.ts
       │           │       ├── dub.ts
       │           │       ├── barrens.ts
       │           │       └── orbital.ts
       │           │
       │           ├── renderer/            # Canvas 2D rendering layer
       │           │   ├── Renderer.ts      # Central canvas context wrapper, layer stack
       │           │   ├── SpriteRenderer.ts # Loads sheets from sprites.json, draws frames
       │           │   ├── AnimationState.ts # Frame clock per-entity animation state machine
       │           │   ├── ParallaxLayer.ts  # Multi-speed background layers
       │           │   ├── VFXPool.ts       # Object-pooled particle and VFX instances
       │           │   ├── UIRenderer.ts    # HUD: HP bar, fuel, heat, reload ring, beat pulse
       │           │   └── TitleCardRenderer.ts # Brechtian title/placard scenes
       │           │
       │           ├── audio/
       │           │   ├── AudioManager.ts  # Web Audio API context + master gain
       │           │   ├── BeatClock.ts     # BPM → downbeat time source (drives BeatSystem)
       │           │   └── SoundBank.ts     # Loads and caches audio buffers by id
       │           │
       │           ├── world/               # Level and world data loading
       │           │   ├── LevelLoader.ts   # Reads world JSON → platform/entity/trigger lists
       │           │   ├── TrapSystem.ts    # Trap ownership state machine (hostile/neutral/hacked/unstable)
       │           │   └── worlds/          # Per-world level data JSON files (8 worlds × 4 stages)
       │           │       ├── world-1.json
       │           │       ├── world-2.json
       │           │       └── …
       │           │
       │           └── ui/                  # DOM-side UI components (outside canvas)
       │               ├── HudPanel.ts      # Status/minigame DOM panels (migrated from index.html)
       │               ├── PauseMenu.ts
       │               └── AccessibilityOptions.ts
       │
       ├── packages/
       │   │
       │   ├── platformer-core/             # Extractable: physics, collision, ECS base
       │   │   ├── package.json             # name: @badger/platformer-core
       │   │   ├── tsconfig.json
       │   │   └── src/
       │   │       ├── index.ts             # Public API barrel
       │   │       ├── World.ts             # createPlatformerWorld() factory
       │   │       ├── PhysicsParams.ts     # Physics constant type + presets (arcade, floaty, heavy)
       │   │       ├── Entity.ts            # Entity = id + component map
       │   │       ├── components/
       │   │       │   ├── Transform.ts     # x, y, w, h, dir
       │   │       │   ├── Velocity.ts      # vx, vy
       │   │       │   ├── Collider.ts      # AABB, layer mask
       │   │       │   ├── Health.ts        # hp, maxHp, greyHp, invuln timer
       │   │       │   ├── MovementState.ts # onGround, coyoteLeft, jumpBuffered, coyoteTime, jumpBuffer
       │   │       │   ├── HitboxSet.ts     # named hitbox rects (attack, hurt, parry)
       │   │       │   └── ActorFlags.ts    # hasRailgun, hasRocket, etc. — boolean capability flags
       │   │       ├── systems/
       │   │       │   ├── gravityStep.ts   # Pure function: apply gravity + max fall speed
       │   │       │   ├── movementStep.ts  # Pure function: apply vx/vy to transform
       │   │       │   ├── platformStep.ts  # Pure function: resolve AABBs against platform list
       │   │       │   ├── coyoteStep.ts    # Pure function: coyote timer + jump buffer
       │   │       │   └── aabb.ts          # Fast AABB overlap test (exported for hitbox use)
       │   │       └── tests/
       │   │           ├── physics.test.ts  # Deterministic step tests (gravity, landing, coyote)
       │   │           └── aabb.test.ts
       │   │
       │   ├── codegate/                    # Extractable: minigame engine
       │   │   ├── package.json             # name: @badger/codegate
       │   │   ├── tsconfig.json
       │   │   └── src/
       │   │       ├── index.ts             # Public API barrel
       │   │       ├── types.ts             # MiniGameSpec, MiniGameResult, MiniGameEvent
       │   │       ├── core.ts              # createCodeGate() — state machine, scoring, timers
       │   │       ├── gates/
       │   │       │   ├── FastTypeGate.ts       # exact string match, speed bonus
       │   │       │   ├── CommandRepairGate.ts  # find and fix syntax error in command
       │   │       │   ├── RegexMatchGate.ts     # choose regex from options
       │   │       │   ├── RoutingGate.ts        # graph relay problem
       │   │       │   ├── BytecodeOrderGate.ts  # sort opcode sequence
       │   │       │   └── MicroCodeGate.ts      # write tiny JS expression
       │   │       ├── render-canvas.ts     # Optional canvas renderer for code gate overlay
       │   │       ├── render-dom.ts        # Optional DOM renderer for code gate panel
       │   │       └── tests/
       │   │           ├── fasttype.test.ts
       │   │           ├── commandrepair.test.ts
       │   │           └── scoring.test.ts
       │   │
       │   ├── sprite-contracts/            # Extractable: sprite schema + validator
       │   │   ├── package.json             # name: @badger/sprite-contracts
       │   │   ├── tsconfig.json
       │   │   └── src/
       │   │       ├── index.ts
       │   │       ├── types.ts             # SpriteSheet, AnimationDef, SpriteManifest types
       │   │       ├── validate.ts          # validateSpriteManifest() — replaces validate-data.mjs logic
       │   │       ├── loader.ts            # loadSpriteSheet(manifest, ctx) → loaded sheet map
       │   │       └── tests/
       │   │           └── validate.test.ts # Runs against data/sprites.json
       │   │
       │   └── progression/                 # Extractable: meta-progression, run state, shops
       │       ├── package.json             # name: @badger/progression
       │       ├── tsconfig.json
       │       └── src/
       │           ├── index.ts
       │           ├── types.ts             # RunState, MetaState, Currency, Boon, ShopAction
       │           ├── RunAggregator.ts     # Accumulate in-run events → results screen data
       │           ├── MetaProgression.ts   # Persist blueprint_shards, dub_favor, orbit_heat
       │           ├── ShopEngine.ts        # Inventory generation, reroll, discount logic
       │           ├── SkillTree.ts         # Node unlock, cost check, derived stat computation
       │           ├── BoonPool.ts          # Active boon list, tag-based effect queries
       │           └── tests/
       │               ├── skillTree.test.ts
       │               ├── shopEngine.test.ts
       │               └── metaProgression.test.ts
       │
       └── tests/
           └── validate-data.mjs            # EXISTING — kept as integration smoke test

       ---
       3. Package Breakdown

       @badger/platformer-core

       What it exports:
       export { createPlatformerWorld } from './World.ts';
       export type { PhysicsParams, Entity, World } from './types.ts';
       export { gravityStep, movementStep, platformStep, coyoteStep } from './systems/';
       export { aabb } from './systems/aabb.ts';
       export type { Transform, Velocity, Collider, Health, MovementState, HitboxSet } from './components/';

       Depends on: Nothing. Zero runtime dependencies. Node built-ins only in tests.

       Files of note: The physics step functions are pure: gravityStep(velocity, params, dt) → velocity. They take and return plain data objects, never mutating DOM or
        canvas. This makes them trivially testable and replay-safe.

       Tests needed:
       - Gravity accumulation over N frames equals exact expected vy
       - Landing on platform snaps y correctly and resets coyoteLeft
       - Coyote time expires after exactly coyote seconds
       - Jump buffer fires jump within jumpBuffer seconds of pressing while airborne
       - AABB overlap: all 9 position cases (left, right, top, bottom, corners, inside)
       - Fast-fall multiplier produces correct increased vy
       - Variable jump cut: releasing jump early reduces vy by correct factor

       @badger/codegate

       What it exports:
       export { createCodeGate } from './core.ts';
       export type { MiniGameSpec, MiniGameResult, MiniGameEvent } from './types.ts';
       export { renderCodeGateCanvas } from './render-canvas.ts';
       export { renderCodeGateDom } from './render-dom.ts';

       Depends on: Nothing. No DOM dependency in core.ts or types.ts. Renderers depend on browser APIs but are optional imports.

       Key design: createCodeGate(spec: MiniGameSpec) returns an object with { update(dt): MiniGameEvent | null, submitInput(text): MiniGameResult | null,
       currentState(): GateState }. The state machine is tick-driven: every frame you call update(dt), and if the timer expires it emits a timeout event. Input
       submission is event-driven. This lets the host (StageRunScene) decide whether to integrate it into the game loop or pause the simulation.

       Tests needed:
       - FastType: correct string → success with correct timing bucket
       - FastType: wrong string → failure, heat penalty recorded
       - FastType: timeout → timeout event with heat penalty
       - CommandRepair: identify correct fix location in malformed command
       - Scoring: perfect window produces clean result tag; normal produces normal
       - All six gate kinds construct without error given valid spec

       @badger/sprite-contracts

       What it exports:
       export { validateSpriteManifest } from './validate.ts';
       export { loadSpriteSheet } from './loader.ts';
       export type { SpriteManifest, SpriteSheet, AnimationDef, LoadedSheet } from './types.ts';

       Depends on: Nothing in validate/types. loader.ts depends on browser's Image and CanvasRenderingContext2D.

       Key design: loadSpriteSheet(sheet: SpriteSheet, ctx: CanvasRenderingContext2D): Promise<LoadedSheet> where LoadedSheet exposes drawFrame(animName, frameIndex,
       x, y). The sprite renderer in apps/runner uses this. validateSpriteManifest replaces the existing tests/validate-data.mjs logic with a typed version that the
       test harness can also call.

       Tests needed:
       - Validate passes on the current data/sprites.json
       - Validate fails correctly on missing file, bad frameSize, zero frames
       - drawFrame bounds-checks frame index against animation length

       @badger/progression

       What it exports:
       export { createRunState, finalizeRun } from './RunAggregator.ts';
       export { createMetaState, persistMeta, loadMeta } from './MetaProgression.ts';
       export { createShopEngine } from './ShopEngine.ts';
       export { createSkillTree, computeDerivedStats } from './SkillTree.ts';
       export { createBoonPool } from './BoonPool.ts';
       export type { RunState, MetaState, Currency, Boon, ShopAction, DerivedStats, SkillNode } from './types.ts';

       Depends on: Nothing at runtime. Tests use Node fs to load data/items.json, data/progression.json.

       Key design: computeDerivedStats(attributes: AttributeMap): DerivedStats is a pure function implementing every formula from GAME_LOGIC.md section 4. ShopEngine
       takes the item manifest, current heat, dub_favor, and guile stat, and produces a shop offer list with prices. This isolates economy tuning without touching game
        engine code.

       Tests needed:
       - computeDerivedStats with all attributes at 0 produces baseline values exactly matching GAME_LOGIC.md
       - computeDerivedStats with vigor=5 → hp=10
       - Shop discount caps at 30% regardless of guile value
       - finalizeRun converts in-run credchips, heat, and parceled loot into correct meta currency deltas
       - Boon query: pool with beat tag boon queries correctly by item tag

       ---
       4. Game Engine Architecture

       Game Loop Design

       Fixed timestep with RAF driver and frame accumulation. This satisfies the fixed_timestep_option: required_for_debug constraint from roadmap-modes.yml.

       FIXED_STEP = 1/60  (16.67ms)
       accumulator = 0

       RAF callback(now):
         rawDt = min((now - last) / 1000, 0.1)   // cap spike at 100ms
         last = now
         accumulator += rawDt

         while accumulator >= FIXED_STEP:
           simulate(FIXED_STEP)       // deterministic physics step
           accumulator -= FIXED_STEP

         alpha = accumulator / FIXED_STEP       // interpolation factor
         render(alpha)                          // renderer interpolates between prev/curr

       The simulate function reads from an InputSnapshot produced at frame start (not mid-tick). This means replay recording works by saving the sequence of
       InputSnapshot objects — deterministic on replay.

       ReplayRecorder.ts records: { frame: number, inputs: InputSnapshot, rngSeed: number }[]. The RNG used for enemy AI decisions and item drops is a seedable PRNG
       (xoshiro128**), not Math.random().

       The focus-time slow (stim mechanic from the prototype: simDt = dt * 0.62) is implemented as a time scale multiplier passed into simulate. Fixed-step integrity
       is preserved because the step size itself is multiplied, not the accumulator.

       System Architecture

       Lightweight explicit systems, not a full ECS framework. The ECS data model (Entity = id + component map) is used for data storage, but there is no component
       query engine. Instead, systems receive typed entity lists they care about.

       Reasoning: A full ECS query engine (like bitECS) adds API surface and learning curve for agents. The game has a small number of actor archetypes (player,
       enemies, companions, traps, projectiles) that map cleanly to explicit typed arrays. The physics step functions in @badger/platformer-core are already written as
        pure data-in/data-out functions that operate on component structs — that is ECS style without the query overhead.

       System tick order per fixed step:
       1. InputSystem.snapshot() → ActionMap
       2. ReplayRecorder.record(frame, actionMap)
       3. PhysicsSystem.step(player, platforms, dt)
       4. CombatSystem.step(player, enemies, actionMap, dt)
       5. ItemSystem.step(player, actionMap, dt)
       6. HackSystem.step(player, enemies, traps, actionMap, dt)
       7. EnemySystem.step(enemies, player, dt)
       8. CompanionSystem.step(companions, player, enemies, dt)
       9. BeatSystem.step(dt) → emits downbeat events
       10. WaveDirector.step(dt) (horde mode only)
       11. CameraSystem.step(player, worldBounds, dt)
       12. Active minigame tick (if CodeGate is open)
       13. DebugOverlaySystem.collect(entities) (if debug flags on)

       Scene/State Management

       SceneManager maintains a stack. Push = enter overlay (pause menu, shop). Pop = return. Replace = full scene transition (title → gameplay).

       Each scene implements:
       interface Scene {
         readonly name: string;
         onEnter(ctx: SceneContext): void;
         onExit(): void;
         update(dt: number): void;
         render(renderer: Renderer, alpha: number): void;
       }

       SceneContext provides access to EventBus, SaveManager, AudioManager, InputSystem, and the package APIs. It is the only dependency injection point — scenes do
       not import engine singletons directly.

       The full state graph from GAME_LOGIC.md section 2 maps directly:
       - TitleScene → push ProfileSelectScene
       - ProfileSelectScene → replace ColonyHubScene
       - ColonyHubScene → push ShopScene, push SkillTreeScene, replace StageRunScene
       - StageRunScene hosts DialogueScene as a sub-component (not a full scene push, because dialogue pauses physics but not the renderer)

       Input Abstraction

       InputSystem maps physical keys and gamepad buttons to a named ActionMap:
       type ActionMap = {
         moveLeft: boolean;   moveRight: boolean;
         jump: boolean;       jumpPressed: boolean;   // pressed = edge detect
         fastFall: boolean;
         melee: boolean;      meleePressed: boolean;
         shoot: boolean;      shootPressed: boolean;
         item: boolean;       itemPressed: boolean;
         hack: boolean;       hackPressed: boolean;   hackHeld: boolean;
         pause: boolean;      pausePressed: boolean;
         debugToggle: boolean;
       };

       jumpPressed is the edge-detect (equivalent to pressed.has() in the prototype). The InputSystem also writes jumpBuffered onto the player's MovementState
       component — the physics system reads it there.

       Gamepad support: standard gamepad API, mapped in InputSystem. The CPU AI controller (VS mode) implements the same ActionMap interface — the physics and combat
       systems never know if input came from keyboard, gamepad, or AI.

       Renderer Design

       Layer order per frame render call:
       1. Sky gradient (full canvas)
       2. Far parallax (buildings, ParallaxLayer at 0.3× scroll)
       3. Mid parallax (signs, cables, 0.6×)
       4. Platform tiles (SpriteRenderer from lower_sprawl_tiles sheet)
       5. Traps and environment objects
       6. Projectiles and bullets
       7. Pickups (animated sprite, floating bob)
       8. Enemies (sprite + animation state)
       9. Companions
       10. Player (Moss, with equipment overlays)
       11. VFX particles (VFXPool)
       12. Debug hitbox/hurtbox overlay (DebugOverlaySystem)
       13. HUD (HP pips, fuel cells, heat meter, reload ring)
       14. Code gate panel (if active, rendered as canvas overlay at bottom third)
       15. Dialogue box (if active)
       16. Title card (if active, full overlay)

       SpriteRenderer.drawFrame(sheetId, animName, frame, x, y, flipX) is the single draw primitive. During prototype-to-sprites transition, a drawFallback(entity,
       ctx) function draws the vector placeholder. The switch is per-entity: if the sheet is loaded, use sprites; if not, use fallback. This means art can be delivered
        incrementally.

       AnimationState per entity stores { currentAnim, frame, timer }. It advances frame on timer expiry using the fps from sprites.json. State transitions (idle → run
        → jump) are driven by velocity and action flags, not animation callbacks.

       Audio System

       BeatClock.ts is the heart of the beat-sync system. It maintains a BPM value (default 86 for Dub Colony, 0/disabled for non-beat worlds) and exposes:
       interface BeatClock {
         currentBeat(): number;         // beats elapsed as float
         nextDownbeatTime(): number;    // seconds until next downbeat
         isInDownbeatWindow(): boolean; // true within ±80ms of downbeat
         onDownbeat(cb): void;          // subscribe
       }

       BeatSystem reads BeatClock each tick and emits typed events onto EventBus when downbeats occur. DubShield item listens for the downbeat event. BasslinBoots item
        listens for playerLanded event and cross-references isInDownbeatWindow().

       AudioManager uses Web Audio API AudioContext with master gain, a music gain node, and an SFX gain node. Beat-synced music tracks expose loop points aligned to
       bar boundaries. BeatClock derives its time source from AudioContext.currentTime for sub-millisecond accuracy rather than from the game loop dt accumulator —
       this prevents drift between audio and visual beat indicators.

       ---
       5. Implementation Phases

       Phase 1 — Project Scaffold

       Goal: Vite monorepo boots, existing prototype playable at localhost, all packages scaffolded, CI-ready test run.
       Prerequisites: none
       Files: pnpm-workspace.yaml, root package.json, tsconfig.base.json, biome.json, apps/runner/vite.config.ts, apps/runner/package.json, all packages/*/package.json
        and tsconfig.json, migrate index.html + src/game.css + src/main.js → apps/runner/. Keep tests/validate-data.mjs passing. ~150 lines of config.

       Phase 2 — platformer-core Package

       Goal: Pure physics functions extracted, typed, tested, imported by app.
       Prerequisites: Phase 1
       Files: All of packages/platformer-core/src/. Port physics constants and step logic from main.js into typed pure functions. App imports them and continues to
       work.
       ~300 lines of production code + ~120 lines of tests.

       Phase 3 — codegate Package + Minigame Integration

       Goal: All six gate kinds implemented, state machine tested, canvas renderer working in-game, FastType gate passes acceptance criteria from COMBAT_EXPANSION.md
       section 12.
       Prerequisites: Phase 2
       Files: All of packages/codegate/src/. Modify apps/runner/src/systems/HackSystem.ts and apps/runner/src/scenes/StageRunScene.ts to use the new package.
       ~350 lines production + ~150 lines tests.

       Phase 4 — Sprite Renderer + Animation System

       Goal: Sprite sheets load from data/sprites.json, Moss draws from sprite sheet with correct animation per action, fallback vector still used for unloaded sheets.
       Prerequisites: Phase 1
       Files: packages/sprite-contracts/src/, apps/runner/src/renderer/SpriteRenderer.ts, apps/runner/src/renderer/AnimationState.ts.
       ~250 lines production + ~80 lines tests.

       Phase 5 — ECS Foundation + Player Actor Refactor

       Goal: Entity/component model in place, player (MossBadger.ts) and all prototype verbs migrated to component-based architecture, StageRunScene drives the system
       tick order defined in section 4.
       Prerequisites: Phases 2, 4
       Files: apps/runner/src/engine/ (GameLoop, SceneManager, EventBus), apps/runner/src/actors/MossBadger.ts, apps/runner/src/systems/ (InputSystem, PhysicsSystem,
       CombatSystem, ItemSystem, CameraSystem).
       ~450 lines production.

       Phase 6 — Training Mode + Debug Overlay

       Goal: TrainingScene live with invincible dummy, hitbox/hurtbox overlay toggle, all measurements listed in roadmap-modes.yml section training_dummy.measurements
       displayed in-frame.
       Prerequisites: Phase 5
       Files: apps/runner/src/scenes/TrainingScene.ts, apps/runner/src/systems/DebugOverlaySystem.ts, apps/runner/src/engine/DebugFlags.ts.
       ~300 lines production.

       Phase 7 — Enemy System + Horde Mode

       Goal: Three enemy archetypes (crawler, drone wasp, bass turret) with state machines, WaveDirector spawns 10 waves without softlock, horde arena loads from level
        JSON.
       Prerequisites: Phase 5
       Files: apps/runner/src/systems/EnemySystem.ts, apps/runner/src/actors/EnemyFactory.ts, apps/runner/src/actors/enemies/sprawl.ts,
       apps/runner/src/systems/WaveDirector.ts, apps/runner/src/scenes/HordeScene.ts, apps/runner/src/world/LevelLoader.ts, apps/runner/src/world/worlds/world-1.json.
       ~500 lines production.

       Phase 8 — progression Package + Colony Hub + Shop

       Goal: @badger/progression fully implemented, ColonyHubScene and ShopScene functional with Murr Murrby, skill tree UI working with first Clawline and Rail nodes
       purchasable, meta-state persists across reloads.
       Prerequisites: Phase 5
       Files: All of packages/progression/src/, apps/runner/src/scenes/ColonyHubScene.ts, apps/runner/src/scenes/ShopScene.ts,
       apps/runner/src/scenes/SkillTreeScene.ts, apps/runner/src/engine/SaveManager.ts.
       ~400 lines production + ~150 lines tests.

       Phase 9 — Combat Depth Pass

       Goal: Parry flash + katana draw state, rally health visual, perfect reload sweet spot ring, enemy windup telegraphs for all three enemy types. All timing
       mechanics from DESIGN.md timing_mechanics section working.
       Prerequisites: Phases 5, 6, 7
       Files: apps/runner/src/systems/CombatSystem.ts (expanded), apps/runner/src/renderer/UIRenderer.ts (reload ring, rally grey HP),
       apps/runner/src/actors/enemies/sprawl.ts (windup states).
       ~350 lines production.

       Phase 10 — Hack System + Matrix Powers

       Goal: Quick hack, aimed hack, and command hack input modes working. Terminal overload, camera spoof, environment targets visualized with glyph overlays. Tier 0
       and Tier 1 matrix powers (Street Senses, Remote Tap) functional.
       Prerequisites: Phases 5, 3, 8
       Files: apps/runner/src/systems/HackSystem.ts, apps/runner/src/world/TrapSystem.ts, trap ownership state machine, hack range overlays in DebugOverlaySystem.ts.
       ~400 lines production.

       Phase 11 — Dialogue + Campaign Scene Graph

       Goal: DialogueScene component with RPG box, portrait slot, typewriter text, branching choices, flag writes. TitleScene, MissionBriefingScene, ResultsScene wired
        up. Full World 1 playable from title to results screen.
       Prerequisites: Phases 5, 8
       Files: apps/runner/src/scenes/DialogueScene.ts, apps/runner/src/systems/DialogueSystem.ts, apps/runner/src/renderer/TitleCardRenderer.ts,
       apps/runner/src/scenes/MissionBriefingScene.ts, apps/runner/src/scenes/ResultsScene.ts, World 1 stage JSON data files.
       ~450 lines production.

       Phase 12 — Beat System + Dub Colony World

       Goal: BeatClock driving BeatSystem, DubShield beat-sync working, BasslineBoots landing shockwave, bass platforms active in World 4 level data, BeatClock derived
        from AudioContext.currentTime.
       Prerequisites: Phases 5, 9, 11
       Files: apps/runner/src/audio/BeatClock.ts, apps/runner/src/audio/AudioManager.ts, apps/runner/src/audio/SoundBank.ts, apps/runner/src/systems/BeatSystem.ts,
       apps/runner/src/world/worlds/world-4.json.
       ~300 lines production.

       ---
       6. Agent Task Format

       Phase 1: Project Scaffold
       Goal: Migrate the single-file prototype into a Vite + pnpm monorepo that boots with `pnpm dev`, preserves the existing game play, and passes `npm test`.
       Prerequisites: none
       Files to create/modify:
         - pnpm-workspace.yaml
         - package.json (root, replace existing)
         - tsconfig.base.json
         - biome.json
         - apps/runner/package.json
         - apps/runner/tsconfig.json
         - apps/runner/vite.config.ts
         - apps/runner/index.html (move from root)
         - apps/runner/src/main.js (move from src/)
         - apps/runner/src/game.css (move from src/)
         - packages/platformer-core/package.json
         - packages/codegate/package.json
         - packages/sprite-contracts/package.json
         - packages/progression/package.json
       Acceptance criteria:
         - `pnpm dev` serves the game on localhost:5173, prototype is visually identical
         - `pnpm test` runs validate-data.mjs and passes
         - `pnpm lint` runs Biome with zero errors
         - All four packages resolve as workspace deps in apps/runner
       Implementation notes:
         - vite.config.ts: set base to './', publicDir to '../../assets', resolve alias for data/ dir
         - tsconfig.base.json: target ES2022, moduleResolution bundler, strict true, noUncheckedIndexedAccess true
         - Root package.json scripts: dev → pnpm -F @badger/runner dev, test → node tests/validate-data.mjs, build → pnpm -r build
         - Keep main.js as plain JS for now (not yet TypeScript); migration happens in Phase 5
         - biome.json: enable recommended rules, formatter indent 2 spaces, quotes single

       Phase 2: platformer-core Package
       Goal: Extract all physics logic from main.js into typed pure functions in @badger/platformer-core, import them from apps/runner, and verify via deterministic
       unit tests.
       Prerequisites: Phase 1
       Files to create/modify:
         - packages/platformer-core/src/index.ts
         - packages/platformer-core/src/PhysicsParams.ts
         - packages/platformer-core/src/components/Transform.ts
         - packages/platformer-core/src/components/Velocity.ts
         - packages/platformer-core/src/components/MovementState.ts
         - packages/platformer-core/src/components/HitboxSet.ts
         - packages/platformer-core/src/components/Health.ts
         - packages/platformer-core/src/components/Collider.ts
         - packages/platformer-core/src/systems/gravityStep.ts
         - packages/platformer-core/src/systems/movementStep.ts
         - packages/platformer-core/src/systems/platformStep.ts
         - packages/platformer-core/src/systems/coyoteStep.ts
         - packages/platformer-core/src/systems/aabb.ts
         - packages/platformer-core/src/tests/physics.test.ts
         - packages/platformer-core/src/tests/aabb.test.ts
         - apps/runner/src/main.js (import physics constants and steps from package)
       Acceptance criteria:
         - All physics constants from main.js P object live in PhysicsParams with type PhysicsParams
         - gravityStep, movementStep, platformStep, coyoteStep are pure: no side effects, same inputs always produce same outputs
         - 100% of physics unit tests pass using Node test runner (node --test)
         - Game in apps/runner still plays identically to before (prototype regression test: no visible change in feel)
       Implementation notes:
         - gravityStep signature: (vy: number, params: PhysicsParams, dt: number) → number
         - platformStep signature: (transform: Transform, velocity: Velocity, platforms: Rect[], prevVy: number) → { transform, velocity, onGround: boolean }
         - coyoteStep signature: (state: MovementState, onGround: boolean, dt: number) → MovementState
         - aabb: (a: Rect, b: Rect) → boolean where Rect = {x,y,w,h}
         - Physics constants from prototype: gravity=1900, jumpVelocity=-650, maxFallSpeed=1100, runAccelGround=5200, runAccelAir=2900, friction=4200, maxRunSpeed=285,
        fastFallMultiplier=1.55, coyote=0.095, jumpBuffer=0.11, variableJumpCut=0.48
         - Test: apply gravity for 1.0s → vy should equal exactly 1900 (starting from 0, uncapped); then test cap at 1100
         - Test: coyote timer expires after 0.095s, asserting onGround-triggered reset

       Phase 3: codegate Package + Minigame Integration
       Goal: Implement all six minigame gate kinds in @badger/codegate, wire them into the prototype via a canvas overlay panel, replace the existing gate.active
       inline code in main.js.
       Prerequisites: Phase 1
       Files to create/modify:
         - packages/codegate/src/types.ts
         - packages/codegate/src/core.ts
         - packages/codegate/src/gates/FastTypeGate.ts
         - packages/codegate/src/gates/CommandRepairGate.ts
         - packages/codegate/src/gates/RegexMatchGate.ts
         - packages/codegate/src/gates/RoutingGate.ts
         - packages/codegate/src/gates/BytecodeOrderGate.ts
         - packages/codegate/src/gates/MicroCodeGate.ts
         - packages/codegate/src/render-canvas.ts
         - packages/codegate/src/render-dom.ts
         - packages/codegate/src/index.ts
         - packages/codegate/src/tests/fasttype.test.ts
         - packages/codegate/src/tests/commandrepair.test.ts
         - packages/codegate/src/tests/scoring.test.ts
         - apps/runner/src/main.js (replace gate logic with createCodeGate calls)
       Acceptance criteria:
         - MiniGameSpec interface matches exactly the shape in MINIGAMES.md
         - FastType gate: correct string in perfect window → result.outcome === 'clean'; wrong string → result.outcome === 'fail'
         - Timeout fires after timeLimitMs and emits event with failureHeat delta
         - Canvas renderer draws gate panel in bottom third of canvas when gate is active
         - Old gate.active code block fully removed from main.js
       Implementation notes:
         - MiniGameSpec: { id, kind, prompt, timeLimitMs, attempts, rewardTags, failureHeat }
         - MiniGameResult: { outcome: 'clean'|'normal'|'fail'|'timeout', heatDelta: number, rewardTags: string[], timeMs: number }
         - Perfect window = last 15% of timeLimitMs (timing matches HACKING_IS_FIGHTING.md rail reload design)
         - core.ts createCodeGate returns { update(dt): MiniGameEvent|null, submitInput(text): MiniGameResult|null, currentState(): GateState }
         - GateState: { kind, prompt, inputSoFar, timeRemaining, attemptsLeft, phase: 'active'|'succeeded'|'failed' }
         - render-canvas.ts drawCodeGate(ctx, state, W, H): draws monospace terminal panel over bottom 33% of canvas
         - render-dom.ts updateCodeGateDom(el, state): sets innerHTML of #minigame element (replaces current updateHud logic)
         - The 6 gate kinds only need to validate and score; routing and bytecode-order can be click-or-keyboard selection rather than free text for now

       Phase 4: Sprite Renderer + Animation System
       Goal: Load sprites.json, load PNG sheets, draw Moss and VFX from sprite frames; fall back to placeholder vectors for unloaded sheets; sprite-contracts package
       typed and tested.
       Prerequisites: Phase 1
       Files to create/modify:
         - packages/sprite-contracts/src/types.ts
         - packages/sprite-contracts/src/validate.ts
         - packages/sprite-contracts/src/loader.ts
         - packages/sprite-contracts/src/index.ts
         - packages/sprite-contracts/src/tests/validate.test.ts
         - apps/runner/src/renderer/SpriteRenderer.ts
         - apps/runner/src/renderer/AnimationState.ts
         - apps/runner/src/renderer/Renderer.ts
         - apps/runner/src/main.js (replace drawBadger with SpriteRenderer call, fallback if sheet not loaded)
       Acceptance criteria:
         - validateSpriteManifest(data/sprites.json) passes in both test harness and browser
         - loadSpriteSheet returns a LoadedSheet within 500ms for a 32×32 sheet
         - drawFrame(sheetId, animName, 0, x, y, false) draws the first frame of an animation at correct position
         - AnimationState.advance(dt) increments frame at correct fps and wraps at animation length
         - Fallback: if sheet PNG not found (404), drawFallback(ctx, entity) is called instead; no crash
       Implementation notes:
         - SpriteSheet type mirrors sprites.json schema: { id, file, frameSize: [w,h], animations: Record<string, {frames,fps}> }
         - loadSpriteSheet creates an HTMLImageElement, resolves on load, returns LoadedSheet
         - LoadedSheet.drawFrame(ctx, animName, frameIndex, x, y, flipX): computes srcX = frameIndex * frameW, srcY = animRow * frameH using a row-per-animation layout
         - AnimationState: { currentAnim: string, frame: number, timer: number } — advance() uses animation fps from the loaded sheet
         - The animation row order is insertion order of keys in the animations object in sprites.json
         - Moss's animation selection logic: onGround + vx > 10 → 'run', onGround + vx ≈ 0 → 'idle', vy < 0 → 'jump_up', vy > 0 → 'fall', meleeTimer > 0 →
       'melee_claws' or 'melee_katana', etc.

       Phase 5: ECS Foundation + Player Actor Refactor
       Goal: Full entity/component model, SceneManager, EventBus, and GameLoop in place; player and prototype systems migrated to typed TypeScript; all prototype
       features working under new architecture.
       Prerequisites: Phases 2, 4
       Files to create/modify:
         - apps/runner/src/engine/GameLoop.ts
         - apps/runner/src/engine/SceneManager.ts
         - apps/runner/src/engine/EventBus.ts
         - apps/runner/src/engine/DebugFlags.ts
         - apps/runner/src/engine/ReplayRecorder.ts
         - apps/runner/src/systems/InputSystem.ts
         - apps/runner/src/systems/PhysicsSystem.ts
         - apps/runner/src/systems/CombatSystem.ts
         - apps/runner/src/systems/ItemSystem.ts
         - apps/runner/src/systems/CameraSystem.ts
         - apps/runner/src/actors/MossBadger.ts
         - apps/runner/src/scenes/StageRunScene.ts
         - apps/runner/src/main.ts (replace main.js with full TypeScript entry)
       Acceptance criteria:
         - Game boots through SceneManager → StageRunScene, all prototype features work identically
         - GameLoop runs at fixed 60Hz step; delta capped at 100ms
         - InputSystem.snapshot() produces ActionMap; jumpPressed fires only on edge (not held)
         - ReplayRecorder records input frames; playing back a 10-second recording reproduces identical entity positions
         - Player can use all verbs: run, jump (coyote + buffer), melee (claws), shoot (railgun), boost (rocket), stim, hack gate
       Implementation notes:
         - GameLoop constructor takes a canvas element; internally creates RAF loop
         - EventBus<T extends EventMap>: strongly typed; emit(key, payload) and on(key, handler) — use a Map of Set<handler>
         - SceneManager: scenes are a stack; push(scene), pop(), replace(scene); calls onEnter/onExit
         - InputSystem maps KeyboardEvent codes to ActionMap fields; edge detection via a Set cleared after snapshot
         - MossBadger is not a class with update() — it is a module that exports createPlayer(): Entity and processMossInput(entity, actionMap, dt, systems): void
         - StageRunScene runs the 13-step tick order defined in section 4 of this architecture document
         - Retain fallback vector drawing in all systems until Phase 4 sprite renderer is confirmed stable
         - main.ts no longer has game logic — it only creates canvas, instantiates GameLoop, creates SceneManager, and calls gameLoop.start()

       Phase 6: Training Mode + Debug Overlay
       Goal: Full training_dummy mode live with all overlays and measurements specified in roadmap-modes.yml.
       Prerequisites: Phase 5
       Files to create/modify:
         - apps/runner/src/scenes/TrainingScene.ts
         - apps/runner/src/systems/DebugOverlaySystem.ts
         - apps/runner/src/engine/DebugFlags.ts (expand)
         - apps/runner/src/actors/TrainingDummy.ts
       Acceptance criteria:
         - Pressing [TAB] from main menu enters training mode
         - [H] toggles hitbox overlay; [U] toggles hurtbox overlay; [F] toggles frame data
         - Dummy takes visible flinch on hit but never dies; HP display shows ∞
         - Every attack reports: last hit damage, combo damage, hits per second, rail reload delta ms, melee active frames
         - Invincible player toggle [I], infinite fuel toggle [F2], reset positions [R]
       Implementation notes:
         - DebugFlags is a plain object exported as a singleton: { showHitboxes, showHurtboxes, showFrameData, invinciblePlayer, infiniteFuel } — all boolean
         - DebugOverlaySystem.render(ctx, entities, camera): draws translucent red rects for hitboxes, translucent blue for hurtboxes, white labels for frame counters
         - HitboxSet component stores named rects: { attack: Rect|null, hurt: Rect, parry: Rect|null } — relative to entity transform
         - TrainingDummy entity has hp=Infinity, no AI, responds to damage with a 0.15s visual tint
         - DamageReport: { lastHit: number, combo: number, hps: number, reloadDeltaMs: number, meleeActiveFrames: number } — stored on the scene, displayed by
       UIRenderer
         - Measurements panel draws in top-right corner of canvas, monospace, white text on dark semi-transparent background

       Phase 7: Enemy System + Horde Mode
       Goal: Three enemy archetypes with state machines, WaveDirector, one arena from world-1.json, horde mode survives 10 waves.
       Prerequisites: Phase 5
       Files to create/modify:
         - apps/runner/src/systems/EnemySystem.ts
         - apps/runner/src/actors/EnemyFactory.ts
         - apps/runner/src/actors/enemies/sprawl.ts (TollRatCrawler, DroneWasp, BassTurretStub)
         - apps/runner/src/systems/WaveDirector.ts
         - apps/runner/src/scenes/HordeScene.ts
         - apps/runner/src/world/LevelLoader.ts
         - apps/runner/src/world/worlds/world-1.json
       Acceptance criteria:
         - EnemySystem drives state machines: idle → patrol → alert → windup → attack → recovery for crawlers
         - WaveDirector spawns correct budget per wave using enemy cost table from roadmap-modes.yml
         - Airborne enemies (drone) are not spawned until wave 3 or player has railgun
         - Performance: 25 active entities + projectiles maintains 60fps (measure via GameLoop delta spike detection)
         - Horde mode win condition: survive 10 waves; display enemy clear count per wave
       Implementation notes:
         - EnemyDef type: { id, class, hp, speed, damage, stun, attackRange, attackCd, state, ai: EnemyAISpec }
         - EnemyAISpec for crawler: { kind: 'patrol', bounds: [minX, maxX], turnAtEdge: true }
         - EnemyAISpec for drone: { kind: 'sine', centerY: number, amplitude: 32, frequency: 2.1 }
         - EnemyFactory.createEnemy(def: EnemyDef, x, y): Entity — composes Transform, Velocity, Health, HitboxSet, EnemyState components
         - EnemyState component: { current: StateName, timer: number, target: Entity|null }
         - State machine transitions are pure functions: enemyTransition(state, world): StateName — called by EnemySystem
         - world-1.json schema: { id, platforms: Rect[], spawnPoints: {id, x, y}[], triggers: {id, type, x, y, w, h, payload}[] }
         - WaveDirector reads enemy cost table from data/game-manifest.json extension or inline config; spawns at defined spawnPoints
         - Never spawn inside player AABB (check before placing)

       Phase 8: progression Package + Colony Hub + Shop
       Goal: All @badger/progression exports implemented and tested; ColonyHubScene, ShopScene, SkillTreeScene functional; meta-state persists via SaveManager.
       Prerequisites: Phase 5
       Files to create/modify:
         - packages/progression/src/types.ts
         - packages/progression/src/RunAggregator.ts
         - packages/progression/src/MetaProgression.ts
         - packages/progression/src/ShopEngine.ts
         - packages/progression/src/SkillTree.ts
         - packages/progression/src/BoonPool.ts
         - packages/progression/src/index.ts
         - packages/progression/src/tests/skillTree.test.ts
         - packages/progression/src/tests/shopEngine.test.ts
         - packages/progression/src/tests/metaProgression.test.ts
         - apps/runner/src/scenes/ColonyHubScene.ts
         - apps/runner/src/scenes/ShopScene.ts
         - apps/runner/src/scenes/SkillTreeScene.ts
         - apps/runner/src/engine/SaveManager.ts
       Acceptance criteria:
         - computeDerivedStats({ vigor:5, sinew:0, voltage:0, velocity:0, cortex:0, bass:0, guile:0 }) returns { hp:10, ... }
         - Shop discount clamps at 30% at guile ≥ 15
         - Purchasing 'double_swipe' skill node deducts 1 SP, marks node unlocked, allows 'parry_tooth' (cost 2) to appear as available
         - SaveManager.save(meta) writes to localStorage key 'bsr-meta-v1'; SaveManager.load() returns same object on next boot
         - ColonyHubScene shows currency counts and nav to Shop and SkillTree subscenes
       Implementation notes:
         - AttributeMap: { vigor, sinew, voltage, velocity, cortex, bass, guile } all numbers
         - DerivedStats: { hp, rallyWindow, clawDamage, katanaDamage, railDamage, maxSpeed, hackTimeBonus, shopDiscount, companionSyncRate } — all formulas from
       GAME_LOGIC.md section 4
         - SkillTree: nodes stored as graph; purchaseNode(nodeId, state) validates prereqs, cost, and SP; returns new state or throws
         - BoonPool: { active: Boon[], add(boon), hasTag(tag): boolean, query(tag): Boon[] }
         - ShopEngine.generateOffer(world, heat, dubFavor, guile, items): ShopItem[] — base pool + world-themed items; price = base * (1 - discount)
         - MetaProgression persists: { credchips, blueprintShards, dubFavor, orbitHeat, unlockedBoons, purchasedSkills }
         - SaveManager schema version: if saved version < current, run migration or reset with warning

       Phase 9: Combat Depth Pass
       Goal: Parry flash + katana draw state, rally health with grey HP bar, perfect reload sweet-spot ring UI, enemy windup telegraphs; all timing mechanics from
       DESIGN.md working.
       Prerequisites: Phases 5, 6, 7
       Files to create/modify:
         - apps/runner/src/systems/CombatSystem.ts (expand significantly)
         - apps/runner/src/renderer/UIRenderer.ts
         - apps/runner/src/actors/enemies/sprawl.ts (add windup state)
         - apps/runner/src/actors/MossBadger.ts (parry state, katana draw window)
       Acceptance criteria:
         - Rally window: dealing damage within 1.2s of taking damage recovers 35% of grey HP
         - Parry: melee within 95ms enemy-flash window → enemy stunned, tempo +1, katana draw available if unlocked
         - Perfect reload: K-press during 90ms sweet spot → next shot pierces + EMP spark
         - Reload ring drawn as circular arc in HUD; sweet spot highlighted as bright segment
         - Enemy windup: crawler shows 0.3s red flash before attack; drone shows firing arc preview
       Implementation notes:
         - RallyTimer component: { greyHp: number, windowLeft: number } — CombatSystem decrements window each tick; on player attack, if windowLeft > 0,
       recoverGreyHp(0.35)
         - ParryWindow component on player: { active: bool, timer: number } — set on melee input; CombatSystem checks if enemy attack overlaps during active window
         - Katana draw availability: PlayerState flag katanaDrawAvailable, set true for 0.6s after successful parry if hasKatana
         - RailReloadState: { phase: 'fired'|'cooling'|'sweetspot'|'late'|'ready', timer: number } — durations: 120ms fired, 420ms cooling, 90ms sweet spot, 350ms late
         - UIRenderer.drawReloadRing(ctx, state, x, y): draws arc using canvas arc(), sweet spot arc segment in bright cyan (#67f3c4)
         - Tempo meter: integer 0-5; track in PlayerState; spend on companion assist and combo finishers
         - Grey HP bar: draw greyHp amount in colour #4a4a4a beneath the red HP bar; it shrinks as rally recovers it

       Phase 10: Hack System + Matrix Powers + Trap System
       Goal: All three hack input modes (quick, aimed, command) working; Tier 0 and 1 matrix powers functional; trap ownership state machine visible in debug overlay.
       Prerequisites: Phases 5, 3, 8
       Files to create/modify:
         - apps/runner/src/systems/HackSystem.ts
         - apps/runner/src/world/TrapSystem.ts
         - apps/runner/src/systems/DebugOverlaySystem.ts (extend with hack ranges)
       Acceptance criteria:
         - Quick hack (tap H): auto-targets nearest hackable in range, applies Tier 0/1 effect
         - Aimed hack (hold H): slows time to 0.3× for 1.5s, shows targeting bracket on hackables
         - Command hack (H+direction): opens a 1-3 token command codegate on nearby terminal
         - Trap ownership visible in debug: hostile=red, neutral=white, hacked=green, unstable=yellow
         - Tier 1 Remote Tap: can open simple doors at range 200px; short-circuit cameras (disables 8s)
       Implementation notes:
         - HackableComponent: { id, tier, state: TrapState, range: number, cooldown: number, hackCommand: MiniGameSpec }
         - TrapState: 'hostile'|'neutral'|'hacked'|'unstable' — matches COMBAT_EXPANSION.md section 5.3
         - HackSystem.findTarget(player, hackables): returns nearest within range sorted by tier compatibility
         - Aimed hack slow: apply timeScale=0.3 to GameLoop during aim window; restore on release or timeout
         - Matrix power dispatch: checkMatrixPower(player, target, derivedStats): MatrixEffect|null — reads tier from cortex stat
         - Debug overlay draws dashed circle around hackables showing range; hack line drawn from player to locked target
         - CodeGate from Phase 3 is instantiated by HackSystem for command hacks; result feeds back into TrapSystem

       Phase 11: Dialogue System + Full Scene Graph + World 1 Campaign
       Goal: RPG dialogue box with portrait/choices/flags working; complete scene graph from Title to ResultsScreen; World 1 (4 stages) playable as a campaign.
       Prerequisites: Phases 5, 8
       Files to create/modify:
         - apps/runner/src/scenes/TitleScene.ts
         - apps/runner/src/scenes/DialogueScene.ts
         - apps/runner/src/systems/DialogueSystem.ts
         - apps/runner/src/renderer/TitleCardRenderer.ts
         - apps/runner/src/scenes/MissionBriefingScene.ts
         - apps/runner/src/scenes/ResultsScene.ts
         - apps/runner/src/world/worlds/world-1.json (expand with triggers, dialogue refs)
         - apps/runner/src/ui/HudPanel.ts
       Acceptance criteria:
         - Title screen displays game name and navigates to ProfileSelect on Enter
         - DialogueScene shows portrait left, speaker name top, 2-4 lines typewriter text, up to 4 stacked choice buttons
         - Choosing a dialogue option writes correct flags (trust, heat, questFlag) via EventBus
         - World 1 Stage 1-1 plays, defeats Toll Rat Foreman sub-boss, shows ResultsScreen with currency delta
         - ResultsScene displays damage dealt, parries, reloads, hacks, time alive, and transitions to ColonyHub
       Implementation notes:
         - DialogueSpec: { id, lines: { speaker, text, portrait }[], choices?: { text, flagWrites, next }[] }
         - DialogueSystem: state = { specId, lineIndex, charIndex, charTimer, pendingChoices } — advance on Confirm input, render via UIRenderer
         - Typewriter: advance charIndex by 1 every 35ms; pressing Confirm skips to end of current line
         - TitleCardRenderer: draws full-screen dark overlay with white Brechtian placard text + world title in large monospace
         - World 1 triggers: dialogue_trigger (shows DialogueScene overlay), item_spawn, sub_boss_arena, stage_exit
         - ResultsScene reads from RunAggregator.currentRun() snapshot; displays credchip delta and awards blueprint_shards
         - Murr Murrby shop spawned via trigger in 1-2; ShopScene pushed as overlay on trigger activation

       Phase 12: Beat System + Dub Colony + Audio Foundation
       Goal: BeatClock derived from AudioContext.currentTime; BeatSystem firing downbeat events; DubShield and BasslineBoots working; World 4 stage 4-1 playable with
       beat platforms.
       Prerequisites: Phases 5, 9, 11
       Files to create/modify:
         - apps/runner/src/audio/AudioManager.ts
         - apps/runner/src/audio/BeatClock.ts
         - apps/runner/src/audio/SoundBank.ts
         - apps/runner/src/systems/BeatSystem.ts
         - apps/runner/src/world/worlds/world-4.json
       Acceptance criteria:
         - BeatClock.isInDownbeatWindow() returns true within ±80ms of downbeat (verified visually with overlay)
         - DubShield absorbs one hit when activated within downbeat window; flashes on miss
         - BasslineBoots landing within downbeat window creates visible shockwave VFX and deals 1 damage to adjacent enemies
         - World 4 stage 4-1 has at least 3 bass platforms that pulse on beat (colour shift + upward nudge)
         - AudioManager.playMusic(id) loads an audio buffer and plays it through a gain node; master volume controllable
       Implementation notes:
         - BeatClock constructor: (bpm: number, audioCtx: AudioContext) — startTime stored at AudioContext.currentTime when music begins
         - currentBeat(): (audioCtx.currentTime - startTime) * (bpm / 60)
         - nextDownbeatTime(): seconds until next beat = (Math.ceil(currentBeat()) - currentBeat()) / (bpm / 60)
         - isInDownbeatWindow(windowMs=80): Math.abs(nextDownbeatTime() * 1000) < windowMs || Math.abs((nextDownbeatTime() - (60/bpm)) * 1000) < windowMs
         - BeatSystem subscribes to BeatClock.onDownbeat and emits EventBus 'downbeat' event each tick
         - BassPlatform entity component: { baseY, pulseAmp, activated } — BeatSystem sets activated=true for 120ms on downbeat; PhysicsSystem adds pulseAmp to
       platform top y during activation window
         - SoundBank: loads audio files via fetch + AudioContext.decodeAudioData, caches by id
         - DubShield logic in ItemSystem: on beatguard_active flag + 'downbeat' event → set shieldReady=true for 0.3s; on player hit during shieldReady → absorb hit,
       consume shield

       ---
       Critical Files for Implementation

       - /home/user/work/code/artifacts/badger-sprawl-runner/src/main.js — the prototype all systems must remain compatible with during migration
       - /home/user/work/code/artifacts/badger-sprawl-runner/data/sprites.json — the animation contract that @badger/sprite-contracts and SpriteRenderer must
       faithfully implement
       - /home/user/work/code/artifacts/badger-sprawl-runner/MINIGAMES.md — contains the canonical MiniGameSpec TypeScript interface that @badger/codegate/src/types.ts
        must match exactly
       - /home/user/work/code/artifacts/badger-sprawl-runner/roadmap-modes.yml — the complete acceptance criteria for training, horde, and VS modes that Phases 6–7 are
        measured against
       - /home/user/work/code/artifacts/badger-sprawl-runner/GAME_LOGIC.md — the stat derivation formulas (section 4) and the full enemy state machine schema
       (section 7) that @badger/progression and EnemySystem must implement without deviation
