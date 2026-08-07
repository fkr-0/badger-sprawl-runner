# ADR-0003: Walkable social projections, canonical transactions, and derived infrastructure links

- Status: accepted for Phase 2–4 implementation
- Date: 2026-07-23
- Scope: social-space movement, shops/loadouts, legacy objective migration, and cross-district service effects

## Context

The first place-ledger implementation proved durable NPCs, services, and phase variants, but
four risks remained:

1. a “place” could still feel like a static list with decorative scenery;
2. the legacy shop persisted currency separately and did not persist purchased inventory;
3. existing stages reported coarse completion IDs that did not match the new semantic quest
   model;
4. cross-district consequences risked becoming bespoke flags read by unrelated scenes.

## Decision 1: social space is a spatial projection

`SocialSpaceCatalog` describes compact horizontal places through:

- world width and floor line;
- spawn and walk speed;
- interaction radius;
- NPC and service anchors;
- environmental props and depth copy.

`LocationScene` provides walking, a local camera, proximity focus, keyboard cycling for
accessibility, and in-place service overlays. It remains a disposable projection: NPC memory,
quest state, service levels, inventory, and currency still live outside the scene.

This is intentionally not a second combat scene. Sanctuary violence policy remains explicit,
and combat inputs do not summon combat controllers.

## Decision 2: one transaction crosses both canonical stores

The current architecture still has two durable domains:

- `GameFlow` owns meta currency and skill progression;
- `WorldDirector` owns adventure inventory, equipment, place, and quest state.

`WorldServiceDirector` is the application transaction boundary between them. A purchase:

1. validates place/service/offer/stock;
2. computes price from authored base price, heat, favor, provider trust, and owned stock;
3. debits credchips through `GameFlow`;
4. adds inventory through a `WorldDirector` command/event;
5. refunds currency if the world write fails;
6. returns an auditable receipt for UI, tests, telemetry, and autosave.

Equipment changes hydrate the proven `InventorySystem` to reuse slot/set rules and persist only
the resulting equipped IDs.

The legacy `ShopScene` is not extended. It should be removed or quarantined after the new
service layer reaches feature parity.

## Decision 3: legacy stage results cross an anti-corruption layer

`RuntimeQuestBridge` translates old whole-stage and whole-quest completion IDs into persistent
quest reconciliation. It does not teach `QuestDirector` about every historical runtime name.

Mapped facts complete authored persistent objectives and consequences. Unmapped facts are
preserved as namespaced world flags and reported diagnostically rather than guessed.

New content should emit semantic objective progress directly and bypass reconciliation.

## Decision 4: infrastructure communication is a derived read model

`InfrastructureNetwork` defines civic nodes and dependency links such as:

- Blue Mercy → Drainmarket cold chain;
- Pump Nine → clinic refrigeration;
- obligation archive → consent-aware Elevator Seed routing;
- Drainmarket cuttings → Dub Colony greenhouse rail;
- colony greenhouse practice → homecoming platform depots;
- public forecast → subway and Lift arrival explanations;
- Homecoming Lift → Blue Mercy;
- Blue Mercy coalition → final transmitter launch.

Node status derives from discovered districts, district phases, story completion, and world
flags. Links activate from those statuses. The network never becomes a second mutable source
of truth.

Places and the subway map project the same health, label, and active notices. Future audio,
NPC schedules, economy, and procedural contracts may consume the same read model.

## Decision 5: sound is uncertain evidence

`EnemyPerceptionMemorySystem` converts player actions into typed sound events with intensity
and radius. Nearby enemies retain source position and confidence, investigate, search a
bounded area, and calm down. Sound raises readiness but does not directly own attack AI.

The existing bounded communication network may propagate an alert only after local evidence
produces engagement. This preserves the distinction:

```text
sound heard
  -> uncertain local investigation
    -> sufficient confidence / visual confirmation
      -> engagement
        -> bounded relay communication
```

## Consequences

Positive:

- social spaces feel inhabited without becoming bespoke mega-scenes;
- purchases and equipment survive travel/reload through canonical state;
- legacy content remains playable while semantic migration proceeds;
- world systems visibly depend on and answer one another;
- colony/homecoming effects are encoded as reusable dependencies rather than ending-only prose;
- stealth mistakes create search and uncertainty before combat.

Costs:

- final art and ambient schedules still need a presentation pass over geometric placeholders;
- cross-domain transactions require rollback discipline until currency and adventure saves share
  one atomic persistence envelope;
- coarse legacy quest reconciliation is unsuitable for new branching content;
- sound currently lacks geometry-aware occlusion and material propagation;
- infrastructure links need economy and NPC-schedule consumers before every dependency has a
  mechanical effect.

## Rejected alternatives

- **Rebuild each settlement as a custom scene:** repeats layout, input, camera, and service
  logic and makes phase variants expensive.
- **Continue the legacy shop:** preserves split-brain saves and non-persistent purchases.
- **Rename new quests to match old IDs:** lets obsolete runtime vocabulary dictate the new
  domain model.
- **Persist infrastructure status separately:** creates drift from quests, routes, and services.
- **Gunshot immediately alerts every enemy:** destroys bounded knowledge and makes stealth a
  binary global switch.
