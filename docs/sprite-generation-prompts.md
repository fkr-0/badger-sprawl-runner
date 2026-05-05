# Sprite Generation Prompts for Image LLM

This file contains structured prompts designed for image generation LLMs (like DALL-E, Midjourney, or Stable Diffusion) to create pixel art sprite grids for the Badger Sprawl Runner game.

Each prompt is encoded with:
- **Style Context**: Cyberpunk aesthetic with specific visual themes
- **Technical Specs**: Frame sizes, animation requirements, grid layout
- **Visual References**: Specific details from the game's lore and design
- **Animation Sequences**: Frame-by-frame descriptions for proper sprite sheet layout

## Core Style Prompt (Apply to All Sprites)

```
PIXEL ART SPRITE SHEET for CYBERPUNK PLATFORMER GAME:
- 16-bit era pixel art style (SNES/Genesis aesthetic)
- CYBERPUNK CYBERDECK aesthetic: neon blues/pinks, holographic glitches, wet streets, cable nests
- BADGER PROTAGONIST: anthropomorphic badger courier with wetware whiskers, cybernetic enhancements
- STREET LEVEL: sweaty markets, food stalls, scooters, rain-slicked streets, pirate radio antennas
- DUB COLONY: warm bass culture, collective workshops, smoke-lit repair bays, radical joy, rebel banners
- REBELLION: scrappy anti-authoritarian aesthetic, funny/dangerous, corporate sabotage themes
- Color palette: electric blues, toxic greens, warning reds, holographic purples, street-level browns/grays
- Maintain consistent character design across all animations
```

## 1. Player Character: Moss Badger (48x48 frames)

**Sprite Sheet Layout**: 13 rows × max frames per animation
**Grid Size**: 48x48 pixels per frame
**Total Dimensions**: ~624x624 pixels (adjust based on longest animation)

**Prompt for Image Generation LLM:**

```
CREATE PIXEL ART SPRITE SHEET GRID for CYBERPUNK BADGER COURIER named MOSS:

CHARACTER DESIGN:
- Anthropomorphic badger with cybernetic enhancements
- Wetware whiskers that glow blue when "thinking"
- Street courier aesthetic: worn jacket, cargo pants, boots
- Cyberpunk details: antenna implants, data ports, rebel patches
- Expression: determined but scrappy, badger stubbornness

ANIMATION SEQUENCE GRID (left to right, top to bottom):

ROW 1: IDLE (6 frames) - breathing cycle, whisker antenna blink
- Frame 1-2: standing relaxed, slight breathing movement
- Frame 3-4: whisker glow pulse, looking alert
- Frame 5-6: weight shift, tail twitch

ROW 2: RUN (8 frames) - readable foot cycle, tail bob
- Frame 1-4: left foot forward, right arm swing
- Frame 5-8: right foot forward, left arm swing
- Dust particles, dynamic coat movement

ROW 3: SKID (3 frames) - dust spark, leaned back
- Frame 1: skid start, back leg extended
- Frame 2: maximum lean, spark effects
- Frame 3: skid end, forward momentum

ROW 4: JUMP_UP (3 frames) - launch squash, rising pose
- Frame 1: crouch compression
- Frame 2: launch explosion
- Frame 3: rising arc, coat flutter

ROW 5: FALL (3 frames) - coat flutters, worried expression
- Frame 1: early fall, slight curl
- Frame 2: full fall, maximum spread
- Frame 3: terminal velocity, streamlined

ROW 6: LAND (2 frames) - squash + dust cloud
- Frame 1: impact compression
- Frame 2: bounce recovery, dust puff

ROW 7: MELEE_CLAWS (5 frames) - fast white claw arcs
- Frame 1: draw back
- Frame 2-3: triple claw strike, energy arcs
- Frame 4-5: follow-through, retract

ROW 8: MELEE_KATANA (7 frames) - draw slash with bright smear
- Frame 1: sheath draw
- Frame 2-4: slash arc with blue energy smear
- Frame 5-7: flourish finish, resheath

ROW 9: SHOOT_RAILGUN (5 frames) - recoil, muzzle flash
- Frame 1: aim and charge
- Frame 2-3: fire with recoil, blue plasma flash
- Frame 4-5: recovery, smoke trail

ROW 10: ROCKET_BOOST (6 frames) - backpack flame and smoke
- Frame 1: ignition start
- Frame 2-4: full boost, flame trail, speed lines
- Frame 5-6: burnout, smoke cloud

ROW 11: HIT (3 frames) - grey rally-health flash overlay
- Frame 1: impact stun
- Frame 2: flash grey (damage indicator)
- Frame 3: recovery shake

ROW 12: HACK (4 frames) - crouched terminal typing
- Frame 1: approach terminal
- Frame 2-3: typing animation, data streams
- Frame 4: success flash, stand up

ROW 13: VICTORY (8 frames) - badger fist + pirate antenna
- Frame 1-4: fist pump cycle
- Frame 5-8: antenna adjustment, victory pose

TECHNICAL REQUIREMENTS:
- 48x48 pixel frames
- Transparent background
- Consistent lighting from left side
- Particle effects: dust, sparks, energy glows
- Maintain silhouette readability at all distances
```

## 2. Environment Tiles: Lower Sprawl (32x32 frames)

**Sprite Sheet Layout**: 6 tiles × 1 row (static) + animations below
**Grid Size**: 32x32 pixels per frame

**Prompt for Image Generation LLM:**

```
CREATE PIXEL ART ENVIRONMENT TILE SET for LOWER SPRAWL DISTRICT:

SETTING: Wet streets, cable nests, food stalls, scooters, rain-slicked asphalt, neon signs, market awnings

TILE DESIGNS (32x32 pixels each):

ROW 1: STATIC TILES
- BRICK_TILE: weathered red brick, urban decay, street level
- WET_ASPHALT: rain-puddled black asphalt, neon reflections
- CABLE_BUNDLE: tangled black cables, data ports, urban infrastructure
- DRAIN_PIPE: rusty metal pipe, water dripping, sewer access

ROW 2: ANIMATED ELEMENTS
- NEON_SIGN (4 frames): flickering "OPEN" sign, blue/pink glow, electrical sparks
- MARKET_AWNING (2 frames): striped canvas awning, wind flutter, market stall

VISUAL STYLE:
- Cyberpunk decay: rust, neon, urban grime
- Street level perspective: puddles, litter, cables
- Lighting: harsh neon from above, reflections in wet surfaces
- Color palette: asphalt blacks, neon blues/pinks, rusty browns, warning yellows
```

## 3. Items Core (32x32 frames)

**Sprite Sheet Layout**: 6 items × 4 frames each (pickup animations)
**Grid Size**: 32x32 pixels per frame

**Prompt for Image Generation LLM:**

```
CREATE PIXEL ART ITEM PICKUP SPRITES for CYBERPUNK PLATFORMER:

ITEM DESIGNS (32x32 pixels, 4-frame pickup animations each):

ROW 1-4: ROCKET_BACKPACK_PICKUP
- Crate with flame decals, cybernetic backpack inside
- Animation: glow pulse, open reveal, energy spark, ready state

ROW 5-8: RAILGUN_PICKUP
- Long black case, glowing rail coils visible
- Animation: case unlock, weapon reveal, charge flash, ready state

ROW 9-12: STIM_PACK_PICKUP
- Green ampoule with syringe, medical cross symbol
- Animation: liquid glow, needle gleam, activation spark, ready state

ROW 13-16: KATANA_PICKUP
- Cloth-wrapped blade in stand, traditional yet cyberpunk
- Animation: cloth flutter, blade gleam, energy arc, ready state

ROW 17-20: SIGNAL_JAMMER_PICKUP
- Radio bug device, antenna array, static interference
- Animation: signal pulse, antenna extend, interference wave, ready state

ROW 21-24: DUB_SHIELD_PICKUP
- Speaker coin with bass waves, dub culture symbol
- Animation: bass pulse, sound waves, energy ripple, ready state

VISUAL STYLE:
- High-tech loot aesthetic: glowing effects, holographic labels
- Pickup feedback: rotation, glow pulses, particle effects
- Color coding: rocket=red, rail=blue, stim=green, katana=purple, jammer=yellow, dub=orange
```

## 4. Combat VFX (32x32 frames)

**Sprite Sheet Layout**: 9 effects × variable frames
**Grid Size**: 32x32 pixels per frame

**Prompt for Image Generation LLM:**

```
CREATE PIXEL ART COMBAT EFFECT SPRITES for CYBERPUNK BADGER PLATFORMER:

EFFECT DESIGNS (32x32 pixels each):

ROW 1-4: CLAW_ARC (4 frames)
- White energy claw trails, fast melee feedback
- Animation: arc start, triple claw marks, energy fade, disappear

ROW 5-10: KATANA_SMEAR (6 frames)
- Bright blue slash smear, perfect timing reward
- Animation: draw, slash arc, energy trail, impact flash, fade out

ROW 11-14: RAIL_MUZZLE (4 frames)
- Blue plasma muzzle flash, railgun shot feedback
- Animation: charge, fire burst, smoke trail, dissipate

ROW 15-17: RAIL_TRAIL (3 frames)
- Projectile trail effect, follows railgun shot
- Animation: trail start, full trail, fade end

ROW 18-23: EMP_SPARK (6 frames)
- Electric spark burst, perfect reload impact
- Animation: charge, multi-spark explosion, energy waves, fade

ROW 24-29: ROCKET_FLAME (6 frames)
- Rocket boost flame trail, item-use feedback
- Animation: ignition, full flame, smoke cloud, burnout

ROW 30-34: LANDING_DUST (5 frames)
- Ground impact dust cloud, physics juice
- Animation: impact puff, dust spread, settle, disappear

ROW 35-37: PARRY_FLASH (3 frames)
- White defensive flash, timing confirmation
- Animation: impact, bright flash, fade out

ROW 38-45: CODE_GATE_UNLOCK (8 frames)
- Holographic unlock sequence, minigame success
- Animation: lock icon, data streams, unlock flash, success particles

VISUAL STYLE:
- Energy effects: blue plasma, white flashes, electric sparks
- Particle systems: smoke, dust, energy waves
- Combat feedback: clear hit indicators, timing rewards
- Cyberpunk aesthetic: holographic glitches, neon glows
```

## Technical Implementation Notes

### Grid Layout Convention
- **Horizontal Layout**: Frames flow left to right within each animation
- **Vertical Layout**: Animations stack top to bottom
- **Consistent Spacing**: 1-2 pixel gaps between animations for easy cutting
- **Origin Points**: All sprites centered on their 32x48 pixel frames

### Color Palette Standards
- **Primary Colors**: Electric blue (#00FFFF), toxic green (#00FF00), warning red (#FF0000)
- **Secondary Colors**: Holographic purple (#8000FF), street brown (#8B4513), neon pink (#FF1493)
- **Neutrals**: Asphalt black (#000000), concrete gray (#808080), rust brown (#B7410E)

### Animation Timing Guidelines
- **Combat Effects**: 16-24 FPS for fast feedback
- **Movement**: 8-14 FPS for readable cycles
- **Environmental**: 4-6 FPS for subtle animation
- **UI Elements**: 8-12 FPS for responsive feel

### Export Requirements
- **Format**: PNG with transparency
- **Background**: Pure transparent (no checkerboard artifacts)
- **Metadata**: Frame dimensions and animation data preserved in accompanying JSON
- **Resolution**: Pixel-perfect, no anti-aliasing or smoothing

This prompt system ensures consistent visual style across all sprite assets while providing detailed technical specifications for proper implementation in the game engine.
