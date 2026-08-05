---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: portrait_expansion
source_entry: portrait_little_ix
job_id: portrait_little_ix
animation_state: portrait_little_ix
animation_class: portrait
runtime_clip: expansion:portrait_little_ix:portrait_little_ix
source_class: expansion_template
atlas_family: portrait_little_ix
target_atlas: null
output_image: renders/portraits/little_ix_4c_1r.png
frames: 4
grid:
  columns: 4
  rows: 1
cell_size:
- 96
- 96
output_size:
- 384
- 96
world: null
source_prompt_file: docs/sprite-production/prompts/expansion/portraits/little_ix.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `portrait_little_ix`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/portraits/little_ix_4c_1r.png`
- Grid: 4 columns × 1 rows
- Cell size: 96×96 pixels
- Output size: 384×96 pixels
- Occupied frames: 4
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `portrait_expansion` |
| Animation state | `portrait_little_ix` |
| Animation class | `portrait` |
| Runtime intent | `expansion:portrait_little_ix:portrait_little_ix` |
| Atlas family | `portrait_little_ix` |
| Source class | `expansion_template` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: portrait_little_ix
Grid: 4 columns by 1 rows
Cell size: 96x96 pixels
Output size: 384x96 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Character: squirrel child tinkerer; goggles, soldering toy robot, oversize headphones.
Cells: neutral attentive portrait; speaking/open expression; strong emotional reaction; determined action expression.

Head-and-shoulders dialogue portraits, consistent camera and scale, transparent background, strong facial readability, one subtle prop or costume cue, no text and no speech bubble. Apply the approved reference board's crisp pixel clusters and neon rim-light discipline without copying its characters.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
