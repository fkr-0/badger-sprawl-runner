# Badger Sprawl Runner

Badger Sprawl Runner v1.1 is a sprite-first cyber-badger side-scrolling platformer with five complete campaign chapters, a pnpm/Vite runner app, and extractable gameplay packages for physics, code gates, sprite contracts, progression, and shared-runtime rendering.

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

### Animated story mode and Mirror Palace

Moss now uses the complete authored 17-row motion atlas in production: 86 frames across idle, run, skid, jump, fall, land, claws, katana, railgun, rocket boost, hit, hack, interaction, pickup reaction, parry, victory, and defeat states. Story mode now presents authored chapter placards, progress ribbons, wrapped dialogue, animated speaker figures, branch recaps, and stage-specific machinery context.

Chapter 4 is a complete dedicated story route rather than a shifted Lower Sprawl clone:

- rocket-pack traversal through Debt-contract Door, Reflection Loop, and Banquet Switchback
- Table of Refusals side story with three survivor testimonies
- Banquet Etiquette Loop refusal sequence
- banquet usher and mirror sentinel production enemy behaviors
- three-phase Reflection Judge court battle
- Lio exposed/protected/baited branch persistence
- Mirror Pass payload and transition into Dub Colony

The route is covered by `tests/e2e/mirror-palace-vertical-slice.spec.ts` in Chromium and Firefox.

### Dub Colony civic rhythm chapter

Chapter 5 now uses the authored moving-colony art and turns an 86-BPM classic hip-hop pocket into live gameplay:

- greenhouse, studio-temple, reactor, and assembly-deck route built from dedicated colony geometry
- visible woofer pulse and audio-independent beat window, paced for a laid-back head nod rather than rhythm-game rush
- jump, parry, and melee reactor valves graded as perfect, late, missed, or jammed
- Naya Root follows Moss, marks the pulse, and recharges her shared damage shield after successful syncs
- Chorus Spare Parts and Missing Vote Cards side stories
- signal-jammer bats that erase timing information and feedback guards that can be talked down
- chorus, army, and supplier vote branches with different rhythm or logistics consequences
- three-phase King Feedback battle: Security Pulse, Emergency Crown, and Chorus Test
- Bass Reactor Core payload and Antenna Barrens handoff

The full chapter is covered by `tests/e2e/dub-colony-vertical-slice.spec.ts` in Chromium and Firefox.

### Random-stage dummy dojo and UI release contracts

Dummy Training is now a complete gameplay mode rather than a text counter. Every entry selects one registered campaign stage from a generated seed, reuses its authored art and platform geometry, removes story enemies/objectives, and runs the production movement, physics, combat, animation, camera, sprite, and HUD stack against one invincible dummy.

- real claws, katana, railgun, rocket, parry, dodge, and hack practice
- infinite player integrity, fuel, stims, rail shots, and dummy integrity
- idle, walking, jumping, attacking, armored, and flying dummy presets
- live hitbox, hurtbox, frame-data, and damage-number overlays
- last-hit damage, combo damage, hits per second, rail reload, parry window, melee active/recovery frames, and hack-cast measurements
- `H` toggles all overlays; `F1`–`F4` toggle individual layers
- `[`/`]` changes lesson, `,`/`.` changes dummy behavior, and `1`–`4` changes kit
- `R` restores positions/resources and clears measurements; `N` rerolls to a different random stage
- training never writes campaign progress or economy state

`tests/e2e/training-mode.spec.ts` validates actual attacks, dummy immortality, resource restoration, presets, overlays, reset, reroll, and save isolation. `tests/e2e/gameplay-ui-release-contract.spec.ts` validates internal-canvas sizing, uniform browser display scale, panel bounds/non-overlap, and the player-to-boss readability ratio in Chromium and Firefox.

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

The default production page remains Canvas2D-first. Development/test tools are omitted by default; append `?debug=1` to explicitly enable the F3 overlays, or `?renderer=bridge` to exercise the opt-in Pixi migration path.

### Shared Pixi runtime migration

The shared `@arcade/runtime` 1.9.0 module is vendored with declarations and checksum metadata. `apps/runner/src/renderer/ArcadeRuntimeContract.ts` defines an executable ordered render plan rather than only a pass-name map. Stage backdrop, parallax, player/enemy actors, railgun projectiles, combat VFX, and runner vitals use native Pixi ownership. Terrain remains the only active full-frame Canvas texture bridge. Simulation, collision, stage objectives, sprite contracts, movement/combat policy, VFX emission/update policy, and the existing fixed-step game loop remain unchanged.

PixiJS 8.19 is an explicit runner dependency. `?renderer=bridge` activates retained backdrop and parallax textures, bounded actor and VFX pools, native railgun presentation, and the native vitals HUD. Runtime sprite-frame addressing supplies exact atlas rectangles while Badger retains animation choice, parallax factors, boss scaling, combat tells, and all gameplay policy. World interactions, terrain tiles, item/gear icons, objectives, contextual panels, and specialist authored overlays continue through Canvas where they have not yet earned a native parity contract.

The current Chromium benchmark still keeps Canvas as the default, but the earlier large bridge penalty is gone. Repeated frozen production-bundle runs passed both renderer budgets and ranged from `7.1 ms` Canvas / `12.4 ms` bridge p95 to `16.9 ms` Canvas / `14.4 ms` bridge p95 across 90 post-warmup samples. The bridge also reports selected hardware tier, frame/allocation/upload/bundle/heap metrics, actor/VFX overflow, and retained-texture counts. The run-to-run reversal reinforces that these are regression guardrails rather than physical-device certification.

The next runtime-integration order is:

1. Replace the remaining terrain upload with retained native tile and decoration objects while preserving collision-independent set dressing.
2. Add golden visual parity for player/enemy frame placement, mirroring, hit flashes, telegraphs, squash/stretch, and boss scaling across both renderers.
3. Exercise resize, suspend/resume, WebGL context loss, teardown, and long-session heap/upload behavior in Chromium and Firefox.
4. Calibrate the hardware profiles on representative desktop and lower-power physical devices before considering bridge mode as the default.

For stable local or worktree benchmarking, serve the frozen production bundle rather than a hot-reloading Vite process:

```sh
pnpm build
python3 -m http.server 5182 --bind 127.0.0.1 --directory apps/runner/dist
BADGER_E2E_BASE_URL=http://127.0.0.1:5182 \
  pnpm exec playwright test tests/e2e/renderer-bridge-performance.spec.ts --project=chromium
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
| Context interaction: scan, synchronize, deliver invoice, triage, open late-stage console | M |
| FastType console | Type the shown repair line, Backspace to edit, Enter to submit |
| Cargo router / broadcast composer | Arrow keys to focus/change clauses, 1–3 to select, Enter to submit |
| Close an active late-stage console | Escape |
| Use active item | E |
| Select item | 1, 2, 3 |
| Start selected story stage | R |
| Dodge | Shift or R |
| Toggle developer overlays | F3 with `?debug=1` or in Vite development mode |
| Training overlays | H, or F1–F4 per layer |
| Training lesson / dummy preset | [ / ], then , / . |
| Training kit | 1–4 |
| Training reset / random-stage reroll | R / N |
| Return to title | Escape |

Late-stage consoles preserve verified work after a failed submission and grade results as `clean`, `recovered`, or `assisted`. After three failures, public assist pauses the timer and exposes incremental clues so the campaign cannot be blocked by a terminal challenge.

## Sprite animation inspector

The Vite runner exposes `sprite-review.html` as a live shared-runtime workbench. It preserves the deterministic contact-sheet baseline while adding lazy sheet selection, animation switching, loop/once/ping-pong playback, speed control, timeline scrubbing, frame stepping, pivot/hitbox/hurtbox overlays, frame-event logs, and exact atlas geometry diagnostics. Inspector state is shareable through the `inspect`, `animation`, `mode`, and `speed` query parameters.

Runtime manifest reloads reuse decoded atlas images when their canonical sheet contracts are unchanged. Reports distinguish decoded, reused, added, removed, changed, unchanged, and explicitly forced sheets; strict failures preserve the complete previously committed cache. Update `source.revision` when replacing bytes behind an unchanged file path, or request a forced reload for that sheet.

```text
sprite-review.html?sheet=moss_badger_production&inspect=moss_badger_production&animation=run&mode=pingpong&speed=0.75
```

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
pnpm run test:e2e:mirror-palace # Chapter 4 story and animation acceptance
pnpm run test:e2e:dub-colony # Chapter 5 vote, beat, companion, and boss acceptance
pnpm run test:e2e:late-campaign # Chapters 6–8 dedicated minigames through the final ending card
pnpm run test:e2e:progression # expanded item and four-track skill acceptance
pnpm run test:e2e:training # random-stage dummy dojo and gameplay UI contracts in Chromium and Firefox
pnpm run test:e2e:sprite-review # BSR-owned sprite review PNGs and Moss golden image via shared arcade tooling
pnpm run sprites:progression # regenerate extended item, pickup, and skill atlases
pnpm run sprites:moss-motion # promote the complete authored Moss motion atlas
pnpm run sprites:mirror-palace # regenerate the reflected banquet parallax atlas
pnpm run sprites:audit:dalle # reconcile image_mapping.json + matching.txt and write mapping reports
pnpm run sprites:import:dalle:dry # preview normalized DALL-E atlases without replacing runtime files
pnpm run sprites:import:dalle # import reviewed boards, mirror source/public files, and update provenance
pnpm run sprites:audit:usage # fail when a runtime sheet has no production-code/data path
pnpm run verify:release # complete build, validation, smoke, lint, and Chromium E2E gate
pnpm run stage:artifact-lab # verify, then materialize .artifacts-deploy-stage
pnpm run deploy:artifact-lab:dry-run # verify and preview deployment
pnpm run deploy:artifact-lab # verify and deploy through the curated Artifact Lab deployer
```

The bridge exposes the same gates as `validate-release`, `stage-release`, `deploy-release-dry-run`, and `deploy-release`. Deployment actions always run the release verification chain first.

### Reviewed DALL-E sprite import

`image_mapping.json` contains the automatic filename pass. `matching.txt` is the manually reviewed supplemental ledger for ambiguous boards in `images_6a23c916_DALLE_-_Pixel_Art_Sprite_Sheet/`. `scripts/copy-dalle-sprites.sh` retains its historical name but delegates to `scripts/import-dalle-sprites.py`, which crops presentation boards, removes connected backgrounds, packs exact manifest rows, mirrors assets into `apps/runner/public`, and records source provenance.

Runtime sheets are required to have a production-code or data reference. Only `comfy_badger_run_grid` and the superseded generated `mirror_palace_parallax` are explicitly classified as archival source material. The current terrain renderer tiles stage-specific sprite atlases over collision geometry, so imported world boards are visible gameplay art rather than unused manifest inventory.

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
