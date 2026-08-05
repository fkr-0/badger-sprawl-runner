# ADR-0004: Event-bucket world beats, resolution evidence, and alarm knowledge actors

- Status: accepted for Phase 2–8 continuation
- Date: 2026-07-23
- Scope: NPC schedules, stage-resolution attribution, local alarms, and the vertical city-to-colony route

## Context

The persistent world had durable NPC relocation, resolution XP, hearing, search, and bounded
enemy communication. Three architectural gaps remained:

1. NPC movement between chapters risked becoming either frame-simulated off-screen activity or
   scattered story flags;
2. XP was correctly awarded only at resolution, but the completion result did not yet carry
   evidence of how the player approached the situation;
3. alarms and cameras risked becoming global alert switches outside the bounded knowledge model.

Chrome Arcology also required an explicit answer to a narrative-architectural question: how
does a subway-centered game go to space without replacing its central metaphor?

## Decision 1: schedule people by world beat, not clock simulation

`WorldSchedule` derives one authored world beat from canonical story progress:

```text
city-night
  -> floodline-open
    -> vertical-shift
      -> skybound
        -> colony-watch
          -> public-forecast
            -> homecoming
              -> commons-dawn
```

NPC schedule rules declare a location window and priority. They do not simulate travel frames,
sleep cycles, or arbitrary calendar time. A durable explicit NPC relocation always overrides a
schedule rule.

This provides deterministic revisits, testable cast convergence, and readable story pacing
without persisting off-screen scene graphs.

## Decision 2: attribute the resolution, never reward the attack

`ResolutionApproachTracker` records evidence during live play:

- melee commitment;
- ballistic use;
- hacking;
- sustained bounded stealth exposure;
- engagement observed;
- player-caused kills;
- semantic approaches explicitly reported by authored systems.

The tracker grants no XP. One shared stage-completion decorator appends approaches and
constraints to `StageRuntimeResult`. `ResolutionRewardDirector` consumes that evidence only
after the authored situation is complete, preserving the anti-grind rule.

All district completion methods now cross the same decorator rather than duplicating dispatch.

## Decision 3: alarms are local knowledge actors

`EnemyAlarmDeviceSystem` models alarms as world entities with position, scan radius, hack radius,
durability, detection, cooldown, and state:

```text
armed -> suspicious -> local report -> cooldown
   |                         |
   +-> hacked -> spoofed ----+
   +-> damaged -> disabled
```

An armed device reports the player’s last-known position into the communication cell containing
the device. A spoofed device reports a plausible false position at lower confidence. A strong
device report may travel one relay hop under the same rules as an enemy witness. No device can
set a level-global alert variable.

## Decision 4: the subway becomes vertical rather than yielding to a new metaphor

Chrome Arcology introduces the **Vertical Ghost** subway era. Blue Mercy reaches an erased
labor basement before the public map admits the stop. The Elevator Seed is modeled as a routing
constitution containing priority, interruption, failure, visibility, and revision rules.

The upward expedition is enabled by a derived infrastructure chain:

```text
Blue Mercy passenger stewardship
  + Open Vein medicine and cold-chain practice
  + Missing-Floor labor governance
  + protected route archives
    -> worker-authored Elevator Seed
      -> Sky Mirror Express
        -> Dub Colony expedition
```

The homecoming reverses the material flow but not the hierarchy: colony greenhouse practice,
disagreement procedures, tools, passengers, and testimony return to Blue Mercy. The colony is
another home and another network node, not a replacement capital.

## Consequences

Positive:

- cast movement is deterministic and narratively legible;
- explicit relocation remains authoritative;
- live playstyle evidence reaches progression without per-kill XP;
- all stage completion results share one contract;
- alarms participate in perception, uncertainty, relay limits, and spoofing;
- the space act deepens the subway metaphor instead of abandoning it;
- city decisions become material prerequisites for orbital travel;
- colony outcomes have defined return paths into city services.

Costs and follow-up:

- world beats are deliberately coarse and need authored exceptions rather than a fake universal
  clock;
- social and repair approaches need more semantic producers;
- alarm vision currently lacks geometry-aware occlusion;
- projectile damage has an application port but still needs collision authoring;
- contradictory reports do not yet carry source trust or doctrine;
- final social-space art must communicate schedule and transformation changes visually.

## Rejected alternatives

- **Persist NPC coordinates across every scene:** couples narrative state to presentation and
  creates migration debt.
- **Award XP when an approach action occurs:** turns attacks and hacks into farmable currency.
- **Infer playstyle only from equipped gear:** confuses preparation with actual resolution.
- **Use one global alarm meter:** breaks bounded knowledge and makes stealth unrecoverable.
- **Treat the Elevator Seed as a key item:** removes the political question of who authors
  routing defaults.
- **Make space a separate campaign map:** abandons the subway as the material and thematic pulse
  of the game.
