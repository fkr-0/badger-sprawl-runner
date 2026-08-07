---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: enemy_state_gap
source_entry: enemy_command_lock_partisan_state_extension
job_id: enemy_command_lock_partisan_state_extension__turn_or_reorient
animation_state: turn_or_reorient
animation_class: locomotion
runtime_clip: future:enemy_turn
source_class: remaining_gap_catalog
atlas_family: assets/sprites/enemies/expansion/enemy_command_lock_partisan_state_extension.png
target_atlas: assets/sprites/enemies/expansion/enemy_command_lock_partisan_state_extension.png
output_image: renders/enemy_command_lock_partisan_state_extension/turn_or_reorient_4c_1r.png
frames: 4
grid:
  columns: 4
  rows: 1
cell_size:
- 48
- 48
output_size:
- 192
- 48
world: asteroid_redoubt
source_prompt_file: docs/sprite-production/prompts/expansion/gaps/enemies/enemy_command_lock_partisan_state_extension.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `enemy_command_lock_partisan_state_extension__turn_or_reorient`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/enemy_command_lock_partisan_state_extension/turn_or_reorient_4c_1r.png`
- Grid: 4 columns × 1 rows
- Cell size: 48×48 pixels
- Output size: 192×48 pixels
- Occupied frames: 4
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `enemy_state_gap` |
| Animation state | `turn_or_reorient` |
| Animation class | `locomotion` |
| Runtime intent | `future:enemy_turn` |
| Atlas family | `assets/sprites/enemies/expansion/enemy_command_lock_partisan_state_extension.png` |
| Source class | `remaining_gap_catalog` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: enemy_command_lock_partisan_state_extension__turn_or_reorient
Grid: 4 columns by 1 rows
Cell size: 48x48 pixels
Output size: 192x48 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: rebel command-lock enemy; emergency armor, red cable armband, worried face.
World palette family: regolith grey, rebel red, solar gold, transmitter cyan, greenhouse green and void black.
Animation: turn_or_reorient.
Frame count: 4.
Frame order:
1. key pose
2. anticipation
3. active change
4. peak

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=24, y=44 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Specific missing-state design: load near support, narrow turning silhouette, plant toward opposite direction, stable patrol recovery.
Runtime intent: future:enemy_turn.
This is a future atlas-family render target, not permission to rename or overwrite an existing runtime clip.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
