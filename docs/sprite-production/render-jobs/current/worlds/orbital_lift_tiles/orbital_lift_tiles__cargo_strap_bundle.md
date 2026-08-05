---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: worlds
source_entry: orbital_lift_tiles
job_id: orbital_lift_tiles__cargo_strap_bundle
animation_state: cargo_strap_bundle
animation_class: environment_tile
runtime_clip: current:orbital_lift_tiles:cargo_strap_bundle
source_class: current_manifest
atlas_family: assets/sprites/worlds/orbital_lift_tiles.png
target_atlas: assets/sprites/worlds/orbital_lift_tiles.png
output_image: renders/orbital_lift_tiles/cargo_strap_bundle_1c_1r.png
frames: 1
grid:
  columns: 1
  rows: 1
cell_size:
- 32
- 32
output_size:
- 32
- 32
world: orbital_lift
source_prompt_file: docs/sprite-production/prompts/current/worlds/orbital_lift_tiles.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `orbital_lift_tiles__cargo_strap_bundle`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/orbital_lift_tiles/cargo_strap_bundle_1c_1r.png`
- Grid: 1 columns × 1 rows
- Cell size: 32×32 pixels
- Output size: 32×32 pixels
- Occupied frames: 1
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `current` |
| Category | `worlds` |
| Animation state | `cargo_strap_bundle` |
| Animation class | `environment_tile` |
| Runtime intent | `current:orbital_lift_tiles:cargo_strap_bundle` |
| Atlas family | `assets/sprites/worlds/orbital_lift_tiles.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: orbital_lift_tiles__cargo_strap_bundle
Grid: 1 columns by 1 rows
Cell size: 32x32 pixels
Output size: 32x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: vertical logistics cathedral, cargo straps, lift grating, vacuum doors, counterweights, scanner machinery and Earth-horizon space.
Palette: white-gold machinery, scanner blue, black space, hazard orange, cargo red and steel grey.
Tile or prop: Cargo Strap Bundle.
Existing visual cue: industrial lift grating, cargo straps, vacuum doors, warning machinery.
Runtime tags: world:orbital_lift, tile, decorative.
Frames: 1. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
