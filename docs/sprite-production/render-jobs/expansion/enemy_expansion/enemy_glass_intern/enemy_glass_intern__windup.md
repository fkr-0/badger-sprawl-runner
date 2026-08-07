---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: enemy_expansion
source_entry: enemy_glass_intern
job_id: enemy_glass_intern__windup
animation_state: windup
animation_class: combat
runtime_clip: expansion:enemy_glass_intern:windup
source_class: expansion_template
atlas_family: assets/sprites/enemies/glass_intern.png
target_atlas: assets/sprites/enemies/glass_intern.png
output_image: renders/enemy_glass_intern/windup_3c_1r.png
frames: 3
grid:
  columns: 3
  rows: 1
cell_size:
- 48
- 48
output_size:
- 144
- 48
world: chrome_arcology
source_prompt_file: docs/sprite-production/prompts/expansion/enemies/chrome_arcology/enemy_glass_intern.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `enemy_glass_intern__windup`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/enemy_glass_intern/windup_3c_1r.png`
- Grid: 3 columns × 1 rows
- Cell size: 48×48 pixels
- Output size: 144×48 pixels
- Occupied frames: 3
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `enemy_expansion` |
| Animation state | `windup` |
| Animation class | `combat` |
| Runtime intent | `expansion:enemy_glass_intern:windup` |
| Atlas family | `assets/sprites/enemies/glass_intern.png` |
| Source class | `expansion_template` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: enemy_glass_intern__windup
Grid: 3 columns by 1 rows
Cell size: 48x48 pixels
Output size: 144x48 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: Glass Intern; class walker; overworked junior in translucent office armor; attacks with clipboard jab and panic shove; intended counter is knock into glass, talk-down, slippery floor.
World palette family: cold cyan, polished silver, white-blue light, restrained gold, deep navy reflections.
Animation: windup.
Frame count: 3.
Frame order:
1. clear anticipation
2. energy or body acceleration
3. active action begins

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=24, y=44 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
