# Badger Sprawl Runner — first-release path

## Release principle

Ship a small, test-backed vertical slice before expanding scope. Each gameplay pillar must expose a deterministic contract test first, then scene integration, then content expansion.

## Milestone map

### R0.1 — mechanics contracts

- [x] Clean flying-object physics in `@badger/platformer-core`
  - Test: `packages/platformer-core/src/tests/flying-object.test.ts`
  - Verifies ballistic integration, fall-speed caps, wind/fluid damping, and layered fluid sampling.
- [x] Extensible fluid fields
  - Test: `packages/platformer-core/src/tests/flying-object.test.ts`
  - Verifies uniform, layered, and composable fluid fields through a public API.
- [x] Clean melee combo system
  - Test: `apps/runner/src/systems/MeleeComboSystem.test.ts`
  - Verifies starter chains, timed expiry, airborne extensions, hit application, skill-gated finishers.
- [x] Item set contracts
  - Test: `apps/runner/src/systems/ItemSetSystem.test.ts`
  - Verifies first-release movement, melee, and defensive set bonuses.
- [x] Badger skill-tree expansion
  - Test: `packages/progression/src/tests/first-release-skill-tree.test.ts`
  - Verifies clawline, railgun, rocket, and hacking tracks plus prerequisite integrity.

### R0.2 — playable integration

- [x] Wire `MeleeComboSystem` into `CombatSystem` and `StageRunScene` input handling.
  - Tests: `apps/runner/src/actors/MossBadger.test.ts` and `tests/e2e/lower-sprawl-vertical-slice.spec.ts`.
  - Verifies scene-level melee reaches live enemies and drives the claw animation.
- [x] Attach item-set effects to player stats/loadout.
  - Tests: `apps/runner/src/systems/ItemEffectResolver.test.ts`, `apps/runner/src/systems/RuntimeItemApplier.test.ts`, and `tests/e2e/lower-sprawl-vertical-slice.spec.ts`.
  - Verifies two-piece and three-piece effects alter live movement, landing combat, and rocket fuel behavior.
- [ ] Add a visible flying-object archetype: thrown scrap, drone projectile, or rail ricochet.
  - Add test proving stage runtime advances projectile state with a chosen fluid field.
- [ ] Add one fluid zone in lower-sprawl: sewer steam, drain current, fan tunnel, or zero-g vent.
  - Add test proving a layout tag instantiates the correct `FluidField`.

### R0.3 — first content slice

- [x] Lower Sprawl core release slice: tutorials, side quest, toll-rhythm puzzle, two-phase boss, payload, story choice, debrief, and skill reward.
  - E2E: `tests/e2e/lower-sprawl-vertical-slice.spec.ts`.
  - Verifies title → briefing → choice → stage → all optional objectives → boss → wafer key → debrief → Drainmarket unlock → skill purchase → reload.
- [x] Lower Sprawl item-set route.
  - The high route now contains Rocket Backpack, Bassline Boots, and Gravity Talisman pickups.
  - E2E verifies both Burrowbreaker bonuses, runtime stat application, and the loadout budget.
- [x] Drainmarket combat lesson: authored clinic route, red invoice parry flash, knife-drone counter timing, injury-ledger triage, two-phase Knife-drone Nest, stim-cache reward, and Chrome Arcology unlock.
  - Add scene contract test binding campaign tutorial beats to enemy behavior.
- [x] Chrome Arcology railgun lesson: authored three-room sightline route, armor-piercing multi-target railgun action, labor-floor manifest side job, Elevator Seed Router, three-phase Madame Vitrine, Elevator Seed payload, and Mirror Palace unlock.
  - E2E: `tests/e2e/chrome-arcology-vertical-slice.spec.ts` in Chromium and Firefox.
- [x] Progression expansion: 23-item runtime catalog, eight additional sprite-backed pickups, six item sets, four five-tier disciplines, 20-node skill UI, and shared item/skill combat effects.
  - E2E: `tests/e2e/progression-skill-tree.spec.ts` in Chromium and Firefox.
- [x] Story animation and Chapter 4: promoted the 86-frame Moss production atlas, upgraded placards/dialogue presentation, and authored Mirror Palace rocket traversal, refusal-table story, banquet loop, Reflection Judge, Mirror Pass, and Dub Colony handoff.
  - E2E: `tests/e2e/mirror-palace-vertical-slice.spec.ts` in Chromium and Firefox.
- [x] Chapter 5 Dub Colony: dedicated colony route, visible 86-BPM classic hip-hop machinery, branch-aware beat windows, animated Naya shield companion, spare-parts and vote-card stories, jammer/guard behaviors, three-phase King Feedback, Bass Reactor Core, and Antenna Barrens handoff.
  - E2E: `tests/e2e/dub-colony-vertical-slice.spec.ts` in Chromium and Firefox.
- [x] Chapters 6–8 late-campaign route: exact-input FastType ledger repair, three-column cargo-claim routing, clause-based public broadcast composition, clean/recovered/assisted grading, preserved correction state, non-blocking public assist, optional signal/witness/toolkit work, complete multi-phase bosses, all three payloads, debrief autosaves, campaign completion, and the final Publish the Tools ending card.
  - E2E: `tests/e2e/late-campaign-vertical-slice.spec.ts` drives every dedicated canvas interface and the continuous Antenna Barrens → Orbital Lift → Asteroid Redoubt journey in Chromium and Firefox.
- [x] Dummy dojo and gameplay UI release hardening: randomized registered campaign stage, production movement/combat/rendering, invincible configurable dummy, infinite resources, live hitbox/hurtbox/frame/damage overlays, complete timing metrics, compact non-overlapping HUD geometry, and observable melee target/move telemetry.
  - E2E: `tests/e2e/training-mode.spec.ts` and `tests/e2e/gameplay-ui-release-contract.spec.ts` in Chromium and Firefox.
- [ ] Story arc continuity pass.
  - Add campaign test proving all eight stages have: placard, boss, choice, item payload, unlock reward, and release-status tag.

### R0.4 — release gate

- [ ] `pnpm test` passes from repository root.
- [ ] `pnpm typecheck` passes from repository root.
- [ ] `pnpm build` passes from repository root.
- [ ] `todo.md` has one first-release checklist section with each checked item backed by a named test.
- [ ] README has a short playable-slice section: controls, current systems, known gaps.

## Execution order

1. Keep pure systems isolated and tested.
2. Integrate one system at a time into the runner scene loop.
3. Add content only when the system contract exists.
4. Promote a TODO to done only when a test names the expected behavior.

## Current done in this pass

- Added pure flying-object + fluid API to `@badger/platformer-core`.
- Added deterministic melee combo system with skill-gated finishers.
- Added first-release item set definitions and bonus merging.
- Expanded badger skill tracks to include clawline, railgun, rocket, and hacking.
- Added targeted tests for each new contract.
- Implemented the complete Lower Sprawl core route with deterministic quest and puzzle state.
- Connected stage completion to debrief, persistent rewards, the next stage, and the shared skill tree.
- Added cross-browser Playwright coverage for the full route and animation state transitions.
- Added a continuous cross-browser Chapters 6–8 acceptance journey through the campaign-complete ending card.
- Fixed alternating grounded state that previously reset locomotion animations every frame.
- Replaced Captain Grin's inert placeholder behavior with telegraphed charge and receipt-burst patterns using the production boss sheet.
- Added deterministic warning/active steam vents and broadened the Lower Sprawl enemy mix.
- Integrated the complete Burrowbreaker Rig route with live landing shockwave, air control, fall-speed, and fuel-refund effects.
- Moved developer balance/runtime/tutorial panels behind the `F3` debug toggle so `D` remains an uninterrupted movement key.
- Rebuilt the gameplay HUD around segmented integrity, item cooldowns, route guidance, contextual prompts, and transient combat feedback.
- Tuned jump shaping with one-shot jump cuts, apex hang, stronger reversals, velocity camera lookahead, and a momentum dodge.
- Added explicit telegraphed patrol, turret, and bruiser attacks plus market/toll checkpoint recovery for the first world.
