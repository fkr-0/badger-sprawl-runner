---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: items
source_entry: items_extended
job_id: items_extended__batch_01
animation_state: capacitor_coil_pickup,phase_mantle_pickup,ledger_lens_pickup,echo_spurs_pickup
animation_class: locomotion
runtime_clip: current:items_extended:capacitor_coil_pickup,phase_mantle_pickup,ledger_lens_pickup,echo_spurs_pickup
source_class: current_manifest
atlas_family: assets/sprites/items_extended.png
target_atlas: assets/sprites/items_extended.png
output_image: renders/items_extended/batch_01_4c_4r.png
frames: 16
grid:
  columns: 4
  rows: 4
cell_size:
- 32
- 32
output_size:
- 128
- 128
world: null
source_prompt_file: docs/sprite-production/prompts/current/items/items_extended.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `items_extended__batch_01`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/items_extended/batch_01_4c_4r.png`
- Grid: 4 columns × 4 rows
- Cell size: 32×32 pixels
- Output size: 128×128 pixels
- Occupied frames: 16
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `current` |
| Category | `items` |
| Animation state | `capacitor_coil_pickup,phase_mantle_pickup,ledger_lens_pickup,echo_spurs_pickup` |
| Animation class | `locomotion` |
| Runtime intent | `current:items_extended:capacitor_coil_pickup,phase_mantle_pickup,ledger_lens_pickup,echo_spurs_pickup` |
| Atlas family | `assets/sprites/items_extended.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: items_extended__batch_01
Grid: 4 columns by 4 rows
Cell size: 32x32 pixels
Output size: 128x128 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Sheet purpose: item pickup loops.
Existing visual cue: 16+ glowing pickup items on grid.
Row 1: Capacitor Coil. Cell 1 neutral float; cell 2 stronger glow; cell 3 bob upward with one sparkle; cell 4 bob downward with rim light.
Row 2: Phase Mantle. Cell 1 neutral float; cell 2 stronger glow; cell 3 bob upward with one sparkle; cell 4 bob downward with rim light.
Row 3: Ledger Lens. Cell 1 neutral float; cell 2 stronger glow; cell 3 bob upward with one sparkle; cell 4 bob downward with rim light.
Row 4: Echo Spurs. Cell 1 neutral float; cell 2 stronger glow; cell 3 bob upward with one sparkle; cell 4 bob downward with rim light.

Each row is one distinct item and must preserve that item's silhouette across all four cells. Center every object at x=16, y=16; move it no more than three pixels during the bob. Use transparent background and compact pickup sparkle only. No readable labels.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
