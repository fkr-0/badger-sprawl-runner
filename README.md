# Badger Sprawl Runner

Badger Sprawl Runner v1.0 is a sprite-first cyber-badger side-scrolling platformer prototype with a pnpm/Vite runner app and extractable gameplay packages for physics, code gates, sprite contracts, and progression.

The project is deliberately original. It uses cyberpunk-sprawl vocabulary and orbital-heist themes as genre inspiration, but keeps names, factions, locations, characters, and plotlines owned by this project.

## v1.0 release scope

```text
v1.0 contains:
- apps/runner: Vite-powered playable vertical-slice runner app. Its production entrypoint uses `RunnerApp` + `SceneManager` for mode routing.
- apps/runner/src/smokeMain.ts: preserved immediate-mode runner prototype used as a reference/smoke harness.
- src/main.js + root index.html: legacy static prototype kept for direct browser play.
- packages/platformer-core: pure physics/collision helpers.
- packages/codegate: extractable minigame gate engine.
- packages/sprite-contracts: sprite manifest schema, validation, and loading.
- packages/progression: run aggregation, shop, meta-progression, and skill tree logic.
- tests: data validation, package tests, runner smoke checks, and runtime contracts.
```

### Playable Lower Sprawl slice

The first campaign world is playable as a complete vertical slice:

- briefing placard and dialogue
- three-way story choice
- Meter Maidens' Ledger side quest using three toll-meter scans
- toll-gate rhythm puzzle using melee, parry, and shoot beats
- deterministic steam-vent hazards with warning and active phases
- patrol, turret, and bruiser enemies with telegraphed attacks instead of passive contact damage
- responsive checkpoint recovery at the market relay and toll approach
- compact combat HUD with segmented health, cooldowns, contextual prompts, and route guidance
- production-sprite Tollbooth Captain Grin with charge and receipt-burst patterns
- three-piece Burrowbreaker Rig route with live set bonuses
- wafer-key payload pickup
- debrief and Drainmarket unlock
- persistent quest/puzzle rewards and first skill-tree purchase

The route is covered by `tests/e2e/lower-sprawl-vertical-slice.spec.ts`, including save/reload and player animation transitions.

Deferred after v1.0: final production art/audio, CI-hosted artifacts, and an npm publishing decision for workspace packages.

## Requirements

```sh
pnpm --version   # project declares pnpm@9.0.0
node --version   # tested with modern Node 20+
```

## Play the app

```sh
pnpm install
pnpm dev
# opens the Vite runner at the printed local URL
```

For the legacy static prototype:

```sh
python3 -m http.server 8042
# then open http://localhost:8042
```

## Controls

| Action | Key |
|---|---|
| Move | A / D or Arrow Left / Arrow Right |
| Jump | W, Space, or Arrow Up |
| Fast fall | S or Arrow Down |
| Melee | J |
| Shoot | K |
| Parry | L |
| Scan meter / synchronize toll gate | M |
| Use active item | E |
| Select item | 1, 2, 3 |
| Start selected story stage | R |
| Dodge | Shift or R |
| Toggle developer overlays | F3 |
| Return to title | Escape |

## Release commands

```sh
pnpm run test          # data validation + runtime contracts + package tests; Vitest timeout is 30s per test
pnpm run typecheck     # TypeScript typecheck across workspace packages/apps
pnpm run build         # package builds + Vite production build
pnpm run smoke:runner  # verifies runner dist entry and bundled app contract
pnpm run lint          # Biome release lint gate
```

A v1 release is ready only when all commands above exit 0 and `docs/todo.md` has no unchecked release-critical items.

## Repository map

```text
badger-sprawl-runner/
├── apps/runner/                 # Vite runner app
├── packages/codegate/           # code gate minigame engine
├── packages/platformer-core/    # physics and platforming core
├── packages/progression/        # run/meta progression systems
├── packages/sprite-contracts/   # sprite schemas and loader
├── data/                        # manifest, item, progression, sprite data
├── docs/                        # implementation plans, workflows, and design docs
├── src/                         # legacy static prototype source
├── tests/                       # workspace-level validation and smoke tests
└── package.json                 # workspace scripts
```

## Expanded design docs

- `docs/STORY.md` — five-act Brechtian drama, cast, heist payloads, dialogue promise.
- `docs/CAMPAIGN.md` — expanded worlds, stages, sub-bosses, endbosses, placards, level descriptions.
- `docs/ENEMY_BIBLE.md` — enemy classes, world rosters, counters, hack/trap interactions.
- `docs/SPRITES.md` — sprite requirements and asset direction.
- `docs/MINIGAMES.md` — code gate and heist minigame design.
- `docs/ROADMAP.md` — broader post-v1 project roadmap.
- `docs/story-flavour.yml` — comprehensive story content pack with dialogue, characters, chapters, and sprite generation prompts.
- `docs/visual-soundscapes/` — ambient lo-fi soundtrack sub-project deriving a half-hour suite from the main Badger/Moss motif.
