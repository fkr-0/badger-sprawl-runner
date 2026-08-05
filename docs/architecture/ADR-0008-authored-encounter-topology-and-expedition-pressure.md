# ADR-0008: Authored encounter topology and expedition pressure

- Status: Accepted
- Date: 2026-07-24
- Scope: Phase 4 encounter ecology and Phase 5 expedition-pressure foundation

## Context

The action runtime already had readiness, hearing, local communication cells, alarm devices, witnesses, cohesion, retreat, checkpoints, durability, and replay-oriented systems. The missing layer was not another AI controller. It was authored spatial meaning.

Distance-only sight and sound could not express a shutter, service corridor, atrium, pressure door, maintenance crawl, or public evacuation route. Conversely, putting durable encounter knowledge directly into `StageRunScene` would create a second AI truth and make content validation impossible.

Persistent expeditions also needed pressure without a second currency or replay exploit. Checkpoints could restore Moss, but the reset policy was implicit; field rewards either had to become permanent immediately or had no meaningful risk.

## Decision 1: Encounter topology is authored data

Each runtime stage projects:

- zones;
- sight and acoustic portals;
- occluders;
- civilian evacuation routes;
- at least two distinct approach plans for every major zone.

Topology contains geometry and semantic affordances, not mutable AI state. `EncounterTopologyCatalog` currently supplies all eight story stages. The content validator rejects broken references, invalid transmission values, incomplete evacuation routes, and major zones without distinct plans.

## Decision 2: Perception emits evidence; readiness owns engagement

`EnemyVisionSystem` and `EnemyPerceptionMemorySystem` answer local questions:

- can this actor currently see Moss;
- through which portals;
- with what confidence;
- which sound source was heard;
- how much acoustic transmission survived the route.

They do not engage enemies. `EncounterReadinessSystem` remains the single owner of notice and engagement. Authored stages pass explicit evidence; legacy or non-authored callers may still use the compatibility heuristic.

This preserves a staged migration path and prevents two systems from disagreeing about whether an enemy is active.

## Decision 3: Reuse visibility math, do not duplicate it

Authored occluders are projected into the existing `CombatVisibilitySystem` raycast contract. The topology layer decides connectivity and transmission; the visibility system decides whether an obstacle blocks the direct segment.

This separates graph topology from collision geometry and keeps both deterministic.

## Decision 4: Sound is a sourced event

Sound events carry:

- kind;
- source ID and source class;
- position;
- intensity and radius;
- traversed portal IDs.

Player movement and attacks, landing impacts, alarm triggers, alarm damage, and spoofed decoys use the same hearing boundary. Future doors and traps must enqueue sound events rather than directly mutating enemy awareness.

## Decision 5: Civilians follow authored escape routes

Civilian witnesses remain owned by `CivilianWitnessSystem`. Topology supplies route projections; the system chooses, follows, and completes routes. The scene only renders the projection and emits player-facing cues.

Routes use line, shape, text, and motion rather than color alone. Witness actors expose documenting, evacuating, sheltering, and withdrawn states without becoming collectible morality markers.

## Decision 6: Checkpoint reset semantics are explicit

Every checkpoint resolves a `StageCheckpointResetPolicy`. The default story-continuity policy:

- preserves defeated enemies;
- preserves disabled alarms;
- preserves civilian state;
- preserves objective progress;
- loses half of exposed field salvage.

Alternative policies may be authored later, but no respawn may silently reset a subsystem.

## Decision 7: Field salvage is temporary pressure, not another currency

`ExpeditionPressureSystem` owns expedition-local salvage:

- collection is deduplicated by source;
- checkpoints bank exposed value;
- death loses only the policy-bounded exposed share;
- stage completion settles remaining value.

Only the persistent application boundary converts settled salvage into canonical credchips.

## Decision 8: Run settlement is idempotent

Every expedition launch receives a deterministic `runId`. `WorldDirector` records settled IDs and rejects duplicate commits. Salvage journal entries use the same run identity. `AdventureController` grants credchips only when the first world settlement succeeds.

Repeated callbacks therefore cannot duplicate:

- inventory commits;
- service-strain recovery;
- completed-run counts;
- salvage earnings;
- canonical currency.

## Decision 9: Build telemetry is observational

`BuildComparisonTelemetrySystem` may record and compare:

- duration;
- damage;
- kills;
- alarm outcomes;
- civilian outcomes;
- stand-down appeals;
- salvage and deaths;
- loadout, skills, and semantic approaches.

It has no tuning, AI, reward, persistence, or combat mutation authority. Its output is evidence for balancing and training review, not a hidden adaptive-difficulty mechanism.

## Decision 10: Production UI translates systems into routes and pressure

The player receives:

- route-read panels with space, two plans, risk, approach family, and physical cue;
- shape-plus-label salvage states: exposed, banked, and lost;
- chalk evacuation paths and non-color witness marks;
- local sight, sound, and report-language cues rather than raw confidence percentages.

Debug projections remain available for development, but production language describes what Moss can infer and act on.

## Consequences

Positive:

- authored spaces become mechanically distinct without district mega-scenes;
- local knowledge remains bounded and testable;
- stealth, force, repair, social, and exploration plans can share one geometry contract;
- checkpoints create pressure without repetitive empty traversal;
- settlement cannot duplicate currency;
- narrative transformations can reuse the same report and alarm infrastructure as public services.

Costs:

- placeholder late-stage layouts still need district-specific portal placement;
- door and trap sound producers remain to be authored;
- alternate checkpoint policies require explicit local justification and tests;
- approach-plan HUD density needs controller and reduced-motion review;
- comparison telemetry still needs replay/training presentation.

## Rejected alternatives

### Global faction awareness

Rejected because one witness, camera, or gunshot would unrealistically activate an entire district and erase local stealth recovery.

### Scene-owned portal and checkpoint state

Rejected because `StageRunScene` is already an integration pressure point and must not become a second world or AI store.

### Immediate permanent salvage

Rejected because it removes expedition pressure and makes checkpoint banking meaningless.

### New salvage currency

Rejected because the game already has canonical credchips; field salvage is a temporary settlement state, not an economy.

### Adaptive balance driven by telemetry

Rejected because hidden mutation would make builds difficult to reason about, invalidate deterministic replay, and turn analysis into an unaccountable difficulty controller.
