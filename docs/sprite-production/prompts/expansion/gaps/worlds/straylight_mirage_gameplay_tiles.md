---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
status: planned_full_scope
source_catalog: docs/sprite-production/remaining-gaps.yml
category: world_gameplay_gap
world: straylight_mirage
target_atlas: assets/sprites/worlds/expansion/straylight_mirage_gameplay_tiles.png
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
render_job_count: 6
---

# Straylight Mirage: Gameplay-Specific Tile States

These jobs close a specifically audited animation or tile gap. Render each job independently; do not merge the whole bundle into one image request.

## Render job `straylight_mirage_gameplay_tiles__false_door`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: straylight_mirage_gameplay_tiles__false_door
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: orbital mirror palace, false doors, glass floors, violet space, banquet luxury, zero-gravity fountains and deceptive reflections.
Palette: violet, cobalt, black glass, silver, magenta refraction, sparse warm banquet gold.
Tile or prop: False Door.
Existing visual cue: convincing closed door, subtle glitch, false opening, collapse into light, empty hold, reset.
Runtime tags: interactive_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: convincing closed door, subtle glitch, false opening, collapse into light, empty hold, reset.
Runtime intent: future:mirage_false_door.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `straylight_mirage_gameplay_tiles__reflection_loop`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: straylight_mirage_gameplay_tiles__reflection_loop
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: orbital mirror palace, false doors, glass floors, violet space, banquet luxury, zero-gravity fountains and deceptive reflections.
Palette: violet, cobalt, black glass, silver, magenta refraction, sparse warm banquet gold.
Tile or prop: Reflection Loop.
Existing visual cue: stable mirror, delayed reflection, divergent reflection, loop break flash, real surface, reset.
Runtime tags: puzzle_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: stable mirror, delayed reflection, divergent reflection, loop break flash, real surface, reset.
Runtime intent: future:mirage_reflection_loop.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `straylight_mirage_gameplay_tiles__banquet_switch`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: straylight_mirage_gameplay_tiles__banquet_switch
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: orbital mirror palace, false doors, glass floors, violet space, banquet luxury, zero-gravity fountains and deceptive reflections.
Palette: violet, cobalt, black glass, silver, magenta refraction, sparse warm banquet gold.
Tile or prop: Banquet Switch.
Existing visual cue: ornate idle switch, refusal input, accepted pulse, permanently changed state.
Runtime tags: interactive_tile, planned_gameplay_tile.
Frames: 4. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: ornate idle switch, refusal input, accepted pulse, permanently changed state.
Runtime intent: future:mirage_banquet_switch.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `straylight_mirage_gameplay_tiles__lightblade_tripline`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: straylight_mirage_gameplay_tiles__lightblade_tripline
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: orbital mirror palace, false doors, glass floors, violet space, banquet luxury, zero-gravity fountains and deceptive reflections.
Palette: violet, cobalt, black glass, silver, magenta refraction, sparse warm banquet gold.
Tile or prop: Lightblade Tripline.
Existing visual cue: hidden anchors, warning glint, blade line forms, active sweep, fade, reset.
Runtime tags: hazard_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: hidden anchors, warning glint, blade line forms, active sweep, fade, reset.
Runtime intent: future:mirage_tripline.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `straylight_mirage_gameplay_tiles__zero_g_fountain`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: straylight_mirage_gameplay_tiles__zero_g_fountain
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: orbital mirror palace, false doors, glass floors, violet space, banquet luxury, zero-gravity fountains and deceptive reflections.
Palette: violet, cobalt, black glass, silver, magenta refraction, sparse warm banquet gold.
Tile or prop: Zero G Fountain.
Existing visual cue: stable basin with eight coherent floating-fluid phases and unchanged footprint.
Runtime tags: environment_tile, planned_gameplay_tile.
Frames: 8. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: stable basin with eight coherent floating-fluid phases and unchanged footprint.
Runtime intent: future:mirage_zero_g_fountain.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `straylight_mirage_gameplay_tiles__mirror_floor_break`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: straylight_mirage_gameplay_tiles__mirror_floor_break
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: orbital mirror palace, false doors, glass floors, violet space, banquet luxury, zero-gravity fountains and deceptive reflections.
Palette: violet, cobalt, black glass, silver, magenta refraction, sparse warm banquet gold.
Tile or prop: Mirror Floor Break.
Existing visual cue: intact mirror floor, spider cracks, collapse, transparent gap with shard edges.
Runtime tags: breakable_tile, planned_gameplay_tile.
Frames: 4. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: intact mirror floor, spider cracks, collapse, transparent gap with shard edges.
Runtime intent: future:mirage_floor_break.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
