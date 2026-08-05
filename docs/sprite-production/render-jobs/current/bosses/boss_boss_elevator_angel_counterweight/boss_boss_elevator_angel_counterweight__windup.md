---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: bosses
source_entry: boss_boss_elevator_angel_counterweight
job_id: boss_boss_elevator_angel_counterweight__windup
animation_state: windup
animation_class: combat
runtime_clip: current:boss_boss_elevator_angel_counterweight:windup
source_class: current_manifest
atlas_family: assets/sprites/bosses/boss_elevator_angel_counterweight.png
target_atlas: assets/sprites/bosses/boss_elevator_angel_counterweight.png
output_image: renders/boss_boss_elevator_angel_counterweight/windup_4c_1r.png
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
world: orbital_lift
source_prompt_file: docs/sprite-production/prompts/current/bosses/boss_boss_elevator_angel_counterweight.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `boss_boss_elevator_angel_counterweight__windup`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/boss_boss_elevator_angel_counterweight/windup_4c_1r.png`
- Grid: 4 columns × 1 rows
- Cell size: 96×96 pixels
- Output size: 384×96 pixels
- Occupied frames: 4
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `current` |
| Category | `bosses` |
| Animation state | `windup` |
| Animation class | `combat` |
| Runtime intent | `current:boss_boss_elevator_angel_counterweight:windup` |
| Atlas family | `assets/sprites/bosses/boss_elevator_angel_counterweight.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: boss_boss_elevator_angel_counterweight__windup
Grid: 4 columns by 1 rows
Cell size: 96x96 pixels
Output size: 384x96 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: Elevator Angel boss; white-gold lift AI with cable wings and cargo hook hands.
World palette family: white-gold machinery, scanner blue, black space, hazard orange, cargo red and steel grey.
Animation: windup.
Frame count: 4.
Frame order:
1. clear anticipation
2. energy or body acceleration
3. active action begins
4. maximum active silhouette

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=48, y=88 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
