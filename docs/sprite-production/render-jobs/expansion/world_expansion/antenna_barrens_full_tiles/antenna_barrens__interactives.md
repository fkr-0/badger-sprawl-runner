---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: world_expansion
source_entry: antenna_barrens_full_tiles
job_id: antenna_barrens__interactives
animation_state: antenna_barrens__interactives
animation_class: environment_tile
runtime_clip: expansion:antenna_barrens_full_tiles:antenna_barrens__interactives
source_class: expansion_template
atlas_family: antenna_barrens_full_tiles
target_atlas: null
output_image: renders/world-expansion/antenna_barrens/interactives_4c_4r.png
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
world: antenna_barrens
source_prompt_file: docs/sprite-production/prompts/expansion/worlds/antenna_barrens_full_tiles.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `antenna_barrens__interactives`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/world-expansion/antenna_barrens/interactives_4c_4r.png`
- Grid: 4 columns × 4 rows
- Cell size: 32×32 pixels
- Output size: 128×128 pixels
- Occupied frames: 16
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `world_expansion` |
| Animation state | `antenna_barrens__interactives` |
| Animation class | `environment_tile` |
| Runtime intent | `expansion:antenna_barrens_full_tiles:antenna_barrens__interactives` |
| Atlas family | `antenna_barrens_full_tiles` |
| Source class | `expansion_template` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: antenna_barrens__interactives
Grid: 4 columns by 4 rows
Cell size: 32x32 pixels
Output size: 128x128 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: wind-scoured uplink desert, rust plates, wire bridges, dead dishes, battery towers, signal snow, chalk logic and lightning.
Palette: sun-faded ochre, rust red, electric cyan, storm violet, black cable and lightning white.
Set: Interactives.
Cell plan:
Row 1: terminal idle/active; four chronological animation phases.
Row 2: camera hostile/hacked; four chronological animation phases.
Row 3: door locked/open; four chronological animation phases.
Row 4: trap hostile/hacked; four chronological animation phases.

All tiles use the same orthographic side-view construction language. Collision tiles fill cells and meet edges cleanly; objects and hazards use true alpha outside silhouettes. Animated rows preserve footprint. No readable text. Keep the approved neon-animal reference board's crisp cluster work and lighting discipline while rendering environment assets rather than characters.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
