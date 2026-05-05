# Full Game Logic: Badger Sprawl Runner

## 1. Design frame

```yaml
core_identity:
  format: "sprite-first 2D side-scrolling hack-and-slash jump-and-run"
  structure: "worlds -> stages -> setpieces -> sub-bosses -> world endboss"
  dramatic_model: "Brechtian episode drama: each world is a social machine exposed through songs, placards, treason, and argument"
  player_role: "Moss, badger courier turned rebel tactician"
  companion_role: "computer-controlled fighters join for story-relevant areas and change combat, dialogue, and route access"
```

The game is staged like a sequence of visible mechanisms rather than a hidden illusion. Each chapter can open with a projected title card, a short song/slogan from the dub colony, and a narrator line that tells the player what injustice will be exposed. Characters sometimes step outside the immediate plot and comment on why the heist matters.

## 2. Primary game states

```text
Title
  -> ProfileSelect
  -> ColonyHub
      -> DialogueScene
      -> ShopScene
      -> SkillTreeScene
      -> MissionBriefing
          -> StageRun
              -> Exploration
              -> CombatArena
              -> CodeGate
              -> CompanionSetpiece
              -> SubBoss
              -> HeistObjective
              -> EscapeChase
              -> EndBoss
          -> ResultsScreen
      -> Betrayal/DramaInterlude
  -> FinalRebellion
  -> EpilogueVariant
```

## 3. Character attributes

```yaml
attributes:
  vigor:
    affects: [max_hp, rally_health_recovery]
  sinew:
    affects: [melee_damage, knockback_resistance, parry_stun]
  voltage:
    affects: [railgun_damage, emp_duration, drone_break]
  velocity:
    affects: [run_speed, air_control, dodge_recovery]
  cortex:
    affects: [hack_time_limit, mistake_forgiveness, code_gate_rewards]
  bass:
    affects: [beat_items, dub_shield, companion_sync]
  guile:
    affects: [shop_prices, stealth_routes, betrayal_detection]
```

## 4. Derived stats

```yaml
derived_stats:
  hp: "5 + vigor * 1"
  rally_window: "1.2s + vigor * 0.05s"
  claw_damage: "1 + floor(sinew / 3)"
  katana_damage: "2 + floor(sinew / 2)"
  rail_damage: "2 + floor(voltage / 2)"
  max_speed: "285 + velocity * 8 px/s"
  hack_time_bonus: "cortex * 0.45s"
  shop_discount: "min(30%, guile * 2%)"
  companion_sync_rate: "base + bass * 3%"
```

## 5. Combat loop

```text
read telegraph
  -> dodge / jump / parry / interrupt
  -> punish with claw, katana, railgun, or companion sync
  -> build tempo meter
  -> spend tempo on rocket burst, EMP strike, or companion command
  -> rally lost health by counterattacking
```

## 6. Skill trees

### Clawline tree

| Node | Cost | Unlock |
|---|---:|---|
| Double Swipe | 1 | second claw tap within 220 ms |
| Burrow Uppercut | 2 | crouch + melee launches small enemies |
| Parry Tooth | 2 | successful parry refunds melee recovery |
| Katana Draw | 3 | post-parry draw slash |
| Red Fur Rally | 4 | rally heal increased by 25% |

### Rail tree

| Node | Cost | Unlock |
|---|---:|---|
| Coil Discipline | 1 | railgun reload indicator |
| Perfect Reload | 2 | sweet spot overpenetration |
| Magnet Slug | 2 | pulls small drones into line |
| Wall Pierce | 3 | rail shot breaks cracked panels |
| Star-Killer Pin | 4 | boss armor plates can be cracked |

### Rocket tree

| Node | Cost | Unlock |
|---|---:|---|
| Soft Ignition | 1 | safer vertical boost |
| Vector Burst | 2 | boost follows held input vector |
| Heat Skim | 2 | graze hazards to recharge fuel |
| Rocket Cancel | 3 | cancel melee recovery with boost |
| Comet Badger | 4 | final rocket dive attack |

### Cortex tree

| Node | Cost | Unlock |
|---|---:|---|
| Terminal Eyes | 1 | highlight hack terminals |
| Forgive Typo | 2 | first mistake ignored |
| Regex Teeth | 2 | regex gates reveal false choices |
| Ghost Script | 3 | companion can hold one gate open |
| Root Choir | 4 | perfect hack lowers global heat |

### Bass/Companion tree

| Node | Cost | Unlock |
|---|---:|---|
| Downbeat Guard | 1 | dub shield beat cue |
| Call-and-Response | 2 | companion assist command |
| Sync Step | 2 | companion copies jump route better |
| Rebel Chorus | 3 | two companions in selected finale rooms |
| Sound-System Revolt | 4 | final rebellion crowd attack |

## 7. Item logic

```yaml
item_categories:
  weapon: "railgun variants, katana variants, claw mods"
  active: "rocket backpack, signal jammer, dub shield, echo cassette"
  passive: "nanofur, boots, talismans, shop charms"
  hack: "black ice tooth, ghost script wafer, regex lens"
  companion: "AI uplink cards that modify ally behavior"
  story: "keys, ledgers, betrayal proofs, rebel transmitters"
```

Items have `tags`. Skills and companions react to tags. Example: a `beat` item gets stronger with Bass, a `hack` item with Cortex, and a `rail` item with Voltage.

## 8. Companion fighter logic

Computer-controlled fighters are not generic pets. Each joins because a stage requires their knowledge, betrayal, repair ability, or political standing.

```yaml
companion_ai:
  modes:
    follow: "stay near Moss, avoid pits, mirror jumps with forgiving teleport catch-up"
    flank: "attack enemies from opposite side"
    guard: "block shots and rescue Moss once per room"
    hack: "hold a terminal channel while Moss types or fights"
    setpiece: "perform scripted story move: open bridge, betray, rescue, broadcast"
  command_meter:
    source: "tempo from hits, parries, clean landings, successful hacks"
    spend: "companion assist attack or utility"
  story_flags:
    trust: "increases from matching values in dialogue"
    doubt: "increases when player takes corporate shortcuts"
    betrayal_possible: "some allies can leave or turn if trust is low"
```

## 9. Dialogue system

Classic RPG boxes with large portraits and clear speaker names.

```yaml
dialogue_box:
  layout: "bottom third of screen"
  portrait: "left"
  speaker_name: "top border"
  text: "2-4 lines, typewriter reveal optional"
  choices: "1-4 answers, shown as stacked buttons"
  flags: "trust, heat, quest, shop discount, route access"
```

## 10. Merchant system

A travelling cat-like merchant homage without copying any named character: **Murr Murrby**, a smug ring-tailed void-cat with a backpack shrine and folding counter. He appears in impossible places, sells essentials, and comments on capitalism with theatrical cheer.

```yaml
merchant_logic:
  appears:
    - before sub-boss rooms
    - after hard code gates
    - inside dub colony hub
    - during escape routes as a joke kiosk
  inventory_sources:
    base: [stim_pack, repair_cell, rail_slug]
    world: "local themed items"
    trust: "rebellion discounts"
    heat: "danger raises prices"
  personality:
    - cheerful profiteer
    - secretly funds rebel clinics
    - refuses to sell betrayal-proof items because that would ruin the lesson
```

## 11. Brechtian drama structure

```text
Prologue: The Song of the Toll
Act I: The Badger Sells His Feet
Act II: The Colony Teaches the Price of Air
Act III: Treason at the Mirror Banquet
Act IV: The Old Ally Wears a New Uniform
Act V: The Asteroid Learns to Speak
Epilogue: The Audience Is Asked Who Owns the Sky
```

Treason is not a twist for shock only. It reveals material pressure: debt, fear, old loyalties, hunger, ideology, and survival. New and old allies return with changed motives.

## 12. Ending variants

| Ending | Trigger | Result |
|---|---|---|
| Broadcast Revolt | balanced trust, low/moderate heat | asteroid becomes free transmitter and mutual-aid relay |
| Hardline Orbit | high heat, many lethal choices | rebellion wins but militarizes |
| Bargain Sky | accept corporate deals | tolls fall briefly, debt machine survives |
| Choir Ending | max companion trust, perfect final hack | citizens rewrite ledger collectively |
| Badger Alone | betrayal cascades | Moss wins duel but loses movement backing |
