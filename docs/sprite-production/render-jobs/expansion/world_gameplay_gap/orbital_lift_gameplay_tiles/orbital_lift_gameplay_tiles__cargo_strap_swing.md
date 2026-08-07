---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: world_gameplay_gap
source_entry: orbital_lift_gameplay_tiles
job_id: orbital_lift_gameplay_tiles__cargo_strap_swing
animation_state: cargo_strap_swing
animation_class: traversal_tile
runtime_clip: future:orbital_cargo_strap
source_class: remaining_gap_catalog
atlas_family: assets/sprites/worlds/expansion/orbital_lift_gameplay_tiles.png
target_atlas: assets/sprites/worlds/expansion/orbital_lift_gameplay_tiles.png
output_image: renders/orbital_lift_gameplay_tiles/cargo_strap_swing_4c_2r.png
frames: 8
grid:
  columns: 4
  rows: 2
cell_size:
- 32
- 32
output_size:
- 128
- 64
world: orbital_lift
source_prompt_file: docs/sprite-production/prompts/expansion/gaps/worlds/orbital_lift_gameplay_tiles.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `orbital_lift_gameplay_tiles__cargo_strap_swing`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/orbital_lift_gameplay_tiles/cargo_strap_swing_4c_2r.png`
- Grid: 4 columns × 2 rows
- Cell size: 32×32 pixels
- Output size: 128×64 pixels
- Occupied frames: 8
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `world_gameplay_gap` |
| Animation state | `cargo_strap_swing` |
| Animation class | `traversal_tile` |
| Runtime intent | `future:orbital_cargo_strap` |
| Atlas family | `assets/sprites/worlds/expansion/orbital_lift_gameplay_tiles.png` |
| Source class | `remaining_gap_catalog` |

## Prompt

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

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
