# ADR-0006: Late-act content packs and institutional knowledge

- Status: accepted
- Date: 2026-07-23
- Scope: Antenna Barrens, Orbital Lift, Asteroid Redoubt, Last Route, Commons Dawn, enemy reports, civilian witnesses

## Context

The first five inhabited districts proved the generic NPC, place, layout, quest, schedule, infrastructure, service, and runtime-reconciliation pipelines. Continuing to append every district to the original catalog files would preserve runtime reuse while damaging authoring clarity: giant catalogs create merge conflicts, discourage district-level review, and make story changes difficult to audit as one dramatic unit.

The late act also requires more than additional locations. Its three political systems must communicate:

- Antenna Barrens governs prediction, consent, uncertainty, and appeal;
- Orbital Lift governs classification, passenger standing, obedience, and refusal;
- Asteroid Redoubt governs public tools, protected routes, authorship, and revision.

Enemy coordination had already gained bounded cells, expiring claims, contradiction, and cohesion. It still treated source confidence as politically neutral and had no bounded non-enemy witness actors.

## Decision 1: district content packs

Late districts are authored in focused modules grouped by concern:

```text
AntennaBarrensNpcContent
AntennaBarrensPlaceContent
AntennaBarrensSocialSpaces
AntennaBarrensQuestContent

OrbitalLiftNpcContent
OrbitalLiftPlaceContent
OrbitalLiftSocialSpaces
OrbitalLiftQuestContent

AsteroidRedoubtNpcContent
AsteroidRedoubtPlaceContent
AsteroidRedoubtSocialSpaces
AsteroidRedoubtQuestContent
```

Core catalogs import and spread these packs into the same unified arrays used by runtime projections and validators.

The modules import core interfaces with `import type`, avoiding runtime cycles. The core catalog remains the composition root; content packs never register themselves globally.

### Consequences

- Each district can be reviewed as one dramatic and production unit.
- Cross-world validation remains centralized.
- New districts do not require new scene classes or service economies.
- Content packs remain data-oriented and cannot bypass world commands, quest application, or persistence.
- Similar modularization should be applied to older districts when those files receive substantial future edits, but no rewrite is required merely for stylistic symmetry.

## Decision 2: institutions communicate through typed dependencies

Infrastructure links represent more than route availability. Late-act links carry operational doctrine:

```text
listener consent archive
  -> public forecast
    -> pre-harm appeal switch
      -> passenger classification

colony air forecast
  + bidirectional return rights
    -> passenger manifest
      + machine command history
        -> homecoming lift

Blue Mercy practiced institutions
  -> public toolkit mirrors

protected route map
  -> peer return signal

public toolkits
  + peer receiving stations
    -> commons transmitter
      -> local copies back on Blue Mercy
```

A link becomes active from durable world flags and district state. Infrastructure remains a derived projection; it does not create a second mutable persistence model.

### Consequences

- Earlier side quests can materially change late capacity and governance.
- The final transmitter cannot be treated as an isolated ending button.
- Story text, subway notices, and place projections can explain the same dependency graph.

## Decision 3: Last Route is distinct from Homecoming

The story schedule and subway pulse now contain two separate late beats:

```text
homecoming
  -> last-route
    -> commons-dawn
```

- **Homecoming** begins after Orbital Lift completion and returns passengers, seeds, tools, and testimony to Blue Mercy.
- **Last Route** begins when the final asteroid expedition launches from a transformed city.
- **Commons Dawn** begins after final completion and returns the save to Blue Mercy while retaining the Redoubt as a peer node.

Durable relocation events supersede prior quest placements. Default schedules remain lower-authority projections.

### Consequences

- The space colony expedition does not replace the city as headquarters.
- The final mission launches from institutions the player previously built.
- Completed-campaign migration lands at the transformed subway, not at a frontier stronghold.
- Blue Mercy has three authored social compositions: liberation, homecoming, and Commons Dawn.

## Decision 4: typed report provenance and district doctrine

Enemy reports carry a source kind:

- `witness`
- `civilian-witness`
- `sensor`
- `spoofed-sensor`
- `relay`

`EnemySourceTrustDoctrine` applies a stage-specific trust weight before the report enters `EnemyReportLedger`.

The ledger remains responsible for geometric compatibility, contradiction, decay, and consensus. The doctrine is responsible for institutional bias.

Examples:

- Antenna enforcement trusts forecast sensors over listener speech.
- Lift customs trusts cargo-authority eyes over unrecognized passenger testimony.
- Skylock trusts executive sensors and command-chain repetition over independent receivers.

Enemy snapshots expose source kind, doctrine label, and applied weight.

### Consequences

- Institutional bias is explicit, testable, and debuggable.
- A sensor and a witness with equal raw confidence need not have equal political authority.
- Spoofed devices can be discounted without inventing special-case behavior trees.
- Future transformed-stage or faction doctrines can replace the static hostile profiles through the same boundary.

## Decision 5: civilian witnesses share the bounded topology

`CivilianWitnessSystem` creates authored local witness actors for late encounter spaces. A witness has position, radius, trust, stress, disposition, report cooldown, and incident history.

A witness may:

- document conduct;
- warn the local cell;
- misdirect authority;
- shelter or withdraw;
- support a wavering patrol’s stand-down.

Civilian claims enter `EnemyCommunicationNetwork` as `civilian-witness` reports. Stand-down support enters `EnemyCohesionSystem` through its explicit legitimacy port.

Sensor spoofing or disabling can be recorded as observable local public aid. No global morality currency is introduced.

### Consequences

- Non-enemies participate in encounter knowledge without becoming escort objectives by default.
- Losing a witness changes the local information ecology.
- Social resolution can affect combat through typed, bounded interfaces.
- Visible civilian sprites and authored evacuation geometry remain a presentation task, not a prerequisite for the deterministic model.

## Rejected alternatives

### One late-act mega-scene

Rejected because it would own places, quests, services, story state, and enemy doctrine in one class and repeat the architecture problems the pivot is intended to remove.

### A global faction-awareness boolean

Rejected because it erases source, geography, contradiction, and decay.

### A universal source-confidence table

Rejected because it hides institutional politics and makes every district’s surveillance system behave alike.

### Global morality or civilian reputation points

Rejected because witness action should depend on local memory, danger, and standing rather than one abstract player score.

### Ending directly at the asteroid

Rejected because it turns the city into a prologue, makes the colony a replacement headquarters, and removes the subway’s final transformation from play.

## Verification obligations

- Every content pack must pass unified cross-catalog validation.
- Every late place must have a social layout.
- Every conversation quest foreign key must resolve.
- Legacy stage results must reconcile into persistent late quests without losing unmapped facts.
- Last Route and Commons Dawn must have independent schedule and subway-pulse tests.
- Source doctrine must be applied before claim consensus.
- Civilian reports must remain bounded to local cells.
- Bosses remain excluded from generic cohesion surrender.
- Completed-campaign migration must return to Blue Mercy.
