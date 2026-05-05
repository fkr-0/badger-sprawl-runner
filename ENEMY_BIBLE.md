# Enemy Bible

Enemies are not only obstacles. Each enemy is a visible worker, machine, officer, ghost, or compromised creature inside the social machine of its world. Their attacks teach platforming, spacing, hacking, parry timing, trap use, and companion coordination.

## Enemy design rules

```yaml
enemy_rules:
  readable_before_deadly: true
  every_enemy_has_two_counters: true
  platforming_role_required: true
  hack_state_required_for_advanced_enemies: true
  trap_interaction_required_for_heavies: true
  moral_identity_required_for_humanoid_enemies: true
```

## Global enemy classes

| Class | Purpose | Common counters |
|---|---|---|
| Walker | Ground pressure, basic timing | jump, claws, traps |
| Jumper | Pursues across platforms | parry, launcher, spike bait |
| Flyer | Forces vertical aim | railgun, hook claw, signal hack |
| Shield | Teaches spacing/parry | katana, backstab, terminal overload |
| Caster | Teaches code-state reading | interrupt, syntax parry, line break |
| Turret | Route denial | hack, railgun, alternate path |
| Heavy | Trap bait, arena control | crushers, lightning, armor break |
| Assassin | Movement duel | dodge, parry, predictive shot |
| Swarm | Crowd control | wide slash, scatter coil, bass pulse |
| Boss-Argument | Mechanical and ideological test | combat + dialogue + hack state |

## World enemy sets

### Lower Sprawl

| Enemy | Class | Platforming role | Attack | Hacking/trap interaction |
|---|---|---|---|---|
| Toll Rat | Walker | patrols short ledges | bite and coin toss | can be lured into turnstile trap |
| Coin Mite | Swarm | crawls on ceilings | small leap | railgun through coin pile chains damage |
| Bailiff Scooter | Jumper/Rusher | crosses gaps fast | ram | hacked traffic light redirects it |
| Signboard Sniper | Turret | rooftop pressure | slow aimed shot | drop their neon sign with railgun |
| Debt Printer Imp | Caster | hides behind platforms | paper warrant traps | overload printer for explosion |
| Fuse Monk | Shield/Caster | guards wet wires | electric staff | wet-gutter lightning can stun |
| Drone Kennel-Master | Sub-boss | locks arena exits | releases drones | hack kennel door to reverse spawn |

### Chrome Arcology

| Enemy | Class | Platforming role | Attack | Hacking/trap interaction |
|---|---|---|---|---|
| Glass Intern | Walker | slips on glass floors | clipboard jab | shatters if knocked into pane |
| Reception Lancer | Assassin | guards elevator lips | spear dash | parry opens elevator switch |
| Memo Wasp | Flyer | blocks vertical shafts | paper sting | camera spoof redirects swarm |
| Holo-Gardener | Caster | teleports between planters | thorn drone | water pipe hack roots it |
| Contract Lawyer Bot | Caster | floats backward | binding clause | syntax parry cancels clause |
| Compliance Shield | Shield | blocks narrow routes | shield bash | back panel vulnerable after jump-over |
| Panic Siren | Turret/Runner | flees through platforms | alarm pulse | signal jammer stops heat gain |

### Straylight Mirage

| Enemy | Class | Platforming role | Attack | Hacking/trap interaction |
|---|---|---|---|---|
| Reflection Hound | Jumper | mirrors player jumps | bite from mirrored side | attack the shadow, not body |
| Prism Duelist | Assassin | midrange platform guard | delayed blade | katana spacing counter |
| Etiquette Blade | Shield | punishes spam | formal countercut | wait for bow animation |
| Debt Harpist | Caster | controls rhythm hazards | shockwave chords | bass shield reflects chord |
| Vacuum Porter | Turret | opens/pulls vents | pressure gust | vent panel hack reverses pull |
| Window Saint | Caster | makes false floors | glass sermon | railgun reveals real platform |
| Mirror Guard Pair | Sub-boss | pincer teleport | clone strike | hack mirror anchor to expose real one |

### Dub Colony

| Enemy | Class | Platforming role | Attack | Hacking/trap interaction |
|---|---|---|---|---|
| Bass Beetle | Jumper | hops on beat | body slam | offbeat parry stuns |
| Echo Drummer | Turret | sends ring waves | rhythm pulse | downbeat guard reflects |
| Feedback Cobra | Walker/Caster | sine crawl | sonic spit | speaker overload silences |
| Tape Priestess | Caster | rewinds hazards | loop curse | cut tape reels with claws/katana |
| Mold Angel | Flyer | protects greenhouse | pollen cloud | nonlethal route increases trust |
| Amp Golem | Heavy | arena wall | slam shockwave | bait into speaker feedback |
| Static Choir | Swarm | group push | chorus shove | bass stat weakens wave |

### Uplink Barrens

| Enemy | Class | Platforming role | Attack | Hacking/trap interaction |
|---|---|---|---|---|
| Spark Jackal | Jumper | zigzags over pylons | electric bite | wet ground chains stun |
| Wire Witch | Caster | hovers near cables | lightning thread | cut/hack cable to ground her |
| Dish-Climber | Walker/Vertical | climbs antenna masts | bolt throw | railgun knocks from mast |
| Regex Fox | Caster/Assassin | warps between terminals | malformed prompt | correct syntax creates punish window |
| Packet Butcher | Heavy/Caster | blocks relay rooms | packet cleaver | interrupt during compile windup |
| Null Monk | Shield | creates silence field | anti-hack zone | pure melee required inside field |
| Signal Leech | Swarm | drains hack charge | attaches to walls | bass pulse shakes loose |

### Orbital Lift

| Enemy | Class | Platforming role | Attack | Hacking/trap interaction |
|---|---|---|---|---|
| Strap-Hook Twin | Jumper | swings between cargo hooks | hook slash | hook blade counters |
| Stamp Golem | Heavy | blocks scanner corridors | bureaucratic slam | scanner hack marks weak point |
| Sniffer Cherub | Flyer | searches contraband routes | alarm sniff | signal jammer blinds |
| Gravity Customs | Caster | flips room gravity | stamp shock | syntax hack locks gravity briefly |
| Wind Lancer | Assassin/Flyer | exterior cable duel | dive lance | railgun timing punish |
| Maintenance Choir | Swarm/Caster | repairs hazards | repair chant | interrupt lead singer |
| Debt Paladin | Shield/Heavy | guards prisoner cargo | oath strike | dialogue flag can weaken resolve |

### Asteroid Redoubt

| Enemy | Class | Platforming role | Attack | Hacking/trap interaction |
|---|---|---|---|---|
| Rock Mite | Swarm | crawls low-grav ceilings | pebble bite | gravity flip scatters |
| Drill Hermit | Heavy | digs new tunnel hazards | drill charge | bait into brittle wall |
| Airlock Nun | Caster | controls pressure doors | air burst | hack door state |
| Hull Spider | Jumper/Ceiling | wall and ceiling pursuit | web mine | railgun breaks web anchor |
| Oxygen Clerk | Shield/Caster | taxes air pockets | suffocation field | expose false ledger entry |
| Ammunition Ghost | Flyer | haunts foundry shells | explosive pass | nonlethal banish via bass chord |
| Traitor Mask | Assassin/Caster | pretends to be ally | backstab + false prompt | trust flags reveal outline |

### Final Broadcast

| Enemy | Class | Platforming role | Attack | Hacking/trap interaction |
|---|---|---|---|---|
| Riot Drone Choir | Swarm/Flyer | fills air lanes | synchronized bolts | companion chorus counters |
| Clause Serpent | Caster | coils around ledger platforms | contract bite | correct clause rewrite breaks coil |
| Archive Twin | Assassin/Caster | one attacks, one rewrites | dual slash/edit | hit real editor first |
| Redaction Nun | Shield | deletes platforms | black bar sweep | broadcast light restores |
| Star Lancer | Assassin | final ascent duel | star-point dash | parry into rail punish |
| Angel Fragment | Caster | leftover obedience logic | cable halo | prove schedule contradiction |
| Fox Fragment | Caster | final hack duel echo | malformed states | perfect syntax gives heal |

## Sub-boss requirements

```yaml
sub_boss_requirements:
  hp_scale: "short encounter, 25-45 seconds when mastered"
  unique_mechanic: required
  arena_gimmick: required
  non_damage_solution: optional_but_preferred
  dialogue_bark: required
  rematch_variant: allowed_in_final_broadcast
```

## Endboss requirements

```yaml
endboss_requirements:
  phases: 3
  phase_types:
    - physical_combat
    - environmental_or_hack_state
    - ideological_or_dialogue_choice
  checkpoint_between_phases: recommended
  visible_state_machine: required
  final_choice_or_consequence: required
```
