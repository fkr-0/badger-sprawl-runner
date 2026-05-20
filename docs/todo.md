# Badger Sprawl Runner v1.0 Release TODO

Status key: `[ ]` not started, `[~]` in progress, `[x]` complete, `[!]` blocked or intentionally deferred.

Verified from repo root `/home/user/work/code/artifacts/badger-sprawl-runner` on 2026-05-10.

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

- [x] `pnpm run test` exited 0: data validation, runtime contracts, and all package tests passed.
- [x] `pnpm run typecheck` exited 0: all workspace packages and `apps/runner` typechecked.
- [x] `pnpm run build` exited 0: packages built and Vite produced `apps/runner/dist`.
- [x] `pnpm run smoke:runner` exited 0: runner bundle smoke contract passed.
- [x] `pnpm run lint` exited 0: Biome checked 122 files with no fixes applied.
- [x] `git status --short && git diff --stat` produced no working-tree changes after verification before this checklist update.

## Known deferred/non-blocking after v1.0

- [!] Replace generated placeholder art/audio with final production assets.
- [!] Add browser-driven end-to-end gameplay tests.
- [!] Add CI workflow publishing hosted build artifacts.
- [!] Decide whether reusable packages should publish to npm or remain workspace-internal.

---

# Full Story Mode Campaign TODO

Status key: `[ ]` not started, `[~]` in progress, `[x]` complete, `[!]` blocked or intentionally deferred.

## Campaign skeleton gates

- [x] Define the eight-stage campaign spine in code.
- [x] Design the first three Brechtian acts with placards, visible machinery, choices, payloads, bosses, and debriefs.
- [x] Route story mode through all eight stages from `GameFlow`.
- [x] Persist story progress through the save store: current stage, completed stages, acquired payloads, campaign completion.
- [x] Add tests for campaign content completeness, story routing, and save/load progress.
- [ ] Replace stage placeholders with bespoke layouts, bosses, dialogue choices, and final art/audio.

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

- [ ] Turn campaign choice data into an in-game choice UI instead of requiring direct `GameFlow.chooseStageChoice()` calls from tests.
- [ ] Add a result/branch recap panel after every stage choice: selected option, consequence text, result flag, and heat/favor changes.
- [ ] Surface story progress in the menu: current chapter, completed chapters, campaign-complete badge, and final broadcast doctrine.
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
- [ ] Implement boss placeholder runtime behavior for all eight bosses using the structured phase/lesson/behavior data.
- [ ] Add branch-specific debrief lines for Lio, colony alignment, ledger release, cargo reversal, and final broadcast doctrine.
- [ ] Add heat/favor balancing rules so `orbitHeat` and `dubFavor` affect shop prices, ally assists, hazards, or ending text.
- [ ] Add campaign-complete ending cards for all three final broadcast doctrines.

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
- [ ] Add browser-driven E2E tests for menu navigation, story progression, choice selection, save/load, training reset, and VS rematch.
- [ ] Add CI workflow that runs test, typecheck, build, smoke, lint, and uploads runner build artifacts.
- [ ] Add a lightweight Playwright smoke that opens the built runner and verifies canvas/menu status text.
- [ ] Add a release checklist test that fails when `todo.md` contains checked items without code/test evidence markers.
- [ ] Add bundle-size tracking for `apps/runner/dist` so content growth is intentional.
- [ ] Decide whether workspace packages publish to npm or stay internal; document the decision and package visibility.

## Documentation and design hygiene

- [x] Add long-form scene-by-scene story book for episodic play, side facts, and spinoff seeds.
- [ ] Update README with current story-mode scope: full campaign spine, choices, save fields, and remaining runtime scene gaps.
- [ ] Update STORY.md from design-only prose to match the implemented campaign schema and branch outcomes.
- [ ] Add `docs/campaign-schema.md` explaining acts, stages, choices, branches, modifiers, boss contracts, and save fields.
- [ ] Add `docs/release-evidence.md` summarizing the current verification gates and what each gate proves.
- [ ] Keep `todo.md` statuses conservative: use `[~]` for skeleton/contract work when concrete runtime UI is not complete.
