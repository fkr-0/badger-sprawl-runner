---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: boss_action_gap
source_entry: boss_boss_elevator_angel_counterweight_action_variants
job_id: boss_boss_elevator_angel_counterweight_action_variants__gravity_flip
animation_state: gravity_flip
animation_class: boss_special
runtime_clip: future:boss_gravity_flip
source_class: remaining_gap_catalog
atlas_family: assets/sprites/bosses/expansion/boss_boss_elevator_angel_counterweight_action_variants.png
target_atlas: assets/sprites/bosses/expansion/boss_boss_elevator_angel_counterweight_action_variants.png
output_image: renders/boss_boss_elevator_angel_counterweight_action_variants/gravity_flip_4c_2r.png
frames: 8
grid:
  columns: 4
  rows: 2
cell_size:
- 96
- 96
output_size:
- 384
- 192
world: orbital_lift
source_prompt_file: docs/sprite-production/prompts/expansion/gaps/bosses/boss_boss_elevator_angel_counterweight_action_variants.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `boss_boss_elevator_angel_counterweight_action_variants__gravity_flip`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/boss_boss_elevator_angel_counterweight_action_variants/gravity_flip_4c_2r.png`
- Grid: 4 columns × 2 rows
- Cell size: 96×96 pixels
- Output size: 384×192 pixels
- Occupied frames: 8
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `boss_action_gap` |
| Animation state | `gravity_flip` |
| Animation class | `boss_special` |
| Runtime intent | `future:boss_gravity_flip` |
| Atlas family | `assets/sprites/bosses/expansion/boss_boss_elevator_angel_counterweight_action_variants.png` |
| Source class | `remaining_gap_catalog` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: boss_boss_elevator_angel_counterweight_action_variants__gravity_flip
Grid: 4 columns by 2 rows
Cell size: 96x96 pixels
Output size: 384x192 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: Elevator Angel boss; white-gold lift AI with cable wings and cargo hook hands.
World palette family: white-gold machinery, scanner blue, black space, hazard orange, cargo red and steel grey.
Animation: gravity_flip.
Frame count: 8.
Frame order:
1. key pose
2. anticipation
3. active change
4. peak
5. follow-through
6. recover
7. secondary motion
8. return

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=48, y=90 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Specific missing-state design: cable wings lock, halo rotates, gravity stamp inversion peaks, suspended recovery.
Runtime intent: future:boss_gravity_flip.
This is a future atlas-family render target, not permission to rename or overwrite an existing runtime clip.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
