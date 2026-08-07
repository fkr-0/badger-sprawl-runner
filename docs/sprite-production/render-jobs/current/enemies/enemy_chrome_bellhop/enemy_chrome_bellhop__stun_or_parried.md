---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: enemies
source_entry: enemy_chrome_bellhop
job_id: enemy_chrome_bellhop__stun_or_parried
animation_state: stun_or_parried
animation_class: combat
runtime_clip: current:enemy_chrome_bellhop:stun_or_parried
source_class: current_manifest
atlas_family: assets/sprites/enemies/chrome_bellhop.png
target_atlas: assets/sprites/enemies/chrome_bellhop.png
output_image: renders/enemy_chrome_bellhop/stun_or_parried_3c_1r.png
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
source_prompt_file: docs/sprite-production/prompts/current/enemies/enemy_chrome_bellhop.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `enemy_chrome_bellhop__stun_or_parried`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/enemy_chrome_bellhop/stun_or_parried_3c_1r.png`
- Grid: 3 columns × 1 rows
- Cell size: 48×48 pixels
- Output size: 144×48 pixels
- Occupied frames: 3
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `current` |
| Category | `enemies` |
| Animation state | `stun_or_parried` |
| Animation class | `combat` |
| Runtime intent | `current:enemy_chrome_bellhop:stun_or_parried` |
| Atlas family | `assets/sprites/enemies/chrome_bellhop.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: enemy_chrome_bellhop__stun_or_parried
Grid: 3 columns by 1 rows
Cell size: 48x48 pixels
Output size: 144x48 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: robotic chrome bellhop; polished uniform, luggage shield, blade umbrella.
World palette family: cold cyan, polished silver, white-blue light, restrained gold, deep navy reflections.
Animation: stun_or_parried.
Frame count: 3.
Frame order:
1. parry impact
2. open stunned posture
3. shaking recovery

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=24, y=44 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
