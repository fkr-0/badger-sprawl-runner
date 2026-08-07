---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: character_state_gap
source_entry: character_naya_root_state_extension
job_id: character_naya_root_state_extension__follow_or_run
animation_state: follow_or_run
animation_class: locomotion
runtime_clip: future:companion_follow
source_class: remaining_gap_catalog
atlas_family: assets/sprites/characters/expansion/character_naya_root_state_extension.png
target_atlas: assets/sprites/characters/expansion/character_naya_root_state_extension.png
output_image: renders/character_naya_root_state_extension/follow_or_run_4c_2r.png
frames: 8
grid:
  columns: 4
  rows: 2
cell_size:
- 48
- 48
output_size:
- 192
- 96
world: dub_colony
source_prompt_file: docs/sprite-production/prompts/expansion/gaps/characters/character_naya_root_state_extension.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `character_naya_root_state_extension__follow_or_run`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/character_naya_root_state_extension/follow_or_run_4c_2r.png`
- Grid: 4 columns × 2 rows
- Cell size: 48×48 pixels
- Output size: 192×96 pixels
- Occupied frames: 8
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `character_state_gap` |
| Animation state | `follow_or_run` |
| Animation class | `locomotion` |
| Runtime intent | `future:companion_follow` |
| Atlas family | `assets/sprites/characters/expansion/character_naya_root_state_extension.png` |
| Source class | `remaining_gap_catalog` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: character_naya_root_state_extension__follow_or_run
Grid: 4 columns by 2 rows
Cell size: 48x48 pixels
Output size: 192x96 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: Naya Root: raccoon shield fighter; leaf-pattern shield, seed pouch, work boots.
World palette family: warm amber, red, leaf green, bass purple, cyan electronics, soot-black shadows.
Animation: follow_or_run.
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
Anchor: keep the ground/object reference fixed at x=24, y=44 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Specific missing-state design: eight-frame purposeful follow run, readable role equipment, stable anchor and no combat VFX.
Runtime intent: future:companion_follow.
This is a future atlas-family render target, not permission to rename or overwrite an existing runtime clip.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
