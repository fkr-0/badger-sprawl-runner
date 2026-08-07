---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
status: planned_full_scope
source_catalog: docs/sprite-production/remaining-gaps.yml
category: world_gameplay_gap
world: asteroid_redoubt
target_atlas: assets/sprites/worlds/expansion/asteroid_redoubt_gameplay_tiles.png
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
render_job_count: 6
---

# Asteroid Redoubt: Gameplay-Specific Tile States

These jobs close a specifically audited animation or tile gap. Render each job independently; do not merge the whole bundle into one image request.

## Render job `asteroid_redoubt_gameplay_tiles__low_grav_spark_gap`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: asteroid_redoubt_gameplay_tiles__low_grav_spark_gap
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: low-gravity rebel outpost, regolith blocks, transmitter roots, cargo crates, radio shrines, solar foil and public murals.
Palette: regolith grey, rebel red, solar gold, transmitter cyan, greenhouse green and void black.
Tile or prop: Low Grav Spark Gap.
Existing visual cue: quiet gap, charge motes, first arc, active low-gravity arc, drifting residuals, safe reset.
Runtime tags: hazard_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: quiet gap, charge motes, first arc, active low-gravity arc, drifting residuals, safe reset.
Runtime intent: future:asteroid_spark_gap.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `asteroid_redoubt_gameplay_tiles__transmitter_root`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: asteroid_redoubt_gameplay_tiles__transmitter_root
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: low-gravity rebel outpost, regolith blocks, transmitter roots, cargo crates, radio shrines, solar foil and public murals.
Palette: regolith grey, rebel red, solar gold, transmitter cyan, greenhouse green and void black.
Tile or prop: Transmitter Root.
Existing visual cue: dormant root, signal intake, branching transmission, broadcast peak, stable public node, reset.
Runtime tags: interactive_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: dormant root, signal intake, branching transmission, broadcast peak, stable public node, reset.
Runtime intent: future:asteroid_transmitter_root.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `asteroid_redoubt_gameplay_tiles__pirate_radio_shrine`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: asteroid_redoubt_gameplay_tiles__pirate_radio_shrine
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: low-gravity rebel outpost, regolith blocks, transmitter roots, cargo crates, radio shrines, solar foil and public murals.
Palette: regolith grey, rebel red, solar gold, transmitter cyan, greenhouse green and void black.
Tile or prop: Pirate Radio Shrine.
Existing visual cue: dark shrine, tuning, checkpoint flare, stable broadcast glow.
Runtime tags: checkpoint_tile, planned_gameplay_tile.
Frames: 4. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: dark shrine, tuning, checkpoint flare, stable broadcast glow.
Runtime intent: future:asteroid_radio_shrine.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `asteroid_redoubt_gameplay_tiles__airlock`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: asteroid_redoubt_gameplay_tiles__airlock
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: low-gravity rebel outpost, regolith blocks, transmitter roots, cargo crates, radio shrines, solar foil and public murals.
Palette: regolith grey, rebel red, solar gold, transmitter cyan, greenhouse green and void black.
Tile or prop: Airlock.
Existing visual cue: closed, pressure equalization, opening, open hold, closing, sealed.
Runtime tags: interactive_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: closed, pressure equalization, opening, open hold, closing, sealed.
Runtime intent: future:asteroid_airlock.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `asteroid_redoubt_gameplay_tiles__regolith_break`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: asteroid_redoubt_gameplay_tiles__regolith_break
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: low-gravity rebel outpost, regolith blocks, transmitter roots, cargo crates, radio shrines, solar foil and public murals.
Palette: regolith grey, rebel red, solar gold, transmitter cyan, greenhouse green and void black.
Tile or prop: Regolith Break.
Existing visual cue: solid regolith, cracked block, low-gravity fracture, drifting rubble gap.
Runtime tags: breakable_tile, planned_gameplay_tile.
Frames: 4. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: solid regolith, cracked block, low-gravity fracture, drifting rubble gap.
Runtime intent: future:asteroid_regolith_break.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `asteroid_redoubt_gameplay_tiles__solar_foil_platform`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: asteroid_redoubt_gameplay_tiles__solar_foil_platform
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: low-gravity rebel outpost, regolith blocks, transmitter roots, cargo crates, radio shrines, solar foil and public murals.
Palette: regolith grey, rebel red, solar gold, transmitter cyan, greenhouse green and void black.
Tile or prop: Solar Foil Platform.
Existing visual cue: four subtle foil shimmer and flex phases with stable collision edge.
Runtime tags: environment_tile, planned_gameplay_tile.
Frames: 4. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: four subtle foil shimmer and flex phases with stable collision edge.
Runtime intent: future:asteroid_solar_foil.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
