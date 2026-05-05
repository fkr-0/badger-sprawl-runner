# Hacking Is Fighting

## Core thesis

The strongest identity of Badger Sprawl Runner is not “platformer plus hacking minigames”.
The strongest identity is:

> fighting, hacking, typing, parrying, reloading, and manipulating the environment all become one coherent skill language.

The player should feel that a good hacker is not someone who pauses the action to solve a detached puzzle. A good hacker is someone who reads timing, syntax, enemy state, and world state while moving.

## The one-skill-language model

```text
combat timing       == input timing
parry correctness   == syntax correctness
reload discipline   == typing rhythm
boss phase reading  == code-state reading
environment hacking == remote battlefield manipulation
````

## Mechanical equivalences

| Combat action          | Hacking equivalent          | Shared player skill      |
| ---------------------- | --------------------------- | ------------------------ |
| Railgun perfect reload | timed command submit        | rhythm, anticipation     |
| Claw parry window      | syntax correctness window   | precision under pressure |
| Katana draw slash      | successful exploit chain    | staged execution         |
| Boss armor phase       | code state transition       | reading systems          |
| Enemy telegraph        | terminal prompt             | pattern recognition      |
| Dodge cancel           | command abort / rollback    | recovery discipline      |
| Rocket burst           | privilege escalation burst  | high-risk repositioning  |
| Combo finisher         | command pipeline completion | sequencing               |

## Railgun perfect reload ≈ typing timing

The railgun should teach the same skill as fast command entry.

```yaml
rail_reload:
  phases:
    fired:
      duration_ms: 120
      state: recoil
    cooling:
      duration_ms: 420
      state: cannot_reload
    sweet_spot:
      duration_ms: 90
      state: perfect_reload_available
    late:
      duration_ms: 350
      state: normal_reload
  perfect_result:
    - next_shot_pierces
    - emp_spark_on_hit
    - terminal_hack_charge_plus_one
  late_result:
    - normal_shot
  missed_result:
    - longer_reload
    - heat_meter_plus_small
```

Typing gates reuse this rhythm:

```yaml
typing_gate:
  prompt: "unlock --gate drain-7 --silent"
  submit_window:
    perfect: "submit within final 15% of beat marker"
    normal: "submit correctly outside perfect window"
    failed: "wrong syntax or timeout"
  rewards:
    perfect:
      - lower_heat
      - empower_next_rail_shot
    normal:
      - open_gate
    failed:
      - spawn_enemy_or_raise_alarm
```

## Parry window ≈ syntax correctness

A parry is a physical syntax check.

```yaml
parry_as_syntax:
  enemy_attack:
    telegraph: "red flash / command glyph"
    valid_response: "melee during active syntax window"
    invalid_response:
      early: "whiff; recovery punish"
      late: "take damage"
      wrong_button: "guard breaks"
  syntax_gate:
    telegraph: "prompt token glow"
    valid_response: "correct token before cursor collapses"
    invalid_response:
      early: "partial command rejected"
      late: "timeout"
      wrong_token: "alarm"
```

Design rule:

> If the player can learn a parry, they can learn a command gate.
> If the player can learn a command gate, they can learn a boss phase.

## Boss phases ≈ code states

Bosses should expose state machines visually.

Example boss: Black-Ice Fox.

```yaml
black_ice_fox:
  states:
    scan:
      visual: "fox circles, terminal eyes flicker"
      player_read: "prepare to dodge malformed packets"
    inject:
      visual: "three command glyphs appear"
      player_read: "choose/parry valid syntax"
    execute:
      visual: "fox lunges or terminal explodes"
      player_read: "punish if syntax was correct"
    rollback:
      visual: "fox glitches backward"
      player_read: "railgun pierce window"
```

Boss UI should not hide the state machine. It should stylize it:

```text
[SCAN] -> [INJECT] -> [EXECUTE] -> [ROLLBACK]
```

This fits the Brechtian structure: the machinery is visible.

## Environment manipulation through the matrix

At higher Cortex/Voltage/Bass skill levels, Moss becomes able to manipulate the battlefield at distance.

This is not generic magic. It is hacking urban infrastructure.

## Environment hack targets

| Target          | Low-level effect    | Advanced effect                 | Counterplay / cost             |
| --------------- | ------------------- | ------------------------------- | ------------------------------ |
| Terminal        | opens gate          | explodes near enemies           | raises heat if overused        |
| Street lamp     | brief light flicker | lightning strike on weak enemy  | needs charged capacitor        |
| Security camera | disables detection  | marks enemies for railgun chain | camera must have line of sight |
| Drone dock      | pauses drone spawn  | turns dock into friendly turret | requires code gate             |
| Speaker stack   | pushes enemies      | beat-synced shockwave           | stronger with Bass stat        |
| Vending machine | drops heal/coin     | launches electrified cans       | costs credchips or guile check |
| Elevator panel  | opens route         | crushes heavy enemy with lift   | cooldown, telegraph required   |
| Neon sign       | distraction         | falls as area hazard            | one-time use                   |
| Rain gutter     | slippery terrain    | conducts lightning arc          | requires wet environment       |
| Antenna mast    | reveals map         | orbital spark strike            | high Cortex + Voltage          |

## Matrix powers progression

```yaml
matrix_power_tiers:
  tier_0:
    name: Street Senses
    unlock: campaign_start
    powers:
      - highlight usable terminals
      - see enemy alert lines
  tier_1:
    name: Remote Tap
    unlock: cortex_2
    powers:
      - open simple doors at distance
      - short-circuit weak cameras
  tier_2:
    name: Combat Script
    unlock: cortex_4_or_black_ice_tooth
    powers:
      - stun weak drones
      - trigger exploding terminals
      - turn one hazard against enemies
  tier_3:
    name: Weather Root
    unlock: voltage_4_plus_cortex_5
    powers:
      - lightning strike weak or marked enemies
      - chain lightning through wet floors
      - overload railgun shot through infrastructure
  tier_4:
    name: Choir Root
    unlock: final_world_plus_high_rebel_trust
    powers:
      - crowd-assisted environment hacks
      - multi-terminal boss phase rewrite
      - final broadcast system manipulation
```

## Remote lightning strike

A high-level hacker fantasy: Moss marks a weak enemy, routes power through the district, and calls a lightning-like discharge from infrastructure.

```yaml
power:
  id: matrix_lightning
  fantasy: "strike distant weak enemies through hacked city infrastructure"
  requirements:
    stats:
      cortex: 5
      voltage: 4
    resource:
      tempo: 2
      heat_cost: 1
    target_conditions:
      - enemy_rank in [weak, standard]
      - enemy_is_marked or standing_near_conductor
      - environment_has_power_source
  effects:
    primary:
      damage: high_vs_weak
      stun: 1.2s
      visual: "thin white-green city-lightning arc"
    secondary:
      chain_to_wet_targets: true
      explode_terminal_if_adjacent: true
  restrictions:
    - cannot delete sub-bosses instantly
    - bosses only lose shield/armor nodes
    - repeated use raises district heat
    - some enemies carry grounding rods
```

## Exploding terminals

Terminals become combat objects once the player learns that hacking is fighting.

```yaml
power:
  id: terminal_overload
  requirements:
    cortex: 3
    nearby_terminal: true
  input:
    mode: quick_command
    example_commands:
      - "overload"
      - "burst"
      - "arc left"
  effects:
    normal:
      - radial_damage
      - smoke_screen
    perfect:
      - radial_damage
      - emp_stun
      - heat_refund_if_no_civilians_nearby
    failed:
      - terminal_locks
      - alarm_heat_plus_one
```

## Input model for combat hacks

The player should not open a slow menu during combat unless in accessibility/easy mode.

```yaml
combat_hack_input:
  quick_hack:
    button: hack_tap
    behavior: "auto-target nearest valid infrastructure"
  aimed_hack:
    button: hack_hold
    behavior: "slow focus aim cone; choose terminal/camera/lamp"
  command_hack:
    button: hack_plus_direction
    behavior: "small 1-3 token command challenge"
  accessibility_option:
    tactical_pause: optional
```

## Three-layer battlefield reading

Every fight should be readable at three levels:

```yaml
battlefield_layers:
  body:
    examples:
      - enemy attack telegraph
      - jump distance
      - melee range
  machine:
    examples:
      - terminal state
      - camera line
      - door lock
      - power cable
  code:
    examples:
      - prompt token
      - boss state
      - hack cooldown
      - syntax window
```

The player improves by seeing more layers at once.

## Stat integration

```yaml
stat_scaling:
  cortex:
    - longer hack windows
    - more visible code states
    - more forgiving syntax correction
    - unlocks remote manipulation
  voltage:
    - stronger EMP and lightning effects
    - railgun/environment chains
    - better drone disruption
  bass:
    - sync hacks to beat
    - speaker-stack manipulation
    - crowd/companion resonance
  guile:
    - spoof enemy authorization
    - reduce heat from illegal hacks
    - merchant discounts for hack tools
  velocity:
    - hack while moving
    - shorter slowdown penalty
  sinew:
    - melee parry can inject simple commands into enemies
```

## Example integrated encounter

```text
Room: Lower Sprawl transformer alley

1. Two crawlers patrol below a flickering neon sign.
2. A drone watches from a camera dock.
3. A terminal sits behind a short jump.
4. Player has three options:

   direct combat:
     jump in, claw/parry crawlers, railgun drone

   hybrid:
     railgun drone, perfect reload, overload terminal, slash survivor

   hacker-fighter:
     quick-hack camera -> mark drone
     parry crawler -> gain tempo
     submit "arc sign" on beat
     neon sign explodes downward
     lightning chains through wet gutter
```

The best route is not merely safest. It is stylish, systemic, and teachable.

## Enemy resistance model

```yaml
enemy_hack_resistance:
  weak:
    examples: [crawler, basic_drone, camera_mite]
    remote_kill: allowed_if_setup
  standard:
    examples: [lancer, turret, fox_light]
    remote_kill: rare
    remote_stun: common
  elite:
    examples: [sub_boss, captain, mirror_guard]
    remote_kill: never
    remote_stun: conditional
    armor_node_damage: allowed
  boss:
    remote_kill: never
    phase_transition_manipulation: allowed
    shield_break: allowed
    dialogue_state_change: allowed
```

## Balance constraints

```yaml
constraints:
  - remote hacks must not make movement/combat obsolete
  - powerful hacks need setup: mark, conductor, terminal, tempo, or risk
  - weak enemies can be cleared stylishly by matrix powers
  - bosses can be weakened or phase-shifted, not skipped
  - high-level hacks raise heat unless performed cleanly
  - environment kills must telegraph to avoid visual confusion
  - training mode must expose hack hitboxes/ranges/cooldowns
```

## UI requirements

```yaml
ui:
  hackable_objects:
    idle: "small dim glyph"
    in_range: "soft outline"
    target_locked: "clear bracket"
    dangerous_overload: "warning pulse"
  boss_code_state:
    display: "small visible state strip"
    example: "[SCAN] -> [INJECT] -> [EXECUTE]"
  command_prompt:
    max_tokens: 3
    position: "near target, not full-screen"
  accessibility:
    option_tactical_pause: true
    option_slow_command_windows: true
    option_disable_typing_minigames: false
    alternative_to_typing: "token selection / rhythm input"
```

## Design mantra

```text
A claw parry is a syntax check.
A rail reload is a command submit.
A boss phase is a state machine.
A city is a circuit.
A rebellion is a distributed system.
```

