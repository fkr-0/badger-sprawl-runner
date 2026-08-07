---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: item_expansion
source_entry: combat_weapon_pickups_and_icons
job_id: combat_weapons__pickup_batch_03
animation_state: combat_weapons__pickup_batch_03
animation_class: interaction
runtime_clip: expansion:combat_weapon_pickups_and_icons:combat_weapons__pickup_batch_03
source_class: expansion_template
atlas_family: combat_weapon_pickups_and_icons
target_atlas: null
output_image: renders/items-expansion/combat_weapons_pickups_03_4c_1r.png
frames: 4
grid:
  columns: 4
  rows: 1
cell_size:
- 32
- 32
output_size:
- 128
- 32
world: null
source_prompt_file: docs/sprite-production/prompts/expansion/items/combat_weapon_pickups_and_icons.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `combat_weapons__pickup_batch_03`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/items-expansion/combat_weapons_pickups_03_4c_1r.png`
- Grid: 4 columns × 1 rows
- Cell size: 32×32 pixels
- Output size: 128×32 pixels
- Occupied frames: 4
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `item_expansion` |
| Animation state | `combat_weapons__pickup_batch_03` |
| Animation class | `interaction` |
| Runtime intent | `expansion:combat_weapon_pickups_and_icons:combat_weapons__pickup_batch_03` |
| Atlas family | `combat_weapon_pickups_and_icons` |
| Source class | `expansion_template` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: combat_weapons__pickup_batch_03
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Row 1: signal_launcher; long hack-projectile launcher with antenna barrel; palette accent violet data glow and green status light. Four-frame pickup loop: neutral, glow, bob up, bob down.

Render distinct, game-readable weapon pickups. Keep each row's object centered and preserve its silhouette through the four-frame bob loop. True alpha background, no labels, no hands holding the weapon.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
