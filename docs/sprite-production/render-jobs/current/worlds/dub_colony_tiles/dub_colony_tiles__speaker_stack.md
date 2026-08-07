---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: worlds
source_entry: dub_colony_tiles
job_id: dub_colony_tiles__speaker_stack
animation_state: speaker_stack
animation_class: environment_tile
runtime_clip: current:dub_colony_tiles:speaker_stack
source_class: current_manifest
atlas_family: assets/sprites/worlds/dub_colony_tiles.png
target_atlas: assets/sprites/worlds/dub_colony_tiles.png
output_image: renders/dub_colony_tiles/speaker_stack_1c_1r.png
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
world: dub_colony
source_prompt_file: docs/sprite-production/prompts/current/worlds/dub_colony_tiles.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `dub_colony_tiles__speaker_stack`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/dub_colony_tiles/speaker_stack_1c_1r.png`
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
| Animation state | `speaker_stack` |
| Animation class | `environment_tile` |
| Runtime intent | `current:dub_colony_tiles:speaker_stack` |
| Atlas family | `assets/sprites/worlds/dub_colony_tiles.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: dub_colony_tiles__speaker_stack
Grid: 1 columns by 1 rows
Cell size: 32x32 pixels
Output size: 32x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: warm mobile maker colony, speakerstone, cable vines, studio machinery, greenhouse train cars, solar cloth and communal repair culture.
Palette: warm amber, red, leaf green, bass purple, cyan electronics, soot-black shadows.
Tile or prop: Speaker Stack.
Existing visual cue: cyber-organic speakerstone, cable vines, solar cloth, studio machinery.
Runtime tags: world:dub_colony, tile, solid, collision_safe, material:speaker_cone.
Frames: 1. 

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
