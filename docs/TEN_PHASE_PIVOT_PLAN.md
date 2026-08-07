# Badger Sprawl Runner — Ten-Phase Adventure Pivot Plan

Status: canonical execution plan  
Numbering: Phase 0 through Phase 9 = ten phases  
Revision: 2026-07-23

## Delivery doctrine

Each phase follows:

```text
validated content/model
  -> pure decisions
    -> application controller
      -> scene projection
        -> deterministic debug access
          -> integration evidence
```

The plan protects four principles:

1. preserve responsive movement and combat;
2. make places, people, and routes persistent;
3. keep authored story geography primary;
4. build reusable content pipelines instead of district-specific mega-scenes.

## Status overview

| Phase | Name | Status |
|---:|---|---|
| 0 | Product and architecture charter | Complete |
| 1 | Persistent world and transit shell | Complete |
| 2 | Inhabited places and social persistence | All eight districts now have validated safehouse, settlement, station, schedules, and transformed revisits |
| 3 | Quest, economy, inventory, and service loop | Complete: atomic services, expedition ledger, curated rewards, quest XP, twelve-shard campaign cadence, and shadow-shop quarantine |
| 4 | Encounter ecology, stealth, and local communication | Authored topology, occluded vision, acoustic portals, physical alarms, evacuation routes, two-plan validation, and post-enforcement employment implemented |
| 5 | Combat, progression, and expedition pressure | Active: explicit checkpoint policy, bounded field salvage, idempotent settlement, route-readable builds, and comparison telemetry implemented |
| 6 | City act: Lower Sprawl through Chrome Arcology | Three-district inhabited/content slice implemented; authored route integration and final presentation remain |
| 7 | Sky mirror and colony act | Mirror Palace and Dub Colony inhabited/content slices, peer transit, air governance, and emergency-authority arcs implemented |
| 8 | Homecoming and final expedition | Last Route, three late inhabited districts, public forecast, passenger Lift, Redoubt transmitter, and Commons Dawn implemented |
| 9 | Systemic endgame, procedural undercity, polish, and release | Foundations planned; release code-splitting and systemic endgame remain |

## Phase 0 — Product and architecture charter

Goal: decide what game is being built and prevent genre-pivot enthusiasm from dissolving proven mechanics.

Delivered:

- persistent node-world decision;
- eight districts interpreted as regional arcs with subzones;
- world/expedition/encounter/action ownership layers;
- Decision → Event → Projection world pattern;
- currency semantics;
- approach-parity rules;
- procedural-content guardrails;
- architecture decision record;
- camera and speed separated into orthogonal tuning planes.

Exit condition:

- every new feature has an owner and a persistence boundary;
- `StageRunScene` is not selected as the default owner of new global systems.

## Phase 1 — Persistent world and transit shell

Goal: replace disposable story runs with a world that remembers current place, unlocked routes, and district state.

Delivered:

- `AdventureSaveV2`;
- V1 save migration;
- validated world graph;
- safehouse, settlement, route, stronghold, and station vocabulary;
- deterministic travel commands/events;
- current position and respawn anchor;
- subway map as canonical story entry;
- story expedition and debrief loop returning to world;
- debug travel and district phase tools;
- closer story camera;
- calm enemy readiness states.

Exit condition met:

- a save can leave, reload, travel, complete a stage, and return without losing world position.

## Phase 2 — Inhabited places and social persistence

Goal: make off-combat locations actual places with residents, rules, services, memory, and visible transformation.

Implemented foundation:

- durable NPC state: met, trust, conversation history, flags, relocation;
- durable location state: visit count, flags, service levels;
- `NpcCatalog` with principal and supporting cast;
- `PlaceLedger` content contract;
- `PlaceDirector` projection and interaction boundary;
- generic `LocationScene`;
- Lower Sprawl safehouse, market settlement, and station;
- Drainmarket clinic loft, market commons, and Floodline platform;
- Chrome Arcology canteen, Service Atrium, and Cargo Lift Interchange;
- Mirror Palace backstage room, Servants’ Court, and False-World Tram;
- Dub Colony repair bay, Speaker Garden Assembly, and Chorus Rail;
- Antenna Barrens Pirate Mast Shelter, Signal Scavenger Camp, and Dead-Air Terminal;
- Orbital Lift Cargo Union Galley, Freight Worker Concourse, and Skylock Elevator;
- Asteroid Redoubt Free Transmitter Workshop, Redoubt Commons, and Return Signal Dock;
- contested and transformed variants;
- horizontal walkable social-space layouts with proximity interaction and compact cameras;
- canonical field-shop and persistent loadout-locker overlays inside the place scene;
- district-aware rumor boards;
- service definitions for skills, shop, rumor board, transit, repair, archive, clinic, greenhouse, and others;
- subway pulse projected into places and map.
- derived infrastructure dependency notices projected into places and the subway map.
- deterministic event-bucket world beats and NPC schedules from city night through commons dawn;
- durable NPC relocation explicitly outranking authored schedule defaults;
- schedule-aware social-space anchors for cast convergence during homecoming;
- forty-eight NPCs projected through persistent place, conversation, trust, and relocation state;
- twenty-four walkable social spaces using one validated proximity-interaction pipeline;
- Commons Dawn as a third authored Blue Mercy platform composition after liberation and homecoming.

Remaining deliverables:

1. Add dedicated repair, clinic, legal archive, greenhouse, and transit-control overlays on the canonical transaction boundary.
2. Add richer post-boss visual prop-state changes and event-specific ambient animation.
3. Replace geometric placeholder actors with final social-space sprite compositions.
4. Add accessibility-safe conversation history and quest recap.
5. Add final social-space art, authored ambient animation, and accessibility review to all eight district triptychs.

Exit condition:

- three Lower Sprawl places are navigable, distinct, and revisitable;
- at least six NPCs remember interactions and move after a district outcome;
- services are functional rather than placeholder console logs;
- combat inputs cannot accidentally fire in sanctuary space.

## Phase 3 — Quest, economy, inventory, and service loop

Goal: make activity outside combat mechanically consequential without producing currency clutter or loot inflation.

Implemented foundation:

- durable quest state;
- validated quest catalog;
- global main quest with explicit homecoming;
- Lower Sprawl main, side, evidence, and maintenance quests;
- authored multi-approach descriptions;
- quest activation through conversation and rumor board;
- persistent inventory slots already available in `AdventureSaveV2`.
- executable `QuestDirector` with objective progress, step advancement, explicit consequence selection, service upgrades, and NPC relocation;
- canonical inventory mutation through `WorldDirector` commands/events;
- canonical credchip debit/credit through `GameFlow`;
- transactional `WorldServiceDirector` with rollback-safe purchases and existing equipment-slot rules;
- Murr and Drainmarket shop offers projected from place, pressure, favor, trust, stock, and owned inventory;
- anti-corruption `RuntimeQuestBridge` translating legacy stage results into persistent local quests while preserving unmapped facts;
- Drainmarket main, privacy, telemetry, and maintenance quest chains.
- resolution-based XP and level progression with no per-kill award path;
- approach mastery counts and idempotent reward claims preventing callback replay or grind farming;
- live action, stealth-exposure, engagement, and kill evidence decorating every stage completion through one shared boundary;
- Chrome Arcology shop and four multi-visit quest chains on the canonical service/quest models;
- Mirror Palace shop and four multi-visit quest chains covering hidden service, testimony, Lio repair, and staff transit;
- Dub Colony shop and four multi-visit quest chains covering emergency authority, air, greenhouse transit, and solar windows;
- canonical seven-approach quest vocabulary shared with resolution attribution;
- runtime reconciliation for the public staff local, refusal archive, rotating-fader commons, and bidirectional return line;
- Antenna Barrens main, listener archive, forecast appeal, and mast-weather quest chains;
- Orbital Lift passenger, witness protection, machine refusal, and counterweight quest chains;
- Asteroid Redoubt transmitter, public toolkit, protected-map, and return-signal quest chains;
- canonical Lift passenger cooperative using existing credchip and persistent inventory transactions;
- runtime reconciliation for public forecast, passenger manifest, protected witnesses, public toolkits, and the commons transmitter;
- persistent expedition integrity, injuries, item condition, modification, and service-strain state;
- bounded expedition launch/commit projection between `AdventureSaveV2` and `StageRunScene`;
- runtime stim consumption synchronized back into persistent inventory;
- deterministic curated story reward tables using `ItemDropSystem`;
- executable repair, modification, clinic, greenhouse, archive, legal-aid, and transit-control overlays;
- atomic multi-command world transactions with full rollback on any rejected mutation;
- clinic costs expressed in supplies and published service strain rather than currency debt;
- one-unit civic-service strain recovery after every completed expedition;
- item modification effects composed with skill and loadout effects at expedition launch;
- quest-completion XP based on authored kind and structural depth, never kill count;
- one-time repair, modification, archive, legal, greenhouse, and transit mastery evidence;
- campaign blueprint-shard cadence increased from four to twelve, enough for one complete capstone closure and secondary investment;
- economy telemetry for spending, service use, broken equipment, hoarding risk, clinic strain, and recovery soft-lock risk;
- legacy `ShopScene` quarantined without independent save reads or writes.

Phase-complete invariants:

1. No service may mutate world state outside a validated command or atomic transaction.
2. Expedition scenes receive and return only bounded ledger projections, never world-owned scene objects.
3. Consumable use, item wear, repairs, modifications, rewards, injuries, and equipment survive travel and reload.
4. Repeated kills and replayed callbacks cannot become XP, mastery, stock, or reward exploits.
5. Care and production scarcity remain visible and recoverable rather than becoming permanent debt or a soft lock.
6. The main campaign supports a coherent capstone build without granting enough shards to flatten all four disciplines.

Currency rule:

- credchips = ordinary trade;
- blueprint shards = permanent build unlocks;
- favor = relationship/faction consequence;
- heat = pressure;
- all other resources should usually be items, supplies, or quest state.

Exit condition:

- combat, stealth, hacking, social, and exploration resolutions all progress quests and XP;
- one purchased or found item persists across travel/reload;
- one item can be repaired or modified;
- no mandatory path requires grinding respawning enemies.

## Phase 4 — Encounter ecology, stealth, and local communication

Goal: make enemies inhabitants and workers in a coordinated environment rather than globally activated targets.

Implemented foundation:

- off-guard, routine, alert, engaged readiness;
- directional notice and weak rear detection;
- calm local patrol profiles;
- dormant distant bosses;
- bounded communication cells;
- observer, relay, enforcer, isolated communication roles;
- local last-known-position sharing;
- one-hop relay propagation;
- typed player sound events for footsteps, jumping, dodging, melee, gunfire, and hack pulses;
- distance-attenuated hearing with role-sensitive confidence;
- bounded investigation and last-known-position search;
- confidence and search decay back into calm readiness;
- quiet-action contrast: hack pulses are materially less audible than rail fire;
- hackable local alarm devices rendered in authored stages with durability and an explicit disable port;
- armed alarms publishing real last-known positions into one bounded cell;
- spoofed alarms publishing lower-confidence false positions;
- high-confidence device reports using the same one-hop relay topology as enemy witnesses;
- expiring local report ledger with positional clustering rather than last-write-wins knowledge;
- compatible witnesses increasing trust while contradictory claims remain distinct;
- source identity, report count, trust, and conflict projected into enemy debug state;
- patrol response scaled by consensus trust;
- local cohesion derived from casualties, relay loss, conflicting intelligence, and mutual support;
- wavering, retreating, standing-down, and recommitted dispositions;
- retreating actors leaving the active combat set without generic boss surrender;
- explicit legitimacy port for authored social stand-down outcomes;
- typed witness, civilian-witness, sensor, spoofed-sensor, and relay provenance;
- district-specific hostile source-trust doctrine for Antenna Barrens, Orbital Lift, and Asteroid Redoubt;
- doctrine label and applied source weight projected into enemy debug state;
- bounded civilian witnesses capable of documenting, warning, misdirecting, withdrawing, and supporting stand-down;
- sensor sabotage recorded as observable local public aid rather than global reputation;
- debug snapshot fields and communication events.
- authored encounter zones, sight/acoustic portals, occluders, evacuation routes, and approach plans for all eight stages;
- deterministic vision evidence using portal transmission and the existing visibility raycast contract;
- geometry-aware acoustic propagation for player, impact, alarm, device, and decoy sounds;
- physically damageable alarms with directional rail and melee interaction;
- visible civilian compositions, stress rings, chalk evacuation routes, and non-color state marks;
- content validation requiring two distinct approach plans in every major authored zone;
- production route-read UI showing space, plan, approach family, physical cue, and explicit risk;
- Marlo Turnstile and Vera Counterweight as recurring post-enforcement workers across Blue Mercy, Chorus Rail, and homecoming.
- deterministic authored door actors whose open state is shared by vision and acoustic routing;
- deterministic authored floor traps with trigger, cooldown, persistent spoof, second-hack disable, typed source provenance, and non-color world marks;
- district-specific Antenna Barrens, Orbital Lift, and Asteroid Redoubt portal geometry rather than shared horizontal placeholders;
- Maceo Margin, Rita Latch, and Della Redact as accountable post-enforcement workers with contested admissions, transformed jobs, social-space anchors, and world-beat schedules.

Remaining deliverables:

1. Bind more quest/faction outcomes to witness trust and stand-down legitimacy.
2. Add district-specific post-story employment for remaining common enemy families.
3. Add controller-first route-plan inspection and reduced-motion awareness transitions.
4. Convert final placeholder cover art into district-specific interactive silhouettes without changing topology truth.

New architecture principle: **bounded knowledge topology**.

AI does not ask “Does the enemy faction know?” It asks:

- which actor perceived an event;
- which cell received a report;
- which relay can transmit it;
- how reliable and current the report is;
- which actors trust that source;
- what local doctrine says to do with uncertainty.

Exit condition:

- Moss can enter one authored encounter unseen;
- a mistake produces local escalation rather than global panic;
- breaking a relay materially contains the response;
- enemies search, communicate, and eventually calm down;
- direct combat remains fast once engagement begins.

## Phase 5 — Combat, progression, and expedition pressure

Goal: tune the existing action core for a persistent RPG without flattening its speed or turning builds into damage spreadsheets.

Implemented foundation:

- explicit checkpoint reset policy carried by every checkpoint and respawn event;
- story-continuity default preserving defeated enemies, disabled alarms, civilian state, and objective progress;
- expedition-local salvage deduplicated by authored source;
- checkpoint banking and policy-bounded loss of exposed salvage on death;
- deterministic run identities and duplicate-settlement rejection;
- successful first settlement converting banked salvage into canonical credchips exactly once;
- pressure HUD using shape, label, and color for exposed, banked, and lost value;
- observational build telemetry for duration, damage, kills, alarms, civilian outcomes, stand-downs, salvage, deaths, loadout, skills, and semantic approaches;
- stable run comparison producing evidence statements without mutating balance.
- deterministic 60 Hz locomotion golden traces for run/brake, held jump, coyote jump, fast fall, and ground dodge;
- exact apex, landing, displacement, and end-velocity signatures with a camera-independence contract;
- bounded elite/boss repetition resistance that preserves damage and only scales repeated stun/poise control;
- move variation and a 1.4-second pause resetting resistance, with explicit player feedback rather than hidden adaptation;
- a dedicated three-card Lower Sprawl Build Lab comparing route access, pressure, public consequence, failure mode, and practice next;
- authored-baseline versus observed-run labeling so intended affordances are never presented as measured performance;
- bounded, sanitized, run-ID-deduplicated build telemetry history persisted through the canonical save and hydrated into the Build Lab.
- direct Build Lab training launch with deterministic seed, real skill ranks, lesson, dummy, and weapon kit for all three authored cards.

Remaining deliverables:

1. Tune heavy commitment, dodge, parry, recovery, and elite poise values against the golden movement corpus.
2. Bind field healing and clinic recovery to the finalized injury cadence.
3. Add authored alternate checkpoint policies where local rehearsal or boss return is narratively justified.
4. Make more skill-tree choices open physical portal, traversal, and social options.
5. Add replay timeline drill-down for Build Lab evidence.
6. Capture three completed Lower Sprawl runs on the same seed and approve comparison thresholds from evidence.

Exit condition:

- three substantially different builds complete the Lower Sprawl stronghold;
- no build invalidates platforming readability;
- death creates pressure without forcing repetitive empty traversal;
- movement still feels recognizably like the current game.

## Phase 6 — City act: Lower Sprawl through Chrome Arcology

Goal: deliver the first complete adventure act and prove that persistent places, transit, quests, and combat form one satisfying loop.

Implemented acceptance foundation:

- deterministic Phase 6 report requiring all three city stages, transformed revisits, a publicly governed Elevator Seed, and the Chrome-to-Mirror route;
- world-map projection of the active phase, met criteria, and first blocking criterion;
- **No One in the Remainder**, an exact protected bin-packing contract for lift manifests;
- public objective order, capacity proof, incompatible-load handling, and an accountable next departure for every unplaced load;
- algorithmic quest motifs exposed through the content dashboard rather than hidden in prose.

Content:

- Lower Sprawl: wake Blue Mercy;
- Drainmarket: route medicine through knife weather;
- Chrome Arcology: expose missing labor floors and steal the Elevator Seed.

Deliverables per district:

- safehouse;
- settlement;
- station;
- authored route;
- stronghold;
- main quest over multiple visits;
- two side quests;
- maintenance contract;
- boss consequence;
- post-story revisit;
- enemy communication topology;
- services gained or transformed;
- subway announcement set.

Act climax:

- the Elevator Seed bends the city map into orbit;
- player choices determine who controls the first upward route;
- the city remains revisitable before departure.

Exit condition:

- the game unmistakably feels like an adventure RPG rather than an improved stage campaign;
- the whole city act can be played from new save to orbit departure.

Remaining release evidence:

1. Record the complete new-save-to-orbit E2E run.
2. Capture a transformed-city visual baseline after the Elevator Seed charter.
3. Approve one exact and one heuristic manifest fixture above the twelve-item exact-search limit.

## Phase 7 — Sky mirror and colony act

Goal: make space deepen the city’s themes rather than replace them with a disconnected science-fiction campaign.

Implemented acceptance foundation:

- bounded low-gravity and air-control profiles that compose with equipment while preserving the city golden traces;
- deterministic simulation-time traversal rhythm for Mirror Palace, Dub Colony, Antenna Barrens, Orbital Lift, and Asteroid Redoubt;
- explicit `inputDelayMs: 0` contract: rhythm moves world opportunities, never input sampling;
- Phase 7 report requiring orbital stages, city-system mirrors, at least three homecoming effects, and public knowledge-conflict procedures;
- **Four Colors, No Crown**, an exact minimum graph-coloring quest whose assignment must expire and rotate;
- **Assume the Model Is Complete**, a public proof-by-contradiction quest preserving the counterexample holder’s consent and remedy.

Content:

- Mirror Palace: luxury and betrayal;
- Dub Colony: refuge, air, food, emergency power;
- Antenna Barrens: prediction, secrecy, and public technical knowledge.

Key design requirement:

Every orbital system must visibly mirror a city system:

- tram ↔ subway;
- oxygen allocation ↔ route priority;
- greenhouse train ↔ clinic supply line;
- emergency broadcast ↔ station announcement;
- docking authority ↔ fare authority;
- prediction model ↔ patrol coordination.

Deliverables:

1. Low-gravity traversal profiles without changing the base movement contract.
2. Colony off-combat assembly and service network.
3. Rhythm mechanics integrated with defense and world machinery.
4. Lio betrayal consequences.
5. King Feedback governance outcomes.
6. Sister Version/Mara/Rook knowledge conflict.
7. Black-Ice Fox contestable forecast outcome.
8. City-to-colony service effects visible in both directions.

Exit condition:

- the colony feels like transformed transit infrastructure and a political community;
- at least three city decisions return as concrete colony conditions;
- at least three colony outcomes are prepared to alter the city homecoming.

Remaining release evidence:

1. Capture one controller and keyboard traversal trace for each rhythm profile.
2. Add reduced-motion presentation for moving route machinery while retaining the same open-window truth.
3. Record the three city-to-colony and three colony-to-city consequence fixtures in E2E.

## Phase 8 — Homecoming and final expedition

Goal: complete the dramatic loop by returning to the city before the final launch.

Implemented acceptance foundation:

- Phase 8 report requiring Orbital Lift completion, return delegation, transformed-city revisit, canonical homecoming topology, coalition service capacity, and final doctrine;
- final-doctrine readiness scored from real service levels, routes, appeals, refusal channels, archives, and distributed tools;
- unsupported doctrines produce concrete warnings instead of being treated as earned because a dialogue flag exists;
- dedicated Director Vane controller with competence proof, exact chromatic route lock, reproducible contradiction closure, witness interruption, and ownership collapse;
- Gödel Archive Echo and **The Incomplete Timetable**, adding an explicit undecidable route state without confusing incompleteness with institutional secrecy;
- runtime harness snapshots for Director Vane, traversal rhythm, and content readiness.

Topology already implemented:

- Orbital Lift → Lower Sprawl homecoming route;
- Lower Sprawl → Asteroid Redoubt final launch route;
- no direct Orbital Lift → Asteroid shortcut in the canonical graph.

Deliverables:

1. Orbital Lift descent and Elevator Angel resolution.
2. Cargo-prisoner liberation and machine testimony.
3. Required transformed-city revisit.
4. Companion and NPC relocations based on prior choices.
5. Greenhouse, archive, clinic, shop, and transit consequences.
6. Blue Mercy platform as coalition assembly and mission control.
7. Final-launch preparation quests.
8. Asteroid Redoubt social commons and full-kit route.
9. Director Vane four-phase confrontation.
10. Evidence/tools/abolition broadcast doctrines combined with world-state evaluation.

Exit condition:

- the player sees the city changed before choosing the final doctrine;
- the final expedition is materially enabled by relationships and services built across the world;
- the ending is not selected from dialogue alone but reflects accumulated infrastructure state.

Remaining release evidence:

1. Record one materially grounded fixture for each final doctrine and one deliberately unsupported warning fixture.
2. Capture the required homecoming revisit and Blue Mercy coalition assembly as a single E2E flow.
3. Add final Vane arena visual and audio baselines for all four systemic phases.

## Phase 9 — Systemic endgame, procedural undercity, polish, and release

Goal: expand replayability only after the authored world, economy, and ending are stable.

Implemented acceptance foundation:

- five optional undercity entrances attached to persistent places and opened contextually from the walkable world;
- deterministic manifests with seed, entrance, depth, contract, vendor, elite, room/pack bounds, reward scale, and checksum;
- separately versioned active-expedition save, never embedded in canonical world truth;
- exact startup reconstruction and resume of active manifests, room position, and banked/exposed salvage;
- optional expedition settlement committing inventory, wear, integrity, injury, and salvage without advancing authored stages, quests, districts, or endings;
- bounded depth 1–20, at most five packs, three side rooms, two affixes per pack, and 2.25 reward scale;
- distinct procedural vendors and elites that cannot impersonate authored companions or bosses;
- machine-readable content dashboard for quests, approaches, routes, places, schedules, services, stage art, undercity entries, and algorithmic motifs;
- Phase 9 acceptance report for canonical campaign stability, Commons Line state, separate save ownership, deterministic manifests, validation, migrations, and release evidence.
- ownership-oriented production chunks separating the cyclic game core, authored adventure content, campaign content, scene shells, renderer, persistence, procedural expeditions, workspace packages, and external runtimes;
- production entry reduced from 879.75 kB to roughly 10 kB, with no Rollup circular-chunk or size warnings.

Deliverables:

1. Optional procedural undercity entrances attached to persistent places.
2. Active expedition saves separate from canonical world save.
3. Seeded manifests exposed for reproduction and debugging.
4. Bounded enemy affixes and reward scaling.
5. Procedural vendors and unique elites without replacing authored NPCs/bosses.
6. District contracts that remix established systems.
7. Postgame Commons Line service and governance events.
8. Full performance, accessibility, localization, save-migration, and controller polish.
9. Content validation dashboards for quests, routes, NPC schedules, services, approaches, and missing assets.
10. Release evidence: deterministic replays, E2E flows, visual baselines, migration fixtures, and balance reports.

Exit condition:

- authored campaign remains coherent without procedural content;
- optional expeditions deepen builds and world maintenance rather than become the true game;
- all ten phases meet release acceptance criteria;
- the final version can be patched without invalidating saves or requiring scene-specific data surgery.

Remaining release work:

1. Persist mid-room inventory wear, integrity, and collected-source identity rather than only manifest, room, and pressure state.
2. Add explicit active-expedition migration fixtures beyond schema v1.
3. Complete localization extraction, controller glyph review, and reduced-motion coverage.
4. Capture deterministic replay, E2E, visual, migration, and balance evidence required by the Phase 9 report.

## Cross-phase acceptance gates

### Architecture

- world truth is outside disposable scenes;
- IDs are validated;
- migrations are explicit;
- debug commands reproduce state;
- content additions avoid central switch statements where catalogs suffice.

### Narrative

- every district changes after its conflict;
- every major NPC has contradiction, agency, and long arc;
- every boss represents a system that solved a real problem badly;
- the subway changes as chorus and infrastructure;
- space mirrors the city;
- the city is revisited before the finale.

### Game design

- at least two approaches for major objectives;
- no XP solely for kills;
- no mandatory loot treadmill;
- no global enemy omniscience;
- no settlement reduced to a static mission list;
- no final choice detached from prior play.

### Production

- model tests before scene polish;
- one vertical slice before district multiplication;
- asset requests generated from validated content gaps;
- deterministic seeds for generated encounters;
- build and test evidence attached to each phase checkpoint.

