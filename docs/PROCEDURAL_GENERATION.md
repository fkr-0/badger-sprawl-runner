# Procedural Dungeon and Mob Generation Design

This document designs an optional procedural layer for **Badger Sprawl Runner**. The goal is not to turn story mode into a fully random roguelike. The goal is to add replayable, Diablo-II-like variation to enemy packs, micro-dungeons, side rooms, ambushes, and post-campaign runs while preserving authored Brechtian story beats.

## Design goals

```yaml
procedural_generation_goals:
  preserve_authored_campaign:
    - placards, heist payloads, dialogue choices, boss contracts, and debriefs remain authored
    - procedural content fills optional routes, side jobs, challenge rooms, and replay variants
  enemy_first_randomness:
    - procedural identity is mostly expressed through mob packs, elites, affixes, hazards, and room pressure
    - geometry varies enough to change positioning decisions without hiding required story objects
  deterministic_replay:
    - every run has a seed
    - seed plus stage id plus ruleset version reproduce layout/mob decisions
  readable_difficulty:
    - the player can understand why a pack is dangerous from enemy silhouettes, affix labels, VFX, and HUD warnings
  cyberpunk_story_fit:
    - randomness is framed as city systems, debt markets, security contracts, pirate-radio interference, and corporate dispatch
```

## Where procedural generation fits

Procedural elements should be opt-in per stage and per mode.

```yaml
modes:
  story_mode:
    procedural_scope: limited
    allowed:
      - optional side rooms
      - ambush pack composition
      - elite affixes on non-boss enemies
      - loot/pickup placement around non-critical routes
      - minigame pressure variants
    forbidden:
      - changing required heist payload identity
      - moving story-critical dialogue trigger off the golden path
      - replacing named boss phase order
      - blocking route completion with random keys
  arcade_replay:
    procedural_scope: medium
    allowed:
      - stage route chunks
      - enemy pack tables
      - elite/champion packs
      - reward room variants
      - boss modifier overlays
  endless_sprawl_or_dungeon:
    procedural_scope: high
    allowed:
      - room graph generation
      - escalating floors
      - random minibosses
      - procedural vendors
      - faction/mob-family rotations
```

## Diablo-II-inspired enemy model

The core Diablo-II-like part should be **mob generation**, not only map generation. Each generated encounter is a pack with a family, role composition, rank, affixes, density, and reward budget.

```yaml
encounter_pack:
  seed: string
  stage_id: RuntimeStageId
  family: EnemyFamily
  rank: normal | champion | elite | unique | boss_support
  budget: number
  density: sparse | standard | swarm | duel
  roles:
    - bruiser
    - skirmisher
    - ranged
    - summoner
    - shield
    - trapper
  affixes:
    - name: static_aura
      telegraph: blue ring + buzzing speakers
      effect: periodic small EMP pulse
    - name: debt_shield
      telegraph: receipt halo
      effect: absorbs first hit until parried
    - name: fast_route
      telegraph: orange leg trails
      effect: movement speed bonus
    - name: knife_cloud
      telegraph: orbiting knife sprites
      effect: proximity chip damage
    - name: mirror_counter
      telegraph: mirror flash
      effect: brief counter/parry window
  rewards:
    - credchips
    - blueprint_shard_chance
    - temporary_discount_token
    - side_quest_progress
```

### Enemy families

```yaml
enemy_families:
  toll_authority:
    stages: [lower-sprawl, orbital-lift]
    story_logic: street rent, access gates, toll enforcement
    base_roles: [shield, bruiser, trapper]
    sample_units:
      - tollbooth_deputy
      - meter_bailiff
      - turnstile_guard
  drainmarket_knives:
    stages: [drainmarket]
    story_logic: privatized injury market and knife-drone protection rackets
    base_roles: [skirmisher, ranged, swarm]
    sample_units:
      - knife_drone
      - clinic_collector
      - price_tag_wasp
  arcology_security:
    stages: [chrome-arcology, mirror-palace]
    story_logic: luxury policing and contract etiquette
    base_roles: [ranged, shield, trapper]
    sample_units:
      - lobby_sentinel
      - elevator_bouncer
      - banquet_reflector
  pirate_static:
    stages: [antenna-barrens, asteroid-redoubt]
    story_logic: hostile broadcast terrain and signal parasites
    base_roles: [summoner, ranged, trapper]
    sample_units:
      - static_mast_imp
      - ledger_ghost
      - antenna_saboteur
  cargo_union_pressure:
    stages: [dub-colony, orbital-lift, asteroid-redoubt]
    story_logic: exploited cargo crews, redirected logistics, collective action
    base_roles: [bruiser, support, swarm]
    sample_units:
      - crate_brute
      - lift_chain_worker
      - chorus_shieldhand
```

## Dungeon / route generation model

Use a **room-graph plus authored anchors** model. Each stage has fixed anchors, and procedural rooms fill optional or replay paths.

```yaml
stage_generation_graph:
  anchors:
    start: fixed
    payload_room: fixed_or_bounded
    boss_gate: fixed
    exit_or_debrief_trigger: fixed
  generated_nodes:
    - traversal_room
    - enemy_pack_room
    - vendor_or_rest_room
    - side_quest_room
    - minigame_room
    - reward_room
  edges:
    critical_path:
      min_rooms: 3
      max_rooms: 7
      may_branch: false
    optional_branches:
      min_rooms: 1
      max_rooms: 4
      may_branch: true
      reward_bias: high
```

### Room chunk contract

A room chunk should be data-only and reusable. The runtime can later assemble these into `StageLayout`.

```yaml
room_chunk:
  id: drainmarket_clinic_crossing_01
  stage_tags: [drainmarket, clinic, melee_training]
  width: 640
  height: 360
  sockets:
    left: ground
    right: ground
    top: vent
    bottom: sewer
  platform_archetype: staggered
  hazard_tags: [knife_lane, price_board]
  encounter_slots:
    - id: entry_pack
      x: 220
      y: 300
      budget: 3
      allowed_roles: [skirmisher, ranged]
    - id: pressure_pack
      x: 460
      y: 260
      budget: 5
      allowed_roles: [trapper, skirmisher]
  pickup_slots:
    - kind: optional_consumable
      x: 380
      y: 210
  constraints:
    - no_required_payload
    - reachable_without_rocket
    - camera_safe
```

## Generation pipeline

```yaml
generation_pipeline:
  1_seed_context:
    input:
      - campaign_stage_id
      - mode
      - run_seed
      - story_progress
      - heat
      - dub_favor
      - branch_consequences
  2_select_ruleset:
    output:
      - stage_generation_profile
      - enemy_family_weights
      - room_chunk_pool
  3_build_room_graph:
    output:
      - ordered critical path
      - optional branch graph
      - anchor placement
  4_place_rooms:
    output:
      - platforms
      - camera bounds
      - exits
      - sockets
  5_generate_encounters:
    output:
      - mob packs
      - elite affixes
      - pack telegraphs
  6_place_rewards:
    output:
      - pickups
      - currency
      - side quest progress objects
  7_validate_layout:
    checks:
      - all critical anchors reachable
      - no impossible jump gaps
      - no critical pickup inside random hazard-only room
      - enemy density within performance budget
  8_materialize_stage_layout:
    output:
      - StageLayout
      - generation_manifest for debug/replay
```

## Enemy generation details

### Encounter budget

Each enemy and affix has a cost. Stage heat and branch choices can raise the budget.

```yaml
budget_formula:
  base: stage_profile.base_pack_budget
  heat_bonus: floor(orbit_heat / 2)
  branch_bonus:
    ambush_warning_overlay: +1 but pre-telegraphed
    companion_assist_delay: +1
    naya_shield_bonus: +1 allowed because player has mitigation
  side_room_bonus: +2
  champion_multiplier: 1.5
```

### Rank ladder

```yaml
pack_ranks:
  normal:
    affix_count: 0
    label: none
    reward_multiplier: 1
  champion:
    affix_count: 1
    label: blue title
    reward_multiplier: 1.4
  elite:
    affix_count: 2
    label: gold title
    reward_multiplier: 2
  unique:
    affix_count: 2
    custom_name: true
    fixed_story_hint: optional
    reward_multiplier: 3
```

### Affix rules

Affixes should be composable but bounded. Avoid unfun combinations.

```yaml
affix_rules:
  max_affixes_per_pack: 2
  forbidden_pairs:
    - [fast_route, knife_cloud]
    - [debt_shield, mirror_counter]
  role_requirements:
    static_aura: [ranged, summoner, trapper]
    debt_shield: [shield, bruiser]
    mirror_counter: [skirmisher, shield]
  telegraph_required: true
  sprite_requirements:
    - icon
    - aura_vfx
    - hit_reaction_tag
```

## Data contracts to add later

```yaml
new_data_files:
  data/procgen/enemy-families.json:
    purpose: enemy family pools, role weights, unit costs
  data/procgen/affixes.json:
    purpose: affix costs, telegraphs, forbidden pairs
  data/procgen/stage-profiles.json:
    purpose: per-stage procedural room and pack rules
  data/procgen/room-chunks.json:
    purpose: reusable room chunk graph nodes
  data/procgen/generation-presets.json:
    purpose: story/replay/endless difficulty presets
```

## Runtime systems to add later

```yaml
systems:
  SeededRng:
    responsibility: deterministic random stream split by domain
  RoomGraphGenerator:
    responsibility: critical path and optional branch graph
  RoomChunkAssembler:
    responsibility: socket-compatible room placement and platform merging
  EncounterGenerator:
    responsibility: mob pack selection, role composition, rank, affixes
  EnemyAffixSystem:
    responsibility: apply affix behavior during combat step
  ProceduralStageBuilder:
    responsibility: convert generation manifest to StageLayout
  ProcgenDebugOverlay:
    responsibility: display seed, pack budget, rooms, validation failures
```

## First implementation milestone

Start with enemy generation before full dungeon generation.

```yaml
milestone_1_enemy_pack_generator:
  scope:
    - data/procgen/enemy-families.json
    - data/procgen/affixes.json
    - EncounterGenerator unit tests
    - StageRunScene optional generatedEnemyPacks option
  output:
    - deterministic enemy packs per stage id and seed
    - champion/elite affix labels in HUD/renderer
    - no geometry generation yet
  reason:
    - gives the Diablo-II feeling fastest
    - low risk to authored level flow
    - reuses existing StageLayout and CombatEntity runtime
```

## Second implementation milestone

```yaml
milestone_2_side_room_generator:
  scope:
    - room chunks for optional side rooms only
    - generated optional branches off the stage registry layout
    - validation for reachability and camera bounds
  output:
    - replayable side rooms without breaking story route
```

## Third implementation milestone

```yaml
milestone_3_endless_sprawl:
  scope:
    - fully generated room graph
    - escalating floor budget
    - procedural vendors
    - unique enemy names and modifiers
  output:
    - Diablo-style replay mode separate from authored story
```

## Open design decisions

```yaml
open_questions:
  - Should procgen be unlocked after finishing story stage once, or available immediately as remix mode?
  - Should unique elites get generated names from story vocabulary?
  - Should affix icons live in item_icons or a new enemy_affix_icons sheet?
  - Should room chunks be authored in JSON or generated from TypeScript builders first?
  - Should endless mode preserve Brechtian placards as random public-service announcements?
```
