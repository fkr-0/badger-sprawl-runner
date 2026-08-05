---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
status: planned_full_scope
source_catalog: llm-sprite-generation/remaining-gaps.yml
category: world_gameplay_gap
world: antenna_barrens
target_atlas: assets/sprites/worlds/expansion/antenna_barrens_gameplay_tiles.png
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
render_job_count: 6
---

# Antenna Barrens: Gameplay-Specific Tile States

These jobs close a specifically audited animation or tile gap. Render each job independently; do not merge the whole bundle into one image request.

## Render job `antenna_barrens_gameplay_tiles__signal_snow`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: antenna_barrens_gameplay_tiles__signal_snow
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: wind-scoured uplink desert, rust plates, wire bridges, dead dishes, battery towers, signal snow, chalk logic and lightning.
Palette: sun-faded ochre, rust red, electric cyan, storm violet, black cable and lightning white.
Tile or prop: Signal Snow.
Existing visual cue: eight crisp static phases with stable alpha density and no readable symbols.
Runtime tags: environment_tile, planned_gameplay_tile.
Frames: 8. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: eight crisp static phases with stable alpha density and no readable symbols.
Runtime intent: future:antenna_signal_snow.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `antenna_barrens_gameplay_tiles__static_mast`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: antenna_barrens_gameplay_tiles__static_mast
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: wind-scoured uplink desert, rust plates, wire bridges, dead dishes, battery towers, signal snow, chalk logic and lightning.
Palette: sun-faded ochre, rust red, electric cyan, storm violet, black cable and lightning white.
Tile or prop: Static Mast.
Existing visual cue: quiet mast, charge tell, lightning branch, full arc, residual current, safe reset.
Runtime tags: hazard_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: quiet mast, charge tell, lightning branch, full arc, residual current, safe reset.
Runtime intent: future:antenna_static_mast.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `antenna_barrens_gameplay_tiles__regex_terminal`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: antenna_barrens_gameplay_tiles__regex_terminal
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: wind-scoured uplink desert, rust plates, wire bridges, dead dishes, battery towers, signal snow, chalk logic and lightning.
Palette: sun-faded ochre, rust red, electric cyan, storm violet, black cable and lightning white.
Tile or prop: Regex Terminal.
Existing visual cue: idle terminal without text, malformed pulse, correction activity, valid confirmation, public exploit state, reset.
Runtime tags: interactive_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: idle terminal without text, malformed pulse, correction activity, valid confirmation, public exploit state, reset.
Runtime intent: future:antenna_regex_terminal.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `antenna_barrens_gameplay_tiles__lightning_pylon`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: antenna_barrens_gameplay_tiles__lightning_pylon
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: wind-scoured uplink desert, rust plates, wire bridges, dead dishes, battery towers, signal snow, chalk logic and lightning.
Palette: sun-faded ochre, rust red, electric cyan, storm violet, black cable and lightning white.
Tile or prop: Lightning Pylon.
Existing visual cue: grounded pylon, cloud charge, strike tell, lightning impact, ground arc, recovery.
Runtime tags: hazard_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: grounded pylon, cloud charge, strike tell, lightning impact, ground arc, recovery.
Runtime intent: future:antenna_lightning_pylon.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `antenna_barrens_gameplay_tiles__wire_bridge`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: antenna_barrens_gameplay_tiles__wire_bridge
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: wind-scoured uplink desert, rust plates, wire bridges, dead dishes, battery towers, signal snow, chalk logic and lightning.
Palette: sun-faded ochre, rust red, electric cyan, storm violet, black cable and lightning white.
Tile or prop: Wire Bridge.
Existing visual cue: stable bridge, wind bend, maximum sway, return.
Runtime tags: moving_tile, planned_gameplay_tile.
Frames: 4. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: stable bridge, wind bend, maximum sway, return.
Runtime intent: future:antenna_wire_bridge.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `antenna_barrens_gameplay_tiles__brittle_dish`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: antenna_barrens_gameplay_tiles__brittle_dish
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: wind-scoured uplink desert, rust plates, wire bridges, dead dishes, battery towers, signal snow, chalk logic and lightning.
Palette: sun-faded ochre, rust red, electric cyan, storm violet, black cable and lightning white.
Tile or prop: Brittle Dish.
Existing visual cue: intact dish, dented dish, collapse, broken mast debris.
Runtime tags: breakable_tile, planned_gameplay_tile.
Frames: 4. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: intact dish, dented dish, collapse, broken mast debris.
Runtime intent: future:antenna_dish_break.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
