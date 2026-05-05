# Design Spec

## Elevator pitch

A compact sprite-based 2D jump-and-run where a badger courier-thief becomes an orbital rebel. Levels are readable and kinetic: run, jump, wall-kick, slash, shoot, boost, hack terminals, steal signal keys, buy upgrades, and push through one more neon district.

## Feel target

```yaml
feel:
  reference_shape: "classic left-to-right platformer readability, not clone content"
  camera: "smooth side-follow with lookahead"
  rules:
    - player always understands why they fell, missed, or got hit
    - every item modifies movement/combat in an obvious way
    - hazards telegraph before punishing
    - combat windows are short but fair
    - hacking minigames are fast, optional in easy paths, rewarding in heists
```

## Core loop

```text
enter district
  -> scout route
  -> platform through patrol spaces
  -> fight or evade guards
  -> hack / type / route a gate
  -> steal payload / rescue contact / plant relay
  -> escape chase
  -> spend loot at dub-shop / black-market railbench
  -> carry blueprints and boons into later runs
```

## Physics model

```yaml
player_physics:
  gravity: 1900 px/s^2
  jump_velocity: -650 px/s
  max_fall_speed: 1100 px/s
  run_accel_ground: 5200 px/s^2
  run_accel_air: 2900 px/s^2
  ground_friction: 4200 px/s^2
  max_run_speed: 285 px/s
  fast_fall_multiplier: 1.55
  coyote_time: 0.095 s
  jump_buffer: 0.11 s
  variable_jump_cut: 0.48
  ledge_grace: "future: snap up 4-6 px when near platform top"
```

## Player verbs

| Verb | Button | Timing | Notes |
|---|---:|---:|---|
| Run | Left/Right | continuous | Ground accel higher than air accel. |
| Jump | Space/W/Up | buffered | Supports coyote time and jump-cut. |
| Fast fall | Down/S | held | For precise descent and timing attacks. |
| Claw slash | J | 180 ms active | Short-range, quick cancel into jump after hit. |
| Katana draw | J after perfect dodge | 280 ms | Longer reach, pierces armored drones. |
| Railgun shot | K | charge/reload window | High impact, low fire rate. Perfect reload grants overpenetration. |
| Rocket boost | E with pack | fuel-limited | Burst upward/forward based on input vector. |
| Stim | E with stim | instant | Heal + short focus-time window. |
| Hack | M or terminal contact | minigame | Fast typing/coding puzzle gates side paths and heists. |

## Dead-cell-like timing mechanics

```yaml
timing_mechanics:
  rally_heal:
    rule: "after taking damage, dealing damage within 1.2s recovers a fraction of grey health"
    tuning: "recover 35% of recent damage max"
  perfect_reload:
    rule: "press shoot during 90ms reload sweet spot"
    reward: "next railgun shot pierces + creates EMP spark"
  clean_landing:
    rule: "land within 120ms after melee hit or rocket burst"
    reward: "+12% move speed for 2.0s"
  parry_claw:
    rule: "melee within enemy attack windup flash"
    reward: "stun + katana draw availability"
  heist_heat:
    rule: "faster clear yields lower alarm; missed hacks raise patrol density"
    reward: "shop discounts and faction trust"
```

## Items and capabilities

### Required items

| Item | Slot | Effect | Fun physics hook |
|---|---|---|---|
| Rocket backpack | Active | Directional burst, fuel meter | Lets badger convert horizontal momentum into high arcs. |
| Railgun | Weapon | Heavy shot, charge/reload cadence | Knockback can self-correct in air. |
| Stim pack | Consumable | Heal + focus-time | Slows world briefly, keeps player fast. |
| Claws | Melee base | Fast slash/parry | Cancels on hit. |
| Katana | Melee upgrade | Draw slash after parry/perfect dodge | Strong timing identity. |

### Additional item set

| Item | Type | Effect |
|---|---|---|
| Signal jammer | Active | Freezes cameras, slows drones, hides hack traces. |
| Phase pick | Utility | Opens weak walls and locked loot hatches. |
| Dub shield | Defensive | Beat-synced pulse absorbs one hit if timed on downbeat. |
| Echo cassette | Run boon | Replays last 2 seconds as ghost decoy. |
| Gravity talisman | Movement | One air flip that reverses vertical velocity slightly. |
| Nanofur weave | Passive | Reduces spike/graze damage. |
| Solder mite swarm | Companion | Repairs rocket fuel cells and nibbles armor. |
| Black ice tooth | Hack/combat | Successful code gate charges next melee with EMP. |
| Bassline boots | Movement | Landing on beat creates shockwave. |
| Contraband seed key | Meta | Unlocks one hidden shop category across runs. |

## Run aggregation / shop system

```yaml
persistent_progression:
  currencies:
    credchips: "spent in-run"
    blueprint_shards: "unlock item into future drop pool"
    dub_favor: "unlocks reggae colony merchants and safehouses"
    orbit_heat: "risk meter; high value unlocks harder heists"
  shop_capabilities:
    - reroll item pool
    - buy one emergency stim
    - install railgun mod
    - repair rocket backpack
    - buy faction rumor revealing secret route
    - bank one boon for next run
  meta_boni:
    - starting stim count +1
    - rocket fuel cell +1
    - first hack mistake ignored
    - shop discount after no-hit sector
    - rebel contact reveals heist objective early
```

## World structure

```text
World 1  Lower Sprawl        alleys, drainage, neon markets, corp scooters
World 2  Chrome Arcology     elevators, glass atriums, drone gardens
World 3  Straylight Mirage   orbital hotel-like maze, luxury zero-g, mirror traps
World 4  Dub Colony          bass-reactive platforms, sound-system trains, studio temples
World 5  Uplink Barrens      antenna fields, storm bridges, smuggler pylons
World 6  Asteroid Redoubt    rebel satellite base, low gravity, final uprising
```

## Enemies

| Enemy | Behavior | Counterplay |
|---|---|---|
| Rent-a-cop crawler | Walks platforms, turns at edges | Jump, slash, railgun. |
| Drone wasp | Sine hover, fires slow bolts | Railgun or claw parry. |
| Mirror guard | Teleports after hit | Wait for afterimage. |
| Bass turret | Fires on beat | Jump between pulses. |
| Black-ice fox | Triggers hack duel | Type faster or dodge glitch bolts. |
| Orbital lancer | Boss guard | Parry flash, attack after dash. |

## Implementation architecture

```text
src/main.js
  input        keyboard state and edge events
  physics      player acceleration, gravity, collision, coyote/buffer
  combat       melee boxes, projectile shots, enemy hits
  items        active slot behavior and cooldowns
  minigames    code gate state machine
  render       canvas drawing now; sprite-sheet renderer later

data/*.json
  sprites      source of truth for asset production
  items        item capabilities, shop/drop metadata
  progression  boons, currencies, unlocks
```
