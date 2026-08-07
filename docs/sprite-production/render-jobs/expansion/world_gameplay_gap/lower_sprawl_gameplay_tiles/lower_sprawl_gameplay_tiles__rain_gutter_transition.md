---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: world_gameplay_gap
source_entry: lower_sprawl_gameplay_tiles
job_id: lower_sprawl_gameplay_tiles__rain_gutter_transition
animation_state: rain_gutter_transition
animation_class: environment_tile
runtime_clip: future:lower_sprawl_gutter
source_class: remaining_gap_catalog
atlas_family: assets/sprites/worlds/expansion/lower_sprawl_gameplay_tiles.png
target_atlas: assets/sprites/worlds/expansion/lower_sprawl_gameplay_tiles.png
output_image: renders/lower_sprawl_gameplay_tiles/rain_gutter_transition_4c_1r.png
frames: 4
grid:
  columns: 4
  rows: 1
cell_size:
- 32
- 32
output_size:
- 128
- 32
world: lower_sprawl
source_prompt_file: docs/sprite-production/prompts/expansion/gaps/worlds/lower_sprawl_gameplay_tiles.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `lower_sprawl_gameplay_tiles__rain_gutter_transition`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/lower_sprawl_gameplay_tiles/rain_gutter_transition_4c_1r.png`
- Grid: 4 columns × 1 rows
- Cell size: 32×32 pixels
- Output size: 128×32 pixels
- Occupied frames: 4
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `world_gameplay_gap` |
| Animation state | `rain_gutter_transition` |
| Animation class | `environment_tile` |
| Runtime intent | `future:lower_sprawl_gutter` |
| Atlas family | `assets/sprites/worlds/expansion/lower_sprawl_gameplay_tiles.png` |
| Source class | `remaining_gap_catalog` |

## Prompt

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

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
