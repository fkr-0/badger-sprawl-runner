# Combat Expansion: Claws, Blades, Guns, Distance, Traps, Platform Enemies

## 0. Combat thesis

Badger Sprawl Runner combat should feel like:

> a fast platform fighter, a hack-and-slash action game, and a live hacking duel all using the same timing language.

Every fighting style should answer:

```yaml
combat_question:
  claws: "Can you read close timing and punish instantly?"
  swords: "Can you control space, rhythm, and commitment?"
  guns: "Can you manage distance, reload cadence, and target priority?"
  hacking: "Can you read state, syntax, and environmental opportunity?"
  traps: "Can you turn platforming terrain into combat advantage?"
```

---

# 1. Distance concepts

Combat should be designed in clear range bands.

```yaml
distance_bands:
  body_range:
    range: "0-32 px"
    danger: "grapples, bites, contact damage"
    best_tools: [claws, dodge, parry, burrow_uppercut]

  claw_range:
    range: "32-58 px"
    danger: "fast melee trades"
    best_tools: [claw_slash, parry_tooth, quick_katana_draw]

  sword_range:
    range: "58-96 px"
    danger: "lancers, katana duelists, shield enemies"
    best_tools: [katana, hook_blade, step_slash]

  gun_range:
    range: "96-360 px"
    danger: "turrets, drones, rail duelists"
    best_tools: [railgun, pistol, shotgun, aimed_hack]

  matrix_range:
    range: "line-of-sight / infrastructure graph"
    danger: "cameras, terminals, antenna locks"
    best_tools: [remote_tap, terminal_overload, lightning_route]

  platform_range:
    range: "vertical or separated by hazards"
    danger: "enemy above/below, jump arcs, trap corridors"
    best_tools: [rocket, wallshot, falling_slash, trap_hack]
```

Design rule:

> Each weapon owns a distance, but good play lets the player convert one distance into another.

Examples:

```text
railgun recoil -> creates sword distance
rocket burst -> skips gun distance into claw distance
parry -> converts enemy attack into hack opportunity
terminal overload -> turns far enemy into environmental target
katana launch -> converts close enemy into aerial juggle
```

---

# 2. Claw fighting

Claws are Moss’s native style: fast, scrappy, low commitment, excellent for timing and recovery.

## 2.1 Claw identity

```yaml
claw_style:
  role: close_range_timing
  strengths:
    - fastest attack startup
    - parry access
    - good aerial correction
    - strong against weak enemies
    - builds tempo quickly
  weaknesses:
    - low reach
    - weak against shields unless parried
    - risky against contact enemies
    - poor against airborne ranged enemies
```

## 2.2 Core claw moves

| Move            | Input               | Use               | Notes                                               |
| --------------- | ------------------- | ----------------- | --------------------------------------------------- |
| Quick Claw      | melee               | basic slash       | Fastest attack. Low damage, high tempo gain.        |
| Double Swipe    | melee, melee        | close combo       | Second hit moves Moss slightly forward.             |
| Hook Claw       | melee + up          | anti-air          | Pulls light drones downward.                        |
| Burrow Uppercut | down + melee        | launcher          | Pops weak enemies upward.                           |
| Falling Rake    | melee while falling | aerial slash      | Strong if used after fast fall.                     |
| Wall Scratch    | melee near wall     | cling/cancel      | Small wall-stall, useful in platform combat.        |
| Parry Tooth     | melee during flash  | defensive counter | Correct timing stuns enemy and opens syntax window. |

## 2.3 Claw timing

```yaml
claw_timing:
  quick_claw:
    startup_ms: 80
    active_ms: 110
    recovery_ms: 160
    cancel_on_hit: [jump, dodge, second_claw]

  parry_tooth:
    valid_window_ms: 95
    reward:
      - enemy_stun
      - tempo_plus
      - next_hack_token_auto_correct
      - katana_draw_available_if_unlocked
    fail:
      early: whiff_recovery
      late: take_hit
```

## 2.4 Claw upgrades

```yaml
claw_upgrades:
  double_swipe:
    effect: "second claw tap within 220ms"
  hook_claw:
    effect: "pulls light airborne enemies into melee range"
  red_fur_rally:
    effect: "claw hits recover more grey health"
  syntax_parry:
    effect: "parrying a coded enemy reveals one valid hack token"
  burrow_uppercut:
    effect: "down + melee launches weak grounded enemies"
  wall_scratch:
    effect: "brief wall cling after clawing a wall or shield"
```

---

# 3. Swordfighting styles

Swords should not merely be “stronger claws”. Each blade style defines a different rhythm.

## 3.1 Sword families

```yaml
sword_families:
  katana:
    identity: "draw timing, clean commitment, counter-duels"
  machete:
    identity: "rough crowd-clearing, heavy arcs, sprawl survival"
  mono_saber:
    identity: "high-tech armor cutting, heat risk"
  hook_blade:
    identity: "platform control, pulls, ledge fighting"
  baton_blade:
    identity: "nonlethal stun, parry and guard"
```

---

## 3.2 Katana style: draw and punish

The katana is a timing weapon. It should feel elegant, dangerous, and slightly ceremonial.

```yaml
katana_style:
  role: precision_midrange
  strengths:
    - long melee reach
    - strong punish after parry
    - cuts through lightly armored enemies
    - excellent boss armor-node damage
  weaknesses:
    - more recovery than claws
    - poor if spammed
    - requires spacing
```

| Move          | Input                         | Use                   |
| ------------- | ----------------------------- | --------------------- |
| Draw Slash    | melee after parry             | high-damage counter   |
| Step Cut      | forward + melee               | range control         |
| Rising Cut    | up + melee                    | anti-air              |
| Falling Moon  | down + melee in air           | descending slash      |
| Sheath Cancel | release melee at perfect beat | reduces recovery      |
| Mirror Cut    | after perfect dodge           | crosses through enemy |

```yaml
katana_timing:
  draw_slash:
    startup_ms: 130
    active_ms: 160
    recovery_ms: 300
    perfect_contexts:
      - after_parry
      - after_perfect_dodge
      - after_successful_code_gate
    reward:
      - armor_node_damage
      - clean_landing_speed_bonus
      - boss_phase_interrupt_if_window_open
```

---

## 3.3 Machete style: ugly, practical, crowd-clearing

A sprawl tool, not a noble weapon.

```yaml
machete_style:
  role: crowd_control
  strengths:
    - wide arcs
    - good against groups
    - chops vines/cables/soft barriers
  weaknesses:
    - slower startup
    - weaker parry
    - bad against precise duelists
```

| Move           | Effect                                      |
| -------------- | ------------------------------------------- |
| Street Chop    | heavy close strike                          |
| Wide Sweep     | hits 2-3 weak enemies                       |
| Cable Cut      | destroys certain platform hazards           |
| Panic Swing    | works while damaged, but increases recovery |
| Bloodless Flat | nonlethal knockdown if timed late           |

---

## 3.4 Mono-saber style: illegal high-tech blade

Dangerous, hot, anti-armor, but increases heat.

```yaml
mono_saber:
  role: anti_armor_high_risk
  resource: blade_heat
  strengths:
    - cuts shields
    - breaks armor plates
    - melts locked grates
  weaknesses:
    - raises district heat
    - can overheat
    - attracts drones
```

Special rule:

```yaml
overheat:
  if_blade_heat_full:
    - blade_disabled_for_seconds: 5
    - visible_smoke_trail: true
    - enemy_drones_gain_tracking: true
```

---

## 3.5 Hook blade style: platform combat

This weapon connects combat and movement.

```yaml
hook_blade:
  role: platform_control
  effects:
    - pull light enemies
    - pull Moss toward hook points
    - hang briefly from rails
    - drag shield enemies off ledges
```

This is excellent for levels with:

```text
moving trains
cranes
hanging signs
speaker stacks
antenna masts
orbital cargo hooks
```

---

# 4. Guns

Guns should not turn the game into a shooter. They should create spacing puzzles.

## 4.1 Gun classes

```yaml
guns:
  railgun:
    role: precision_pierce
    range: long
    rhythm: slow_reload_timing
  shock_pistol:
    role: fast_interrupt
    range: medium
    rhythm: short_bursts
  scatter_coil:
    role: close_burst
    range: short
    rhythm: reload_after_two_shots
  nail_smg:
    role: suppressive_fire
    range: medium
    rhythm: recoil_management
  harpoon_line:
    role: movement_and_pull
    range: medium
    rhythm: aim_commitment
  signal_launcher:
    role: hack_projectile
    range: long
    rhythm: delayed_trigger
```

---

## 4.2 Railgun

The iconic gun.

```yaml
railgun:
  identity: "one perfect line through chaos"
  verbs:
    - pierce enemies
    - break armor nodes
    - trigger conductive objects
    - recoil Moss backward
    - chain with perfect reload
  perfect_reload:
    window_ms: 90
    effects:
      - pierce_plus
      - emp_on_hit
      - next_hack_faster
      - rail_trail_marks_target
```

Railgun should interact with environment:

| Object       | Railgun effect                |
| ------------ | ----------------------------- |
| wet pipe     | electricity arc               |
| neon sign    | drops sign trap               |
| terminal     | remote overload if marked     |
| mirror panel | ricochet puzzle               |
| antenna mast | long-distance lightning route |
| cargo hook   | swings platform               |

---

## 4.3 Shock pistol

A fast, less dramatic gun.

```yaml
shock_pistol:
  role: interrupt_tool
  good_against:
    - small drones
    - charging enemies
    - code-casting enemies
  weak_against:
    - armor
    - shield bosses
  special:
    - interrupts enemy syntax cast
    - primes enemy for claw parry
```

---

## 4.4 Scatter coil

Close-range blast gun.

```yaml
scatter_coil:
  role: panic_space_maker
  effects:
    - pushes enemies away
    - can launch Moss slightly backward in air
    - strong against swarms
  risk:
    - long reload
    - poor precision
```

---

## 4.5 Signal launcher

The hacker’s gun.

```yaml
signal_launcher:
  role: ranged_hack_delivery
  ammo_types:
    mark:
      effect: "marks enemy/object for remote hack"
    spoof:
      effect: "briefly turns turret/drone friendly"
    burst:
      effect: "detonates marked terminal"
    leash:
      effect: "pulls weak enemy toward hacked object"
```

This weapon makes “hacking is fighting” explicit.

---

# 5. Traps and platform hazards

Traps should serve both platforming and combat. Most should be hackable, baitable, or reversible.

## 5.1 Trap categories

```yaml
trap_categories:
  physical:
    - spikes
    - crushers
    - saw rails
    - falling signs
    - cargo hooks
  electrical:
    - exposed wires
    - terminal overloads
    - lightning gutters
    - antenna arcs
  security:
    - cameras
    - laser grids
    - drone docks
    - alarm doors
  rhythm:
    - bass shockwaves
    - speaker pulses
    - moving beat platforms
  orbital:
    - vacuum vents
    - low_gravity shafts
    - rotating rooms
    - pressure doors
```

---

## 5.2 Trap table

| Trap         | Platform role    | Combat role             | Hack interaction             |
| ------------ | ---------------- | ----------------------- | ---------------------------- |
| Spikes       | jump precision   | knock enemies into them | temporarily retract          |
| Crusher      | timing obstacle  | bait heavy enemies      | freeze / reverse             |
| Neon Sign    | falling hazard   | crush weak enemies      | railgun or hack drops it     |
| Exposed Wire | avoid floor      | electrocute wet enemies | route lightning              |
| Camera Cone  | stealth pressure | calls drones            | spoof / blind / mark targets |
| Drone Dock   | spawn hazard     | enemy source            | turn into friendly turret    |
| Bass Pulse   | rhythmic jump    | pushes groups           | amplify with Bass stat       |
| Vacuum Vent  | movement hazard  | pulls enemies           | open/close remotely          |
| Cargo Hook   | moving platform  | snags enemies           | redirect path                |
| Laser Grid   | route block      | cuts projectiles        | phase-shift with code gate   |

---

## 5.3 Trap ownership

Every trap has an owner state.

```yaml
trap_owner_states:
  hostile:
    color: red
    damages_player: true
    damages_enemies: sometimes
  neutral:
    color: white
    damages_all: true
  hacked:
    color: green
    damages_enemies: true
    damages_player: false_or_reduced
  unstable:
    color: yellow
    behavior: unpredictable
    reason: failed_hack_or_overload
```

This makes hacking tactically visible.

---

# 6. Enemy taxonomy

Enemies should be platform-aware. They should force the player to use verticality, distance, traps, and hacking.

## 6.1 Basic enemy classes

```yaml
enemy_classes:
  walkers:
    function: "ground pressure"
  jumpers:
    function: "platform pursuit"
  flyers:
    function: "anti-comfort / force railgun or hook"
  shields:
    function: "spacing and parry test"
  casters:
    function: "hacking duel"
  turrets:
    function: "route denial"
  heavies:
    function: "trap bait"
  assassins:
    function: "movement duel"
  swarms:
    function: "crowd control test"
```

---

## 6.2 Lower Sprawl enemies

| Enemy            | Movement            | Attack             | Counter                    |
| ---------------- | ------------------- | ------------------ | -------------------------- |
| Toll Rat         | patrols edges       | quick bite         | claw, jump, trap           |
| Scooter Bailiff  | rushes straight     | ram                | jump over, railgun rear    |
| Debt Printer Imp | stationary/cowardly | spawns paper traps | hack or rush               |
| Signboard Sniper | roof camper         | slow aimed shot    | rocket, rail, falling sign |
| Cable Crawler    | ceiling path        | drops wire         | hook claw, pistol          |
| Fuse Monk        | slow walker         | electrified staff  | parry syntax window        |

---

## 6.3 Chrome Arcology enemies

| Enemy               | Movement                   | Attack          | Counter                    |
| ------------------- | -------------------------- | --------------- | -------------------------- |
| Reception Lancer    | precise dash               | spear thrust    | katana spacing             |
| Holo-Gardener       | teleports between planters | thorn drones    | rail through plants        |
| Contract Lawyer Bot | floats backward            | binding clauses | code parry                 |
| Glass Janitor       | sweeps platforms           | slippery floor  | jump timing                |
| Panic Siren         | runs away                  | raises alarm    | signal launcher            |
| Drone Wasp Queen    | airborne                   | spawns wasps    | railgun, terminal overload |

---

## 6.4 Mirror Palace enemies

| Enemy            | Movement             | Attack                  | Counter            |
| ---------------- | -------------------- | ----------------------- | ------------------ |
| Reflection Hound | mirrors player jumps | bite from opposite side | fake-out movement  |
| Prism Duelist    | midrange blade       | delayed slash           | katana parry       |
| Etiquette Blade  | walks slowly         | punishes button spam    | wait, parry        |
| Debt Harpist     | stationary           | rhythm shockwaves       | bass shield        |
| Mirror Guard     | teleports            | clone strike            | hit real shadow    |
| Vacuum Porter    | opens vents          | pull/push zones         | hack vent controls |

---

## 6.5 Dub Colony enemies

These should be morally complicated: not all are villains. Some are rivals, scared defenders, or ideological opponents.

| Enemy          | Movement        | Attack          | Counter                    |
| -------------- | --------------- | --------------- | -------------------------- |
| Bass Beetle    | hops on beat    | body slam       | jump on offbeat            |
| Echo Drummer   | stationary      | shockwave rings | downbeat guard             |
| Feedback Cobra | sine-wave crawl | sonic spit      | rail or dodge rhythm       |
| Rival Selector | platform DJ     | summons hazards | hack speakers              |
| Amp Golem      | slow heavy      | huge slam       | bait into trap             |
| Static Choir   | group enemy     | chorus push     | area attack / bass counter |

---

## 6.6 Uplink Barrens enemies

| Enemy          | Movement           | Attack            | Counter                 |
| -------------- | ------------------ | ----------------- | ----------------------- |
| Spark Jackal   | fast zigzag        | electric bite     | trap bait               |
| Wire Witch     | hovers near cables | lightning thread  | cut cable / hack        |
| Regex Fox      | evasive            | malformed prompts | syntax mastery          |
| Packet Butcher | heavy caster       | packet cleaver    | interrupt               |
| Dish-Climber   | climbs masts       | throws bolts      | railgun                 |
| Null Monk      | phases             | silence field     | pure melee inside field |

---

## 6.7 Orbital / Asteroid enemies

| Enemy           | Movement           | Attack         | Counter           |
| --------------- | ------------------ | -------------- | ----------------- |
| Gravity Customs | flips gravity      | stamp shock    | adapt platforming |
| Wind Lancer     | aerial dash        | lance dive     | rail / katana     |
| Airlock Nun     | guards doors       | pressure burst | hack pressure     |
| Hull Spider     | wall/ceiling       | web mines      | fire/rail         |
| Forge Ox        | ground heavy       | charge         | trap crush        |
| Signal Lancer   | teleports by relay | beam stab      | destroy relays    |

---

# 7. Enemy state machines

Enemies should be predictable enough for mastery.

```yaml
standard_enemy_state_machine:
  idle:
    transitions: [patrol, alert]
  patrol:
    transitions: [alert, turn_at_edge]
  alert:
    transitions: [approach, aim, retreat]
  windup:
    transitions: [attack, interrupted, parried]
  attack:
    transitions: [recovery, hit_confirm]
  recovery:
    transitions: [retreat, patrol, enrage]
  hacked:
    transitions: [stunned, friendly, overloaded]
```

For coded enemies:

```yaml
coded_enemy_state_machine:
  scan:
    visible_state: "[SCAN]"
    player_action: "prepare"
  inject:
    visible_state: "[INJECT]"
    player_action: "syntax parry / quick hack"
  execute:
    visible_state: "[EXECUTE]"
    player_action: "dodge or punish if interrupted"
  rollback:
    visible_state: "[ROLLBACK]"
    player_action: "railgun / katana punish"
```

---

# 8. Platforming-combat enemy patterns

## 8.1 Edge guards

Enemies that control platform lips.

```yaml
edge_guard:
  examples: [Reception_Lancer, Toll_Rat_Elite]
  role:
    - punish careless jumps
    - teach falling slash
    - teach railgun before landing
  counters:
    - bait thrust
    - rocket over
    - terminal shock from behind
```

## 8.2 Ceiling enemies

```yaml
ceiling_enemy:
  examples: [Cable_Crawler, Hull_Spider]
  role:
    - make player look upward
    - punish tunnel vision
    - justify hook claw and anti-air
  counters:
    - hook_claw
    - shock_pistol
    - railgun_angle
    - hacked_lightning_gutter
```

## 8.3 Vertical pursuers

```yaml
vertical_pursuer:
  examples: [Reflection_Hound, Spark_Jackal]
  role:
    - chase across platforms
    - force clean jumps
  counters:
    - trap routes
    - burrow_uppercut
    - spike bait
```

## 8.4 Stationary route denial

```yaml
route_denial:
  examples: [Bass_Turret, Signboard_Sniper, Drone_Dock]
  role:
    - block easy path
    - encourage hacking
  counters:
    - signal_launcher
    - railgun
    - alternate platform route
```

---

# 9. Advanced fighting skills

## 9.1 Cancel skills

```yaml
cancel_skills:
  jump_cancel:
    trigger: "claw hit"
    effect: "jump out of recovery"
  rocket_cancel:
    trigger: "melee recovery + fuel"
    effect: "burst out of danger"
  rail_recoil_cancel:
    trigger: "rail shot near wall"
    effect: "convert recoil into wall slide"
  hack_cancel:
    trigger: "perfect command"
    effect: "cancel item recovery"
  parry_cancel:
    trigger: "successful parry"
    effect: "immediate katana draw or quick hack"
```

## 9.2 Juggle skills

```yaml
juggle_skills:
  launcher:
    moves: [burrow_uppercut, rising_cut, scatter_coil]
  sustain:
    moves: [hook_claw, shock_pistol, rail_tap]
  finisher:
    moves: [falling_moon, rail_pierce, terminal_overload]
```

Juggle design rule:

> Juggles should be stylish against weak enemies, useful against elites, and limited against bosses.

## 9.3 Trap combo skills

```yaml
trap_combo_examples:
  wet_gutter_chain:
    setup: "enemy on wet floor"
    action: "railgun exposed wire"
    result: "electric arc hits group"

  falling_sign_combo:
    setup: "enemy under neon sign"
    action: "hack sign bolt or railgun bracket"
    result: "sign falls as platform hazard"

  crusher_bait:
    setup: "heavy enemy charges"
    action: "dodge under crusher, hack freeze release"
    result: "crusher stuns heavy"

  speaker_pop:
    setup: "group near speaker"
    action: "downbeat hack"
    result: "bass pulse launches group"
```

---

# 10. Gun + melee + hacking combo language

The best combat should sound like a sentence.

```text
parry -> katana draw -> rail reload -> terminal burst
jump -> falling claw -> hook drone -> lightning route
rocket over -> scatter coil -> wall scratch -> hack camera
```

## Combo grammar

```yaml
combo_grammar:
  openers:
    - claw_parry
    - rail_mark
    - rocket_entry
    - trap_bait
    - quick_hack
  linkers:
    - jump_cancel
    - hook_claw
    - perfect_reload
    - syntax_parry
    - companion_assist
  finishers:
    - katana_draw
    - rail_pierce
    - terminal_overload
    - lightning_route
    - falling_moon
```

---

# 11. Training mode requirements for these systems

Training mode must allow testing:

```yaml
training_tests:
  melee:
    - claw_range_visualizer
    - parry_window_meter
    - katana_draw_timing
    - combo_damage_counter
  guns:
    - rail_reload_sweetspot_meter
    - recoil_distance_display
    - projectile_hitbox_overlay
  hacking:
    - terminal_range_overlay
    - syntax_window_display
    - hack_cooldown_timer
    - environment_target_lines
  traps:
    - trap_owner_state_toggle
    - trap_damage_numbers
    - trap_trigger_radius
  enemies:
    - enemy_state_label
    - force_enemy_state
    - freeze_enemy
    - dummy_invincible
```

---

# 12. Concrete next vertical slice

To prove this combat model, build one arena:

```yaml
vertical_slice_arena:
  name: Lower Sprawl Transformer Alley
  includes:
    platforms:
      - flat ground
      - one upper platform
      - one ceiling cable
      - one wet gutter
    enemies:
      - toll_rat
      - cable_crawler
      - signboard_sniper
      - drone_wasp
    traps:
      - exposed_wire
      - falling_neon_sign
      - hackable_camera
      - exploding_terminal
    player_tools:
      - claws
      - railgun
      - rocket_backpack
      - quick_hack
    required_combos:
      - claw_parry_basic_enemy
      - railgun_drop_neon_sign
      - hack_terminal_explosion
      - wet_gutter_lightning_chain
```

Acceptance criteria:

```yaml
acceptance_criteria:
  - player can clear arena using only claws and movement
  - player can clear arena faster using railgun and traps
  - player can clear arena stylishly using hacking/environment combos
  - every enemy has at least two valid counters
  - every trap can hurt player before hacking and help player after hacking
  - debug overlay shows hitboxes, hack ranges, and trap ownership
```

---

# 13. Design mantra

```text
Claws teach timing.
Swords teach spacing.
Guns teach distance.
Traps teach terrain.
Hacking teaches systems.

The master player does not choose between fighting and hacking.
The master player fights by hacking and hacks by fighting.
```
