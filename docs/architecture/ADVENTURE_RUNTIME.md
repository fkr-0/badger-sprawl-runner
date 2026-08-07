# Adventure runtime architecture

## Purpose

This document is the Phase 0/1 implementation contract for the adventure pivot. It turns the
design direction in `docs/ADVENTURE_PIVOT.md` into code ownership, data contracts, tests, and
a productive content workflow.

## Implemented foundation

### Durable world projection

`AdventureSaveV2` persists:

- current location and spawn;
- respawn anchor;
- discovered and visited locations;
- unlocked transit routes;
- quest states and objective progress;
- persistent inventory and equipment IDs;
- district story phases;
- world flags and deterministic transition sequence.

V1 saves migrate by projecting completed/current campaign stages into district discovery,
transit unlocks, phases, and the current district safehouse.

### World graph

`WorldGraph.ts` defines eight districts, each with safehouse, settlement, route, stronghold,
and station nodes. Internal foot routes and inter-district subway/lift/shuttle links form one
validated graph.

### World director

`WorldDirector` is the world application boundary. It decides commands, emits events, evolves
state, repairs stale IDs, reports reachable locations, and exposes explicit debug travel.

### World shell

`SubwayMapScene` is the canonical story entry. It presents discovered places, unlocked
connections, current position, and deployable expedition nodes. Stage completion returns to
the narrative debrief; completing the debrief returns to the world shell.

## New design concepts

### 1. Scene-as-projection

A scene may own presentation caches and transient simulation, but is reconstructed from
application state. This prevents “mega-scene persistence,” makes test setup cheap, and allows
future settlements or subway interiors to use different renderers without changing saves.

### 2. Encounter readiness gate

Combat controllers receive only enemies whose encounter state is `engaged`. Before engagement,
enemies inhabit the place as:

- `off-guard`: stationary, slow to notice, suitable for surprise;
- `routine`: small local patrol, moderate notice time;
- `alert`: stationary watch posture, fast notice time;
- `engaged`: handed to the existing stage-specific combat controller.

This is a compatibility membrane, not the final stealth model. Phase 4 can replace the
detection heuristic with vision cones, occlusion, hearing, last-known position, search, and
alarms while retaining the same readiness output contract.

### 3. Orthogonal tuning planes

Do not use one “game speed” scalar. Tune independently:

- **presentation:** camera zoom, anchor, lookahead, shake;
- **locomotion:** acceleration, top speed, air control, braking;
- **encounter tempo:** patrol pace, notice delay, attack windup, recovery;
- **difficulty pressure:** damage, health, pack budget, resource scarcity.

This makes the requested closer view safe now while preserving later movement-speed tuning.
It also prevents accessibility changes from corrupting encounter balance.

### 4. Place ledger

Each district should eventually publish one data record that binds:

- place nodes and spawn IDs;
- NPC services;
- quest providers and quest-state projections;
- expedition entrances;
- post-story visual/state variants;
- transit unlock conditions.

The ledger is content data, not scene code. Validation should fail CI when an ID is missing or
a route points nowhere.

### 5. Capability ports

Major encounters should declare supported capabilities (combat, ranged, traversal, hacking,
preparation) and validate that at least two approach plans remain viable. This converts “many
playstyles” from an aspiration into authoring-time data that tests can inspect.

## Camera and speed decision

The story camera now uses a 1.16× world zoom anchored at the ground plane, reducing visible
world width from 960 to roughly 828 world units. HUD and interface remain screen-space.
Training uses a milder profile.

Movement speed is intentionally not frozen. It belongs to a locomotion profile and can be
tuned after camera/playtest feedback. The foundational decisions that should remain stable
are:

- world scale and simulation coordinates are independent;
- camera composition is data-driven;
- calm patrol speed is not chase/attack speed;
- perception delay is not movement speed;
- district variants may select profiles without branching core systems.

## Productive workflow

For each future phase or district slice:

1. add/modify validated data contracts;
2. implement a pure decision/model test;
3. connect an application controller;
4. project it through a scene/UI;
5. add one deterministic debug command;
6. add an integration test for the full transition;
7. capture a visual/playtest artifact only after model tests pass.

This “model → application → projection → evidence” order reduces scene-driven rework and
keeps designers able to change content data without editing engine code.

## Phase 1 acceptance status

- [x] persistent node-world target encoded;
- [x] eight districts reconciled with subzone interpretation;
- [x] `AdventureSaveV2` and V1 migration;
- [x] location, spawn, quest, inventory, travel, and district-phase persistence;
- [x] validated travel graph;
- [x] deterministic world commands/events;
- [x] current location and respawn handling;
- [x] subway/map shell;
- [x] debug travel and district-phase controls;
- [x] closer camera profile;
- [x] calm readiness gate before combat AI;
- [x] place-ledger content boundary and generic off-combat location projection;
- [x] durable NPC, conversation, relocation, location, and service state;
- [x] Lower Sprawl safehouse, settlement, and station variants;
- [x] Drainmarket clinic, commons, and Floodline variants proving the place-ledger pipeline;
- [x] Chrome Arcology canteen, Service Atrium, and Cargo Lift Interchange proving a third district slice;
- [x] Mirror Palace backstage room, Servants’ Court, and False-World Tram;
- [x] Dub Colony repair bay, Speaker Garden Assembly, and Chorus Rail;
- [x] Antenna Barrens Pirate Mast Shelter, Signal Scavenger Camp, and Dead-Air Terminal;
- [x] Orbital Lift Cargo Union Galley, Freight Worker Concourse, and Skylock Elevator;
- [x] Asteroid Redoubt Free Transmitter Workshop, Redoubt Commons, and Return Signal Dock;
- [x] modular district content packs composed through unified catalogs and validators;
- [x] walkable horizontal social layouts with proximity-based interaction;
- [x] canonical field-shop and persistent loadout-locker transactions;
- [x] persistent expedition integrity, injuries, item condition, repair history, and modifications;
- [x] bounded expedition launch and commit through `ExpeditionDirector`;
- [x] runtime stim use synchronized with persistent inventory;
- [x] deterministic curated story rewards through `ItemDropSystem`;
- [x] atomic multi-command world transactions with all-or-nothing service mutation;
- [x] executable repair, modification, clinic, greenhouse, archive, legal-aid, and transit-control overlays;
- [x] clinic and greenhouse scarcity represented as visible, recoverable service strain;
- [x] economy telemetry for spending, service use, equipment breakage, hoarding, and recovery risk;
- [x] authored quest-completion XP and explicit level/skill cadence;
- [x] twelve campaign blueprint shards supporting one capstone closure;
- [x] legacy `ShopScene` quarantined without save access;
- [x] cross-catalog spatial-anchor and infrastructure dependency validation;
- [x] validated quest catalog and quest application director;
- [x] legacy stage-result anti-corruption bridge into persistent quests;
- [x] idempotent resolution XP, level projection, and approach mastery ledger;
- [x] live approach evidence and one shared decorated stage-completion boundary;
- [x] subway pulse projection across story eras;
- [x] derived infrastructure network projected into places and the transit map;
- [x] bounded local enemy communication cells and one-hop relays;
- [x] sound confidence, bounded investigation, last-known-position search, and calm decay;
- [x] hackable local alarm actors, bounded real reports, and false-position spoofing;
- [x] event-bucket world beats and schedule projection from city night through commons dawn;
- [x] Vertical Ghost, Sky Mirror, Diaspora Chorus, Commons Loop, homecoming, Last Route, and Commons Dawn subway eras;
- [x] public staff-local, withdrawable testimony, public-air, rotating-authority, bidirectional-return, forecast-appeal, passenger-manifest, toolkit-mirror, protected-map, and peer-return infrastructure;
- [x] schedule-aware Blue Mercy homecoming anchors and physical cast convergence;
- [x] expiring local report ledger with compatible-claim clustering and contradictory-source trust;
- [x] local cohesion from casualties, relay loss, report conflict, and mutual support;
- [x] retreat and explicit-legitimacy stand-down ports with bosses excluded;
- [x] typed report provenance and district-specific hostile source-trust doctrine;
- [x] bounded civilian witnesses sharing communication and cohesion boundaries;
- [x] explicit Orbital Lift homecoming route through Lower Sprawl;
- [x] final completion and completed-save migration returning to Blue Mercy Commons Dawn;
- [x] fifty-four NPCs, thirty-seven quests, twenty-four places/layouts, twenty-three infrastructure nodes, and thirty-nine links validated as one world;
- [ ] final social-space sprite composition and remaining service overlays (Phase 2);
- [x] semantic repair/social/exploration evidence, curated drops, repair, clinic cost, and expedition inventory commit (Phase 3);
- [x] authored encounter topology, vision occlusion, visible civilian actors, evacuation routes, geometry-aware hearing, physical alarms, and two-plan validation (Phase 4);
- [x] explicit checkpoint reset policy, bounded salvage pressure, idempotent expedition settlement, and observational build telemetry (Phase 5 foundation);
- [x] nineteen authored encounter portals and eleven deterministic acoustic traps, with one portal-state projection shared by vision and hearing;
- [x] district-specific late-stage portal/occluder geometry for Antenna Barrens, Orbital Lift, and Asteroid Redoubt;
- [x] five canonical locomotion golden traces, explicit elite anti-loop control scaling, and the persistent three-build Lower Sprawl Build Lab;
- [x] deterministic Build Lab-to-training presets using real skill nodes, selected lesson/dummy, and appropriate weapon kit;
- [x] executable Phase 6–9 acceptance reports and material final-doctrine readiness projected through the persistent world map;
- [x] protected bin packing, exact authority graph coloring, finite contradiction proofs, and a bounded Gödel Archive Echo integrated as civic mechanics;
- [x] orbital environment and rhythm profiles preserving city movement and zero input delay;
- [x] dedicated Director Vane capstone controller using coalition evidence, graph-colored route windows, contradiction closure, witnesses, and doctrine support;
- [x] five seeded undercity entrances, checksummed manifests, bounded procedural roles, and separately versioned active-expedition saves;
- [x] startup reconstruction and resume of the exact active undercity manifest with room and pressure hydration;
- [x] runtime-readable adventure content dashboard and E2E harness access for dashboard, rhythm, and Vane state;
- [x] warning-free ownership-oriented production chunking with a 10 kB entry and bounded independently cached game/content/runtime chunks;
- [ ] more faction stand-down bindings, final heavy/parry recovery tuning, replay timeline drill-down, and three approved observed comparison runs.
