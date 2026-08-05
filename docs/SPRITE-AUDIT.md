# Sprite Audit Report

> **Latest production-art review:** see [`docs/sprite-production/STATE-REVIEW.md`](sprite-production/STATE-REVIEW.md) and [`docs/sprite-production/FULL-SCOPE-PLAN.md`](sprite-production/FULL-SCOPE-PLAN.md) for the 2026-07-21 approved-style render queue and expansion scope.

Generated: 2026-06-06
Updated: 2026-07-19 (reviewed DALL-E import, runtime reachability, and sprite-tiled terrain)

## Summary

| Category | Count | Animations | Status |
|---|---|---|---|
| Total sprite sheets | 71 | 400+ | 69 runtime-reachable, 2 explicit archival sources |
| Player / Moss source | 3 sheets | 17-state production atlas + source grids | Production atlas active |
| Enemies | 16 sheets | 7 each | Authored/imported and runtime-bound |
| Bosses | 8 sheets | 11 each | Authored/imported and runtime-bound |
| Characters/NPCs | 20 sheets | 5 each | Dialogue/story runtime-bound |
| World tiles | 8 sheets | 7 each | Stage registry renders all eight; five reviewed DALL-E boards imported |
| World parallax/backdrops | 10 sheets | 3-layer atlases plus backdrop | Nine runtime assets, one superseded archive |
| Items and item icons | 4 sheets | 23 pickups and matching UI coverage | Core + extended production atlases |
| Skill icons | 1 sheet | 20 | Four tracks × five tiers |
| VFX combat | 1 sheet | 11 | Production source |

Current release contracts:

- 55 DALL-E-imported atlases, all referenced by production code or data.
- 69/69 runtime sheets reachable; `comfy_badger_run_grid` and `mirror_palace_parallax` are explicit archival inputs.
- `matching.txt` contains the reviewed supplemental mapping ledger; item boards 68–70 are preserved as alternatives rather than falsely assigned to one live atlas.
- Platform collision geometry is now covered by stage-specific sprite tiles and animated decorative props instead of vector-only grey rectangles.

## Completed Fixes

### 0. Missing Runtime Atlases and Build Path (DONE 2026-07-13)

Generated 40 deterministic, contract-sized pixel-art fallback atlases for source sheets that were absent from `assets/`, including dedicated Drainmarket tile and parallax sheets that had previously been omitted. The generated set covers Moss, item sheets, missing world tiles and parallax layers, five enemies, five bosses, and twelve character/faction sheets.

The fallbacks use animation-aware pose changes and category-specific silhouettes, equipment, effects, and palettes. They are intentionally reviewable interim art rather than final production replacements.

- Generator: `scripts/generate-missing-sprites.mjs`
- Generate absent source sheets: `pnpm sprites:missing`
- Preview the pending generation list: `pnpm sprites:missing:dry`
- Runtime assets are synchronized into `apps/runner/public/assets/sprites/`
- Vite now serves `apps/runner/public`, matching the validated sprite manifest layout
- The production smoke test verifies `dist/data/sprites.json` and all 65 referenced atlases
- Quality check after generation: 0 missing sheets, 0 blank frames, 0 near-empty frames

### 1. Background Removal (DONE)

Fixed placeholder generator to use alpha=60 borders instead of alpha=130.
All 63 placeholder sprites now have clean transparent backgrounds.

- `generate-placeholder-sprites.mjs`: Border alpha changed from 130 to 60
- Semi-transparent white background pattern eliminated
- Items that were 100% opaque now have proper transparency

### 2. Missing Item Pickup Animations (DONE)

Added 9 missing pickup animations to `items_core`:

| Item | Animation Added |
|---|---|
| claws | `claws_pickup` |
| phase_pick | `phase_pick_pickup` |
| echo_cassette | `echo_cassette_pickup` |
| gravity_talisman | `gravity_talisman_pickup` |
| nanofur_weave | `nanofur_weave_pickup` |
| solder_mite_swarm | `solder_mite_swarm_pickup` |
| black_ice_tooth | `black_ice_tooth_pickup` |
| bassline_boots | `bassline_boots_pickup` |
| contraband_seed_key | `contraband_seed_key_pickup` |

All 22 items now have matching pickup animations in `items_core` and icons in `item_icons`.

### 3. World Name Consistency (DONE)

Fixed `game-manifest.json` to list all 8 chapter worlds:

| # | World | Chapter |
|---|---|---|
| 1 | Lower Sprawl | ch01 |
| 2 | Drainmarket | ch02 |
| 3 | Chrome Arcology | ch03 |
| 4 | Straylight Mirage | ch04 |
| 5 | Dub Colony | ch05 |
| 6 | Antenna Barrens | ch06 |
| 7 | Orbital Lift | ch07 |
| 8 | Asteroid Redoubt | ch08 |

Also normalized `asteroid_redoubt_final_broadcast` -> `asteroid_redoubt` in sprites.json.

### 4. Anchor Metadata (DONE)

Added center-bottom anchors to all entity sheets:

| Entity Type | Frame Size | Anchor | Rationale |
|---|---|---|---|
| Player (Moss) | 48x48 | [24, 44] | Feet-center, pre-existing |
| Enemies | 48x48 | [24, 44] | Feet-center |
| Bosses | 96x96 | [48, 88] | Feet-center, scaled |
| Characters | 48x48 | [24, 44] | Feet-center |
| Items (pickups) | 32x32 | [16, 16] | Center |

Total: 300 animations received anchor metadata.

### 5. World Tile Variety (DONE)

Expanded all non-Lower-Sprawl worlds from 4 to 7 tile animations each, and added the previously absent dedicated Drainmarket tile atlas.

Added per world:
- 1 extra solid/collision_safe tile
- 1 extra decorative tile  
- 1 extra animated_prop tile

| World | Animations |
|---|---|
| lower_sprawl_tiles | 7 (was 7) |
| drainmarket_tiles | 7 (new dedicated sheet) |
| chrome_arcology_tiles | 7 (was 4) |
| straylight_mirage_tiles | 7 (was 4) |
| dub_colony_tiles | 7 (was 4) |
| antenna_barrens_tiles | 7 (was 4) |
| orbital_lift_tiles | 7 (was 4) |
| asteroid_redoubt_tiles | 7 (was 4) |

## Anchor Analysis

### Moss Badger

All 17 animations use consistent anchor `[24, 44]` on 48x48 frames. Correct feet-center placement.

### Items (items_core)

All 22 pickup animations now have anchor `[16, 16]` (center of 32x32 frames).

### Enemies/Bosses/Characters

All 300 entity animations now have anchors:
- Enemies: `[24, 44]` on 48x48 frames
- Bosses: `[48, 88]` on 96x96 frames
- Characters: `[24, 44]` on 48x48 frames

## Sprite Dimension Matrix

| Sheet Type | Frame Size | Grid | Total Atlas Size | Animations |
|---|---|---|---|---|
| Player Moss | 48x48 | 8x17 | 384x816 | 17 |
| Enemies | 48x48 | 6x7 | 288x336 | 7 |
| Bosses | 96x96 | 10x11 | 960x1056 | 11 |
| Characters | 48x48 | 6x5 | 288x240 | 5 |
| Items core | 32x32 | 4x22 | 128x704 | 22 |
| Item icons | 32x32 | 4x4 | 128x128 | 15 (1-frame each) |
| VFX combat | 32x32 | 8x11 | 256x352 | 11 |
| World tiles | 32x32 | 4x7 | 128x224 | 7 |
| World parallax | 320x180 | 3x1 | 960x180 | 3 |

## Remaining Creation Tasks

### For Production Art Replacement

1. **Replace all 63 placeholder PNGs** with final production sprites
   - Use `llm-sprite-generation/` prompts as generation starting point
   - Maintain frame sizes, grid layouts, and animation contracts
   - Target 4x4 max prompt grids per batch

2. **Hurtbox/hitbox metadata** for enemies and bosses
   - Currently encoded in Moss but not in enemies/bosses
   - Needed for combat system integration

3. **Per-frame hitbox events** for combat animations
   - Currently only Moss has hitbox event markers
   - Enemies/bosses need `hitbox` events for attack frames

4. **Dialogue portrait crops** from character sheets
   - Characters have 5 anims (idle/talk/assist/react/exit)
   - May need separate portrait sheet for dialogue UI

### Post-v1 Nice-to-Have

1. Per-stage sprite prompt manifests for bespoke art
2. Visual regression snapshots for key gameplay HUDs
3. Asset provenance and license metadata
4. Weather/time-of-day palette variants
5. Foreground silhouette strips for parallax depth

## Scripts

- `scripts/generate-placeholder-sprites.mjs` - Regenerate all placeholder atlases
- `scripts/postprocess-sprites-fast.py` - Background removal for AI-generated sprites
- `tests/public-sprite-assets.mjs` - Verify sprite manifest consistency
- `tests/animation-contracts.mjs` - Verify animation contract completeness
