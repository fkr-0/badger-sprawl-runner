---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: items
source_entry: items_core
job_id: items_core__batch_06
animation_state: bassline_boots_pickup,contraband_seed_key_pickup
animation_class: interaction
runtime_clip: current:items_core:bassline_boots_pickup,contraband_seed_key_pickup
source_class: current_manifest
atlas_family: assets/sprites/items_core.png
target_atlas: assets/sprites/items_core.png
output_image: renders/items_core/batch_06_4c_2r.png
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
world: null
source_prompt_file: docs/sprite-production/prompts/current/items/items_core.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `items_core__batch_06`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/items_core/batch_06_4c_2r.png`
- Grid: 4 columns × 2 rows
- Cell size: 32×32 pixels
- Output size: 128×64 pixels
- Occupied frames: 8
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `current` |
| Category | `items` |
| Animation state | `bassline_boots_pickup,contraband_seed_key_pickup` |
| Animation class | `interaction` |
| Runtime intent | `current:items_core:bassline_boots_pickup,contraband_seed_key_pickup` |
| Atlas family | `assets/sprites/items_core.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: items_core__batch_06
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Sheet purpose: item pickup loops.
Existing visual cue: Items Core.
Row 1: Bassline Boots. Cell 1 neutral float; cell 2 stronger glow; cell 3 bob upward with one sparkle; cell 4 bob downward with rim light.
Row 2: Contraband Seed Key. Cell 1 neutral float; cell 2 stronger glow; cell 3 bob upward with one sparkle; cell 4 bob downward with rim light.

Each row is one distinct item and must preserve that item's silhouette across all four cells. Center every object at x=16, y=16; move it no more than three pixels during the bob. Use transparent background and compact pickup sparkle only. No readable labels.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
