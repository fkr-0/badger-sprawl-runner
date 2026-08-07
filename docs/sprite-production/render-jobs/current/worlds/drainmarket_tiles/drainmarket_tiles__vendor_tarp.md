---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: worlds
source_entry: drainmarket_tiles
job_id: drainmarket_tiles__vendor_tarp
animation_state: vendor_tarp
animation_class: environment_tile
runtime_clip: current:drainmarket_tiles:vendor_tarp
source_class: current_manifest
atlas_family: assets/sprites/worlds/drainmarket_tiles.png
target_atlas: assets/sprites/worlds/drainmarket_tiles.png
output_image: renders/drainmarket_tiles/vendor_tarp_2c_1r.png
frames: 2
grid:
  columns: 2
  rows: 1
cell_size:
- 32
- 32
output_size:
- 64
- 32
world: drainmarket
source_prompt_file: docs/sprite-production/prompts/current/worlds/drainmarket_tiles.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `drainmarket_tiles__vendor_tarp`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/drainmarket_tiles/vendor_tarp_2c_1r.png`
- Grid: 2 columns × 1 rows
- Cell size: 32×32 pixels
- Output size: 64×32 pixels
- Occupied frames: 2
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `current` |
| Category | `worlds` |
| Animation state | `vendor_tarp` |
| Animation class | `environment_tile` |
| Runtime intent | `current:drainmarket_tiles:vendor_tarp` |
| Atlas family | `assets/sprites/worlds/drainmarket_tiles.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: drainmarket_tiles__vendor_tarp
Grid: 2 columns by 1 rows
Cell size: 32x32 pixels
Output size: 64x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: subterranean clinic bazaar, sump brick, medicine stalls, patched tubing, wet grates, leaking valves and mutual-aid caches.
Palette: deep teal, clinic green, warning red, violet UV light, rust brown, damp charcoal.
Tile or prop: Vendor Tarp.
Existing visual cue: sump brick, clinic floor, rusted grates, medical tubing, leaking valves.
Runtime tags: decorative, material:patched_canvas, tile, world:drainmarket.
Frames: 2. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
