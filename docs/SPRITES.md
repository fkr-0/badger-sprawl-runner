# Sprite Requirements

All sprites are original production targets. Current prototype draws placeholders, but filenames and animation contracts are listed in `data/sprites.json`.

## Sprite sheet rules

```yaml
sprite_sheet_contract:
  tile: 16x16 or 32x32 base grid
  player_frame: 48x48
  enemy_frame: 32x32 or 48x48
  effects_frame: 32x32
  export: png with transparent background
  naming: "entity_action_variant.png"
  animation_metadata: "data/sprites.json"
```

## Player: Moss badger

| Animation | Frames | Notes |
|---|---:|---|
| idle | 6 | breathing, whisker antenna blink |
| run | 8 | readable foot cycle, tail bob |
| skid | 3 | dust spark, leaned back |
| jump_up | 3 | launch squash, rising pose |
| fall | 3 | coat flutters |
| land | 2 | squash + dust |
| melee_claws | 5 | fast white claw arcs |
| melee_katana | 7 | draw slash with one bright smear |
| shoot_railgun | 5 | recoil, muzzle flash |
| rocket_boost | 6 | backpack flame and smoke |
| hit | 3 | grey rally-health flash |
| hack | 4 | crouched terminal typing |
| victory | 8 | badger fist + pirate antenna |

## Environment sprites

| Category | Assets |
|---|---|
| Lower Sprawl | brick tiles, wet asphalt, neon signs, cable bundles, drain pipes, market awnings |
| Chrome Arcology | glass floors, elevator rails, indoor trees, security gates, holo ads |
| Mirror Palace | reflective tiles, luxury columns, zero-g fountains, fake doors, mirror shards |
| Dub Colony | speaker stacks, bass platforms, solar sail cloth, studio racks, herb planters, train cars |
| Antenna Barrens | pylons, storm clouds, wire bridges, satellite dishes, battery towers |
| Asteroid Redoubt | low-grav rock tiles, rebel banners, vacuum doors, transmitter dishes, cargo crates |

## Item sprites

| Item | Pickup | UI icon | Held/active visual |
|---|---|---|---|
| rocket backpack | backpack crate | flame pack | attached to Moss back |
| railgun | long case | rail coil | held forward, recoil flash |
| stim pack | green ampoule | syringe cross | quick injection sparkle |
| katana | cloth-wrapped blade | blade glyph | draw slash arc |
| signal jammer | radio bug | static disk | expanding ring |
| phase pick | lock needle | purple pick | wall crack shimmer |
| dub shield | speaker coin | bass circle | beat pulse bubble |
| gravity talisman | black stone | spiral | inverted dust swirl |

## Combat and VFX sprites

| Effect | Frames | Purpose |
|---|---:|---|
| claw_arc | 4 | melee hitbox visibility |
| katana_smear | 6 | perfect timing reward |
| rail_muzzle | 4 | shot feedback |
| rail_trail | 3 | projectile trail |
| emp_spark | 6 | perfect reload impact |
| rocket_flame | 6 | item-use feedback |
| landing_dust | 5 | physics juice |
| parry_flash | 3 | timing confirmation |
| code_gate_unlock | 8 | minigame success |

## UI sprites

| UI element | Notes |
|---|---|
| health pip | badger claw mark / red-grey rally overlay |
| rocket fuel | small cell icons |
| rail reload bar | circular sweet spot |
| heat meter | alarm badge filling up |
| shop card frame | item, price, faction discount |
| code gate panel | monospace terminal plate |
