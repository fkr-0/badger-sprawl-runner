---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: item_expansion
source_entry: combat_weapon_pickups_and_icons
job_id: combat_weapons__icons
animation_state: combat_weapons__icons
animation_class: ui_icon
runtime_clip: expansion:combat_weapon_pickups_and_icons:combat_weapons__icons
source_class: expansion_template
atlas_family: combat_weapon_pickups_and_icons
target_atlas: null
output_image: renders/items-expansion/combat_weapons_icons_4c_3r.png
frames: 12
grid:
  columns: 4
  rows: 3
cell_size:
- 32
- 32
output_size:
- 128
- 96
world: null
source_prompt_file: docs/sprite-production/prompts/expansion/items/combat_weapon_pickups_and_icons.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `combat_weapons__icons`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/items-expansion/combat_weapons_icons_4c_3r.png`
- Grid: 4 columns × 3 rows
- Cell size: 32×32 pixels
- Output size: 128×96 pixels
- Occupied frames: 12
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `item_expansion` |
| Animation state | `combat_weapons__icons` |
| Animation class | `ui_icon` |
| Runtime intent | `expansion:combat_weapon_pickups_and_icons:combat_weapons__icons` |
| Atlas family | `combat_weapon_pickups_and_icons` |
| Source class | `expansion_template` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: combat_weapons__icons
Grid: 4 columns by 3 rows
Cell size: 32x32 pixels
Output size: 128x96 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

HUD icon order:
1. machete
2. mono_saber
3. hook_blade
4. baton_blade
5. shock_pistol
6. scatter_coil
7. nail_smg
8. harpoon_line
9. signal_launcher
Leave unused cells transparent.

Render one centered weapon symbol per cell with dark outline and one neon accent. No text, no hands, no scenery.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
