# ADR-0001: Canonical story mode is a persistent node-world

- Status: accepted for Phase 0/1
- Date: 2026-07-23
- Scope: canonical story mode; versus, training, and endless remain independent modes

## Context

The shipping story flow treated each stage as a disposable run launched from a menu. The
mechanics already support an action-adventure RPG—movement, melee, ballistics, hacking,
companions, authored districts, choices, items, and skill trees—but the delivery structure
did not let places, routes, services, or local consequences persist.

The campaign also has two incompatible scales:

- the runtime defines eight authored regional arcs;
- prose planning describes eight worlds with four stages each.

A seamless open world would multiply streaming, collision, save, navigation, and content
cost before the game has proved its place loop.

## Decision

Canonical story mode is a **persistent node-based side-scrolling action-adventure RPG**.

Each runtime campaign entry is a district/regional arc. Each district owns five stable place
kinds:

1. safehouse;
2. settlement;
3. authored route;
4. stronghold;
5. transit station.

The planned thirty-two “stages” become subzones, routes, interiors, contracts, and
stronghold sections inside those eight districts. They are not thirty-two top-level menu
runs.

The expanding subway/lift/shuttle network is the world graph. Travel is explicit and
persistent. Story expeditions remain bounded authored scenes so combat and traversal stay
testable and performant.

## Runtime layers

The architecture has four ownership layers:

| Layer | Owns | Must not own |
|---|---|---|
| World | location, travel, discovery, quests, district phases, durable inventory | frame simulation |
| Expedition | current authored route/stronghold, checkpoint, temporary pressure | global truth |
| Encounter | readiness, perception, alarms, approach state, local enemy coordination | save serialization |
| Action | movement, attacks, damage, hacking verbs, animation timing | world navigation |

Scenes are disposable projections of these layers. A scene is never the authoritative save
object.

## Architectural pattern: Decision → Event → Projection

World changes use a small command/event core:

1. a command expresses intent (`travel`, `unlock-route`, `set-respawn`);
2. a pure decision function validates it against graph and state;
3. emitted events evolve durable state;
4. scenes project the resulting state.

This yields deterministic tests, replayable debug transitions, migration safety, and a clear
future seam for analytics or tooling without introducing an event-sourcing framework across
the entire game.

## Phase-0 product rules

### Currency

- `credchips`: spendable district economy;
- `blueprintShards`: scarce permanent build unlocks;
- `dubFavor`: relationship/faction consequence, not a shop currency;
- `orbitHeat`: world pressure, not money.

Additional currencies require a distinct decision loop and UI purpose; flavor tokens should
be items, quest flags, or reputation rather than new wallets.

### Approach parity

Every major authored encounter should expose at least two viable approach plans from:

- force/melee;
- ballistics;
- movement/ghoststep;
- hacking/environment;
- social/quest preparation where fiction supports it.

Parity means comparable opportunity and consequence, not identical completion time. No
build may be silently invalidated by a required interaction outside its verbs.

### Protected contracts

- Preserve current movement responsiveness and combat timing behind regression tests.
- Keep procedural generation optional and subordinate to authored campaign geography.
- Keep speed, camera composition, enemy readiness, and difficulty on separate tuning planes.
- Do not add world/quest responsibilities to `StageRunScene`.

## Consequences

Positive:

- locations and NPC services can become meaningful;
- story consequences have visible places to modify;
- fast travel grows from fiction rather than a level selector;
- bounded expeditions preserve the strongest existing mechanics;
- the eight-vs-thirty-two content mismatch becomes a useful hierarchy.

Costs:

- story navigation now requires a world shell and save migration;
- debrief transitions must explicitly return to the world projection;
- future quests and inventories need durable IDs and migration discipline.

## Rejected alternatives

- **Keep the linear stage menu:** cheapest, but preserves the core structural problem.
- **Single central mission hub:** improves fiction but still makes districts disposable.
- **Immediate seamless metroidvania/open world:** high engineering and content risk with no
  proof that the persistent-place loop is fun.
- **Procedural world as the campaign:** conflicts with authored character, district, and
  consequence goals.
