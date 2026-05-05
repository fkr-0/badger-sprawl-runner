# Campaign: Worlds, Stages, Sub-Bosses, Endbosses

Each world is an episode in the five-act drama. Every stage has a placard, a local contradiction, 1-3 sub-bosses, a platforming identity, and at least one way to solve combat through movement, hacking, traps, or companions.

## Campaign overview

```yaml
world_count: 8
stages_per_world: 4
sub_bosses_per_stage: "1-3"
endbosses: 8
structure:
  prologue: "World 1 opening"
  act_i: [Lower Sprawl, Chrome Arcology]
  act_ii: [Straylight Mirage]
  act_iii: [Dub Colony, Uplink Barrens]
  act_iv: [Orbital Lift]
  act_v: [Asteroid Redoubt, Final Broadcast]
```

## World 1 — Lower Sprawl: The Song of the Toll

Placard: **The poor pay rent to distance.**

Theme: rain, debt gates, undercity alleys, food stalls, cable nests. The platforming is low, dirty, horizontal, and readable: awnings, gutters, cables, scooters, drainpipes. Combat teaches claws, simple parry, trap bait, and first terminal overloads.

| Stage | Name | Level description | Sub-bosses | Story beat |
|---|---|---|---|---|
| 1-1 | Drainpipe Wake | Sewer pipes, broken toll bridges, rats in fluorescent vests, collapsible brick ledges. Teaches jump buffering, claw range, and spike avoidance. | Toll Rat Foreman | Moss steals a wafer-key and sees children charged to cross a footbridge. |
| 1-2 | Neon Awning Mile | Rooftop awnings bounce Moss between food stalls. Neon signs can be dropped on enemies with rail shots later. | Scooter Bailiff, Signboard Sniper | Murr Murrby sells stims from a folding roof stall and calls it “survival retail.” |
| 1-3 | Cable Nest Court | Dense vertical cable maze with first timed code gate. Cameras summon drones unless hacked. | Bailiff Twins, Debt Printer Imp | Lio begs Moss to stop, claiming the toll office will punish families. |
| 1-4 | Market Blackout | Rainstorm market evacuation. Terminal explosions, wet-gutter lightning, first railgun pickup. Ends in escape through shutters. | Captain Grin, Drone Kennel-Master, Fuse Monk | Sister Version hijacks the city screens and reveals the dub colony signal. |

Endboss: **Captain Grin, Tollbooth Saint**. A smiling armored collector riding a coin-fed barricade engine. Phase 1 teaches armor plates, Phase 2 adds turnstile lasers, Phase 3 requires hacking the toll meter while dodging baton parries.

Enemy additions: coin mites, turnstile crawlers, bailiff scooters, paper-warrant swarms, wet-wire eels.

## World 2 — Chrome Arcology: The Badger Sells His Feet

Placard: **The elevator rises because someone below is pressed down.**

Theme: glass elevators, indoor forests, polished security, hidden labor. Platforming becomes vertical and clean-looking but cruel: moving glass floors, conveyor belts, maintenance vents, rich gardens over worker shafts.

| Stage | Name | Level description | Sub-bosses | Story beat |
|---|---|---|---|---|
| 2-1 | Lobby of Polished Teeth | Security lobby with vertical elevators and scanner doors. Rook Null joins and can hold hack channels. | Reception Lancer | Rook Null explains that the building's map excludes worker floors. |
| 2-2 | Atrium Orchard | Beautiful indoor orchard with hostile gardener drones. Roots hide water theft pipes. | Holo-Gardener, Drone Wasp Queen | Moss learns the trees are watered by stolen district water. |
| 2-3 | Executive Laundry | Conveyor belts, vent stealth, spinning washers, suit-press crushers. | Spin-Cycle Guard, Contract Lawyer Bot, Steam Bailiff | Lio appears in uniform as a corporate courier. |
| 2-4 | Elevator Seed Vault | Timed heist stage with rotating glass locks and cargo shafts. | Glass Janitor, Vault Triplets, Panic Siren | Moss steals the elevator seed and sees prisoners moved as cargo. |

Endboss: **Madame Vitrine, Mirror of Human Resources**. A polished executive duelist. She turns mistakes into “performance review” debuffs, summons glass copies, and offers Moss a contract mid-fight. Rejecting or accepting changes Guile/Heat consequences.

Enemy additions: glass interns, memo wasps, elevator mites, compliance shields, contract drones.

## World 3 — Straylight Mirage: Treason at the Mirror Banquet

Placard: **Luxury is a room where suffering arrives already laundered.**

Theme: orbital resort, mirrored corridors, false windows, zero-g fountains, banquet politics. Platforming uses low gravity, reflection decoys, and fake floors. Dialogue choices interrupt combat.

| Stage | Name | Level description | Sub-bosses | Story beat |
|---|---|---|---|---|
| 3-1 | Dock of Borrowed Stars | Orbital dock with vacuum vents and customs robots. Rocket pack gains orbit tuning. | Customs Lark, Vacuum Porter | Sister Version upgrades rocket burst for low-grav correction. |
| 3-2 | Mirror Gallery | Fake platforms, reflection hounds, mirrored terminals that reverse inputs. | Reflection Hound, Prism Duelist | Companions argue under projected slogans about violence and proof. |
| 3-3 | Banquet of Air | A playable banquet: answer selection, etiquette duels, table platforms, chandelier traps. | Sommelier Drone, Etiquette Blade, Debt Harpist | Auntie Subharmonic recognizes an old revolutionary serving the court. |
| 3-4 | Suite of False Windows | Betrayal chase through glass suites; Lio closes routes remotely. | Lio the Courier, Mirror Guard Pair, Window Saint | Lio betrays Moss under family debt pressure. |

Endboss: **The Reflection Judge**. Copies Moss's current build and forces a public choice: expose Lio, protect Lio, or weaponize the betrayal. The fight alternates between mirror duel, code-state reading, and dialogue placards.

Enemy additions: reflection hounds, etiquette blades, vacuum porters, debt harpists, prism duelists, window saints.

## World 4 — Dub Colony: The Colony Teaches the Price of Air

Placard: **A refuge can become a fortress; a fortress can become a prison.**

Theme: moving sound-system habitat, reggae/dub workshops, bass platforms, solar sails, greenhouse train cars. Mechanics emphasize beat timing, companion defense, non-lethal choices, shops, and community votes.

| Stage | Name | Level description | Sub-bosses | Story beat |
|---|---|---|---|---|
| 4-1 | Speakerstack Gardens | Bass-reactive platforms, planters, speaker elevators. Teaches downbeat guard and bounce timing. | Bass Beetle, Echo Drummer | The colony becomes home base, but not everyone trusts Moss. |
| 4-2 | Studio Temple | Recording rooms become combat rooms. Tape loops rewind hazards unless cut or hacked. | Tape Priestess, Feedback Cobra | Moss learns that rhythm can guard, push, and overload. |
| 4-3 | Greenhouse Train | Moving train cars with fragile crops. Naya Root joins as shield companion. | Mold Angel, Rail-Rider Crew, Pollen Turret | Protecting food changes route rewards and colony trust. |
| 4-4 | Soundclash Dock | Wave defense at docking bay with shop breaks, debate interruptions, and rival selectors. | Rival Selector, Amp Golem, Static Choir | Colony votes whether to become openly rebel. |

Endboss: **King Feedback, the Friendly Tyrant**. He wants to centralize all colony channels “temporarily” for safety. The fight alternates between rhythm boss, shielded debate, and audience vote. Victory can exile, persuade, or bind him to a council.

Enemy additions: bass beetles, echo drummers, feedback cobras, amp golems, static choir, mold angels, rival selectors.

## World 5 — Uplink Barrens: The Old Ally Wears a New Uniform

Placard: **A signal is free only if the receiver can answer.**

Theme: antenna deserts, storm bridges, smuggler pylons, lightning, signal silence. Platforming is windy, tall, and dangerous. Combat connects hacking to weather: terminal arcs, lightning routes, conductive rain, antenna targeting.

| Stage | Name | Level description | Sub-bosses | Story beat |
|---|---|---|---|---|
| 5-1 | Pylon Steppe | Wind pushes jumps across antenna legs. Spark jackals chase through conductive grass. | Spark Jackal, Wire Witch | Rook Null detects debt ledger shards split across signal towers. |
| 5-2 | Storm Bridge | Rocket precision over lightning gaps and collapsing relay bridges. | Thunder Bailiff, Dish-Climber Pack | Lio returns wounded, maybe enemy or maybe warning. |
| 5-3 | Black-Ice Relay | Combat coding under pressure. Naya guards while Moss types, parries, and overloads. | Regex Fox, Packet Butcher, Null Monk | Hacking becomes fighting in full view. |
| 5-4 | Smuggler Parliament | Platforming through jury-like pylon chambers; answer selection changes allies. | Old Captain Ossa, Bribe Engine, Signal Leech | Player chooses whether to trust old smugglers or expose them. |

Endboss: **The Black-Ice Fox**. A hacker-duelist with visible code states: SCAN, INJECT, EXECUTE, ROLLBACK. Perfect hacks turn attacks into healing code; failed syntax creates enemy clones.

Enemy additions: spark jackals, wire witches, regex foxes, packet butchers, null monks, signal leeches, dish climbers.

## World 6 — Orbital Lift: The Machine That Carries Obedience

Placard: **No machine is neutral when its schedule is a sentence.**

Theme: cargo containers, sky elevator, chase stages, rotating gravity. Platforming is about moving rooms, counterweights, outside cables, pressure doors, and cargo prayers. This is the act of obedience and old allies in new uniforms.

| Stage | Name | Level description | Sub-bosses | Story beat |
|---|---|---|---|---|
| 6-1 | Cargo Rosary | Containers move like beads on belts. Enemies pray to logistics schedules. | Container Saint, Strap-Hook Twins | The rebellion hides in cargo marked “unprofitable bodies.” |
| 6-2 | Customs Spine | Scanner corridors, stamp traps, contraband side rooms. Murr Murrby sells from a scanner kiosk. | Gravity Customs, Stamp Golem, Sniffer Cherub | Murr jokes about emergency morality while prices shift with heat. |
| 6-3 | Cable Outside | High-altitude exterior climb, wind lancers, rescue setpiece for a companion. | Wind Lancer, Maintenance Choir | A companion falls; trust determines who risks the rescue. |
| 6-4 | Counterweight Heart | Multi-companion puzzle: reverse cargo flow while fighting debt paladins. | Balance Maw, Debt Paladin, Lift Oracle | Moss frees prisoners but reveals rebel capacity to seize orbit. |

Endboss: **The Elevator Angel**. A huge maintenance intelligence with cable halos. It is obedient, not hateful. Dialogue can reduce phases if Moss proves the schedule is murder.

Enemy additions: strap-hook twins, stamp golems, sniffer cherubs, gravity customs, debt paladins, maintenance choir, balance maw.

## World 7 — Asteroid Redoubt: The Asteroid Learns to Speak

Placard: **After the fortress is taken, the first enemy is the new lock on its door.**

Theme: low gravity caves, rebel workshops, vacuum doors, transmitter dishes. This world begins triumphant but becomes politically dangerous. Some rebels want mutual aid; others want command. Treason becomes factional.

| Stage | Name | Level description | Sub-bosses | Story beat |
|---|---|---|---|---|
| 7-1 | Rock With a Mouth | Low-grav caves with transmitter fossils and drill enemies. | Drill Hermit, Rock Mite Matron | Rebels seize the first transmitter cave. |
| 7-2 | Vacuum Chapel | Pressure doors, airlock puzzles, hull spiders, moral choice over prisoners. | Airlock Nun, Hull Spider, Oxygen Clerk | Old and new allies disagree on mercy. |
| 7-3 | Rebel Foundry | Crafting/defense stage. Build dish parts while enemies breach walls. | Forge Ox, Ammunition Ghost, Foundry Choir | Skill tree final branches unlock; command faction appears. |
| 7-4 | Dish Crown | Full-kit platforming on transmitter dishes; traitor faction sabotages relays. | Signal Lancer, Choir Splitter, Traitor Mask | The traitor is revealed as a faction, not one person. |

Endboss: **Director Vane's Proxy Body**. Remote-operated war frame carrying projected contract clauses. Break armor, hack clauses, then survive the command faction's attempt to seize the victory narrative.

Enemy additions: drill hermits, rock mites, airlock nuns, hull spiders, oxygen clerks, ammunition ghosts, traitor masks.

## World 8 — Final Broadcast: The Audience Is Asked Who Owns the Sky

Placard: **A rebellion that cannot be answered is only another broadcast.**

Theme: uprising montage, multi-companion assault, public ledger rewrite, final tower. This is a boss-rush argument and full-system exam: platforming, hacking, companions, dialogue, traps, railgun, sword, claws.

| Stage | Name | Level description | Sub-bosses | Story beat |
|---|---|---|---|---|
| 8-1 | City Answers Back | Districts send fighters. Ally routes open based on prior trust and choices. | Riot Drone Choir, Bailiff Remnant, Citizen Shieldbreak | All rescued districts answer the asteroid. |
| 8-2 | Ledger Under Glass | Code combat inside a visible debt ledger. Platforms are clauses; traps are signatures. | Clause Serpent, Archive Twins, Redaction Nun | Moss edits the debt ledger live. |
| 8-3 | The Treason Lesson | Boss-rush argument with echoes of former enemies and allies. | Lio Rematch, King Feedback Echo, Vitrine Echo | Former enemies return as political arguments. |
| 8-4 | Broadcast Tower | Final ascent through state machines, lightning routing, companion assists, and public choices. | Star Lancer, Angel Fragment, Fox Fragment | The player chooses what to broadcast. |

Final Endboss: **Director Vane, Keeper of the Sky-Lock**. Three-phase fight: bodyguard duel, contract hack, public argument. The final input is a broadcast choice that determines ending tone.

Enemy additions: riot drone choir, clause serpents, archive twins, redaction nuns, star lancers, angel fragments, fox fragments.

## Stage design requirements

```yaml
requirements:
  every_stage:
    - at least one platforming gimmick
    - at least one hackable environment object
    - at least one trap usable by both player and enemies
    - one merchant/ally/dialogue beat every 1-2 stages
    - one visible social-machine detail
  every_world:
    - 4 stages
    - 1 endboss
    - one new enemy family
    - one recurring enemy modified by local rules
    - one companion/dialogue consequence
  every_sub_boss:
    - teaches or tests one mechanic
    - has one non-damage vulnerability
    - can be made easier by a hack, trap, or dialogue flag
```
