---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: player_expansion
source_entry: moss_gun_styles
job_id: moss_gun_styles__scatter_coil_fire
animation_state: scatter_coil_fire
animation_class: sprite_animation
runtime_clip: expansion:moss_gun_styles:scatter_coil_fire
source_class: expansion_template
atlas_family: moss_gun_styles
target_atlas: null
output_image: renders/moss_gun_styles/scatter_coil_fire_4c_2r.png
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
world: null
source_prompt_file: docs/sprite-production/prompts/expansion/player/gun_styles.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `moss_gun_styles__scatter_coil_fire`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/moss_gun_styles/scatter_coil_fire_4c_2r.png`
- Grid: 4 columns × 2 rows
- Cell size: 48×48 pixels
- Output size: 192×96 pixels
- Occupied frames: 8
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `player_expansion` |
| Animation state | `scatter_coil_fire` |
| Animation class | `sprite_animation` |
| Runtime intent | `expansion:moss_gun_styles:scatter_coil_fire` |
| Atlas family | `moss_gun_styles` |
| Source class | `expansion_template` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: moss_gun_styles__scatter_coil_fire
Grid: 4 columns by 2 rows
Cell size: 48x48 pixels
Output size: 192x96 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: Moss, anthropomorphic badger courier with black-white facial mask, patched dark courier coat, cargo trousers, boots, claw wraps, compact tail, chrome wetware whiskers and pirate-radio details.
Core Moss palette family: charcoal, off-white fur, deep violet, electric cyan and controlled hot-red accents.
Animation: scatter_coil_fire.
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
Specific move design: close blast, large recoil, pump/reload recovery.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
