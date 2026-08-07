# ADR-0009 — Deterministic acoustics, movement baselines, control resistance, and build evidence

- Status: accepted
- Date: 2026-07-24
- Scope: Phase 4 encounter ecology and Phase 5 combat/build review

## Context

The adventure pivot now depends on several systems that are easy to implement in ways that undermine replayability or player trust:

- doors and traps can accidentally become a second, scene-local perception truth;
- random trap triggering can make AI reports irreproducible;
- camera and movement tuning can drift together without a stable feel contract;
- anti-stunlock behavior can become hidden adaptive difficulty or input reading;
- build-comparison UI can present authored intentions as measured results;
- transient telemetry can disappear before players can compare completed runs.

These risks cross combat, AI, world geometry, persistence, and UI. They therefore require explicit ownership and evidence boundaries rather than more scene conditionals.

## Decision 1 — One portal-state projection serves vision and sound

`EncounterAcousticActorSystem` owns authored door and floor-trap runtime state for an encounter.

A door projects one `open` value. Both `EnemyVisionSystem` and `EnemyPerceptionMemorySystem` receive that exact projection during the same fixed-step update. Neither perception system may infer or mutate door state.

Door and trap events create typed local sound evidence with source identity. They do not directly engage enemies, mutate quest state, apply damage, or grant rewards.

The legacy random `TrapSystem` is not used for encounter knowledge because `Math.random()` would make report propagation and replay comparison nondeterministic.

## Decision 2 — Late-stage geometry is authored by district

Antenna Barrens, Orbital Lift, and Asteroid Redoubt use explicit topology builders rather than the generic three-zone horizontal template.

Each district owns:

- portal names and placement;
- vision and acoustic transmission;
- high and low stronghold routes;
- occluder meaning;
- evacuation waypoints;
- acoustic trap placement and story function.

The common topology schema and validator remain shared. District flavor changes data, not ownership.

## Decision 3 — Movement feel is protected by fixed-step golden traces

Canonical movement scenarios run at 60 Hz through the production `PhysicsSystem` and `CombatSystem`:

- run and brake;
- held jump;
- coyote jump;
- fast fall;
- ground dodge.

The contract records exact apex frame, landing frame, minimum height, displacement, end velocity, and selected frame samples. Camera stepping is tested separately and may not alter the trace.

Golden traces are not a declaration that movement can never change. They make every change explicit, reviewable, and attributable to a locomotion decision rather than incidental camera, rendering, or difficulty work.

## Decision 4 — Elite resistance scales control, never damage

Elite and boss repetition resistance is deterministic and target-local.

Repeated hits from the same move family inside 1.4 seconds reduce only stun and poise control. Damage, hit confirmation, rewards, and encounter difficulty do not change. A different move family or sufficient pause resets the sequence.

The system never reads buffered input, predicts intent, measures player success, or changes rules based on performance. It emits `loop-resisted` events so the player receives an honest cue to vary move, route, or timing.

## Decision 5 — Build comparison separates authored baseline from observed run

The Lower Sprawl Build Lab compares three coherent identities:

- Ghost Signal;
- Commons Claw;
- Rail Breach.

Every card includes route access, pressure, public consequence, failure mode, and practice guidance. Damage is one evidence field rather than the verdict.

Without matching telemetry the UI must say `authored-baseline`. A card may say `observed-run` only when sanitized StageRun telemetry matches its loadout and approach signature.

## Decision 6 — Observational history uses the canonical save

`GameFlow.meta.buildTelemetryHistory` is the single persistent history boundary.

History is:

- sanitized on construction and load;
- deduplicated by run ID;
- bounded to twelve snapshots;
- cloned on read;
- filtered by stage for the Build Lab.

The history is observational. It cannot mutate combat tuning, rewards, AI, or procedural generation.

## Consequences

### Positive

- vision and hearing cannot disagree about an authored door;
- trap reports and replays are reproducible;
- movement drift becomes reviewable;
- elite counterplay is legible and fair;
- comparison UI cannot fabricate evidence;
- completed runs remain useful after save/reload;
- future Pixi/native HUD implementations can consume renderer-neutral snapshots.

### Costs

- intended locomotion changes require deliberate golden updates;
- district geometry needs authored data rather than template reuse;
- telemetry schema changes require sanitizer maintenance;
- elite move-family keys must remain stable across projectile and melee implementations.

## Rejected alternatives

### Let vision and hearing infer door state independently

Rejected because it creates contradictory local knowledge and ordering-sensitive bugs.

### Use random trap variants during story encounters

Rejected because story AI evidence must be replayable. Random visual decoration may exist elsewhere, but not in knowledge topology.

### Give elites hidden damage reduction after repeated hits

Rejected because it invalidates player feedback and approaches adaptive difficulty without consent.

### Compare only DPS and completion time

Rejected because the game is about routes, public consequences, pressure, witnesses, and infrastructure as well as execution speed.

### Store telemetry in local UI state

Rejected because it would disappear across navigation/reload and create a second persistence boundary.
