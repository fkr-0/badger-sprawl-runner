---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: world_gameplay_gap
source_entry: antenna_barrens_gameplay_tiles
job_id: antenna_barrens_gameplay_tiles__static_mast
animation_state: static_mast
animation_class: hazard_tile
runtime_clip: future:antenna_static_mast
source_class: remaining_gap_catalog
atlas_family: assets/sprites/worlds/expansion/antenna_barrens_gameplay_tiles.png
target_atlas: assets/sprites/worlds/expansion/antenna_barrens_gameplay_tiles.png
output_image: renders/antenna_barrens_gameplay_tiles/static_mast_4c_2r.png
frames: 6
grid:
  columns: 4
  rows: 2
cell_size:
- 32
- 32
output_size:
- 128
- 64
world: antenna_barrens
source_prompt_file: docs/sprite-production/prompts/expansion/gaps/worlds/antenna_barrens_gameplay_tiles.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `antenna_barrens_gameplay_tiles__static_mast`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/antenna_barrens_gameplay_tiles/static_mast_4c_2r.png`
- Grid: 4 columns × 2 rows
- Cell size: 32×32 pixels
- Output size: 128×64 pixels
- Occupied frames: 6
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `world_gameplay_gap` |
| Animation state | `static_mast` |
| Animation class | `hazard_tile` |
| Runtime intent | `future:antenna_static_mast` |
| Atlas family | `assets/sprites/worlds/expansion/antenna_barrens_gameplay_tiles.png` |
| Source class | `remaining_gap_catalog` |

## Prompt

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

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
