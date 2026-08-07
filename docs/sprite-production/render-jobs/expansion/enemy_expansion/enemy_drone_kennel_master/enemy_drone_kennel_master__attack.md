---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: enemy_expansion
source_entry: enemy_drone_kennel_master
job_id: enemy_drone_kennel_master__attack
animation_state: attack
animation_class: combat
runtime_clip: expansion:enemy_drone_kennel_master:attack
source_class: expansion_template
atlas_family: assets/sprites/enemies/drone_kennel_master.png
target_atlas: assets/sprites/enemies/drone_kennel_master.png
output_image: renders/enemy_drone_kennel_master/attack_4c_2r.png
frames: 5
grid:
  columns: 4
  rows: 2
cell_size:
- 48
- 48
output_size:
- 192
- 96
world: lower_sprawl
source_prompt_file: docs/sprite-production/prompts/expansion/enemies/lower_sprawl/enemy_drone_kennel_master.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `enemy_drone_kennel_master__attack`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/enemy_drone_kennel_master/attack_4c_2r.png`
- Grid: 4 columns × 2 rows
- Cell size: 48×48 pixels
- Output size: 192×96 pixels
- Occupied frames: 5
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `enemy_expansion` |
| Animation state | `attack` |
| Animation class | `combat` |
| Runtime intent | `expansion:enemy_drone_kennel_master:attack` |
| Atlas family | `assets/sprites/enemies/drone_kennel_master.png` |
| Source class | `expansion_template` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: enemy_drone_kennel_master__attack
Grid: 4 columns by 2 rows
Cell size: 48x48 pixels
Output size: 192x96 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: Drone Kennel-Master; class sub-boss; armored handler carrying a portable drone kennel; attacks with locks exits and releases attack drones; intended counter is hack kennel door and reverse the spawn.
World palette family: indigo rain shadows, cyan and magenta neon, rust orange, dirty yellow, wet charcoal.
Animation: attack.
Frame count: 5. Leave the final 3 cell(s) fully transparent.
Frame order:
1. clear anticipation
2. energy or body acceleration
3. active action begins
4. maximum active silhouette
5. impact or effect peak

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=24, y=44 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
