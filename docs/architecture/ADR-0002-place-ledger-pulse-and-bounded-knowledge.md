# ADR-0002: Place ledgers, subway pulse, and bounded knowledge topology

- Status: accepted for Phase 2–4 foundation
- Date: 2026-07-23
- Scope: off-combat places, narrative persistence, quests, and enemy communication

## Context

The adventure pivot introduces three pressures that often produce fragile game architecture:

1. settlements become bespoke scenes containing hard-coded NPC and shop logic;
2. story consequences become flags scattered through UI and combat callbacks;
3. stealth AI becomes a single global alert variable that makes every enemy omniscient.

All three problems share the same structural mistake: a local projection is allowed to own
global truth.

## Decision 1: place ledger

Off-combat locations are authored as validated place records. A place binds:

- location identity;
- safety and violence policy;
- atmosphere and music cue;
- district-phase variants;
- resident NPC IDs;
- service definitions;
- ambient lines;
- interaction guidance.

`PlaceDirector` projects a place from durable adventure state. `LocationScene` renders and
interacts with that projection but does not own NPC memory, service level, quest state, or
district phase.

This pattern is called **ledger, director, projection**:

```text
PlaceLedger (authored possibility)
  + AdventureSave (durable actuality)
    -> PlaceDirector (decision and projection)
      -> LocationScene (disposable presentation)
```

## Decision 2: quest orchestration

Quest structure lives in a catalog; durable progress lives in `AdventureSaveV2`; semantic
progress and consequence application live in `QuestDirector`.

Combat and scene code report facts such as:

- `lower-sprawl-resolved`;
- `ghost-stops +1`;
- `survivor-consent +1`;
- `elevator-angel-resolved`.

They do not directly set the next quest step, relocate an NPC, or unlock a service.

Branching quests with multiple consequences remain incomplete until an explicit consequence
is selected. The architecture therefore cannot silently choose the first authored political
outcome for the player.

## Decision 3: subway pulse

The subway is represented as a derived narrative/systemic pulse rather than a pile of
chapter-specific UI strings.

The pulse derives from story and adventure state and projects:

- current era;
- announcement voice;
- visual map signal;
- network mood;
- service pattern.

This lets the same state appear coherently in:

- the transit map;
- stations;
- safehouses;
- travel conversations;
- loading/placard transitions;
- later audio and ambient systems.

The pulse is a read model. It does not duplicate or replace canonical story progress.

## Decision 4: bounded knowledge topology

Enemy knowledge is local and transmissible, not faction-global.

Enemies belong to stable encounter cells and have communication roles:

- observer;
- relay;
- enforcer;
- isolated.

An engaged source builds alert in its cell. A relay may warn at most one adjacent cell under
the initial profile. Reports contain a last-known position and decay. They increase
EncounterReadiness notice rather than directly commanding combat states.

The later stealth implementation may add confidence, sound identity, source trust,
occlusion, spoofing, and doctrine while retaining this topology.

## Decision 5: homecoming topology

The canonical graph has no direct Orbital Lift → Asteroid Redoubt edge.

Orbital Lift completion unlocks:

- `homecoming:orbital-lift:lower-sprawl`;
- `launch:lower-sprawl:asteroid-redoubt`.

This makes the transformed city an obligatory playable mirror and coalition staging ground
before the final expedition.

## Consequences

Positive:

- district content can multiply without multiplying scene classes;
- NPCs and services can relocate safely;
- save migrations have explicit data to sanitize;
- narrative effects can be tested without rendering;
- enemy escalation becomes readable and containable;
- the subway can transform coherently across interfaces;
- the homecoming is enforced by topology rather than only prose.

Costs:

- catalogs require ID validation and authoring discipline;
- generic projections need deliberate art/layout layers to avoid feeling templated;
- quest semantic events need bridges from existing objective systems;
- local AI communication requires authored or derived cell boundaries;
- service implementations must migrate away from legacy independent persistence paths.

## Rejected alternatives

- **One custom hub scene per district:** fast initially, expensive and inconsistent after the
  second district.
- **Store entire scene objects:** impossible to migrate or reason about reliably.
- **One global alert meter:** contradicts surprise, stealth, and inhabited-place pacing.
- **Global event sourcing for the whole game:** unnecessary complexity; command/event
  evolution remains limited to durable adventure state.
- **Direct orbit-to-finale travel:** removes the city’s transformation from the player’s
  decision context and weakens the subway’s dramatic function.

