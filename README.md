# Badger Sprawl Runner

Badger Sprawl Runner v1.0 is a sprite-first cyber-badger side-scrolling platformer prototype with a pnpm/Vite runner app and extractable gameplay packages for physics, code gates, sprite contracts, and progression.

The project is deliberately original. It uses cyberpunk-sprawl vocabulary and orbital-heist themes as genre inspiration, but keeps names, factions, locations, characters, and plotlines owned by this project.

## v1.0 release scope

```text
v1.0 contains:
- apps/runner: Vite-powered playable vertical-slice runner app. Its production entrypoint uses `RunnerApp` + `SceneManager` for mode routing.
- apps/runner/src/smokeMain.ts: preserved immediate-mode runner prototype used as a reference/smoke harness.
- src/main.js: legacy static prototype retained as archived reference code; the root index now redirects to the production Vite build.
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

### Playable Drainmarket slice

The second campaign stage now has its own complete gameplay route:

- authored clinic-and-nest platform layout with Drainmarket parallax art
- knife drones, price-tag wasps, and clinic collectors using stage-specific sprite sheets
- red invoice flashes that teach the real parry input and counter window
- Clinic Without Cameras side job using three invoice deliveries
- Injury Ledger Triage sequence using parry, melee, and shoot inputs
- clinic-crossing and nest-approach checkpoint recovery
- two-phase production-sprite Knife-drone Nest with lunge and blade-fan patterns
- stim-cache story payload, debrief, persistent rewards, and Chrome Arcology unlock

The complete route is covered by `tests/e2e/drainmarket-vertical-slice.spec.ts` in Chromium and Firefox.

### Playable Chrome Arcology slice

The third campaign stage is now a complete railgun-focused vertical slice:

- authored luxury-atrium, cargo-shaft, service-floor, and Glasscourt layout
- production-sprite chrome bellhops and mirror sentinels with explicit telegraphed attacks
- a real 560-pixel railgun lane that pierces armor and up to four aligned targets
- three sightline rooms that teach preparation, positioning, and multi-target shots
- Cargo Name Tags side job revealing hidden labor floors B2 and B7
- Elevator Seed Router using a shoot, parry, shoot authority sequence
- service-guts and seed-vault checkpoint recovery
- three-phase Madame Vitrine fight with glass lanes, contract fans, and a mirror dash
- Elevator Seed payload, debrief, persistent rewards, and Mirror Palace unlock

The complete route is covered by `tests/e2e/chrome-arcology-vertical-slice.spec.ts` in Chromium and Firefox.

### Expanded items and skill disciplines

Progression now uses one canonical graph and one shared runtime effect channel instead of separate menu and gameplay definitions:

- 23 registered items, including eight new animated gear pickups
- six three-piece item sets spanning movement, melee, defense, railgun, stealth, and living-circuit builds
- four five-tier skill disciplines: Clawline, Railgun, Rocket, and Hacking
- 20 dedicated skill icons and a four-column graph UI with prerequisite links and effect descriptions
- item, item-set, and purchased-skill bonuses merge additively into live combat and movement
- rail damage, pierce count, cycle speed, recoil, EMP payloads, fuel capacity/recharge, air control, dodge recovery, mitigation, parry timing, and combo duration all have runtime implementations
- equipped passive gear is visible in the in-game `EQUIPPED SIGNAL` strip
- deterministic sprite generation through `pnpm run sprites:progression`

The full progression route is covered by `tests/e2e/progression-skill-tree.spec.ts` in Chromium and Firefox, while Chrome Arcology E2E verifies saved Railgun skills and conductor gear changing the live weapon.

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

For the exact production artifact entry used by static preview pages:

```sh
pnpm build
python3 -m http.server 8042
# then open http://localhost:8042; the root entry redirects to apps/runner/dist/index.html
```

The production page is canvas-only. Development/test tools are omitted by default; append `?debug=1` to explicitly enable the F3 overlays.

## Controls

| Action | Key |
|---|---|
| Move | A / D or Arrow Left / Arrow Right |
| Jump | W, Space, or Arrow Up |
| Fast fall | S or Arrow Down |
| Melee | J |
| Shoot | K |
| Parry | L |
| Context interaction: scan, synchronize, deliver invoice, triage | M |
| Use active item | E |
| Select item | 1, 2, 3 |
| Start selected story stage | R |
| Dodge | Shift or R |
| Toggle developer overlays | F3 with `?debug=1` or in Vite development mode |
| Return to title | Escape |

## Release commands

```sh
pnpm run test          # data validation + runtime contracts + package tests; Vitest timeout is 30s per test
pnpm run typecheck     # TypeScript typecheck across workspace packages/apps
pnpm run build         # package builds + Vite production build, published to Artifact Lab at dist/
pnpm run smoke:runner  # verifies runner dist entry and bundled app contract
pnpm run smoke:artifact # opens the nested-path production artifact in Chromium and verifies sprite-backed rendering
pnpm run lint          # Biome release lint gate
pnpm run test:e2e:drainmarket # Stage 2 acceptance in Chromium and Firefox
pnpm run test:e2e:chrome-arcology # Stage 3 acceptance in Chromium and Firefox
pnpm run test:e2e:progression # expanded item and four-track skill acceptance
pnpm run sprites:progression # regenerate extended item, pickup, and skill atlases
pnpm run verify:release # complete build, validation, smoke, lint, and Chromium E2E gate
pnpm run stage:artifact-lab # verify, then materialize .artifacts-deploy-stage
pnpm run deploy:artifact-lab:dry-run # verify and preview deployment
pnpm run deploy:artifact-lab # verify and deploy through the curated Artifact Lab deployer
```

The bridge exposes the same gates as `validate-release`, `stage-release`, `deploy-release-dry-run`, and `deploy-release`. Deployment actions always run the release verification chain first.

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
