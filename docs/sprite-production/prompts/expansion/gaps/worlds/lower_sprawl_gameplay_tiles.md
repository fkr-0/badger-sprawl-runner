---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
status: planned_full_scope
source_catalog: llm-sprite-generation/remaining-gaps.yml
category: world_gameplay_gap
world: lower_sprawl
target_atlas: assets/sprites/worlds/expansion/lower_sprawl_gameplay_tiles.png
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
render_job_count: 6
---

# Lower Sprawl: Gameplay-Specific Tile States

These jobs close a specifically audited animation or tile gap. Render each job independently; do not merge the whole bundle into one image request.

## Render job `lower_sprawl_gameplay_tiles__toll_meter`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: lower_sprawl_gameplay_tiles__toll_meter
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: rain-slick undercity alleys, debt gates, brick, wet asphalt, food stalls, cable nests, improvised neon and rusty drainage.
Palette: indigo rain shadows, cyan and magenta neon, rust orange, dirty yellow, wet charcoal.
Tile or prop: Toll Meter.
Existing visual cue: idle meter, scan/read state, accepted pulse, disabled or liberated state.
Runtime tags: interactive_tile, planned_gameplay_tile.
Frames: 4. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: idle meter, scan/read state, accepted pulse, disabled or liberated state.
Runtime intent: future:lower_sprawl_toll_meter.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `lower_sprawl_gameplay_tiles__steam_vent`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: lower_sprawl_gameplay_tiles__steam_vent
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: rain-slick undercity alleys, debt gates, brick, wet asphalt, food stalls, cable nests, improvised neon and rusty drainage.
Palette: indigo rain shadows, cyan and magenta neon, rust orange, dirty yellow, wet charcoal.
Tile or prop: Steam Vent.
Existing visual cue: cold vent, warning rattle, first steam, active jet peak, sustained jet, pressure drop, drips, safe reset.
Runtime tags: hazard_tile, planned_gameplay_tile.
Frames: 8. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: cold vent, warning rattle, first steam, active jet peak, sustained jet, pressure drop, drips, safe reset.
Runtime intent: stage:steam_vent.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `lower_sprawl_gameplay_tiles__market_relay`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: lower_sprawl_gameplay_tiles__market_relay
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: rain-slick undercity alleys, debt gates, brick, wet asphalt, food stalls, cable nests, improvised neon and rusty drainage.
Palette: indigo rain shadows, cyan and magenta neon, rust orange, dirty yellow, wet charcoal.
Tile or prop: Market Relay.
Existing visual cue: offline, receiving signal, checkpoint activation, stable communal glow.
Runtime tags: checkpoint_tile, planned_gameplay_tile.
Frames: 4. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: offline, receiving signal, checkpoint activation, stable communal glow.
Runtime intent: future:lower_sprawl_market_relay.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `lower_sprawl_gameplay_tiles__wet_electric_rail`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: lower_sprawl_gameplay_tiles__wet_electric_rail
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: rain-slick undercity alleys, debt gates, brick, wet asphalt, food stalls, cable nests, improvised neon and rusty drainage.
Palette: indigo rain shadows, cyan and magenta neon, rust orange, dirty yellow, wet charcoal.
Tile or prop: Wet Electric Rail.
Existing visual cue: wet idle, spark tell, current travels, full hazard, residual spark, safe reset.
Runtime tags: hazard_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: wet idle, spark tell, current travels, full hazard, residual spark, safe reset.
Runtime intent: future:lower_sprawl_electric_rail.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `lower_sprawl_gameplay_tiles__toll_gate_barrier`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: lower_sprawl_gameplay_tiles__toll_gate_barrier
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: rain-slick undercity alleys, debt gates, brick, wet asphalt, food stalls, cable nests, improvised neon and rusty drainage.
Palette: indigo rain shadows, cyan and magenta neon, rust orange, dirty yellow, wet charcoal.
Tile or prop: Toll Gate Barrier.
Existing visual cue: closed, unlock pulse, arm rises, open hold, arm lowers, locked reset.
Runtime tags: interactive_tile, planned_gameplay_tile.
Frames: 6. Leave unused cells fully transparent.

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: closed, unlock pulse, arm rises, open hold, arm lowers, locked reset.
Runtime intent: future:lower_sprawl_toll_gate.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
## Render job `lower_sprawl_gameplay_tiles__rain_gutter_transition`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: lower_sprawl_gameplay_tiles__rain_gutter_transition
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: rain-slick undercity alleys, debt gates, brick, wet asphalt, food stalls, cable nests, improvised neon and rusty drainage.
Palette: indigo rain shadows, cyan and magenta neon, rust orange, dirty yellow, wet charcoal.
Tile or prop: Rain Gutter Transition.
Existing visual cue: steady drip phases with stable collision footprint and clean tile edges.
Runtime tags: environment_tile, planned_gameplay_tile.
Frames: 4. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Exact gameplay-state sequence: steady drip phases with stable collision footprint and clean tile edges.
Runtime intent: future:lower_sprawl_gutter.
Keep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase.
```
