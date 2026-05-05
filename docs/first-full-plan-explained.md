# Badger Sprawl Runner — Full Architecture Expansion Plan

## Context

**Why this change is being made:**  
The project is a dependency-free single-file canvas prototype (`src/main.js`, ~310 lines) with extraordinarily rich design documentation covering 8 worlds, 50+ enemies, 7 RPG stats, 5 skill trees, 6 minigame kinds, 4 companion AI modes, 15+ items, Brechtian narrative structure, and 4 ending variants. The prototype proves the core physics loop and design concept. This plan expands it into a first-class, maintainable 2D platformer infrastructure capable of delivering the full design.

**What prompted it:**  
The game design docs explicitly plan a monorepo extraction (`docs/own-project-extraction.md`). The minigame spec already uses TypeScript interface notation. The gap between prototype and full game requires architectural scaffolding that single-file JS cannot sustain.

**Intended outcome:**  
A Vite + TypeScript + Biome + pnpm monorepo with four extractable library packages and a browser game app — documented with specs and phase plans fine-grained enough for any LLM agent to execute one phase at a time without reading more than two files of context.

---

## Tech Stack Decision: Vite + TypeScript + Biome + pnpm workspaces

**Chosen over:**
- Plain ES modules: No types, no HMR, no package boundary story. Fails at this feature count.
- Vite-only (no TS): The minigame engine must be extractable as a standalone library. Untyped JS libraries are hard to consume. The stat derivation formulas and hitbox contracts accumulate invisible bugs without types.

**Justification:**
- `pnpm workspaces` satisfies the extraction plan with zero cost; getting boundaries wrong mid-project is expensive.
- TypeScript is already implicit in the docs (MINIGAMES.md `interface MiniGameSpec`, GAME_LOGIC.md `yaml`-typed attribute maps).
- Vite replaces `python3 -m http.server` with HMR, module resolution, and a static bundle.
- Biome replaces ESLint + Prettier as a single fast tool.
- Build output remains browser-first static bundle — no server runtime required.
- Canvas2D only, no WebGL. Renderer is swappable via adapter.

---

## Complete Directory Structure

```
badger-sprawl-runner/
│
├── pnpm-workspace.yaml              # declares apps/* and packages/*
├── package.json                     # root — scripts: dev, build, test, lint
├── tsconfig.base.json               # shared TS config (ES2022, bundler, strict)
├── biome.json                       # single linter/formatter for all packages
├── .gitignore
├── bridge.yml                       # existing artifact metadata, unchanged
│
├── data/                            # EXISTING — data-driven JSON manifests
│   ├── game-manifest.json
│   ├── items.json
│   ├── progression.json
│   └── sprites.json
│
├── assets/
│   └── sprites/                     # PNG sprite sheets (currently empty, contract defined)
│
├── docs/
│   ├── own-project-extraction.md    # EXISTING
│   ├── architecture.md              # NEW — this design as prose reference
│   └── superpowers/specs/
│       └── 2026-05-05-badger-sprawl-architecture-design.md  # NEW — brainstorm spec
│
├── apps/
│   └── runner/
│       ├── package.json             # name: @badger/runner
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html               # moved from root
│       └── src/
│           ├── main.ts              # Entry: init engine, load manifests, start loop
│           ├── game.css             # moved from src/game.css
│           │
│           ├── engine/
│           │   ├── GameLoop.ts      # Fixed-step + RAF accumulator
│           │   ├── SceneManager.ts  # Named scene stack, push/pop/replace
│           │   ├── EventBus.ts      # Typed pub/sub
│           │   ├── SaveManager.ts   # localStorage with schema version
│           │   ├── ReplayRecorder.ts # Input frame recording
│           │   └── DebugFlags.ts    # Global debug flag set
│           │
│           ├── scenes/
│           │   ├── TitleScene.ts
│           │   ├── ProfileSelectScene.ts
│           │   ├── ColonyHubScene.ts
│           │   ├── DialogueScene.ts
│           │   ├── ShopScene.ts
│           │   ├── SkillTreeScene.ts
│           │   ├── MissionBriefingScene.ts
│           │   ├── StageRunScene.ts      # Main gameplay — hosts all systems
│           │   ├── ResultsScene.ts
│           │   ├── TrainingScene.ts      # training_dummy mode
│           │   ├── HordeScene.ts
│           │   ├── VsCpuScene.ts
│           │   └── EpilogueScene.ts
│           │
│           ├── systems/
│           │   ├── InputSystem.ts        # Keyboard + gamepad → ActionMap
│           │   ├── PhysicsSystem.ts      # Wraps @badger/platformer-core steps
│           │   ├── CombatSystem.ts       # Hitboxes, parry, rally, perfect reload
│           │   ├── EnemySystem.ts        # State machines, AI step
│           │   ├── ItemSystem.ts         # Active/passive item tick, cooldowns
│           │   ├── HackSystem.ts         # Matrix powers, terminal hacks, combat hacks
│           │   ├── CompanionSystem.ts    # AI modes, command meter, trust
│           │   ├── BeatSystem.ts         # BPM clock, downbeat events
│           │   ├── CameraSystem.ts       # Smooth follow with lookahead
│           │   ├── DialogueSystem.ts     # RPG box state machine
│           │   ├── WaveDirector.ts       # Horde: spawn budget, telegraph
│           │   └── DebugOverlaySystem.ts # Hitbox/hurtbox/frame data overlay
│           │
│           ├── actors/
│           │   ├── MossBadger.ts         # Player entity + verb implementations
│           │   ├── EnemyFactory.ts       # Def → Entity composition
│           │   ├── CompanionActor.ts     # Base companion mode dispatch
│           │   ├── TrainingDummy.ts
│           │   ├── companions/
│           │   │   ├── RookNull.ts
│           │   │   ├── NayaRoot.ts
│           │   │   ├── SisterVersion.ts
│           │   │   └── Lio.ts
│           │   └── enemies/
│           │       ├── sprawl.ts         # TollRatCrawler, ScooterBailiff, DroneWasp, …
│           │       ├── arcology.ts
│           │       ├── mirror.ts
│           │       ├── dub.ts
│           │       ├── barrens.ts
│           │       └── orbital.ts
│           │
│           ├── renderer/
│           │   ├── Renderer.ts           # Canvas context wrapper, layer stack
│           │   ├── SpriteRenderer.ts     # Loads sheets, draws frames
│           │   ├── AnimationState.ts     # Frame-clock per-entity animation FSM
│           │   ├── ParallaxLayer.ts      # Multi-speed background
│           │   ├── VFXPool.ts            # Object-pooled particles
│           │   ├── UIRenderer.ts         # HUD: HP, fuel, heat, reload ring, beat pulse
│           │   └── TitleCardRenderer.ts  # Brechtian title/placard overlays
│           │
│           ├── audio/
│           │   ├── AudioManager.ts       # Web Audio API context + gain nodes
│           │   ├── BeatClock.ts          # BPM → downbeat time source (AudioContext.currentTime)
│           │   └── SoundBank.ts          # Loads and caches audio buffers
│           │
│           ├── world/
│           │   ├── LevelLoader.ts        # World JSON → platform/entity/trigger lists
│           │   ├── TrapSystem.ts         # Trap ownership FSM
│           │   └── worlds/
│           │       ├── world-1.json      # Lower Sprawl (4 stages)
│           │       ├── world-2.json      # Chrome Arcology
│           │       └── world-3.json … world-8.json
│           │
│           └── ui/
│               ├── HudPanel.ts
│               ├── PauseMenu.ts
│               └── AccessibilityOptions.ts
│
├── packages/
│   │
│   ├── platformer-core/
│   │   ├── package.json             # name: @badger/platformer-core, zero deps
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── World.ts             # createPlatformerWorld() factory
│   │       ├── PhysicsParams.ts     # Physics constant type + presets
│   │       ├── Entity.ts            # Entity = { id, components: ComponentMap }
│   │       ├── components/
│   │       │   ├── Transform.ts     # { x, y, w, h, dir }
│   │       │   ├── Velocity.ts      # { vx, vy }
│   │       │   ├── Collider.ts      # { layer: number }
│   │       │   ├── Health.ts        # { hp, maxHp, greyHp, invuln }
│   │       │   ├── MovementState.ts # { onGround, coyoteLeft, jumpBuffered }
│   │       │   ├── HitboxSet.ts     # { attack, hurt, parry } named Rects
│   │       │   └── ActorFlags.ts    # { hasRailgun, hasRocket, hasKatana, … }
│   │       ├── systems/
│   │       │   ├── gravityStep.ts   # (vy, params, dt) → vy — pure function
│   │       │   ├── movementStep.ts  # (transform, velocity, dt) → transform
│   │       │   ├── platformStep.ts  # (transform, velocity, platforms[], prevVy) → result
│   │       │   ├── coyoteStep.ts    # (state, onGround, dt) → state
│   │       │   └── aabb.ts          # (a, b: Rect) → boolean
│   │       └── tests/
│   │           ├── physics.test.ts
│   │           └── aabb.test.ts
│   │
│   ├── codegate/
│   │   ├── package.json             # name: @badger/codegate, zero deps
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts             # MiniGameSpec, MiniGameResult, GateState, MiniGameEvent
│   │       ├── core.ts              # createCodeGate(spec) → { update, submitInput, currentState }
│   │       ├── gates/
│   │       │   ├── FastTypeGate.ts
│   │       │   ├── CommandRepairGate.ts
│   │       │   ├── RegexMatchGate.ts
│   │       │   ├── RoutingGate.ts
│   │       │   ├── BytecodeOrderGate.ts
│   │       │   └── MicroCodeGate.ts
│   │       ├── render-canvas.ts     # drawCodeGate(ctx, state, W, H)
│   │       ├── render-dom.ts        # updateCodeGateDom(el, state)
│   │       └── tests/
│   │           ├── fasttype.test.ts
│   │           ├── commandrepair.test.ts
│   │           └── scoring.test.ts
│   │
│   ├── sprite-contracts/
│   │   ├── package.json             # name: @badger/sprite-contracts, zero deps
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts             # SpriteSheet, AnimationDef, SpriteManifest, LoadedSheet
│   │       ├── validate.ts          # validateSpriteManifest(data) → ValidationResult
│   │       ├── loader.ts            # loadSpriteSheet(sheet, ctx) → Promise<LoadedSheet>
│   │       └── tests/
│   │           └── validate.test.ts
│   │
│   └── progression/
│       ├── package.json             # name: @badger/progression, zero deps
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── types.ts             # RunState, MetaState, Currency, Boon, ShopAction, DerivedStats
│           ├── RunAggregator.ts     # createRunState(), finalizeRun()
│           ├── MetaProgression.ts   # createMetaState(), persistMeta(), loadMeta()
│           ├── ShopEngine.ts        # createShopEngine() → generateOffer()
│           ├── SkillTree.ts         # createSkillTree(), purchaseNode(), computeDerivedStats()
│           ├── BoonPool.ts          # createBoonPool() → add(), hasTag(), query()
│           └── tests/
│               ├── skillTree.test.ts
│               ├── shopEngine.test.ts
│               └── metaProgression.test.ts
│
└── tests/
    └── validate-data.mjs            # EXISTING — kept as integration smoke test
```

---

## Game Engine Architecture

### Game Loop (Fixed Timestep + RAF)

```
FIXED_STEP = 1/60 s
accumulator = 0

RAF callback(now):
  rawDt = min((now - last) / 1000, 0.1)  // cap spike at 100ms
  accumulator += rawDt
  while accumulator >= FIXED_STEP:
    simulate(FIXED_STEP)
    accumulator -= FIXED_STEP
  alpha = accumulator / FIXED_STEP
  render(alpha)                          // interpolate between prev/curr positions
```

`simulate` reads an `InputSnapshot` produced at frame start — never mid-tick. Replay = save `InputSnapshot[]`. PRNG is xoshiro128** (not `Math.random()`). Focus-time slow (stim mechanic) applies a `timeScale` multiplier to `FIXED_STEP` rather than corrupting the accumulator.

### System Tick Order (per fixed step)

1. `InputSystem.snapshot()` → `ActionMap`  
2. `ReplayRecorder.record(frame, actionMap)`  
3. `PhysicsSystem.step(player, platforms, dt)`  
4. `CombatSystem.step(player, enemies, actionMap, dt)`  
5. `ItemSystem.step(player, actionMap, dt)`  
6. `HackSystem.step(player, enemies, traps, actionMap, dt)`  
7. `EnemySystem.step(enemies, player, dt)`  
8. `CompanionSystem.step(companions, player, enemies, dt)`  
9. `BeatSystem.step(dt)` → emits downbeat events  
10. `WaveDirector.step(dt)` (horde only)  
11. `CameraSystem.step(player, worldBounds, dt)`  
12. Active CodeGate tick (if open)  
13. `DebugOverlaySystem.collect(entities)` (if debug)

### Scene Interface

```ts
interface Scene {
  readonly name: string;
  onEnter(ctx: SceneContext): void;
  onExit(): void;
  update(dt: number): void;
  render(renderer: Renderer, alpha: number): void;
}
```

`SceneContext` provides `EventBus`, `SaveManager`, `AudioManager`, `InputSystem`, and package APIs — the only DI point.

`DialogueScene` is a sub-component of `StageRunScene` (not a stack push) — it pauses physics but not the renderer.

### Input ActionMap

```ts
type ActionMap = {
  moveLeft: boolean; moveRight: boolean;
  jump: boolean; jumpPressed: boolean;    // pressed = edge detect
  fastFall: boolean;
  melee: boolean; meleePressed: boolean;
  shoot: boolean; shootPressed: boolean;
  item: boolean; itemPressed: boolean;
  hack: boolean; hackPressed: boolean; hackHeld: boolean;
  pause: boolean; pausePressed: boolean;
  debugToggle: boolean;
};
```

CPU AI controller implements the same `ActionMap` interface — systems never know if input is keyboard, gamepad, or AI.

### Renderer Layer Order

1. Sky gradient  
2. Far parallax (0.3× scroll)  
3. Mid parallax (0.6×)  
4. Platform tiles  
5. Traps + environment  
6. Projectiles  
7. Pickups  
8. Enemies  
9. Companions  
10. Player  
11. VFX particles  
12. Debug hitbox/hurtbox overlay  
13. HUD  
14. Code gate panel (bottom third)  
15. Dialogue box  
16. Title card (full overlay)

`SpriteRenderer.drawFrame(sheetId, animName, frame, x, y, flipX)` is the single draw primitive. Per-entity fallback: if PNG not loaded, calls `drawFallback(ctx, entity)` — art delivered incrementally without breaking game.

### Beat System

`BeatClock` derives its time source from `AudioContext.currentTime` (not dt accumulator) to prevent drift. `isInDownbeatWindow(windowMs=80)` returns true within ±80ms of downbeat. `BeatSystem` emits typed `EventBus` events each tick. `DubShield`, `BasslineBoots`, bass platforms, and speaker stacks all subscribe.

---

## Implementation Phases

### Phase 1 — Project Scaffold
**Goal:** Vite monorepo boots, existing prototype playable at localhost:5173, all packages scaffolded, `pnpm test` passes.  
**Prerequisites:** none  
**Files to create/modify:**
- `pnpm-workspace.yaml`
- `package.json` (root, replace existing)
- `tsconfig.base.json`
- `biome.json`
- `apps/runner/package.json`, `tsconfig.json`, `vite.config.ts`
- `apps/runner/index.html` (move from root)
- `apps/runner/src/main.js` (move from `src/`)
- `apps/runner/src/game.css` (move from `src/`)
- `packages/*/package.json` and `packages/*/tsconfig.json` (4 packages, stub only)

**Acceptance criteria:**
- `pnpm dev` serves prototype on localhost:5173, visually identical to before
- `pnpm test` runs `tests/validate-data.mjs` and passes
- `pnpm lint` runs Biome with zero errors on all files
- All four packages resolve as workspace deps in `apps/runner`

**Implementation notes:**
- `vite.config.ts`: `base: './'`, `publicDir: '../../assets'`, `resolve.alias: { '@data': '../../data' }`
- `tsconfig.base.json`: `target: "ES2022"`, `moduleResolution: "bundler"`, `strict: true`, `noUncheckedIndexedAccess: true`
- Root `package.json` scripts: `"dev": "pnpm -F @badger/runner dev"`, `"test": "node tests/validate-data.mjs"`, `"build": "pnpm -r build"`, `"lint": "biome check ."`
- Keep `main.js` as **plain JS** for now — TypeScript migration happens in Phase 5
- `biome.json`: recommended rules, indent 2 spaces, single quotes
- Each package `package.json`: `"name": "@badger/<name>"`, `"type": "module"`, `"main": "./src/index.ts"`, `"scripts": { "test": "node --test src/tests/*.test.ts" }`

---

### Phase 2 — @badger/platformer-core
**Goal:** All physics logic extracted from `main.js` into typed pure functions, imported by app, deterministic unit tests pass.  
**Prerequisites:** Phase 1  
**Files to create/modify:**
- `packages/platformer-core/src/` (all files listed in directory structure)
- `apps/runner/src/main.js` (import physics from package)

**Acceptance criteria:**
- All physics constants from `main.js` `P` object live in `PhysicsParams` type
- `gravityStep`, `movementStep`, `platformStep`, `coyoteStep` are pure (no side effects, deterministic)
- Unit tests pass via `node --test`
- Game in `apps/runner` plays identically to before

**Implementation notes:**
- `gravityStep(vy: number, params: PhysicsParams, dt: number): number`
- `platformStep(transform: Transform, velocity: Velocity, platforms: Rect[], prevVy: number): { transform: Transform, velocity: Velocity, onGround: boolean }`
- `coyoteStep(state: MovementState, onGround: boolean, dt: number): MovementState`
- `aabb(a: Rect, b: Rect): boolean` where `Rect = { x, y, w, h }`
- Physics constants from prototype: `gravity=1900`, `jumpVelocity=-650`, `maxFallSpeed=1100`, `runAccelGround=5200`, `runAccelAir=2900`, `friction=4200`, `maxRunSpeed=285`, `fastFallMultiplier=1.55`, `coyote=0.095`, `jumpBuffer=0.11`, `variableJumpCut=0.48`
- Test: apply gravity for 1.0s from vy=0 → vy=1900 exactly; then test cap at 1100
- Test: coyote timer resets to 0.095 on landing, expires to 0 after 0.095s

---

### Phase 3 — @badger/codegate + Minigame Integration
**Goal:** All six gate kinds implemented, state machine tested, canvas panel working in-game, existing inline gate code replaced.  
**Prerequisites:** Phase 1  
**Files to create/modify:**
- `packages/codegate/src/` (all files)
- `apps/runner/src/main.js` (replace `gate` object and `submitGate` with `createCodeGate` calls)

**Acceptance criteria:**
- `MiniGameSpec` interface matches exactly the shape in `MINIGAMES.md`
- FastType: correct string in perfect window → `result.outcome === 'clean'`; wrong string → `'fail'`
- Timeout fires after `timeLimitMs`, emits event with `failureHeat` delta
- Canvas panel draws in bottom third of canvas when gate active
- Old `gate.active` code block fully removed from `main.js`

**Implementation notes:**
- `MiniGameSpec: { id, kind, prompt, timeLimitMs, attempts, rewardTags, failureHeat }`
- `MiniGameResult: { outcome: 'clean'|'normal'|'fail'|'timeout', heatDelta: number, rewardTags: string[], timeMs: number }`
- Perfect window = last 15% of `timeLimitMs` (matches `HACKING_IS_FIGHTING.md` rail reload design)
- `createCodeGate(spec)` returns `{ update(dt): MiniGameEvent|null, submitInput(text): MiniGameResult|null, currentState(): GateState }`
- `GateState: { kind, prompt, inputSoFar, timeRemaining, attemptsLeft, phase: 'active'|'succeeded'|'failed' }`
- `render-canvas.ts drawCodeGate(ctx, state, W, H)`: dark panel over bottom 33% of canvas, monospace terminal font, cyan accent `#67f3c4`
- Routing and BytecodeOrder gates can use keyboard selection (arrow keys + enter) rather than free text for now

---

### Phase 4 — @badger/sprite-contracts + Sprite Renderer
**Goal:** `sprites.json` contract typed and validated, PNG sheets load, Moss animates from sprite frames, fallback vector used when sheet not loaded.  
**Prerequisites:** Phase 1  
**Files to create/modify:**
- `packages/sprite-contracts/src/` (all files)
- `apps/runner/src/renderer/SpriteRenderer.ts`
- `apps/runner/src/renderer/AnimationState.ts`
- `apps/runner/src/renderer/Renderer.ts`
- `apps/runner/src/main.js` (replace `drawBadger` with `SpriteRenderer` call + fallback)

**Acceptance criteria:**
- `validateSpriteManifest(data/sprites.json)` passes in test harness and browser
- `loadSpriteSheet` returns `LoadedSheet` within 500ms for a 32×32 sheet
- `drawFrame(sheetId, animName, 0, x, y, false)` draws correct position
- `AnimationState.advance(dt)` increments frame at correct fps and wraps
- 404 on PNG → `drawFallback(ctx, entity)` called, no crash

**Implementation notes:**
- `SpriteSheet: { id, file, frameSize: [w, h], animations: Record<string, { frames: number, fps: number }> }`
- `LoadedSheet.drawFrame(ctx, animName, frameIndex, x, y, flipX)`: `srcX = frameIndex * frameW`, `srcY = animRow * frameH` (row-per-animation layout)
- `AnimationState: { currentAnim: string, frame: number, timer: number }` — `advance()` uses fps from loaded sheet
- Moss animation selection: `onGround && vx > 10 → 'run'`, `onGround && vx ≈ 0 → 'idle'`, `vy < 0 → 'jump_up'`, `vy > 0 → 'fall'`, `meleeTimer > 0 → 'melee_claws'|'melee_katana'`

---

### Phase 5 — ECS Foundation + Player Actor Refactor
**Goal:** Entity/component model, SceneManager, EventBus, GameLoop in TypeScript; player and all prototype verbs migrated; all prototype features working.  
**Prerequisites:** Phases 2, 4  
**Files to create/modify:**
- `apps/runner/src/engine/` (GameLoop, SceneManager, EventBus, DebugFlags, ReplayRecorder)
- `apps/runner/src/systems/InputSystem.ts`, `PhysicsSystem.ts`, `CombatSystem.ts`, `ItemSystem.ts`, `CameraSystem.ts`
- `apps/runner/src/actors/MossBadger.ts`
- `apps/runner/src/scenes/StageRunScene.ts`
- `apps/runner/src/main.ts` (replaces `main.js`)

**Acceptance criteria:**
- Game boots through SceneManager → StageRunScene, all prototype features work identically
- GameLoop runs at fixed 60Hz; delta capped at 100ms
- `InputSystem.snapshot()` produces ActionMap; `jumpPressed` fires only on edge (not held)
- ReplayRecorder records input frames; 10s recording reproduces identical positions on playback
- Player can use all verbs: run, jump (coyote + buffer), melee, shoot, boost, stim, hack gate

**Implementation notes:**
- `GameLoop` constructor takes canvas element; creates RAF loop internally
- `EventBus<T extends EventMap>`: `emit(key, payload)` and `on(key, handler)` — use `Map<string, Set<Function>>`
- `SceneManager`: stack-based; `push(scene)`, `pop()`, `replace(scene)`; calls `onEnter`/`onExit`
- `MossBadger` is a module, not a class: exports `createPlayer(): Entity` and `processMossInput(entity, actionMap, dt, systems): void`
- `StageRunScene` runs the 13-step tick order
- `main.ts`: creates canvas, instantiates `GameLoop`, creates `SceneManager`, calls `gameLoop.start()` — no game logic
- `ReplayRecorder`: stores `{ frame: number, inputs: ActionMap, rngSeed: number }[]`; xoshiro128** PRNG for enemy AI decisions

---

### Phase 6 — Training Mode + Debug Overlay
**Goal:** `training_dummy` mode with all overlays and measurements from `roadmap-modes.yml`.  
**Prerequisites:** Phase 5  
**Files to create/modify:**
- `apps/runner/src/scenes/TrainingScene.ts`
- `apps/runner/src/systems/DebugOverlaySystem.ts`
- `apps/runner/src/engine/DebugFlags.ts` (expand)
- `apps/runner/src/actors/TrainingDummy.ts`

**Acceptance criteria:**
- `[TAB]` from main menu enters training mode
- `[H]` hitboxes, `[U]` hurtboxes, `[F]` frame data toggles
- Dummy takes flinch on hit, never dies; HP displays ∞
- Every attack reports: last hit damage, combo damage, hits/s, rail reload delta ms, melee active frames
- `[I]` invincible player, `[F2]` infinite fuel, `[R]` reset positions

**Implementation notes:**
- `DebugFlags`: plain exported singleton `{ showHitboxes, showHurtboxes, showFrameData, invinciblePlayer, infiniteFuel }` — all boolean
- `DebugOverlaySystem.render(ctx, entities, camera)`: translucent red for hitboxes, blue for hurtboxes, white labels for frame counters
- `HitboxSet` component: `{ attack: Rect|null, hurt: Rect, parry: Rect|null }` — relative to entity transform
- `TrainingDummy`: `hp=Infinity`, no AI, 0.15s visual tint on damage
- `DamageReport: { lastHit, combo, hps, reloadDeltaMs, meleeActiveFrames }` — stored on scene, displayed top-right monospace panel

---

### Phase 7 — Enemy System + Horde Mode
**Goal:** Three enemy archetypes with state machines, WaveDirector, world-1 arena, 10 waves without softlock.  
**Prerequisites:** Phase 5  
**Files to create/modify:**
- `apps/runner/src/systems/EnemySystem.ts`
- `apps/runner/src/actors/EnemyFactory.ts`
- `apps/runner/src/actors/enemies/sprawl.ts` (TollRatCrawler, DroneWasp, BassTurretStub)
- `apps/runner/src/systems/WaveDirector.ts`
- `apps/runner/src/scenes/HordeScene.ts`
- `apps/runner/src/world/LevelLoader.ts`
- `apps/runner/src/world/worlds/world-1.json`

**Acceptance criteria:**
- EnemySystem drives: `idle → patrol → alert → windup → attack → recovery` for crawlers
- WaveDirector uses enemy cost table from `roadmap-modes.yml` (crawler=1, drone=2, turret=3, …)
- Airborne enemies not spawned until wave 3 or player has railgun
- 25 active entities + projectiles holds 60fps
- Horde win condition: survive 10 waves; display clear count per wave

**Implementation notes:**
- `EnemyDef: { id, class, hp, speed, damage, stun, attackRange, attackCd, ai: EnemyAISpec }`
- `EnemyAISpec` for crawler: `{ kind: 'patrol', bounds: [minX, maxX], turnAtEdge: true }`
- `EnemyAISpec` for drone: `{ kind: 'sine', centerY, amplitude: 32, frequency: 2.1 }`
- `EnemyFactory.createEnemy(def, x, y): Entity` — composes `Transform`, `Velocity`, `Health`, `HitboxSet`, `EnemyState`
- `EnemyState: { current: StateName, timer: number, target: Entity|null }`
- State machine transitions are pure: `enemyTransition(state, world): StateName`
- `world-1.json` schema: `{ id, platforms: Rect[], spawnPoints: { id, x, y }[], triggers: { id, type, x, y, w, h, payload }[] }`
- WaveDirector: never spawn inside player AABB; warn with telegraph marker 0.8s before spawn

---

### Phase 8 — @badger/progression + Colony Hub + Shop
**Goal:** Progression package fully implemented and tested; ColonyHub, Shop, SkillTree scenes functional; meta-state persists.  
**Prerequisites:** Phase 5  
**Files to create/modify:**
- `packages/progression/src/` (all files)
- `apps/runner/src/scenes/ColonyHubScene.ts`, `ShopScene.ts`, `SkillTreeScene.ts`
- `apps/runner/src/engine/SaveManager.ts`

**Acceptance criteria:**
- `computeDerivedStats({ vigor:5, ...zeros })` → `{ hp: 10, ... }` exactly matching `GAME_LOGIC.md` section 4
- Shop discount clamps at 30% at guile ≥ 15
- Purchasing `double_swipe` node deducts 1 SP; `parry_tooth` (cost 2) then appears as available
- `SaveManager.save(meta)` → localStorage `'bsr-meta-v1'`; loads back identical on next boot
- ColonyHubScene shows currencies and navigates to Shop/SkillTree

**Implementation notes:**
- `AttributeMap: { vigor, sinew, voltage, velocity, cortex, bass, guile }` all numbers
- `DerivedStats` formulas from `GAME_LOGIC.md` section 4: `hp = 5 + vigor * 1`, `rallyWindow = 1.2 + vigor * 0.05`, `shopDiscount = min(0.30, guile * 0.02)`, etc.
- `SkillTree`: nodes as graph; `purchaseNode(nodeId, state)` validates prereqs + cost, returns new state or throws
- `BoonPool: { active: Boon[], add(boon), hasTag(tag): boolean, query(tag): Boon[] }`
- `ShopEngine.generateOffer(world, heat, dubFavor, guile, items): ShopItem[]` — base pool + world-themed items; `price = base * (1 - discount)`
- `MetaProgression` persists: `{ credchips, blueprintShards, dubFavor, orbitHeat, unlockedBoons, purchasedSkills }`
- `SaveManager`: schema version check on load; if version mismatch → reset + warn

---

### Phase 9 — Combat Depth Pass
**Goal:** Parry flash + katana draw, rally health grey bar, perfect reload sweet-spot ring UI, enemy windup telegraphs.  
**Prerequisites:** Phases 5, 6, 7  
**Files to create/modify:**
- `apps/runner/src/systems/CombatSystem.ts` (expand)
- `apps/runner/src/renderer/UIRenderer.ts`
- `apps/runner/src/actors/enemies/sprawl.ts` (add windup state)
- `apps/runner/src/actors/MossBadger.ts` (parry state, katana draw window)

**Acceptance criteria:**
- Rally: dealing damage within 1.2s of taking damage recovers 35% of grey HP
- Parry: melee within 95ms of enemy flash → stun + tempo +1 + katana draw available (if unlocked)
- Perfect reload: K-press during 90ms sweet spot → pierce + EMP spark; ring shows sweet spot arc
- Crawler shows 0.3s red flash before attack; drone shows firing arc preview

**Implementation notes:**
- `RallyTimer: { greyHp, windowLeft }` component — `CombatSystem` decrements `windowLeft`; on player attack with `windowLeft > 0` → `recoverGreyHp(0.35)`
- `ParryWindow: { active: boolean, timer: number }` on player — set on melee input
- `katanaDrawAvailable` flag: true for 0.6s after successful parry if `hasKatana`
- `RailReloadState: { phase: 'fired'|'cooling'|'sweetspot'|'late'|'ready', timer }` — durations: 120ms fired, 420ms cooling, 90ms sweet spot, 350ms late
- `UIRenderer.drawReloadRing(ctx, state, x, y)`: canvas arc, sweet spot arc segment in `#67f3c4`
- Tempo meter: integer 0–5 on PlayerState; spend on companion assist / combo finishers
- Grey HP bar: `#4a4a4a` drawn beneath red HP bar; shrinks on rally

---

### Phase 10 — Hack System + Matrix Powers + Trap System
**Goal:** Three hack input modes working; Tier 0 and 1 matrix powers functional; trap ownership FSM visible in debug overlay.  
**Prerequisites:** Phases 5, 3, 8  
**Files to create/modify:**
- `apps/runner/src/systems/HackSystem.ts`
- `apps/runner/src/world/TrapSystem.ts`
- `apps/runner/src/systems/DebugOverlaySystem.ts` (extend with hack ranges)

**Acceptance criteria:**
- Quick hack (tap H): auto-targets nearest hackable in range, applies Tier 0/1 effect
- Aimed hack (hold H): time scale 0.3× for 1.5s, targeting bracket shown on hackables
- Command hack (H+direction): opens 1–3 token codegate on nearby terminal
- Trap ownership visible: hostile=red, neutral=white, hacked=green, unstable=yellow
- Tier 1 Remote Tap: open doors at range 200px; short-circuit cameras for 8s

**Implementation notes:**
- `HackableComponent: { id, tier, state: TrapState, range, cooldown, hackCommand: MiniGameSpec }`
- `TrapState: 'hostile'|'neutral'|'hacked'|'unstable'` (from `COMBAT_EXPANSION.md` section 5.3)
- `HackSystem.findTarget(player, hackables)`: nearest within range, sorted by tier compatibility
- Aimed hack: apply `timeScale=0.3` to GameLoop; restore on release or timeout (1.5s)
- `checkMatrixPower(player, target, derivedStats): MatrixEffect|null` — reads tier from cortex stat
- Debug overlay: dashed circle on hackables showing range; line from player to locked target
- `CodeGate` from Phase 3 instantiated by HackSystem for command hacks; result feeds back into TrapSystem

---

### Phase 11 — Dialogue System + Scene Graph + World 1 Campaign
**Goal:** RPG dialogue box working; complete scene graph from Title to ResultsScreen; World 1 (4 stages) playable as campaign.  
**Prerequisites:** Phases 5, 8  
**Files to create/modify:**
- `apps/runner/src/scenes/TitleScene.ts`, `DialogueScene.ts`, `MissionBriefingScene.ts`, `ResultsScene.ts`
- `apps/runner/src/systems/DialogueSystem.ts`
- `apps/runner/src/renderer/TitleCardRenderer.ts`
- `apps/runner/src/world/worlds/world-1.json` (expand with triggers + dialogue refs)
- `apps/runner/src/ui/HudPanel.ts`

**Acceptance criteria:**
- Title screen navigates to ProfileSelect on Enter
- DialogueScene: portrait left, speaker name top, typewriter text, up to 4 choice buttons
- Choosing option writes correct flags (trust, heat, questFlag) via EventBus
- World 1 Stage 1-1 plays, defeats Toll Rat Foreman, shows ResultsScreen with currency delta
- ResultsScene displays damage dealt, parries, reloads, hacks, time alive; transitions to ColonyHub

**Implementation notes:**
- `DialogueSpec: { id, lines: { speaker, text, portrait }[], choices?: { text, flagWrites, next }[] }`
- `DialogueSystem`: state = `{ specId, lineIndex, charIndex, charTimer, pendingChoices }` — advance on Confirm
- Typewriter: charIndex +1 every 35ms; Confirm skips to end of current line
- `TitleCardRenderer`: full-screen dark overlay + white Brechtian placard text in large monospace
- World 1 trigger types: `dialogue_trigger`, `item_spawn`, `sub_boss_arena`, `stage_exit`, `shop_spawn`
- `ResultsScene` reads from `RunAggregator.currentRun()` snapshot
- Murr Murrby shop spawned via `shop_spawn` trigger in stage 1-2

---

### Phase 12 — Beat System + Dub Colony + Audio Foundation
**Goal:** BeatClock from AudioContext.currentTime; DubShield and BasslineBoots working; World 4 stage 4-1 playable with beat platforms.  
**Prerequisites:** Phases 5, 9, 11  
**Files to create/modify:**
- `apps/runner/src/audio/AudioManager.ts`, `BeatClock.ts`, `SoundBank.ts`
- `apps/runner/src/systems/BeatSystem.ts`
- `apps/runner/src/world/worlds/world-4.json`

**Acceptance criteria:**
- `BeatClock.isInDownbeatWindow()` returns true within ±80ms of downbeat (visual overlay confirms)
- DubShield absorbs one hit in downbeat window; flashes on miss
- BasslineBoots landing in window → shockwave VFX + 1 damage to adjacent enemies
- World 4 stage 4-1 has ≥3 bass platforms: colour shift + upward nudge on downbeat
- `AudioManager.playMusic(id)` plays through gain node; master volume controllable

**Implementation notes:**
- `BeatClock(bpm, audioCtx)` — `startTime = audioCtx.currentTime` when music starts
- `currentBeat()`: `(audioCtx.currentTime - startTime) * (bpm / 60)`
- `nextDownbeatTime()`: seconds until next beat = `(Math.ceil(currentBeat()) - currentBeat()) / (bpm / 60)`
- `isInDownbeatWindow(windowMs=80)`: checks both previous and next downbeat distances
- `BeatSystem`: subscribes to `BeatClock.onDownbeat`, emits `EventBus 'downbeat'` event
- `BassPlatform` component: `{ baseY, pulseAmp, activated }` — activated true for 120ms on downbeat; `PhysicsSystem` adds `pulseAmp` to platform top during activation
- `DubShield` in `ItemSystem`: `'downbeat'` event → `shieldReady=true` for 0.3s; on player hit during ready → absorb, consume
- `SoundBank`: `fetch()` + `AudioContext.decodeAudioData()`, cache by id

---

## Critical Files

- `src/main.js` — prototype; all systems must remain compatible during migration
- `data/sprites.json` — animation contract for `@badger/sprite-contracts` and `SpriteRenderer`
- `MINIGAMES.md` — canonical `MiniGameSpec` TypeScript interface (must match exactly in `@badger/codegate/src/types.ts`)
- `roadmap-modes.yml` — acceptance criteria for training, horde, and VS modes (Phases 6–7)
- `GAME_LOGIC.md` — stat derivation formulas (section 4) and enemy state machines (section 7)
- `COMBAT_EXPANSION.md` — distance bands, claw/sword/gun specs, trap ownership model
- `HACKING_IS_FIGHTING.md` — mechanical equivalences, timing windows, matrix power tiers
- `CAMPAIGN.md` — world/stage/boss data driving world JSON files (Phases 7, 11)

---

## Additional Deliverables (created during execution, not in this plan)

1. **`docs/architecture.md`** — prose reference of this design for human readers  
2. **`docs/superpowers/specs/2026-05-05-badger-sprawl-architecture-design.md`** — brainstorm spec file  
3. **Updated `ROADMAP.md`** — replace existing roadmap with phase-aligned milestones  
4. **`docs/plans/phase-N-*.md`** — per-phase agent task files (one per phase, self-contained)  
5. **`bridge.yml`** changelog entry for 2026-05-05 architecture decision  
6. **Org-roam check-in** — `orh_checkin.sh` with full metadata

---

## Verification

End-to-end test after all phases complete:
1. `pnpm dev` — game loads, prototype features work (run, jump, melee, railgun, rocket, stim, code gate)
2. `pnpm test` — `validate-data.mjs` + all package unit tests pass
3. `pnpm -F @badger/platformer-core test` — physics determinism tests pass
4. `pnpm -F @badger/codegate test` — all 6 gate kind tests pass
5. `pnpm -F @badger/progression test` — derived stat formulas match `GAME_LOGIC.md` exactly
6. Training mode: `[TAB]` enters; `[H]` shows hitboxes; dummy never dies
7. Horde mode: 10 waves clear without softlock; `[ESC]` returns to hub
8. World 1 Stage 1-1 clears; ResultsScreen shows; ColonyHub loads with currency
9. `pnpm lint` — zero Biome errors
10. `pnpm build` — builds to `apps/runner/dist/`, `index.html` opens offline in browser
