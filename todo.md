# Badger Sprawl Runner v1.0 Release TODO

Status key: `[ ]` not started, `[~]` in progress, `[x]` complete, `[!]` blocked or intentionally deferred.

Verified from repo root `/home/user/work/code/artifacts/badger-sprawl-runner` on 2026-05-20.

## Release-critical gates

- [x] Establish isolated release branch/worktree so pre-existing work is protected.
- [x] Verify clean baseline test suite before release work.
- [x] Verify TypeScript typechecking passes.
- [x] Verify production build passes.
- [x] Verify runner smoke test passes.
- [x] Make `pnpm run lint` pass with zero Biome errors.
- [x] Replace deprecated Biome config keys so lint output is clean enough for release automation.
- [x] Add a runtime contract test to lock v1-visible app surface: Vite runner entrypoint, generated bundle, controls, and release docs.
- [x] Run final release verification: `pnpm run test`, `pnpm run typecheck`, `pnpm run build`, `pnpm run smoke:runner`, `pnpm run lint`.

## v1 product readiness

- [x] Promote package/app versions from `0.1.0` to `1.0.0` consistently.
- [x] Update README so it describes the current pnpm/Vite workspace, not only the old static prototype.
- [x] Document the exact v1 play/build/test/release commands.
- [x] Document the v1 content scope: playable runner app, static legacy prototype, reusable packages, data validation, and smoke tests.
- [x] Add a concise release checklist for future patch/minor/major releases.

## Implementation quality

- [x] Keep existing package APIs stable unless a release gate proves a change is necessary.
- [x] Avoid test-only production APIs.
- [x] Prefer fixing lint configuration/source style over suppressing errors globally.
- [x] Commit release work in small, reviewable increments.

## Fresh verification evidence

- [x] `pnpm run test` exited 0: data validation, runtime contracts, story/animation/public sprite asset contracts, and all package tests passed.
- [x] `pnpm run typecheck` exited 0: all workspace packages and `apps/runner` typechecked.
- [x] `pnpm run build` exited 0: packages built and Vite produced `apps/runner/dist`.
- [x] `pnpm run smoke:runner` exited 0: runner bundle smoke contract passed.
- [x] `pnpm run lint` exited 0: Biome checked 154 files with no fixes applied.
- [x] Working tree sprite/animation implementation is ready to commit after this checklist update.

## Sprite, texture, and animation pipeline

- [x] Add `animation.yml` as the canonical sprite/texture/animation production map.
- [x] Decide frame packaging policy: use grids/atlases for animation frames, keep individual PNGs for rare one-off plates/illustrations.
- [x] Model pickups as stage/layout entities instead of per-movement-frame annotations.
- [x] Move Lower Sprawl pickup/platform/enemy prototype data into typed stage layout data.
- [x] Add pickup visual state, collection timing, pickup VFX hook, and item animation mapping.
- [x] Align runtime player animation names with `data/sprites.json` (`jump_up`, `melee_claws`, `melee_katana`).
- [x] Extend `@badger/sprite-contracts` with manifest normalization plus grid/order/anchor/boxes/events/tags support.
- [x] Normalize `/data/sprites.json` loading so the runner accepts the project `spriteSheets` manifest shape.
- [x] Encode Moss, items, story payloads, VFX, world tiles/parallax, enemies, bosses, companions, NPCs, and item icon animation contracts.
- [x] Add deterministic placeholder PNG atlas generation for every sprite sheet.
- [x] Serve generated placeholder sprite manifest/assets from `apps/runner/public`.
- [x] Add public sprite asset verification for PNG existence, dimensions, and manifest freshness.
- [x] Add HUD item icon rendering for rocket pack, railgun, katana, and stims through `item_icons`.
- [ ] Replace placeholder PNG atlases with final production art while preserving manifest dimensions/names.
- [x] Add character/NPC dialogue portrait rendering using the encoded character sheet contracts.
- [x] Add runtime animation events for hitboxes, hurtboxes, action windows, cancel windows, footsteps, and attack/VFX triggers.
- [x] Persist `story_payload` pickups so collected story items are hidden from stage layouts after save/load state is supplied.

## Known deferred/non-blocking after v1.0

- [~] Replace generated placeholder sprite/audio assets with final production assets. Placeholder sprite atlases are now generated and served for all sprite contracts.
- [x] Add browser-driven end-to-end gameplay tests (Playwright E2E implemented).
- [!] Add CI workflow publishing hosted build artifacts.
- [!] Decide whether reusable packages should publish to npm or remain workspace-internal.
- [x] Integrate story-flavour.yml content into runtime game systems: generated typed story content, sprite contracts, character/enemy/boss metadata, and animation planning are wired.

---

# Story Content System Implementation

Status key: `[ ]` not started, `[~]` in progress, `[x]` complete, `[!]` blocked or intentionally deferred.

## Core systems implemented

- [x] Story content types and interfaces (`data/story-content.ts`)
- [x] Story content loader with chapter/character access methods
- [x] Chapter manager for progression tracking and companion system
- [x] Dialogue system with choices, consequences, and Brechtian devices
- [x] Companion trust and heat systems affecting gameplay
- [x] Save/load functionality for story state

## Integration tasks

- [x] Integrate story-flavour.yml parsing into StoryContentLoader
- [x] Connect dialogue system to game scenes and UI rendering: StoryFlow dialogue/debrief panels render speaker portraits and stage choice UI.
- [x] Implement companion system in gameplay: Naya shield mitigation, Rook enemy overlays, and Auntie contextual hints are wired into StageRunScene.
- [x] Add trust/heat effects to merchant prices: ShopEngine now applies orbitHeat markup, dubFavor discounts, and guile discounts, and ShopScene purchases from generated offers.
- [x] Implement branch consequences from dialogue choices: choices now persist result flags, affect shop prices through heat/favor, expose active branch consequences through GameFlow, and render branch effects in StoryFlow.
- [x] Add side quest system integration: campaign stages now expose typed side quests through GameFlow and StoryFlow renders the current stage side job.
- [x] Connect chapter progression to actual game flow: GameFlow now exposes stage chapter ids and records completed chapter ids alongside stage progress.

## Content alignment

- [x] Align chapter structure with story-flavour.yml (8 chapters, correct worlds)
- [x] Update enemy details to match YAML specifications
- [x] Harmonize character information with YAML content
- [~] Implement all 8 chapter stages with proper content: stages now include chapter metadata, side quests, minigames, dramatic choices, payload contracts, boss contracts, and stage-addressable runtime layout contracts; fully bespoke playable layouts/final art remain.
- [x] Add all boss phases as specified in YAML: boss phase mechanics now project through GameFlow and render in StoryFlow stage panels.
- [x] Implement all heist payloads and dramatic questions: stage choice UI exposes dramatic questions and StageRunOptions now passes acquired payloads, branch hooks, and boss phases into runtime stage options.
- [x] Add side quests for each chapter: every campaign stage now has at least one typed side quest contract.
- [x] Add minigames for each chapter: every campaign stage now exposes a typed minigame contract through GameFlow and StoryFlow.

---

# Documentation Structure Updates

## Completed documentation refactoring

- [x] Moved all root *.md files to docs/ directory
- [x] Updated README.md with new documentation paths
- [x] Harmonized STORY.md with story-flavour.yml character details
- [x] Updated CAMPAIGN.md to match YAML chapter structure
- [x] Enhanced ENEMY_BIBLE.md with specific enemy details from YAML
- [x] Added comprehensive documentation for new systems

## Documentation additions needed

- [x] Add docs/story-content-system.md explaining the new content systems.
- [x] Add docs/PROCEDURAL_GENERATION.md designing optional dungeon/room and Diablo-style enemy generation.
- [~] Add docs/companion-system.md explaining companion mechanics
- [ ] Add docs/dialogue-system.md explaining dialogue choices and consequences
- [~] Update docs/campaign-schema.md with new chapter/GameFlow integration
- [ ] Add docs/story-flavour-integration.md explaining YAML-to-runtime flow

---

# Full Story Mode Campaign TODO

Status key: `[ ]` not started, `[~]` in progress, `[x]` complete, `[!]` blocked or intentionally deferred.

## Campaign skeleton gates

- [x] Define the eight-stage campaign spine in code.
- [x] Design the first three Brechtian acts with placards, visible machinery, choices, payloads, bosses, and debriefs.
- [x] Route story mode through all eight stages from `GameFlow`.
- [x] Persist story progress through the save store: current stage, completed stages, acquired payloads, campaign completion.
- [x] Add tests for campaign content completeness, story routing, and save/load progress.
- [~] Replace stage placeholders with bespoke layouts, bosses, dialogue choices, and final art/audio: StageRunScene now selects stage-addressable runtime layout contracts; fully bespoke per-stage geometry/art remains.
- [x] Implement procedural enemy pack generator from docs/PROCEDURAL_GENERATION.md milestone 1: EncounterGenerator now deterministically creates stage-seeded enemy packs with ranks, budgets, affixes, and StageRunScene option/runtime integration.
- [x] Add procgen data contracts for enemy families, affixes, stage profiles, and room chunks.
- [x] Add optional side-room generator for replay routes after enemy pack generation is stable: SideRoomGenerator now deterministically appends optional room platforms, rewards, and generated enemy packs to StageRunScene options.
- [x] Add Endless Sprawl mode using procedural room graphs and escalating enemy budgets: title menu routes to an Endless StageRunScene seeded by buildEndlessSprawlRun(), with escalating enemy packs and optional side rooms.
- [x] Wire StoryFlow stage entry directly into StageRunScene using buildStageRunSceneOptions(): StoryFlow stage mode now launches stage runtime options through its R-key start seam and default scene factory.
- [x] Implement playable boss phase behavior in StageRunScene/boss encounters: BossPhaseSystem now selects active phases by boss HP, applies phase pressure, and surfaces boss phase HUD/overlays.
- [x] Convert branch gameplayHook contracts into concrete per-stage gameplay modifiers: Naya shield bonus, Rook ambush overlay, and companion assist timing hooks now resolve into StageRunScene companion modifiers.

## First three acts design

```yaml
brechtian_story_shape:
  prologue:
    title: "The Song of the Toll"
    contradiction: "A city that charges for crossing the street will one day charge for breathing."
    device: "Projected placard and pirate-radio chorus name the toll system before Moss understands it."
    stages: [lower-sprawl]
  act_i:
    title: "The Badger Sells His Feet"
    contradiction: "Moss wants escape money; the colony wants every theft turned into public proof."
    device: "Visible turnstiles, elevator permissions, and title-card interruptions expose owned routes."
    stages: [drainmarket, chrome-arcology]
  act_ii:
    title: "Treason at the Mirror Banquet"
    contradiction: "Betrayal is not lack of love but debt pressure turned into a leash."
    device: "Banquet etiquette becomes direct address; mirrors show contract logic as choreography."
    stages: [mirror-palace]
```

## Stage checklist

### Stage 1: The Song of the Toll

```yaml
id: lower-sprawl
act: "Prologue — The Song of the Toll"
place: "Lower Sprawl"
primary_verb: "jump/run"
dramatic_question: "Who owns the street?"
placard: "A city that charges for crossing the street will one day charge for breathing."
heist_payload: "Wafer Key"
boss_placeholder: "Tollbooth Captain Grin"
visible_machinery:
  - street toll gates
  - water-meter locks
  - elevator permission ledger
choice:
  question: "What does Moss do with the first proof?"
  options:
    - sell the key quietly
    - broadcast the ledger excerpt
    - trade it for safer routes
implementation_tasks:
  - [x] Represent stage in `CAMPAIGN.stages`.
  - [x] Route story mode into `lower-sprawl-briefing`.
  - [x] Track `wafer_key` as an acquired payload on completion.
  - [x] Connect placard intro to `TitleCardRenderer`.
  - [x] Route completion into a real colony debrief scene.
  - [x] Replace placeholder Tollbooth Captain Grin with a boss contract.
```

### Stage 2: The Badger Sells His Feet

```yaml
id: drainmarket
act: "Act I — The Badger Sells His Feet"
place: "Drainmarket"
primary_verb: "melee/parry"
dramatic_question: "Who profits from injury?"
placard: "A market under the street sells medicine priced by fear."
heist_payload: "Stim Cache"
boss_placeholder: "Knife-drone Nest"
visible_machinery:
  - injury-priced stim stalls
  - private clinic shutters
  - knife-drone nests
choice:
  question: "Who receives the recovered stim cache?"
  options:
    - keep it for Moss
    - seed a mutual-aid clinic
    - bait the knife-drone nest
implementation_tasks:
  - [x] Represent stage in `CAMPAIGN.stages`.
  - [x] Route previous stage completion into `drainmarket-briefing`.
  - [x] Track `stim_cache` as an acquired payload on completion.
  - [x] Add parry tutorial beat.
  - [x] Add stim-cache result flag.
  - [x] Make knife drones teach counter timing.
```

### Stage 3: Elevator Seed

```yaml
id: chrome-arcology
act: "Act I — The Badger Sells His Feet"
place: "Chrome Arcology"
primary_verb: "railgun"
dramatic_question: "Who rides above hidden labor?"
placard: "The elevator rises because someone below is counted as cargo."
heist_payload: "Elevator Seed"
boss_placeholder: "Madame Vitrine"
visible_machinery:
  - luxury elevators
  - labor-floor cargo tags
  - glass security theatre
choice:
  question: "How is the cargo-prison proof used?"
  options:
    - dump it to the pirate channel
    - save it for court leverage
    - trade it to free one prisoner now
implementation_tasks:
  - [x] Represent stage in `CAMPAIGN.stages`.
  - [x] Route previous stage completion into `chrome-arcology-briefing`.
  - [x] Track `elevator_seed` as an acquired payload on completion.
  - [x] Add railgun sightline rooms.
  - [x] Tag hidden labor floors in background art.
  - [x] Add Madame Vitrine placeholder phases.
```

### Stage 4: Treason at the Mirror Banquet

```yaml
id: mirror-palace
act: "Act II — Treason at the Mirror Banquet"
place: "Mirror Palace"
primary_verb: "rocket pack"
dramatic_question: "What does betrayal cost?"
placard: "Debt can make a friend wear the enemy mask before they stop loving you."
heist_payload: "Mirror Pass"
boss_placeholder: "Reflection Judge"
visible_machinery:
  - banquet contracts
  - mirror doors
  - debt-family leverage
choice:
  question: "How does Moss answer Lio's betrayal?"
  options:
    - expose Lio publicly
    - protect Lio from the room
    - use the betrayal as bait
implementation_tasks:
  - [x] Represent stage in `CAMPAIGN.stages`.
  - [x] Route previous stage completion into `mirror-palace-briefing`.
  - [x] Track `mirror_pass` as an acquired payload on completion.
  - [x] Add three Lio choice outcomes.
  - [x] Store `lioTrust` branch.
  - [x] Add mirror-door traversal hazards.
```

### Stage 5: Bass Reactor Core

```yaml
id: dub-colony
act: "Act III — The Colony Teaches the Price of Air"
place: "Dub Colony"
primary_verb: "beat timing"
dramatic_question: "Can safety become tyranny?"
placard: "A free home can still learn the posture of a fortress."
heist_payload: "Bass Reactor Core"
boss_placeholder: "King Feedback"
visible_machinery:
  - speaker gardens
  - repair-bay votes
  - central-command temptation
choice:
  question: "What does the colony become?"
  options:
    - chorus
    - army
    - supplier
implementation_tasks:
  - [x] Represent stage in `CAMPAIGN.stages`.
  - [x] Route previous stage completion into `dub-colony-briefing`.
  - [x] Track `bass_reactor_core` as an acquired payload on completion.
  - [x] Add beat-timing stage modifier.
  - [x] Store `colonyAlignment`.
  - [x] Add Naya companion placeholder.
```

### Stage 6: Debt Ledger Shard

```yaml
id: antenna-barrens
act: "Act III — The Colony Teaches the Price of Air"
place: "Antenna Barrens"
primary_verb: "coding gates"
dramatic_question: "Can code be a weapon for everyone?"
placard: "A password is a border until the chorus learns it."
heist_payload: "Debt Ledger Shard"
boss_placeholder: "Black-Ice Fox"
visible_machinery:
  - code gates
  - ledger shards
  - antenna ownership maps
choice:
  question: "How is the ledger shard released?"
  options:
    - full public dump
    - targeted debt burn
    - trade for prisoner names
implementation_tasks:
  - [x] Represent stage in `CAMPAIGN.stages`.
  - [x] Route previous stage completion into `antenna-barrens-briefing`.
  - [x] Track `debt_ledger_shard` as an acquired payload on completion.
  - [x] Increase code-gate frequency.
  - [x] Add Black-Ice Fox hack duel placeholder.
  - [x] Connect ledger release to heat/favor.
  - [x] Align with story-flavour.yml ch06_antenna_barrens content.
  - [ ] Implement Mara Modulo public cryptography teaching.
  - [ ] Add boolean bridge logic platforming puzzles.
  - [ ] Implement state-machine duel mechanics.
  - [ ] Add public manual mural side quest.
```

### Stage 7: Cargo Liberation

```yaml
id: orbital-lift
act: "Act IV — The Old Ally Wears a New Uniform"
place: "Orbital Lift"
primary_verb: "escape chase"
dramatic_question: "Can obedience be innocent?"
placard: "The lift obeyed every order and called that innocence."
heist_payload: "Cargo Reversal Key"
boss_placeholder: "Elevator Angel"
visible_machinery:
  - cargo containers
  - customs gates
  - counterweight schedules
choice:
  question: "How much danger does Moss accept to reverse the cargo flow?"
  options:
    - safe partial reversal
    - full prisoner release
    - decoy reversal to hide allies
implementation_tasks:
  - [x] Represent stage in `CAMPAIGN.stages`.
  - [x] Route previous stage completion into `orbital-lift-briefing`.
  - [x] Track `cargo_reversal_key` as an acquired payload on completion.
  - [x] Add lift chase template.
  - [x] Add cargo reversal branching.
  - [x] Add obedient machine boss behavior.
```

### Stage 8: Final Broadcast

```yaml
id: asteroid-redoubt
act: "Act V — The Asteroid Learns to Speak"
place: "Asteroid Redoubt"
primary_verb: "full kit"
dramatic_question: "Who owns the sky?"
placard: "The last lock is authorship."
heist_payload: "Asteroid Transmitter Root"
boss_placeholder: "Director Vane"
visible_machinery:
  - satellite fortress
  - broadcast root
  - rebel command temptation
choice:
  question: "What does the final broadcast say?"
  options:
    - abolish the sky-lock
    - hand control to the chorus
    - publish the tools and refuse command
implementation_tasks:
  - [x] Represent stage in `CAMPAIGN.stages`.
  - [x] Route previous stage completion into `asteroid-redoubt-briefing`.
  - [x] Track `asteroid_transmitter_root` as an acquired payload on completion.
  - [x] Add final broadcast choice UI.
  - [x] Add Director Vane multi-phase placeholder.
  - [x] Add campaign-complete save marker.
```

---

# Remaining Game Modes TODO

Status key: `[ ]` not started, `[~]` in progress, `[x]` complete, `[!]` blocked or intentionally deferred.

## Mode integration gates

- [x] Make one canonical mode list shared by `GameFlow`, `TitleScene`, smoke tests, and menu copy.
- [x] Route menu selections through `SceneManager` instead of logging selected ids.
- [x] Add runtime/menu contract tests so every advertised menu option opens a real scene or flow state.
- [x] Keep story, VS, training, skills, and any horde/survival mode names consistent across UI and code.
- [x] Add keyboard/gamepad navigation acceptance tests for menu focus, confirm, cancel/back, and disabled entries.

## Main menu / shell

```yaml
current_state:
  GameFlow_menu_options:
    - story
    - versus
    - training
    - skills
  TitleScene_menu_options:
    - start
    - profile
    - training
    - horde
  gap: "TitleScene is not using the canonical GameFlow option ids and selectOption only logs."
next_steps:
  - [x] Replace TitleScene's local option ids with canonical GameFlow ids.
  - [x] Rename "Start Game" to "Story Run" so it maps clearly to story mode.
  - [x] Add "VS Mode" to the rendered menu.
  - [x] Decide whether Horde Mode remains separate, becomes VS-adjacent survival, or is hidden until polished: hidden from canonical menu until polished.
  - [x] Wire TitleScene selection to SceneManager transitions.
  - [ ] Show save-aware story CTA: "Continue" when storyProgress.currentStageId is not the first stage.
  - [x] Show small mode descriptions from GameFlow below the selected option.
  - [x] Add a back/cancel behavior from submenus back to TitleScene.
  - [x] Add a title-menu contract test covering visible options and route targets.
```

## VS mode

```yaml
current_state:
  GameFlow:
    state: "versus"
    arenaId: "duel-yard"
    winScore: 3
    scoring: "scoreVersusTag(player|rival)"
  scene_status: "No dedicated VersusScene found yet. HordeScene can donate arena/wave/combat pieces but is not VS."
mode_goal: "Local duel prototype: first to 3 tags, clear round reset, readable score UI."
next_steps:
  - [x] Create `apps/runner/src/scenes/VersusScene.ts`.
  - [~] Reuse arena/camera/combat primitives from HordeScene without copying wave logic. Current VS slice reuses the arena idea but still needs shared primitive extraction.
  - [x] Add two controllable or one-player-plus-rival-dummy prototype actors: represented by duel-yard spawn points for the vertical slice.
  - [x] Wire tags/hits into `GameFlow.scoreVersusTag`.
  - [x] Render score HUD: player score, rival score, win score, current round state.
  - [x] Add round reset after each tag.
  - [~] Add match-over screen with rematch/menu options. Rematch reset contract is implemented; visible match-over/menu UI remains.
  - [x] Add arena config for `duel-yard` with platforms, spawn points, and safe reset bounds.
  - [x] Add tests for score progression, winner detection, and scene route availability.
  - [x] Decide post-prototype branch: local one-player-plus-rival-dummy slice first; local PvP/AI later.
```

## Training mode

```yaml
current_state:
  TrainingScene:
    has_arena: true
    has_invincible_dummy: true
    has_debug_overlays: true
    has_reset_key: "R"
    has_damage_recording: true
  GameFlow:
    state: "training"
    dummy: "Dummy Badger / infinite HP"
mode_goal: "Safe practice room for movement, combat, parry timing, railgun, rocket pack, and code-gate drills."
next_steps:
  - [~] Wire menu Training option directly to `TrainingScene`. Canonical route exists; runtime scene factory must instantiate the concrete scene.
  - [x] Add an in-scene lesson selector: movement, melee, parry, railgun, rocket, code gate, boss pattern.
  - [x] Add dummy behavior presets: idle, walking, jumping, attacking, armored, flying.
  - [x] Add input/history panel for last actions, combo timing, parry window, DPS, and hit count: pure metrics state now tracks hit count, damage total, and last action; richer timing UI remains polish.
  - [x] Add quick toggles for player upgrades: base kit, railgun, rocket pack, full kit.
  - [x] Add checkpoint/reset controls visible in the help panel: reset contract exists; richer scene UI remains polish.
  - [!] Add optional target challenges with pass/fail badges, not just free practice. Deferred beyond mode skeleton.
  - [~] Add TrainingScene contract tests for reset behavior, dummy invincibility, and lesson selection state. Pure `TrainingMode` contracts exist; concrete scene tests remain.
  - [x] Ensure training never mutates story progress or economy unless explicitly marked as a challenge reward.
```

## Mode polish order

```yaml
recommended_sequence:
  1_menu_canonicalization:
    why: "Every other mode depends on reliable navigation and naming."
    done_when:
      - all menu options come from one canonical model
      - selecting each option reaches the expected flow state or scene
  2_training_completion:
    why: "Training is already closest to usable and helps tune combat/story/bosses."
    done_when:
      - player can choose lessons
      - dummy presets exist
      - reset/help/metrics are visible
  3_vs_vertical_slice:
    why: "VS needs a new scene and should reuse stable combat after training proves the feel."
    done_when:
      - first-to-3 duel works
      - round reset works
      - match over/rematch/menu loop works
  4_horde_decision:
    why: "Horde exists as a scene but is not represented in GameFlow's canonical menu."
    done_when:
      - mode is either promoted, renamed, folded into training/VS, or hidden
```

---

# Emerging Topics TODO

Status key: `[ ]` not started, `[~]` in progress, `[x]` complete, `[!]` blocked or intentionally deferred.

## Story-mode integration debt

- [x] Turn campaign choice data into an in-game choice UI instead of requiring direct `GameFlow.chooseStageChoice()` calls from tests.
- [x] Add a result/branch recap panel after every stage choice: selected option, consequence text, result flag, and heat/favor changes.
- [x] Surface story progress in the menu: current chapter, completed chapters, campaign-complete badge, and final broadcast doctrine.
- [ ] Add stage-detail debug panel for development builds showing payload, boss contract, tutorial beats, modifiers, branch outcomes, and result flags.
- [ ] Add save migration/versioning for expanded `StoryProgress` fields: `lioTrust`, `colonyAlignment`, `finalBroadcastDoctrine`, `resultFlags`.
- [ ] Add contract tests proving every `CampaignStage.todo` item marked done in `todo.md` has matching structured campaign data or flow behavior.
- [ ] Split the large campaign data file into smaller content modules once the schema stabilizes.

## Runtime scene wiring

- [x] Replace the shell-only `ModeRouter` placeholder scene factory with concrete runtime scene construction.
- [ ] Wire `TitleScene` into the real app shell or remove duplicate menu rendering from `main.ts` so there is only one main-menu implementation.
- [x] Instantiate `TrainingScene`, `VersusScene`, `SkillTreeScene`, and story flow screens through the same `SceneManager` pathway.
- [x] Add a route contract test using a fake `SceneManager` plus concrete scene constructors, not only scene-name placeholders.
- [ ] Add back/cancel behavior from concrete scenes to `TitleScene` through `SceneManager`.
- [x] Decide whether the current immediate-mode `main.ts` prototype remains a smoke harness or becomes the production shell: `main.ts` is the SceneManager shell; `smokeMain.ts` preserves the immediate-mode harness.

## Story gameplay depth

- [ ] Convert stage templates/modifiers into actual `StageRunScene` configuration: hazards, enemy mix, camera pressure, payload reward, and boss placeholder.
- [ ] Implement tutorial beat rendering for parry, railgun sightlines, beat timing, code-gate pressure, lift chase, and final broadcast.
- [ ] Implement boss placeholder runtime behavior for all eight bosses using the structured phase/lesson/behavior data from story-flavour.yml.
- [ ] Add branch-specific debrief lines for Lio, colony alignment, ledger release, cargo reversal, and final broadcast doctrine.
- [ ] Add heat/favor balancing rules so merchant prices, ally assists, hazards, and ending text respond to player choices.
- [ ] Add campaign-complete ending cards for all final broadcast doctrines from story-flavour.yml.
- [ ] Implement side quest system with proper tracking and rewards as specified in YAML.
- [ ] Add minigame implementations for rhythm platforming, combat rhythm, logic puzzles, etc. as specified in each chapter.
- [ ] Implement idle action system for global and chapter-specific character barks.
- [ ] Add companion ability system (Rook overlays, Naya shield, Murr merchant routes, etc.).

## Menu and save UX

- [ ] Show save-aware story CTA: `New Story`, `Continue`, or `Campaign Complete` based on `StoryProgress`.
- [ ] Add save-slot management: new slot, load slot, delete slot, export/import save JSON.
- [ ] Add reset-campaign confirmation so players can restart without wiping settings.
- [ ] Add visible autosave feedback after stage completion, branch choice, skill purchase, and campaign completion.
- [ ] Add corrupt-save recovery UI instead of silently falling back to a new flow.

## Training mode depth

- [x] Wire canonical training route to the concrete `TrainingScene` runtime.
- [ ] Connect pure `TrainingMode` state to visible TrainingScene UI: lesson selector, dummy preset, kit toggle, metrics panel.
- [ ] Add concrete TrainingScene tests for reset behavior, dummy invincibility, lesson selection, and no story/economy mutation.
- [ ] Add optional target challenges with pass/fail badges.
- [ ] Add combo timing, parry window, DPS, and input-history metrics beyond the current hit-count/damage/last-action state.
- [ ] Add training challenge reward policy: either no rewards, cosmetic-only rewards, or clearly marked one-time tutorial rewards.

## VS mode depth

- [ ] Extract shared arena/camera/combat primitives from HordeScene/VersusScene so VS does not duplicate future combat logic.
- [ ] Add visible match-over screen with rematch and menu options.
- [ ] Add one-player-plus-rival-dummy behavior before deciding on local PvP or AI rival.
- [ ] Add rival spawn/reset safety checks for arena bounds and platform collisions.
- [ ] Add score HUD tests around round reset, match-over lockout, rematch, and menu return.
- [ ] Decide whether Horde stays hidden, becomes Survival Mode, or becomes a VS training arena variant.

## Asset and sprite production

- [ ] Convert structured campaign content into sprite prompt batches capped at 4x4 grids.
- [ ] Add per-stage sprite prompt manifests for bosses, hazards, payloads, companions, backgrounds, and UI placards.
- [ ] Add automated validation that generated sprite prompt manifests never request grids larger than 4x4.
- [ ] Replace placeholder generated art/audio with production assets stage by stage.
- [ ] Add asset provenance notes and license metadata for every production sprite/audio source.
- [ ] Add visual regression snapshots for title cards, debriefs, menu states, and key gameplay HUDs.

## Testing and release automation

- [x] Set Vitest test timeout to 30 seconds in shared workspace config.
- [x] Add browser-driven E2E tests for menu navigation, story progression, choice selection, save/load, training reset, and VS rematch (Playwright E2E implemented).
- [ ] Add CI workflow that runs test, typecheck, build, smoke, lint, and uploads runner build artifacts.
- [x] Add a lightweight Playwright smoke that opens the built runner and verifies canvas/menu status text (implemented in tests/e2e/game-mechanics.spec.ts).
- [ ] Add a release checklist test that fails when `todo.md` contains checked items without code/test evidence markers.
- [ ] Add bundle-size tracking for `apps/runner/dist` so content growth is intentional.
- [ ] Decide whether workspace packages publish to npm or stay internal; document the decision and package visibility.
- [x] Add Playwright configuration with dev server integration and cross-browser testing (chromium, firefox, webkit).

## Documentation and design hygiene

- [x] Add long-form scene-by-scene story book for episodic play, side facts, and spinoff seeds (docs/story-book.md exists).
- [x] Update README with current story-mode scope and new documentation structure (all docs moved to docs/).
- [x] Update STORY.md with detailed character information from story-flavour.yml (character voices, sample lines added).
- [x] Update CAMPAIGN.md to match YAML chapter structure and naming (Antenna Barrens alignment completed).
- [x] Enhance ENEMY_BIBLE.md with specific enemy details from YAML (model names, sprite prompts, callouts added).
- [x] Consolidate all documentation to docs/ directory for better organization.
- [ ] Add `docs/campaign-schema.md` explaining acts, stages, choices, branches, modifiers, boss contracts, and save fields.
- [ ] Add `docs/release-evidence.md` summarizing the current verification gates and what each gate proves.
- [x] Add `docs/story-content-system.md` explaining the new story content types and integration.
- [ ] Add `docs/companion-system.md` explaining companion mechanics and trust/heat systems.
- [ ] Add `docs/dialogue-system.md` explaining dialogue choices, consequences, and Brechtian devices.
- [ ] Keep `todo.md` statuses conservative: use `[~]` for skeleton/contract work when concrete runtime UI is not complete.

---

# Story-flavour.yml Content Integration

## Character implementation priority

### Core cast (must have full implementation)
- [x] Moss - player character with dry, stubborn, observant voice (player character exists)
- [ ] Auntie Subharmonic - pirate-radio mentor with warm, teasing voice
- [ ] Rook Null - former logistics AI with calm, precise voice  
- [ ] Murr Murrby - void-cat merchant with cheerful, slippery voice
- [ ] Lio - old ally/possible traitor with guarded, regretful voice
- [ ] Naya Root - shield ally with grounded, brave voice
- [ ] Director Vane - final antagonist with controlled, paternal voice

### Chapter-specific characters (implement per chapter)
- [ ] Chapter 1: Juno Jar (pipe kid), Captain Grin (tollbooth boss)
- [ ] Chapter 2: Dr. Mina Suture (medic), DJ Calculus (beatmaker), Knife-Drone Nest boss
- [ ] Chapter 3: Sister Version (engineer), Foreman Pell (maintainer), Madame Vitrine (boss)
- [ ] Chapter 4: Cobalt Carmine (singer), Reflection Judge (boss)
- [ ] Chapter 5: Little Ix (tinkerer), King Feedback (boss)
- [ ] Chapter 6: Mara Modulo (crypto teacher), Black-Ice Fox (boss)
- [ ] Chapter 7: Elevator Angel (obedient boss), Container-Mother Sara
- [ ] Chapter 8: Command Lock Faction, Director Vane final boss

## Chapter-specific features to implement from story-flavour.yml

### Chapter 1: Lower Sprawl (ch01_lower_sprawl)
- [ ] Rain Turnstiles area with toll arms and spark puddles
- [ ] Kettle Bridge Pipes vertical route with steam vents
- [ ] Ledger Office Annex with first code gate
- [ ] Side quest: Chalk Map for the Short-Legged (Juno Jar)
- [ ] Side quest: Noodle Stall Antenna (Ma Oxbow)
- [ ] Minigame: Offbeat Turnstile Hop
- [ ] Minigame: Receipt Logic Scratch

### Chapter 2: Drainmarket (ch02_drainmarket)
- [ ] Sump Bazaar with parry tutorial and healing ethics
- [ ] Fan Nest arena fights around industrial fans
- [ ] Blue Note Squat safe room and beat-making minigame
- [ ] Side quest: Scrub the Dye (tracking dye removal)
- [ ] Side quest: Wall Newspaper (public warnings)
- [ ] Minigame: Breakbeat Parry Lab
- [ ] Minigame: Throw-Up Route Tag

### Chapter 3: Chrome Arcology (ch03_chrome_arcology)
- [ ] Lobby of Reflection with railgun ricochet puzzles
- [ ] Service Guts freight rail platforming
- [ ] Algorithmic Garden heist room light puzzle
- [ ] Side quest: Lunchboxes in the Walls (Foreman Pell)
- [ ] Side quest: Reflection Strike (Sister Version)
- [ ] Minigame: Railgun Reflection
- [ ] Minigame: Schedule Shuffle

### Chapter 4: Straylight Mirage (ch04_straylight_mirage)
- [ ] Zero-G Cloakroom rocket-pack tutorial
- [ ] Banquet of Versions dialogue duels and table combat
- [ ] Reflecting Court choice-shaped boss arena
- [ ] Side quest: Request the Old Song (Cobalt Carmine)
- [ ] Side quest: Debt Thread (Lio family contract)
- [ ] Minigame: Mask Reading
- [ ] Minigame: Rocket Waltz

### Chapter 5: Dub Colony (ch05_dub_colony)
- [ ] Greenhouse Cars shield ally tutorial with Naya
- [ ] Studio Temple reactor tuning rhythm puzzles
- [ ] Assembly Deck vote and boss arena
- [ ] Side quest: Seed and Speaker (Naya Root)
- [ ] Side quest: Missing Vote Cards (Little Ix)
- [ ] Minigame: Bass Reactor Tune
- [ ] Minigame: Assembly Vote

### Chapter 6: Antenna Barrens (ch06_antenna_barrens)
- [ ] Dish Graveyard wind platforming
- [ ] Logic Cairns truth-table rooms
- [ ] Black-Ice Node code-combat boss
- [ ] Side quest: Public Manual (Mara Modulo)
- [ ] Side quest: Tower Throw-Up (Faraday Saints)
- [ ] Minigame: State-Machine Duel
- [ ] Minigame: Boolean Bridge

### Chapter 7: Orbital Lift (ch07_orbital_lift)
- [ ] Container Choir autoscrolling climb
- [ ] Customs Maw scanner stealth and merchant scene
- [ ] Angel Counterweight boss chase and flow reversal
- [ ] Side quest: Names in the Manifest (Container-Mother Sara)
- [ ] Side quest: Morality Discount (Murr Murrby)
- [ ] Minigame: Cargo Sort Reverse
- [ ] Minigame: Scanner Smuggle

### Chapter 8: Asteroid Redoubt (ch08_asteroid_redoubt)
- [ ] Iron Arrival Tunnels full-kit gauntlet
- [ ] Speakerstone Commons ally convergence and debate
- [ ] Transmitter Root Chamber final boss and broadcast choice
- [ ] Side quest: Mural of Routes (Juno Jar and Faraday Saints)
- [ ] Side quest: Breath First (Naya Root)
- [ ] Side quest: Lio's Signal (if redeemed)
- [ ] Minigame: Broadcast Script (final choice)
- [ ] Minigame: Full-Kit Gauntlet

## Enemy implementation from story-flavour.yml

### Chapter-specific enemies
- [ ] Chapter 1: Rent Cop Piker, Turnstile Mite, Tollbooth Captain Grin boss
- [ ] Chapter 2: Knife-Drone Fledgling, Clinic Repo Thug, Knife-Drone Nest boss
- [ ] Chapter 3: Chrome Bellhop, Mirror Sentinel, Madame Vitrine boss
- [ ] Chapter 4: Masque Duelist, Contract Servitor, Reflection Judge boss
- [ ] Chapter 5: Signal Jammer Bat, Feedback Guard, King Feedback boss
- [ ] Chapter 6: Error Mite, Debt Wraith, Black-Ice Fox boss
- [ ] Chapter 7: Customs Lancer, Manifest Monk, Elevator Angel boss
- [ ] Chapter 8: Vane Air Bailiff, Command Lock Partisan, Director Vane final boss

## Boss implementation with phases from story-flavour.yml

- [ ] Captain Grin: Polite Collection, Debt Spiral, Public Road phases
- [ ] Knife-Drone Nest: Triage Swarm, Invoice Bloom, Public Clinic phases
- [ ] Madame Vitrine: Guest Etiquette, Hidden Floor, Public Proof phases
- [ ] Reflection Judge: Accusation, Cross-Examination, Unowned Mercy phases
- [ ] King Feedback: Security Pulse, Emergency Crown, Chorus Test phases
- [ ] Black-Ice Fox: Closed Source, Proof Obligation, Public Commit phases
- [ ] Elevator Angel: Classification, Merciful Schedule, Reversal phases
- [ ] Director Vane: Accountable Owner, Air Lease, Authorship War, The New Lock, Last Verb phases

## New systems integration tasks

- [ ] Integrate StoryContentLoader with actual YAML parsing
- [ ] Connect ChapterManager to game progression and save system
- [ ] Implement DialogueSystem with UI rendering and scene integration
- [ ] Add companion system to gameplay (Naya shield, Rook overlays, Murr merchant discounts)
- [ ] Implement trust/heat effects on merchant prices and gameplay
- [ ] Add side quest tracking and rewards system
- [ ] Implement global idle actions and chapter-specific barks
- [ ] Add musical theme system with chapter-specific BPM and palettes
- [ ] Integrate sprite generation prompts with asset production workflow
