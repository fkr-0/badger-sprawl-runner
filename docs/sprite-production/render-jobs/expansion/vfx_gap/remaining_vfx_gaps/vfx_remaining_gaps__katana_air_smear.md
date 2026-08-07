---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: vfx_gap
source_entry: remaining_vfx_gaps
job_id: vfx_remaining_gaps__katana_air_smear
animation_state: katana_air_smear
animation_class: weapon_vfx
runtime_clip: future:vfx_katana_air
source_class: remaining_gap_catalog
atlas_family: assets/sprites/vfx/vfx_remaining_gaps.png
target_atlas: assets/sprites/vfx/vfx_remaining_gaps.png
output_image: renders/vfx-remaining-gaps/katana_air_smear_4c_2r.png
frames: 6
grid:
  columns: 4
  rows: 2
cell_size:
- 32
- 32
output_size:
- 128
- 64
world: null
source_prompt_file: docs/sprite-production/prompts/expansion/gaps/vfx/remaining_vfx_gaps.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `vfx_remaining_gaps__katana_air_smear`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/vfx-remaining-gaps/katana_air_smear_4c_2r.png`
- Grid: 4 columns × 2 rows
- Cell size: 32×32 pixels
- Output size: 128×64 pixels
- Occupied frames: 6
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `vfx_gap` |
| Animation state | `katana_air_smear` |
| Animation class | `weapon_vfx` |
| Runtime intent | `future:vfx_katana_air` |
| Atlas family | `assets/sprites/vfx/vfx_remaining_gaps.png` |
| Source class | `remaining_gap_catalog` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: vfx_remaining_gaps__katana_air_smear
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Effect identity: compact airborne blade crescent with clear growth, peak and dissipation.
Animation class: weapon_vfx.
Runtime intent: future:vfx_katana_air.
Frame count: 6. Leave unused cells completely transparent.
Frame phases:
1. key pose
2. anticipation
3. active change
4. peak
5. follow-through
6. recover

Render only the isolated effect, never the actor, enemy, boss, weapon-holder, scenery, floor, HUD, readable symbol, or text. Keep one stable effect origin and a coherent growth, impact, sustain, and dissipation path. Match the approved neon-animal board's crisp pixel clusters, dark contour fragments, and restrained two-or-three-color accent discipline. Physical actions use dust, sparks, trails, shock, fragments, pressure, or signal distortion appropriate to the description instead of an invented generic magic projectile.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
