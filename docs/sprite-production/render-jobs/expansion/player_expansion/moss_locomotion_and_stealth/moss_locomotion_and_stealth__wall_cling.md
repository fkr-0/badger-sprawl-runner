---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: player_expansion
source_entry: moss_locomotion_and_stealth
job_id: moss_locomotion_and_stealth__wall_cling
animation_state: wall_cling
animation_class: sprite_animation
runtime_clip: expansion:moss_locomotion_and_stealth:wall_cling
source_class: expansion_template
atlas_family: moss_locomotion_and_stealth
target_atlas: null
output_image: renders/moss_locomotion_and_stealth/wall_cling_4c_1r.png
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
world: null
source_prompt_file: docs/sprite-production/prompts/expansion/player/locomotion_and_stealth.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `moss_locomotion_and_stealth__wall_cling`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/moss_locomotion_and_stealth/wall_cling_4c_1r.png`
- Grid: 4 columns × 1 rows
- Cell size: 48×48 pixels
- Output size: 192×48 pixels
- Occupied frames: 4
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `player_expansion` |
| Animation state | `wall_cling` |
| Animation class | `sprite_animation` |
| Runtime intent | `expansion:moss_locomotion_and_stealth:wall_cling` |
| Atlas family | `moss_locomotion_and_stealth` |
| Source class | `expansion_template` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: moss_locomotion_and_stealth__wall_cling
Grid: 4 columns by 1 rows
Cell size: 48x48 pixels
Output size: 192x48 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: Moss, anthropomorphic badger courier with black-white facial mask, patched dark courier coat, cargo trousers, boots, claw wraps, compact tail, chrome wetware whiskers and pirate-radio details.
Core Moss palette family: charcoal, off-white fur, deep violet, electric cyan and controlled hot-red accents.
Animation: wall_cling.
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
Specific move design: claws braced on wall, controlled downward slip, tail balancing.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
