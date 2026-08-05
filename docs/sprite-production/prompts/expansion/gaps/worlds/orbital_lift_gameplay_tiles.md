---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
status: planned_full_scope
source_catalog: llm-sprite-generation/remaining-gaps.yml
category: world_gameplay_gap
world: orbital_lift
target_atlas: assets/sprites/worlds/expansion/orbital_lift_gameplay_tiles.png
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
render_job_count: 6
---

# Orbital Lift: Gameplay-Specific Tile States

These jobs close a specifically audited animation or tile gap. Render each job independently; do not merge the whole bundle into one image request.

## Render job `orbital_lift_gameplay_tiles__gravity_stamp`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: orbital_lift_gameplay_tiles__gravity_stamp
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: vertical logistics cathedral, cargo straps, lift grating, vacuum doors, counterweights, scanner machinery and Earth-horizon space.
Palette: white-gold machinery, scanner blue, black space, hazard orange, cargo red and steel grey.
Tile or prop: Gravity Stamp.
Existing visual cue: idle stamp, rotate, inversion tell, gravity active, lock release, reset.
Runtime tags: puzzle_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: idle stamp, rotate, inversion tell, gravity active, lock release, reset.
Runtime intent: future:orbital_gravity_stamp.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `orbital_lift_gameplay_tiles__vacuum_leak`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: orbital_lift_gameplay_tiles__vacuum_leak
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: vertical logistics cathedral, cargo straps, lift grating, vacuum doors, counterweights, scanner machinery and Earth-horizon space.
Palette: white-gold machinery, scanner blue, black space, hazard orange, cargo red and steel grey.
Tile or prop: Vacuum Leak.
Existing visual cue: sealed seam, frost tell, leak begins, full jet, pressure dwindles, resealed.
Runtime tags: hazard_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: sealed seam, frost tell, leak begins, full jet, pressure dwindles, resealed.
Runtime intent: future:orbital_vacuum_leak.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `orbital_lift_gameplay_tiles__cargo_strap_swing`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: orbital_lift_gameplay_tiles__cargo_strap_swing
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: vertical logistics cathedral, cargo straps, lift grating, vacuum doors, counterweights, scanner machinery and Earth-horizon space.
Palette: white-gold machinery, scanner blue, black space, hazard orange, cargo red and steel grey.
Tile or prop: Cargo Strap Swing.
Existing visual cue: eight-frame pendulum strap loop with stable pivot and clear grab point.
Runtime tags: traversal_tile, planned_gameplay_tile.
Frames: 8. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: eight-frame pendulum strap loop with stable pivot and clear grab point.
Runtime intent: future:orbital_cargo_strap.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `orbital_lift_gameplay_tiles__scanner_gate`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: orbital_lift_gameplay_tiles__scanner_gate
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: vertical logistics cathedral, cargo straps, lift grating, vacuum doors, counterweights, scanner machinery and Earth-horizon space.
Palette: white-gold machinery, scanner blue, black space, hazard orange, cargo red and steel grey.
Tile or prop: Scanner Gate.
Existing visual cue: closed scanner, sweep, rejection, hacked acceptance, open, reset.
Runtime tags: interactive_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: closed scanner, sweep, rejection, hacked acceptance, open, reset.
Runtime intent: future:orbital_scanner_gate.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `orbital_lift_gameplay_tiles__counterweight_platform`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: orbital_lift_gameplay_tiles__counterweight_platform
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: vertical logistics cathedral, cargo straps, lift grating, vacuum doors, counterweights, scanner machinery and Earth-horizon space.
Palette: white-gold machinery, scanner blue, black space, hazard orange, cargo red and steel grey.
Tile or prop: Counterweight Platform.
Existing visual cue: rest, cable tension, vertical travel, braking settle.
Runtime tags: moving_tile, planned_gameplay_tile.
Frames: 4. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: rest, cable tension, vertical travel, braking settle.
Runtime intent: future:orbital_counterweight.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `orbital_lift_gameplay_tiles__cargo_crate_break`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: orbital_lift_gameplay_tiles__cargo_crate_break
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: vertical logistics cathedral, cargo straps, lift grating, vacuum doors, counterweights, scanner machinery and Earth-horizon space.
Palette: white-gold machinery, scanner blue, black space, hazard orange, cargo red and steel grey.
Tile or prop: Cargo Crate Break.
Existing visual cue: sealed crate, dented crate, break burst, scattered cargo-safe debris.
Runtime tags: breakable_tile, planned_gameplay_tile.
Frames: 4. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: sealed crate, dented crate, break burst, scattered cargo-safe debris.
Runtime intent: future:orbital_crate_break.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
