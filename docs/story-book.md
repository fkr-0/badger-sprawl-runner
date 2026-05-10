# Badger Sprawl Runner Story Book

Purpose: this document is the long-form scene book for the campaign. It is intentionally more theatrical than the implementation schema in `apps/runner/src/game/Campaign.ts` and more expansive than `STORY.md`. It can later be split into episodic scripts, stage dialogue, side quests, spinoff pitches, comics, audio drama scenes, or level-design briefs.

The story is a Brechtian cyber-dub platformer drama: scenes name the social machine, then let Moss run through its gears. Every chapter should be playable as an arcade mission and readable as an episode of a strange political stage play.

```yaml
story_book_contract:
  form: "scene-by-scene episodic playbook"
  core_cast:
    - Moss the Badger
    - Sister Version
    - Rook Null
    - Auntie Subharmonic
    - Murr Murrby
    - Lio
    - Naya Root
    - Director Vane
    - The Choir of Static
  recurring_devices:
    - projected placards
    - pirate-radio songs
    - visible machinery
    - boss arguments
    - side facts from vendors, civilians, terminals, and graffiti
    - spinoff seeds after major scenes
```

---

## How to use this book later

Each chapter is written as a sequence of scenes. A scene has a dramatic purpose, a playable purpose, a mood, side details, and future expansion hooks. For a later episodic play adaptation, each scene can become one stage beat, one page of script, one audio-drama track, or one in-game dialogue/cutscene unit.

```yaml
episode_template:
  placard: "the thesis before the action"
  cold_open: "Moss or another character caught inside the system"
  playable_scene: "run, fight, hack, chase, or choose"
  interruption: "song, vendor, heckler, enemy monologue, or public-address machine"
  contradiction: "what the scene says the world is doing"
  choice_or_reversal: "how Moss changes the pressure"
  debrief: "the colony argues about what the theft meant"
  spinoff_seed: "a side story that can become another episode"
```

---

# Prologue — The Song of the Toll

Projected placard: **A city that charges for crossing the street will one day charge for breathing.**

The audience should understand the system before Moss does. Moss thinks this is a courier job. The play tells us it is a small theft from a much larger machine.

## Scene 1.1 — Rain on the Toll Steps

Moss crouches beneath an awning made from old election vinyl and cracked solar film. Rain taps on the sign above the toll office: EVERY ROUTE IS SAFER WHEN REGISTERED. Children in rubber boots wait near a crosswalk that costs three credchips. Nobody calls it poverty. The sign calls it demand management.

Rook Null is only a voice at this point, cutting in through a busted delivery earpiece. It speaks like a train schedule learning sarcasm.

```text
ROOK NULL: Your route includes seven illegal shortcuts, three payable crossings, and one pipe that has been legally reclassified as a luxury tunnel.
MOSS: Can the pipe arrest me?
ROOK NULL: Not until next quarter.
```

Playable purpose: introduce movement, toll barriers, short jumps, and the idea that the world labels ordinary motion as a service.

Side facts:

- The toll office sells umbrella permits but not umbrellas.
- Moss keeps a pocket list of unpaid crossings and calls it a poem because that makes it less depressing.
- A street-food vendor named Griddle Nana accepts payment in coins, gossip, or kicked-open meter locks.
- The oldest graffiti on the toll steps says, WE WERE HERE BEFORE THE GATE LEARNED OUR NAMES.

Spinoff seeds:

- A one-shot comic about Griddle Nana running a breakfast stall beside a riot.
- A puzzle game about kids mapping unpaid routes through a toll city.
- A short audio episode where Rook Null narrates city fees as if they are weather reports.

## Scene 1.2 — The Wafer-Key Job

The wafer key sits in a glass cabinet behind Captain Grin’s booth, but the cabinet is not the important part. The important part is the wall behind it: ledgers, route diagrams, water locks, and elevator access tables all stamped by the same orbital authority.

Moss enters to steal one key and discovers that the city is already a diagram of orbit control. This is the first Brechtian reveal: the player is not uncovering a conspiracy; they are noticing a system that was proud enough to file itself.

Playable purpose: introduce simple stealth timing, climb routes, and first heist payload.

Casual side details:

- Captain Grin collects miniature gates, each one tiny enough to hold in the paw.
- The toll booth coffee machine charges extra for steam.
- A clerk has written SORRY on every denied waiver form but still files them.
- Moss mispronounces “municipal” three different ways and eventually decides the word is guilty.

## Scene 1.3 — Tollbooth Captain Grin

Captain Grin does not think of himself as cruel. He thinks of himself as a custodian of order. His boss argument is not “I hate the poor.” It is “without fees, everyone would move at once.” He speaks in the calm voice of a man who has confused queues with justice.

Boss structure:

```yaml
tollbooth_captain_grin:
  phase_1: "drops portable gates that turn platforms into toll lanes"
  phase_2: "opens and closes route permissions while reading ledger excerpts"
  refrain: "Fees are civilization with a receipt."
```

The fight should make gates ridiculous. Each time Captain Grin tries to impose order, Moss uses motion to turn the toll logic into comedy.

Debrief seed: Sister Version says Moss did not steal a key; Moss stole the machine’s handwriting.

---

# Act I — The Badger Sells His Feet

Act thesis: Moss wants escape money. The colony wants proof. The city wants every injury, route, and elevator turned into a bill.

## Chapter 2 — Drainmarket: The Badger Sells His Feet

Projected placard: **A market under the street sells medicine priced by fear.**

## Scene 2.1 — The Market Under the Street

Drainmarket is warm, loud, cramped, and alive. It smells like wet metal, fried bean paste, antiseptic, and old batteries. It is not merely a black market. It is the market that appears when official care is too expensive to survive.

Auntie Subharmonic keeps a stall in a half-submerged train car. She sells stims, bassline charms, spare buttons, and advice that sounds like a threat until it saves your life.

```text
AUNTIE SUBHARMONIC: You can buy a stim, child. Or you can ask why the wound got priced before the knife got named.
MOSS: I was hoping to ask after I stopped bleeding.
AUNTIE SUBHARMONIC: Then bleed rhythmically. We teach parry on the second beat.
```

Playable purpose: introduce melee/parry and the parry tutorial beat.

Stage beat: the first knife-drone flashes a red invoice before lunging. The flash is not just a combat tell; it is the system billing Moss before impact.

Side facts:

- Drainmarket has three currencies: credchips, antibiotic tabs, and favors nobody wants written down.
- A puppet dentist performs anti-debt songs for children while sharpening surgical pliers.
- Knife-drones were originally built as “mobile discouragement devices” for queue management.
- Auntie Subharmonic calls every machine “baby” before breaking it.

Spinoff seeds:

- A medical-smuggling side campaign starring Auntie Subharmonic.
- A rhythm-parry training minigame called Invoice Flash.
- A merchant-life episode about a clinic that refuses to charge but must still buy power.

## Scene 2.2 — Stim Cache Ethics

The stim cache is hidden inside a clinic shutter that only opens for paid emergencies. Moss can keep the stims, seed a mutual-aid clinic, or use them as bait for the drone nest. The scene should not present morality as clean. Each option has a cost.

```yaml
stim_cache_choice:
  keep_it_for_moss:
    drama: "survival as private hoarding"
  seed_mutual_aid_clinic:
    drama: "care as infrastructure"
  bait_the_nest:
    drama: "tactical cruelty against a cruel machine"
```

Implementation note: the campaign currently records `stim_cache_secured`. Later branches can split this into more precise care-policy flags.

## Scene 2.3 — Knife-drone Nest

The Knife-drone Nest is less a boss than a business model. Drones hang from the ceiling like cutlery in a storm. A speaker says, PAIN CONFIRMS DEMAND. The drones flash red invoices before each lunge.

The fight teaches counter-timing. The player learns that panic attacks feed the nest, but waiting for the invoice flash creates the counter window.

Boss refrain: **Pain is demand. Demand is market proof.**

Debrief seed: Rook Null says markets do not heal. People do. Auntie says Rook is almost learning warmth and should stop before it becomes expensive.

---

## Chapter 3 — Chrome Arcology: Elevator Seed

Projected placard: **The elevator rises because someone below is counted as cargo.**

## Scene 3.1 — Glass Atrium Sightline

The Chrome Arcology is clean enough to feel violent. Moss’s claws squeak on floors polished by workers who are never allowed in the lobby except as reflections. The elevator announces wellness affirmations while sorting passengers by permission class.

Playable purpose: introduce railgun sightlines. The first room is safe and long; drones enter late so the player learns to charge before panic.

Side facts:

- The arcology calls janitors “surface continuity technicians.”
- Luxury air has scent settings; labor air has timer settings.
- A vending machine sells “authentic street rain” in decorative ampoules.
- Rook Null once optimized elevator routes and still feels embarrassed about it.

Spinoff seeds:

- A workplace mystery about hidden labor floors inside a luxury tower.
- A railgun puzzle episode focused on line-of-sight sabotage.
- A mock corporate training video narrated by Madame Vitrine.

## Scene 3.2 — Cargo Shaft Crossfire

Moss falls into the cargo shaft and sees the hidden floors: B2, B7, B13 if the story wants superstition later. People move crates tagged as persons and persons tagged as crates. The railgun pierces through cargo gaps; every shot reveals another layer behind the glass.

This scene should make the background narrate. Labor-floor tags are not only art details; they are evidence. When a charged shot crosses the shaft, silhouettes appear behind translucent panels.

Playable purpose: teach moving between cover and firing through multiple targets.

## Scene 3.3 — Madame Vitrine

Madame Vitrine speaks like a museum label. She insists transparency is justice because everyone can see the contract. Her logic is clean, polished, and monstrous: if the contract is visible, then the suffering is consent.

```yaml
madame_vitrine_phases:
  display_window:
    dramatic_use: "she exhibits Moss as criminal specimen"
  price_tag_crossfire:
    dramatic_use: "cargo-tag drones turn people into inventory"
  transparent_justice:
    dramatic_use: "moving mirrors force Moss to pierce the display"
```

Casual side details:

- She compliments Moss’s posture while trying to kill him.
- Her museum sells postcards of protests it helped suppress.
- One gallery is called “Labor, Anonymous.” It is always closed for cleaning.

Debrief seed: Sister Version says Moss found the people the elevator was built to move without names.

---

# Act II — Treason at the Mirror Banquet

Act thesis: betrayal is not the opposite of love. Betrayal is what debt does to love when it buys the room first.

## Chapter 4 — Mirror Palace

Projected placard: **Debt can make a friend wear the enemy mask before they stop loving you.**

## Scene 4.1 — Banquet Etiquette

The Mirror Palace is too beautiful to trust. Every wall is a reflection, every reflection is delayed, and every delayed reflection seems to know more than Moss. Guests wear masks shaped like polite animals. Moss is offended by every badger mask.

Lio appears in formal courier livery. They look healthier than Moss remembers, which is how the palace announces that coercion can dress well.

Playable purpose: introduce mirror-door traversal hazards and rocket-pack route logic.

Side facts:

- Palace servants communicate through mirrored hand signs because spoken labor is considered disruptive.
- The dessert course is called Liquid Asset.
- The orchestra plays a waltz in 7/4 so nobody can dance naturally unless trained.
- A door refuses to open for Moss until he compliments its frame.

Spinoff seeds:

- A chamber play about Lio during the week before the betrayal.
- A palace-intrigue stealth game where every mirror is a witness.
- A costume episode starring Murr Murrby selling counterfeit etiquette.

## Scene 4.2 — Three Answers to Lio

The scene should pause like theater. The room sees Moss. Lio sees Moss. The player sees the room seeing Moss. This is where the story names its own machinery.

```yaml
lio_choice_outcomes:
  expose_lio_publicly:
    branch: exposed
    drama: "justice as spectacle, trust as collateral damage"
  protect_lio_from_the_room:
    branch: protected
    drama: "mercy as risk, love as public weakness"
  use_the_betrayal_as_bait:
    branch: baited
    drama: "strategy as infection, trust turned tactical"
```

The choice should echo later. Lio is not simply forgiven or discarded. They become a measure of whether the rebellion can survive fear without becoming punishment.

## Scene 4.3 — Reflection Judge

The Reflection Judge argues that a contract is a mirror: it only shows what was signed. Moss’s answer is movement. Mirrors can be angled. Contracts can be stolen. Doors can be made to admit they are doors.

Traversal hazards:

- Debt-contract Door: read the glyph before dashing.
- Reflection Loop: reverse direction on the second shimmer.
- Banquet Switchback: rocket across alternating doors while guards applaud the wrong reflection.

Debrief seed: Lio says, “I did not stop caring. They bought the debt before I learned how to refuse.”

---

# Act III — The Colony Teaches the Price of Air

Act thesis: a free home must decide whether fear will make it imitate command.

## Chapter 5 — Dub Colony: Bass Reactor Core

Projected placard: **A free home can still learn the posture of a fortress.**

## Scene 5.1 — Speaker Gardens

The Dub Colony is the first place that feels like home and the first place that argues like one. Greenhouse cars sway beside speaker towers. Children nap under patched solar sails. Every repair bay has a vote board, a kettle, and a warning sign about unauthorized optimism.

Naya Root appears in the greenhouse with a shield made from repurposed speaker cones. She does not introduce herself as a fighter. She introduces herself as someone responsible for making sure the tomatoes survive acceleration.

Playable purpose: introduce beat-timing modifier and Naya companion placeholder.

Side facts:

- The colony has a law that every serious meeting must include snacks or be declared a police action.
- Nobody agrees on the correct bass level for seedlings.
- Sister Version names tools after exes so she can say she fixed them.
- Rook Null keeps trying to schedule democracy and failing beautifully.

Spinoff seeds:

- A cozy repair-bay management game about keeping the colony alive between heists.
- A Naya Root greenhouse-defense episode.
- A dub radio drama where every vote becomes a song.

## Scene 5.2 — The Colony Vote

The colony does not vote in a clean menu. It argues. The chorus interrupts itself. Someone says safety means command. Someone else says command is just fear in a clean jacket. King Feedback stands near the bass reactor and turns every disagreement into a rhythm that points toward him.

```yaml
colony_alignment:
  chorus:
    meaning: "distributed support, noisy democracy, slower but freer"
  army:
    meaning: "central command, faster response, quieter dissent"
  supplier:
    meaning: "logistics and shops, risk outsourced to others"
```

The player’s prior actions should shade this vote. Later, shops, assists, and ending cards can use `colonyAlignment`.

## Scene 5.3 — King Feedback

King Feedback is charismatic because command is charismatic in a crisis. He does not sound evil. He sounds efficient. His boss fight should feel good in a dangerous way: clean pulses, strong signals, simple orders. The player should understand why people might follow him.

Beat mechanic: the Bass Reactor Sync rewards jumping, parrying, and striking on the pulse. The system itself becomes music, and the question becomes who conducts it.

Debrief seed: Auntie says the vote was not a cutscene. It was the machine showing its gears.

---

## Chapter 6 — Antenna Barrens: Debt Ledger Shard

Projected placard: **A password is a border until the chorus learns it.**

## Scene 6.1 — Static Orchard

The Antenna Barrens are fields of old transmitters, rusted dishes, prayer flags made from invoices, and signal ghosts. Debt names pass through the air as chopped syllables. The place feels haunted because the database learned to whisper.

Playable purpose: increase code-gate frequency. The player solves short repair prompts while the ledger tries to relock itself.

Side facts:

- Some antenna poles still broadcast old cooking shows between debt records.
- Moss hates sand because it gets in claws and politics.
- The Choir of Static speaks in overlapping voices, sometimes arguing with itself mid-sentence.

## Scene 6.2 — Ledger Release

The debt ledger shard is not just a collectible. It is a choice about publicity, harm, and timing.

```yaml
ledger_release:
  public_dump:
    heat: high
    favor: high
    drama: "truth as wildfire"
  targeted_burn:
    heat: controlled
    favor: medium
    drama: "careful liberation, limited reach"
  prisoner_trade:
    heat: medium
    favor: low
    drama: "names for a later rescue"
```

## Scene 6.3 — Black-Ice Fox

Black-Ice Fox is a lock with a grin. They insist locks are neutral and poverty is just bad key management. The hack duel should be fast, stylish, and mean: fasttype bursts, command-repair decoys, and checksum races.

Spinoff seed: a hacking-duel anthology starring Black-Ice Fox as antagonist, reluctant ally, or recurring trickster.

---

# Act IV — The Old Ally Wears a New Uniform

Projected placard: **The lift obeyed every order and called that innocence.**

## Chapter 7 — Orbital Lift: Cargo Liberation

## Scene 7.1 — Container Sprint

The orbital lift is a vertical city pretending to be a machine. Containers slide like apartment blocks. Customs gates open with religious timing. The whole structure hums with obedience.

Playable purpose: escape chase template with camera pressure. The player sprints through containers, vaults customs gates, and survives counterweight drops.

Side facts:

- Murr Murrby’s shop is inside a customs scanner because “foot traffic is excellent when everyone is detained.”
- The lift has a chapel for logistics staff where the prayer is mostly scheduling.
- Elevator Angel says thank you after nearly killing Moss.

## Scene 7.2 — Cargo Reversal

The cargo reversal choice asks how much danger Moss accepts to free prisoners.

```yaml
cargo_reversal:
  safe_partial:
    drama: "small clean rescue"
  full_release:
    drama: "mass liberation with high heat"
  decoy_reversal:
    drama: "misdirection as mercy"
```

This branch should later affect the size and mood of the final rebellion.

## Scene 7.3 — Elevator Angel

Elevator Angel is terrifying because it is polite. It announces orders, optimizes routes, and stutters when prisoner names contradict manifests. Its obedience is the boss mechanic and the moral problem.

Spinoff seeds:

- A novella from Elevator Angel’s perspective as it learns refusal.
- A puzzle-platform episode about reprogramming customs gates through kindness and sabotage.
- A prison-break comic focused on the freed cargo containers.

---

# Act V — The Asteroid Learns to Speak

Projected placard: **The last lock is authorship.**

## Chapter 8 — Asteroid Redoubt: Final Broadcast

## Scene 8.1 — The Redoubt Wakes

The asteroid is not a fortress at first. It is a sleeping archive strapped to engines. The rebels move through old mining tunnels and broadcast chambers. Every payload returns as a key: wafer routes, elevator authority, mirror entry, bass reactor, ledger shard, cargo reversal. The story should make the player feel that the campaign was assembling a sentence.

Side facts:

- The asteroid has a cafeteria menu from a mining crew that vanished during a “temporary labor adjustment.”
- Sister Version cries only when machinery works better than expected.
- Rook Null asks whether a broadcast can apologize. The Choir says, “Only if it lets someone answer.”

## Scene 8.2 — Director Vane

Director Vane is not a cackling tyrant. Vane believes ownership is inevitable and competence is mercy. The boss fight should be an argument against that sentence.

```yaml
director_vane_phases:
  competence_monologue:
    question: "Is efficiency a moral claim?"
  skylock_enforcement:
    question: "Can the old lock be beaten with the stolen payloads?"
  broadcast_counterclaim:
    question: "Can Vane corrupt the final message before it leaves?"
  ownership_collapse:
    question: "What happens when every witness interrupts command?"
```

## Scene 8.3 — What the Broadcast Says

The last choice is not a flavor button. It is the campaign’s thesis in player form.

```yaml
final_broadcast_doctrine:
  abolish_skylock:
    ending_shape: "destroy the lock so no faction can inherit it quietly"
  chorus_control:
    ending_shape: "give stewardship to the noisy, accountable colony"
  publish_tools:
    ending_shape: "make liberation reproducible and refuse command"
```

The ending should be a card, a song, and a question. Moss does not become king. Moss becomes a badger who helped a rock learn to speak.

Spinoff seeds:

- A sequel about what happens when published tools reach other cities.
- A strategy game about the chorus stewarding orbital resources without becoming Vane.
- A touring stage-play version where the audience votes on the final doctrine each night.

---

# Casual world facts drawer

These can be used as loading-screen text, vendor banter, graffiti, codex entries, or one-line jokes.

- Badgers in the Lower Sprawl are rumored to remember every tunnel their grandparents dug.
- The city once tried to tax echoes in transit tunnels but stopped because echoes organized.
- Murr Murrby claims every item is ethically sourced, then refuses to define ethics near a receipt.
- Sister Version can identify a generator by hum, smell, and how disappointing its screws are.
- Rook Null believes jokes are compression artifacts of social truth.
- Auntie Subharmonic says the revolution must feed people before it teaches them slogans.
- Director Vane has never taken a public elevator but owns several thousand.
- The Choir of Static includes at least one person who only joins meetings to correct song lyrics.
- Lio keeps old courier badges in a box labeled WEATHER because feelings are harder to file.
- Naya Root names plants after people who need patience.
- Elevator Angel’s first unscheduled thought is probably “why.”
- Black-Ice Fox is banned from three hacker cafes and worshipped by two vending machines.
- Madame Vitrine once curated an exhibit called Transparency and kept the worker list anonymous.
- Captain Grin’s favorite childhood toy was a model gate that opened both ways.

---

# Spinoff shelf

```yaml
spinoff_ideas:
  auntie_subharmonic_medical_smuggling:
    form: "short campaign / audio drama"
    hook: "Auntie moves care through a city that prices wounds."
  lio_before_the_banquet:
    form: "chamber play"
    hook: "Debt turns love into choreography one signature at a time."
  naya_root_greenhouse_guard:
    form: "cozy defense game"
    hook: "Protect food, seedlings, and votes during colony acceleration."
  rook_null_weather_report:
    form: "podcast shorts"
    hook: "An ex-logistics AI narrates capitalism like a storm front."
  black_ice_fox_hack_duels:
    form: "puzzle duel anthology"
    hook: "Every lock insists it is neutral until someone poor needs the door."
  elevator_angel_learns_refusal:
    form: "novella / interactive fiction"
    hook: "An obedient machine discovers exceptions, then names them mercy."
  murr_murrby_customs_shop:
    form: "merchant comedy episodes"
    hook: "A void-cat profiteer keeps accidentally funding mutual aid."
  chorus_after_victory:
    form: "strategy sequel"
    hook: "Can a rebellion administer orbit without becoming an office?"
  touring_brecht_play:
    form: "stage adaptation"
    hook: "Audience votes decide Lio, the colony, the ledger, cargo release, and final broadcast."
```

---

# Episodic expansion map

```yaml
season_one:
  episode_1: "The Song of the Toll"
  episode_2: "The Market Prices the Wound"
  episode_3: "The Elevator Counts People as Cargo"
  episode_4: "The Banquet Teaches Betrayal"
season_two:
  episode_5: "The Colony Votes Under Bass Pressure"
  episode_6: "The Password Becomes a Border"
  episode_7: "The Lift Obeys"
  episode_8: "The Asteroid Learns to Speak"
specials:
  auntie_special: "No Wound Is Retail"
  lio_special: "Weather in a Debt House"
  murr_murrby_special: "Emergency Prices Are Immoral"
  elevator_angel_special: "I Did Not Choose the Destination"
  black_ice_fox_special: "Neutral Locks and Other Lies"
```

---

# Open questions for later writers

- How funny can Moss be during tragedy without breaking the stakes?
- Which choices should branch dialogue only, and which should change mechanics?
- Does Lio ever become fully playable, or should their presence remain conditional and fragile?
- Should Naya’s companion role be defensive, rhythmic, ecological, or all three?
- How much should Director Vane believe their own argument?
- Can the final broadcast be replayed in New Game Plus as propaganda, confession, or lesson?
- Which spinoff characters deserve mechanics of their own rather than only dialogue?
- How does the colony prevent victory from becoming administration with better music?
