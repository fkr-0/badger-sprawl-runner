# Badger Sprawl Runner — Persistent Adventure Pivot

```yaml
status: design-review
date: 2026-07-23
scope:
  - genre-positioning
  - persistent-world structure
  - campaign and travel model
  - progression, economy, loot, quests, and services
  - melee, stealth, traps, hacking, and encounter balance
  - implementation roadmap
non_goal:
  - replacing the existing movement, platforming, combat, rendering, or animation work
```

## Executive recommendation

The proposed adventure shift is **strongly compatible** with the current game. It does not require replacing the mechanical core. It requires replacing and extending the shell that currently delivers that core.

The best target is not a top-down action RPG, not a seamless metroidvania, and not a fully random roguelike. The recommended form is:

> **A persistent, node-based, side-scrolling action-adventure RPG in which authored settlements, routes, strongholds, and underground spaces are connected by an expanding transit network.**

Moment-to-moment play remains the current 2D platforming-combat-hacking game. The player still runs, jumps, wall-routes, parries, shoots, hacks, manipulates traps, and fights through readable side-view spaces. The genre shift happens one layer above this:

```text
current delivery
  title/menu
    -> briefing
      -> self-contained stage run
        -> boss/payload
          -> debrief
            -> next stage

recommended delivery
  current persistent location
    -> talk, trade, repair, train, investigate
      -> choose a destination or quest
        -> travel through connected 2D routes
          -> enter encounter, stronghold, dungeon, or story scene
            -> alter the destination's persistent state
              -> return, continue onward, or take transit elsewhere
```

The existing game already contains most of the required vocabulary: campaign choices, side quests, dialogue portraits, shops, a skill tree, inventories, equipment sets, drops, crafting, checkpoints, companions, hacking, traps, procedural enemy packs, generated side rooms, and an eight-chapter story. The major missing system is a single persistent world model that binds those features together.

The practical consequence is:

```yaml
reuse_estimate:
  movement_platforming_rendering: "very high; preserve almost entirely"
  combat_and_items: "high; tune and integrate rather than replace"
  authored_story_content: "high; redistribute across places and visits"
  progression_subsystems: "medium-high; consolidate and persist"
  current_campaign_navigation: "low; this is the primary redesign area"
  current_hub_and_shop_scenes: "prototype value only; replace with spatially grounded versions"

confidence:
  mechanical_reuse: high
  exact_content_cost: medium
  final_balance_cost: uncertain_until_vertical_slice
```

## Core thesis: from run-centric delivery to persistent place-centric adventure structure

This distinction is not primarily about camera direction, combat style, or whether a game has experience points. It describes what the player understands the **world** to be.

### What “run-centric” means here

In a run-centric structure, the main unit of play is a bounded attempt.

```text
prepare
  -> enter challenge
    -> survive / complete objective
      -> receive result and rewards
        -> reset or select the next challenge
```

The stage is important while the run is active. After completion, it mostly becomes a result in the save file: completed, scored, unlocked, or available for replay. The player may have permanent upgrades, but the places themselves are not normally where ongoing life happens.

Badger Sprawl Runner currently expresses this in several ways:

- `GameFlow` moves through title card, briefing, stage, debrief, and then the next campaign node.
- `StageRunScene` owns a complete gameplay session and dispatches a stage-complete result.
- rewards are mainly granted at stage or objective completion;
- the current story presents each district as a large chapter-stage;
- the hub and shop exist as separate prototype scenes rather than as places through which the player physically moves;
- the save records campaign completion, choices, currencies, skills, and payloads, but not a living location graph.

This structure is not bad. It is clear, testable, replayable, and well suited to a platform action game. It also explains why the existing mechanics feel coherent: each stage can be tuned as a complete dramatic and mechanical arc.

### What “place-centric” means

In a place-centric adventure, a route or settlement is not merely the container for one mission. It exists before, during, and after that mission.

The player develops a mental map of places and relationships:

```text
Lower Sprawl safehouse
  ├─ Auntie Subharmonic changes dialogue after the toll revolt
  ├─ Murr Murrby opens a different stock after the clinic quest
  ├─ an abandoned tunnel becomes a subway entrance
  └─ the old toll route remains explorable after Captain Grin falls

Drainmarket
  ├─ clinic services depend on camera sabotage
  ├─ a faction controls the knife-drone docks
  ├─ a side route opens after acquiring a climbing skill
  └─ later story events alter patrols and prices
```

The player's progress is experienced as **change in the world**, not only change in the character sheet.

A place-centric save therefore answers questions the current save does not yet need to answer:

- Where is Moss now?
- Which transit stations are open?
- Which route exits have been discovered?
- Which NPCs are present, absent, allied, hostile, or relocated?
- Which services are available in each settlement?
- Which local hazards, patrols, doors, shortcuts, and bosses have changed permanently?
- Which quests are offered, active, failed, resolved, or waiting for a later story phase?
- Which repeatable spaces have been repopulated or procedurally remixed?

### The deepest difference: missions stop being the world

In a run-centric game, the player generally chooses a mission and the game constructs or loads the space needed by that mission.

In a place-centric game, the player chooses where to go. Missions are reasons to visit, interpret, or transform places that already belong to the world.

That changes the grammar of the game:

```text
run-centric statement:
  "Start the Lower Sprawl mission."

place-centric statement:
  "Take the Toll Line to Lower Sprawl, ask Auntie about the missing meter crew,
   then use the reopened drain route to reach the old toll office."
```

Both statements may eventually load the same platform geometry and combat systems. The difference is what that geometry means and how it connects to everything around it.

### Persistence has several layers

“Persistent” should not be interpreted as “everything remains exactly where it was forever.” Useful persistence is selective.

```yaml
persistence_layers:
  character:
    examples: [level, skills, equipment, inventory, money, relationships]
  narrative:
    examples: [main-story phase, choices, companion arcs, faction outcomes]
  location:
    examples: [shortcuts, station access, defeated named enemies, repaired services]
  encounter:
    examples: [cleared room, hacked turret, opened chest]
  simulation:
    examples: [ordinary patrol respawn, shop restock, procedural contract refresh]
```

The recommended design makes the first three durable. Encounter persistence is used for authored consequences and meaningful shortcuts, not every broken crate. Simulation elements may reset when the player travels or rests.

### The current mechanics live below the genre shift

The existing systems operate mainly at two lower levels:

```text
world layer         places, transit, story phases, settlements       <- redesign
expedition layer    route purpose, rewards, recovery, return path    <- extend
encounter layer     enemies, traps, hacks, objectives, bosses        <- preserve/expand
action layer        movement, jumping, attacks, parries, shooting    <- preserve
```

This is why the shift can be substantial in player experience without invalidating the mechanical work. The game can feel like a different genre because the top two layers change, even while the bottom two remain recognizable.

## The genre spectrum and possible settlement points

The design does not need to jump from “runner” to “open-world RPG.” There are useful intermediate structures.

### Position A — linear action campaign with menus

```yaml
shape: "current direction"
world_model: "ordered chapter stages"
advantages:
  - lowest implementation risk
  - strongest stage pacing
  - easiest balancing and testing
costs:
  - settlements feel like menus or cutscenes
  - little sense of travel or inhabited world
  - quests and services remain secondary interfaces
```

This is mechanically effective but does not satisfy the desired adventure identity.

### Position B — mission-hub action RPG

```yaml
shape: "one persistent central hub plus selected missions"
world_model: "hub is a place; field areas remain bounded runs"
advantages:
  - modest redesign
  - NPCs and services gain personality
  - supports story unfolding between missions
costs:
  - world still feels dispatched from a lobby
  - travel is mostly cosmetic
  - remote towns and hideouts are difficult to make equally meaningful
```

This would be a safe first step, but it would underuse the proposed subway, multiple towns, and regional story changes.

### Position C — persistent node-world side-scrolling adventure

```yaml
shape: "recommended target"
world_model: "settlements, routes, strongholds, and dungeons form a travel graph"
advantages:
  - strong sense of place without requiring one seamless map
  - reuses existing stage loading and side-view geometry
  - supports towns, hideouts, quests, services, revisits, and travel
  - authored story and optional procgen can coexist cleanly
  - implementation can proceed district by district
costs:
  - requires a new world/save/quest layer
  - requires re-entry rules and local-state authoring
  - economy and encounter rewards must support several play styles
```

This is the preferred midpoint.

### Position D — fully interconnected metroidvania-like world

```yaml
shape: "large seamless or near-seamless side-view map"
world_model: "continuous geography with ability-gated backtracking"
advantages:
  - maximum spatial continuity
  - traversal skills naturally unlock old routes
costs:
  - extensive level and camera re-authoring
  - story pacing becomes harder
  - fast travel, save, respawn, streaming, and world reset rules grow complex
  - risks making authored districts feel like one giant obstacle course
```

Some metroidvania principles are useful—shortcuts, ability-gated optional paths, meaningful revisits—but the fully continuous form is not recommended.

### Position E — open procedural action RPG

This would place random dungeons, loot, and repeatable combat at the center. The current procedural work can support such a mode, but making it the main campaign would weaken authored political drama, character continuity, and readable place identity.

## Recommended identity

Working genre description:

> **A side-scrolling expedition RPG and action-adventure with precision platforming, systemic combat, stealth-hacking, persistent districts, and an authored rebellion story.**

Reference ideas should be separated by layer rather than copied wholesale:

```yaml
reference_functions:
  secret_of_mana:
    borrow: [town-to-field rhythm, services, companions, journey, epic escalation]
    do_not_borrow: [top-down movement, party combat assumptions]
  souls_like_action:
    borrow: [telegraph clarity, commitment, poise, meaningful recovery, dangerous elites]
    do_not_borrow: [mandatory stamina slowdown, corpse-run imitation, universal grim tone]
  immersive_stealth:
    borrow: [awareness states, alternate routes, distractions, environmental control]
    do_not_borrow: [slow crouch-only pacing, giant simulation scope]
  diablo_like_progression:
    borrow: [build identity, enemy families, bounded affixes, optional dungeons]
    do_not_borrow: [constant gear replacement, inventory flood, damage-number inflation]
  metroidvania:
    borrow: [shortcuts, ability-gated secrets, revisits]
    do_not_borrow: [one enormous continuous world requirement]
```

## Current design alignment

### Already aligned in design documents

The original `docs/DESIGN.md` core loop already contains:

- route scouting;
- fighting or evading guards;
- hacking and alternate paths;
- payload, rescue, and relay objectives;
- loot spending at shops;
- blueprints and boons carried forward;
- faction favor and safehouses.

`docs/GAME_LOGIC.md` already describes a state flow with:

```text
ColonyHub
  -> DialogueScene
  -> ShopScene
  -> SkillTreeScene
  -> MissionBriefing
  -> StageRun
```

It also defines companion trust, branching dialogue, merchants, multiple endings, story flags, and seven character attributes.

`docs/HACKING_IS_FIGHTING.md` is especially compatible with the pivot. Its three-layer battlefield model—body, machine, and code—provides the systemic foundation for tactical, non-melee solutions.

`docs/PROCEDURAL_GENERATION.md` already makes the correct high-level decision: authored story anchors remain fixed, while procedural generation belongs in optional routes, side rooms, enemy packs, replay modes, and post-campaign dungeons.

### Already aligned in runtime code

The repository contains more than prototypes of basic movement and combat. Relevant implemented or partially implemented systems include:

```yaml
campaign_and_story:
  - GameFlow with campaign choices and persistent result flags
  - StoryFlowScene with briefings, debriefs, branch recaps, and autosave
  - eight runtime chapter-stages
  - side-quest definitions and stage objective systems
  - companion modifiers and branch consequences

progression_and_economy:
  - four large skill disciplines with ranked nodes
  - credchips, blueprint shards, favor, and heat
  - shop pricing influenced by heat and favor
  - inventory, equipment, set bonuses, sockets, affixes, durability, crafting
  - deterministic item-drop tables

world_and_replay:
  - authored stage layouts and a layout registry
  - checkpoints
  - deterministic encounter generation
  - optional generated side rooms
  - endless mode

combat_and_approaches:
  - frame data and combat timelines
  - melee combos, poise, stagger, targeting, visibility helpers
  - hacking and hackable state
  - trap ownership states
  - environmental hazards
  - stage-specific enemy systems and boss controllers
```

The skill tree already tracks the intended build families:

- hand-to-hand / claw combat;
- ballistics;
- stealth / climbing / acrobatics;
- hacking.

This is direct alignment, not conceptual coincidence.

## Current conflicts and actual rework boundaries

### 1. The live campaign flow is linear and stage-owned

`GameFlow` automatically advances from a completed debrief to the next campaign stage. There is no concept of choosing a world destination, returning to a prior district as part of the canonical flow, or remaining in a settlement between story beats.

Required change:

```text
GameFlow as complete world owner
  -> split into
     StoryDirector      main-plot phases and branch consequences
     WorldDirector      location graph, travel, entry/exit, local state
     QuestDirector      offered/active/resolved quest state
     ExpeditionSession  temporary state for one route/dungeon visit
```

The existing `GameFlow` can initially be wrapped and gradually decomposed; it need not be deleted immediately.

### 2. The colony hub and shop are disconnected prototypes

`ColonyHubScene` and `ShopScene` render menus and placeholder geometry, but their navigation methods do not drive the active scene manager. The shipping path instead routes through the title mode menu and `StoryFlowScene`.

This is useful evidence that the architecture anticipated a hub, but these scenes should not become the final adventure shell by adding more buttons. The final settlements should be small playable side-view spaces with NPC interaction points and doors/services.

### 3. The save model is too small for a persistent world

The current save stores:

- currencies;
- skills and ranks;
- campaign stage completion;
- acquired story payloads;
- result flags and a few major branch choices.

It does not store:

- current location and spawn point;
- discovered locations or transit stops;
- quest log state;
- NPC state and relocation;
- persistent inventory/equipment;
- local shortcuts, service unlocks, or named-world changes;
- character experience and level;
- local faction reputation beyond global favor;
- dungeon seed/history or repeatable contract state.

The save format therefore needs a versioned adventure schema before the content pivot expands.

### 4. Item depth exists, but it is not yet the campaign economy

The repository has sophisticated item subsystems, but the live campaign mostly rewards fixed blueprint shards and a few quest-specific credchips/boons. `ItemDropSystem` is deterministic and tested but is not connected to enemy death in `StageRunScene`. `InventorySystem` is rich but is currently an in-memory runtime object rather than a complete persistent player inventory.

The work is integration and restraint, not invention.

### 5. Stealth is represented in skills but not yet a complete enemy perception model

The skill tree has noise reduction, detection delay, unaware damage, pursuit breaks, camera hijacking, and stealth duration. The runtime has line-of-sight helpers. The base enemy state machine, however, does not yet model suspicion, hearing, investigation, last-known position, communication, or confusion.

This is one of the largest new mechanical systems, but it can be added around the existing combat AI rather than replacing it.

### 6. Hacking and traps are conceptually mature but unevenly integrated

Hacking has quick, aimed, and command modes. Traps support hostile, neutral, hacked, and unstable ownership. However:

- some trap outcomes use `Math.random`, which conflicts with deterministic replay and reproducible saves;
- hack effects are not yet a general world-state transaction system;
- enemy conversion, distraction, communication disruption, and persistent infrastructure changes need shared contracts;
- the final adventure needs all approaches to resolve the same encounter and quest objectives.

### 7. The campaign has two incompatible content scales

The prose campaign bible describes eight worlds with four stages each. The live runtime uses eight large chapter-stages—one per major place.

The pivot should resolve this by treating the eight runtime entries as **districts or regional arcs**, not by immediately committing to 32 full-size linear stages.

Recommended interpretation:

```text
runtime chapter-stage
  becomes district
    ├─ settlement / safe location
    ├─ 2-4 reusable route segments
    ├─ authored main-story stronghold
    ├─ optional side dungeon or service interior
    └─ post-resolution state
```

The detailed 32-stage prose can then supply route names, subzones, local bosses, and quest spaces inside these districts.

## Proposed persistent world topology

### World graph

The world should be a graph of compact side-view locations, not one giant map.

```text
                         Asteroid Redoubt
                                |
                         Orbital Lift Line
                                |
              Antenna Barrens --+-- Dub Colony
                     |                 |
              Mirror Palace      Freight Spur
                     |                 |
              Chrome Arcology -- Drainmarket
                     |                 |
                     +-- Lower Sprawl -+
```

This is illustrative, not a final geographical commitment.

Each graph node has a type:

```yaml
location_types:
  settlement:
    purpose: [npc_conversation, services, story_state, quest_givers]
  safehouse:
    purpose: [save, heal, loadout, skill_tree, companion_selection]
  route:
    purpose: [platforming, patrols, secrets, travel friction]
  stronghold:
    purpose: [authored main quest, boss, permanent state change]
  dungeon:
    purpose: [optional challenge, loot, procgen, repeatable contracts]
  transit:
    purpose: [fast_travel, story encounters, network unlocks]
  interior:
    purpose: [shop, clinic, workshop, dialogue, puzzle]
```

### The subway as more than fast travel

The subway is a strong fit because it explains a node-world naturally and supports both cozy and dangerous scenes.

```yaml
subway_functions:
  navigation:
    - displays discovered stations and line disruptions
    - transports Moss between distant districts
  progression:
    - stations open through story, hacks, repairs, or faction help
    - express lines become late-game shortcuts
  narrative:
    - companion conversations occur during journeys
    - advertisements and placards reflect story changes
    - passengers react to Moss's reputation and prior choices
  gameplay:
    - occasional authored ambushes or inspections
    - maintenance tunnels become dungeons and shortcuts
    - hacked switches create alternate routes
  economy:
    - fares, forged passes, or community travel privileges can express class politics
```

The subway should not charge the player constantly merely to consume money. Early toll pressure can be thematic; later, opening public transit can become a visible success of the rebellion.

### Local story phases

Every major district should have a small state machine.

```yaml
example_lower_sprawl_phases:
  occupied:
    patrols: high
    toll_gates: active
    services: limited
    npc_mood: fearful
  uprising:
    patrols: unstable
    routes: partially_blocked
    npc_mood: mobilized
  liberated_or_compromised:
    patrols: faction_dependent
    toll_gates: destroyed_or_repurposed
    services: expanded
    new_quests: reconstruction_and_consequences
```

This creates persistence without requiring a simulated city.

## Main story and adventure pacing

The existing eight-chapter rebellion arc is suitable for an epic adventure. The pivot should add breathing room and return visits rather than merely adding more plot.

### Three quest layers

```yaml
quest_layers:
  main_story:
    function: "unfold the eight-act rebellion and unlock world regions"
    cadence: "large authored quests with named bosses and irreversible decisions"
  district_arcs:
    function: "develop one place, faction, service, or companion over several visits"
    cadence: "2-5 quests per major district"
  contracts_and_rumors:
    function: "replayable or semi-procedural reasons to revisit routes and dungeons"
    cadence: "short, optional, system-driven"
```

### Story rhythm

```text
arrive in district
  -> encounter local contradiction
    -> meet residents and competing explanations
      -> perform one exploratory or service quest
        -> enter main stronghold
          -> make a consequential choice
            -> see district change
              -> receive a new travel lead
```

The story should not require returning to a central hub after every quest. Some arcs should continue across adjacent regions, and some companions should propose detours while travelling.

### Characters as services and relationships

NPC functions should be attached to characters rather than anonymous menus.

```yaml
service_examples:
  murr_murrby:
    services: [consumables, black_market_items, rumor_purchase]
    progression: "stock and prices respond to heat, favor, and clinic support"
  naya_root:
    services: [armor_repair, defensive_mods, greenhouse_projects]
    progression: "improves safehouses after material quests"
  rook_null:
    services: [hack_training, daemon_loadout, transit_network_scan]
    progression: "opens remote infrastructure options"
  auntie_subharmonic:
    services: [quest_board, music_boons, local_reputation_context]
    progression: "turns safehouse into a political and social center"
```

This makes service unlocks feel like social progress.

## Experience, money, and loot

### Experience should reward resolved situations, not only kills

Direct enemy XP creates a serious balance problem: melee becomes the most profitable approach, while stealth and hacking skip rewards. The correct abstraction is **encounter resolution**.

```yaml
experience_sources:
  discovery:
    examples: [new_station, hidden_route, environmental_secret]
  quest:
    examples: [main_objective, side_quest, companion_arc]
  encounter_resolution:
    examples: [defeat, bypass, deceive, disable, convert, trap, clean_hack]
  mastery:
    examples: [first_elite_defeat, no_alarm_clear, perfect_hack, parry_lesson]
  boss_and_unique:
    examples: [named_enemy, major_state_change]

anti_grind_rules:
  - ordinary respawned enemies grant sharply reduced or no repeated XP
  - first resolution and quest context matter more than raw body count
  - stealth, hacking, and nonlethal solutions grant equivalent progression value
```

Recommended level structure:

```yaml
leveling:
  level_cap_for_main_campaign: "moderate, approximately 20-30; exact value after testing"
  level_rewards:
    - one skill point at defined intervals
    - occasional base-stat choice or loadout capacity
  skill_tree_gate:
    - level or mentor unlocks discipline tiers
    - skill points purchase nodes
  blueprint_shards:
    role: "unlock item blueprints, special techniques, and crafting recipes"
```

This is clearer than using blueprint shards as the only skill currency.

### Economy consolidation

The current four meta values are thematically useful but should not all behave as ordinary money.

```yaml
recommended_economy:
  credchips:
    type: spendable_currency
    uses: [consumables, repairs, common_mods, services, bribes]
  blueprint_shards:
    type: rare_knowledge_resource
    uses: [recipes, unique_skill_unlocks, advanced_tools]
  dub_favor:
    type: relationship_reputation
    uses: [service_access, discounts, support, story_options]
  orbit_heat:
    type: pressure_state_not_currency
    uses: [patrol_strength, inspections, prices, ambushes, story_reactivity]
```

Do not add several more currencies per town. Local reputation may exist as flags or compact meters, but the UI should remain legible.

### Money sources

Enemies may drop credchips or salvage, but not every enemy should behave like a coin container.

```yaml
money_sources:
  - contracts and quest payment
  - stolen corporate caches
  - valuables and salvage sold to merchants
  - elite or officer drops
  - hacking vending, payroll, or toll systems
  - bounties for resolving high-heat patrols
```

This preserves stealth parity: a hacker can steal payroll, a stealth player can loot an office, and a fighter can claim officer salvage.

### Loot philosophy

Use a **curated-loot action RPG**, not a loot flood.

```yaml
loot_layers:
  equipment_base:
    examples: [claw_guard, rail_frame, rocket_pack, stealth_weave, daemon_deck]
    replacement_rate: low
  modifications:
    examples: [affixes, sockets, payloads, blades, capacitors]
    replacement_rate: medium
  consumables:
    examples: [stims, charges, traps, temporary scripts]
    replacement_rate: high
  schematics:
    examples: [new_recipe, skill_variant, service_upgrade]
    replacement_rate: rare
  story_items:
    examples: [keys, proofs, transit_passes, faction_objects]
    replacement_rate: authored
```

The player should recognize and care about a railgun for many hours, then modify its behavior. Constantly replacing “Railgun +18” with “Railgun +21” would weaken the game's strong animation and tool identity.

## Build pillars and combat balance

The four skill disciplines should not become four disconnected minigames. They should be four ways of interpreting the same spaces.

### Claw / melee: committed precision

The desired souls-like quality should be taken as **clarity, consequence, and mastery**, not necessarily slow movement.

```yaml
melee_identity:
  retains:
    - fast platform mobility
    - jump and dodge cancels earned through skills
    - claws as responsive baseline weapon
  gains:
    - clearer attack commitment for heavy blade actions
    - poise and stagger as visible resources
    - stronger enemy telegraphs and punish windows
    - limited healing/recovery opportunities during dangerous expeditions
    - elites that cannot be stun-locked casually
```

Avoid applying one stamina bar to every verb by default. Platforming should remain expressive. A smaller combat-specific guard/poise or exertion system can provide commitment without making traversal sluggish.

### Ballistics: lane control and preparation

Ballistics should control distance, armor, and enemy formation rather than simply producing higher damage.

```yaml
ballistics_identity:
  - mark or expose targets
  - pierce aligned enemies
  - suppress dangerous lanes
  - break environment anchors
  - convert recoil into movement
  - carry specialized payloads with limited field supply
```

### Ghoststep: stealth, climbing, traps, and pursuit control

This discipline requires a proper perception model.

```yaml
awareness_states:
  unaware:
    behavior: patrol_or_idle
  suspicious:
    behavior: inspect_sound_or_visual_trace
  searching:
    behavior: move_to_last_known_position_and_communicate
  alerted:
    behavior: combat_and_call_support
  confused:
    behavior: conflicting_target_or_false_signal
  disengaged:
    behavior: return_to_route_with_heightened_readiness
```

Required signals:

- vision cones or readable facing/line cues;
- hearing radius influenced by landing, gunfire, broken objects, and machinery;
- last-known-position markers;
- alarms and enemy communication links;
- hiding based on occlusion, darkness, elevation, vents, and route breaks—not generic tall grass;
- traps and decoys that work with platform geometry.

### Hacking: tactical control and rule rewriting

Hacking should be the most systemic build, with strong setup and situational power.

```yaml
hacking_roles:
  information: [reveal_routes, inspect_enemy_state, preview_alarm_network]
  access: [doors, elevators, transit, locked_interiors]
  control: [camera, turret, drone, speaker, light, trap]
  confusion: [false_orders, decoy_signals, faction_spoofing]
  offense: [overload, emp, environmental_arc]
  logistics: [shop_network, subway_switch, remote_safehouse_support]
```

Strong hacks must need infrastructure, trace budget, setup, a captured process, or a clean timing action. Otherwise hacking becomes a universal ranged spell system and erases the importance of space.

## Encounter design: one problem, several valid plans

Every substantial encounter should define:

```yaml
encounter_contract:
  objective: "what must change for the player to proceed"
  threats: "who or what prevents it"
  terrain: "platform geometry and traversal options"
  infrastructure: "hackable machines and communication links"
  deception_options: "sounds, decoys, faction signals, hidden routes"
  direct_options: "melee, ballistics, companions"
  persistent_consequence: "what remains changed after success"
```

Example:

```text
Objective: cross a customs station and free a detained courier.

melee route:
  challenge the shield guard, parry the lancer, break the holding lock

ballistics route:
  suppress the upper gantry, pierce the relay, cover the courier's escape

ghoststep route:
  climb the service frame, plant a noise trap, steal the cell key unseen

hacking route:
  spoof a transfer order, redirect cameras, make the gate escort the courier out

hybrid route:
  hack lights, drop behind the guard, parry once, escape through the opened train
```

Reward logic evaluates the resolved objective, discovered evidence, optional mastery, and resources recovered—not a kill count alone.

## Checkpoints, death, and expedition pressure

The game can gain danger without adopting every souls-like convention.

Recommended model:

```yaml
expedition_pressure:
  safehouse:
    effects: [save, full_heal, loadout_change, skill_spend]
  field_relay:
    effects: [checkpoint, limited_restock, respawn_anchor]
    reset: "ordinary enemies repopulate or change patrols"
  death:
    consequence:
      - respawn_at_last_relay
      - lose a bounded amount of unbanked salvage or temporary momentum
      - keep main quest discoveries and permanent items
  recovery:
    option: "recover dropped salvage from the failure location or abandon it"
```

This can be tuned after the vertical slice. The main principle is that death should create route tension without repeatedly erasing story progress.

## Procedural dungeons

Procedural dungeons should arrive after the persistent authored world works.

Best initial fiction:

- abandoned subway maintenance networks;
- shifting corporate service tunnels;
- pirate signal vaults;
- debt archive simulations;
- asteroid mine shafts.

Recommended structure:

```yaml
procedural_dungeon:
  entrance: fixed_persistent_location
  seed: stored_for_active_expedition
  authored_anchors:
    - entrance
    - rest_or_vendor_room
    - objective_room
    - exit
  generated_content:
    - room_chunks
    - enemy_families
    - bounded_affixes
    - rewards
  persistence:
    active_run: resumable
    completed_run: summarized_then_new_seed_later
```

Main-story strongholds remain authored.

## Proposed architecture

### New persistent state

```ts
interface AdventureSaveV2 {
  schemaVersion: 2;
  player: {
    level: number;
    experience: number;
    skillPoints: number;
    inventory: InventoryEntry[];
    equippedItemIds: string[];
    currencies: CurrencyState;
  };
  world: {
    currentLocationId: string;
    currentSpawnId: string;
    discoveredLocationIds: string[];
    unlockedTransitEdgeIds: string[];
    locationStates: Record<string, LocationState>;
  };
  quests: Record<string, QuestState>;
  npcs: Record<string, NpcState>;
  story: StoryProgress;
  activeExpedition?: ExpeditionSave;
}
```

Names and exact fields are provisional. The important decision is to separate persistent world state from temporary stage/session state.

### Data contracts

```yaml
new_data_contracts:
  locations:
    fields: [id, type, region, scene, exits, spawn_points, story_phases, services]
  travel_graph:
    fields: [nodes, edges, requirements, travel_events, line_name]
  quests:
    fields: [giver, objectives, stages, rewards, requirements, outcomes]
  npcs:
    fields: [home_location, schedules_or_phases, dialogue_sets, services, relocation_rules]
  encounter_rewards:
    fields: [resolution_id, xp, loot_table, approach_bonuses, repeat_policy]
```

### Runtime separation

`StageRunScene` is already very large and owns many systems. The pivot should not simply add town simulation, quest routing, subway maps, and persistent state directly to it.

Recommended boundaries:

```text
AdventureController
  ├─ StoryDirector
  ├─ WorldDirector
  ├─ QuestDirector
  ├─ EconomyDirector
  └─ SaveCoordinator

LocationScene
  ├─ settlement interaction mode
  ├─ route/field mode using existing gameplay systems
  └─ exits that request world transitions

StageRunScene
  └─ retained initially as ExpeditionScene for combat-heavy authored spaces
```

The first implementation can use scene replacement between small locations. Seamless streaming is unnecessary.

### Preserve auxiliary modes

Training, versus, horde, and endless modes remain useful. They should be framed as non-canonical laboratories or simulations and kept separate from campaign saves.

## Roadmap

> This original roadmap established the pivot sequence. The canonical ten-phase execution
> plan is now `TEN_PHASE_PIVOT_PLAN.md` (Phase 0 through Phase 9). In particular, the later
> work is split into a city act, an orbital/colony act, a required city homecoming and final
> expedition, and only then a systemic/procedural release phase.

### Phase 0 — lock the target and protect the mechanical core

Deliverables:

- accept the persistent node-world target;
- define the four runtime layers: world, expedition, encounter, action;
- decide which currencies remain;
- define approach parity rules;
- declare existing movement and combat-feel regression tests as protected contracts;
- reconcile the 8-district runtime with the 32-stage prose bible.

Exit criteria:

```yaml
phase_0_done_when:
  - no team member expects a seamless open world for the first pivot release
  - each current chapter has a proposed settlement, route, stronghold, and post-story phase
  - the save schema draft covers location, quests, inventory, and travel
```

### Phase 1 — persistent save and world graph foundation

Deliverables:

- `AdventureSaveV2` and migration from current saves;
- `LocationDef` and `TravelGraph` contracts;
- `WorldDirector` with enter, leave, discover, unlock, and respawn operations;
- current location and spawn persistence;
- one world-map or subway-map UI;
- debug commands for travel and story phase changes;
- tests for save migration and deterministic location transitions.

Do not add a large amount of content here.

### Phase 2 — Lower Sprawl adventure vertical slice

Build one complete district with:

```yaml
lower_sprawl_slice:
  safehouse: "Auntie Subharmonic's Relay"
  settlement: "Drainmarket edge / toll market"
  transit: "one damaged Toll Line station"
  routes:
    - "Neon Awning Mile"
    - "Cable Nest Court"
  stronghold: "Old Toll Office / Captain Grin"
  side_dungeon: "Transformer maintenance tunnels"
  npcs:
    - Auntie Subharmonic
    - Murr Murrby
    - Lio
    - Sister Version
  services:
    - shop
    - repair/loadout bench
    - skill mentor or training access
    - rumor/quest board
  quests:
    - one main quest chain
    - two authored side quests
    - one repeatable contract
  persistent_changes:
    - station opens
    - toll gates change ownership
    - clinic or market service improves
    - patrol composition changes
```

This slice must reuse current movement, combat, objectives, Captain Grin, meter scanning, toll rhythm puzzle, pickups, and checkpoints.

### Phase 3 — experience, economy, and persistent inventory

Deliverables:

- level and XP model;
- encounter-resolution reward ledger;
- persistent inventory and equipped loadout;
- enemy/elite drop integration;
- salvage selling and shop purchase persistence;
- blueprint recipe unlocks;
- reward parity tests for direct, stealth, and hack resolutions;
- anti-grind repeat rules.

### Phase 4 — stealth, confusion, and tactical enemy networks

Deliverables:

- awareness state machine;
- hearing, vision, last-known position, and communication;
- alarm network and camera integration;
- distractions, decoys, pursuit breaks, and hiding routes;
- trap placement or preparation model;
- enemy spoofing and temporary faction confusion;
- approach-specific training lessons;
- one encounter with at least four complete solution plans.

### Phase 5 — melee consequence and expedition balance

Deliverables:

- tune poise, stagger, recovery, and heavy-attack commitment;
- define field healing and relay rest rules;
- elite and boss resistance to loops/stun locks;
- balance traversal freedom against combat commitment;
- establish death and unbanked salvage rules;
- use training and replay metrics to compare builds.

This phase should tune, not replace, the current fast platform-combat identity.

### Phase 6 — subway journey and first major story arc

Deliverables:

- Lower Sprawl, Drainmarket, and Chrome Arcology connected by transit;
- travel conversations and one inspection/ambush event;
- companion relocation and service progression;
- district states before and after major quests;
- main story arc ending in the Elevator Seed;
- return visits that reveal consequences and new routes.

This is the first point at which the game should feel unmistakably like an adventure rather than a mission campaign.

### Phase 7 — district conversion pipeline

Convert remaining chapters incrementally:

```text
Mirror Palace
  -> Dub Colony
    -> Antenna Barrens
      -> Orbital Lift
        -> Asteroid Redoubt
```

For each district, require:

- one persistent social space or hideout;
- one transit relationship;
- one authored stronghold;
- one revisit after the main local conflict;
- one companion or faction arc;
- one approach-neutral quest objective;
- one optional high-skill route or dungeon.

### Phase 8 — procedural undercity and endgame expeditions

Only after the authored world and economy are stable:

- connect current encounter and side-room generation to dungeon entrances;
- add active expedition saves;
- add bounded affix and reward scaling;
- add procedural vendors and unique elites;
- preserve fixed authored bosses and story outcomes;
- expose seeds and generation manifests for replay/debug.

### Phase 9 — systemic endgame, polish, and release evidence

After the authored homecoming, final expedition, and ending doctrines are complete:

- add postgame Commons Line events;
- connect optional procedural undercity expeditions to persistent entrances;
- finalize accessibility, localization, save migration, performance, and controller polish;
- validate all NPC, quest, place, route, service, and encounter-approach IDs;
- publish deterministic replay, E2E, balance, migration, and visual evidence for release.

## Vertical-slice acceptance criteria

The adventure pivot is proven when one district supports all of the following:

```yaml
world:
  - player can save in a safehouse, leave, return, and find its state preserved
  - at least three connected locations have distinct functions
  - subway access opens through play and remains unlocked
  - a boss outcome changes NPCs, patrols, and one service

story:
  - main quest unfolds across multiple visits rather than one briefing/run/debrief
  - at least one side quest can be discovered spatially
  - an NPC relationship or faction choice changes a later interaction

progression:
  - XP is awarded for combat, stealth, and hacking resolutions
  - money and inventory persist across travel and reload
  - one item can be modified rather than immediately replaced
  - skill choices visibly change route or encounter options

combat_and_stealth:
  - one major encounter supports direct melee, ranged control, stealth/traps, and hacking
  - enemies communicate suspicion and alerts clearly
  - hacking cannot trivially remove elites without setup
  - melee remains responsive and platforming remains unchanged in feel

technical:
  - current saves migrate without losing campaign choices or skills
  - location transitions are deterministic and tested
  - adventure code does not expand StageRunScene into the sole owner of every new system
```

## Risk map

| Area | Risk | Reason | Containment |
|---|---:|---|---|
| Persistent world/save | Medium | New canonical state ownership | Implement before content expansion; version migrations |
| Spatial hub and services | Low-Medium | Existing scenes are prototypes | Build one compact settlement first |
| Subway travel graph | Low-Medium | Mostly data/UI/state | Avoid seamless train simulation initially |
| XP/economy integration | Medium | Approach parity and grind risk | Reward resolution, not kills |
| Persistent inventory/loot | Medium | Many systems exist but are disconnected | Curated loot and narrow first catalog |
| Stealth/perception | High | New AI state and encounter authoring | One enemy family and one slice first |
| Melee rebalance | Medium-High | Can damage current excellent feel | Protect movement and baseline claw tests |
| Full seamless world | Very High | Level, camera, save, streaming, pacing | Explicitly out of initial scope |
| Main-story procgen | Very High | Undermines authored drama and testing | Procgen only in optional/replay spaces |
| 32 full stages immediately | Very High | Content multiplication | Treat them as subzones within eight districts |

## Guardrails

```yaml
do_not:
  - rewrite platform physics for the genre pivot
  - change to top-down movement
  - turn every settlement into a static menu
  - require one seamless world map
  - pay XP only for kills
  - flood the player with disposable gear
  - add procedural generation to critical story geometry
  - make hacking a universal ranged damage spell
  - make stealth a mandatory slow crouch mode
  - add all districts before the Lower Sprawl slice proves the structure
  - combine world state, quests, economy, and town interaction directly into StageRunScene
```

## Open decisions after the vertical-slice proposal

These decisions should be tested rather than settled entirely on paper:

1. **How punishing should death be?** Start with bounded unbanked salvage loss; test whether retrieval improves tension or merely creates repetition.
2. **How many equipment slots are readable?** The subsystem supports many categories, but the player-facing loadout should remain compact.
3. **Should ordinary enemies respawn after relay rest, travel, or story phase change?** Different district types may use different rules.
4. **How much tactical pause should hacking receive?** Make it an accessibility and build option, not the only usable interface.
5. **How often should transit include events?** They should feel special, not make fast travel tedious.
6. **Should companions physically accompany Moss through all routes?** Story-specific companions are safer than a permanent full party initially.
7. **How much backtracking is enjoyable with these movement speeds?** Shortcuts and transit exits should prevent repeated long empty runs.
8. **What is the exact campaign level cap and skill-point cadence?** Derive this from the number of meaningful quests and desired build specialization.

## Final design position

The proposed shift does not oppose Badger Sprawl Runner's existing identity. It clarifies what the existing systems have been converging toward.

The current game already knows how Moss moves and fights. It already knows that hacking, traps, companions, dialogue, and political choices should matter. It has not yet fully decided what Moss is moving **through** between fights.

The answer should be a persistent journey through places that remember:

```text
Moss does not select “the city mission.”
Moss lives in the city, learns its routes, opens its trains,
returns to its people, and changes who controls its machinery.
```

That is the adventure pivot.
